import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { notify } from '../services/notification.js';
import { runSentimentForCycle, runThemeClusteringForCycle } from '../services/ai.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// ── CYCLE HELPERS ─────────────────────────────────────────
const recalcCycle = async (cycleId) => {
  const cycle = await prisma.feedbackCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== 'Open') return;

  let submitted, total;
  if (cycle.cycleType === 'Maverick') {
    [submitted, total] = await Promise.all([
      prisma.maverickFeedbackForm.count({ where: { cycleId, status: 'Submitted' } }),
      prisma.maverickFeedbackForm.count({ where: { cycleId } }),
    ]);
  } else {
    [submitted, total] = await Promise.all([
      prisma.supervisorEvaluationForm.count({ where: { cycleId, status: 'Submitted' } }),
      prisma.supervisorEvaluationForm.count({ where: { cycleId } }),
    ]);
  }

  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
  if (pct >= cycle.threshold) {
    await prisma.feedbackCycle.update({ where: { id: cycleId }, data: { status: 'Closed', closedAt: new Date() } });
    // Run AI nightly batch (triggered immediately on closure for demo)
    if (cycle.cycleType === 'Maverick') {
      await runSentimentForCycle(cycleId);
      await runThemeClusteringForCycle(cycleId);
    }
  }
  return pct;
};

// ── CYCLES ────────────────────────────────────────────────
router.get('/cycles/:id', async (req, res) => {
  const cycle = await prisma.feedbackCycle.findUnique({ where: { id: req.params.id } });
  if (!cycle) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

  let submitted, total;
  if (cycle.cycleType === 'Maverick') {
    [submitted, total] = await Promise.all([
      prisma.maverickFeedbackForm.count({ where: { cycleId: cycle.id, status: 'Submitted' } }),
      prisma.maverickFeedbackForm.count({ where: { cycleId: cycle.id } }),
    ]);
  } else {
    [submitted, total] = await Promise.all([
      prisma.supervisorEvaluationForm.count({ where: { cycleId: cycle.id, status: 'Submitted' } }),
      prisma.supervisorEvaluationForm.count({ where: { cycleId: cycle.id } }),
    ]);
  }

  res.json({ ...cycle, completionPct: total > 0 ? Math.round((submitted / total) * 100) : 0, submitted, total });
});

router.patch('/cycles/:id/threshold', authorize('Admin'), async (req, res) => {
  const { threshold } = req.body;
  if (!threshold || threshold < 50 || threshold > 100) return res.status(400).json({ error: { code: 'INVALID_THRESHOLD', message: 'Threshold must be 50–100' } });
  const cycle = await prisma.feedbackCycle.update({ where: { id: req.params.id }, data: { threshold: +threshold } });
  await audit(req.user.id, 'UPDATE_THRESHOLD', 'FeedbackCycle', cycle.id, null, { threshold });
  res.json({ threshold: cycle.threshold, updatedAt: cycle.updatedAt });
});

router.post('/cycles/:id/close-override', authorize('Admin'), async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.length < 20) return res.status(400).json({ error: { code: 'REASON_TOO_SHORT', message: 'Reason must be at least 20 characters' } });
  const cycle = await prisma.feedbackCycle.update({
    where: { id: req.params.id },
    data: { status: 'Closed-Override', overrideReason: reason, closedByAdminId: req.user.id, closedAt: new Date() },
  });
  await audit(req.user.id, 'CYCLE_OVERRIDE_CLOSE', 'FeedbackCycle', cycle.id, null, { reason, closedAt: cycle.closedAt });
  res.json({ status: cycle.status, closedAt: cycle.closedAt, auditLogged: true });
});

// ── MAVERICK FEEDBACK FORMS ───────────────────────────────
router.get('/maverick', async (req, res) => {
  const where = req.user.role === 'Admin' ? {} : { userId: req.user.id };
  const forms = await prisma.maverickFeedbackForm.findMany({ where, include: { cycle: { include: { session: { include: { course: true, trainer: true } } } } } });
  res.json(forms);
});

router.get('/maverick/:id', async (req, res) => {
  const form = await prisma.maverickFeedbackForm.findUnique({
    where: { id: req.params.id },
    include: { cycle: { include: { session: { include: { course: true, trainer: true } } } }, user: { select: { name: true, employeeId: true } } },
  });
  if (!form) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (req.user.role !== 'Admin' && form.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  res.json(form);
});

router.put('/maverick/:id/draft', async (req, res) => {
  const form = await prisma.maverickFeedbackForm.findUnique({ where: { id: req.params.id } });
  if (!form || form.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  if (form.status === 'Submitted') return res.status(400).json({ error: { code: 'ALREADY_SUBMITTED' } });
  const { overallRating, keyLearnings, suggestedImprovements, followUpResponse } = req.body;
  const updated = await prisma.maverickFeedbackForm.update({ where: { id: req.params.id }, data: { overallRating, keyLearnings, suggestedImprovements, followUpResponse } });
  res.json({ savedAt: updated.updatedAt });
});

router.post('/maverick/:id/submit', async (req, res) => {
  const form = await prisma.maverickFeedbackForm.findUnique({ where: { id: req.params.id } });
  if (!form || form.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  if (form.status === 'Submitted') return res.status(400).json({ error: { code: 'ALREADY_SUBMITTED' } });
  const { overallRating, keyLearnings, suggestedImprovements, followUpResponse } = req.body;
  if (!overallRating || overallRating < 1 || overallRating > 5)
    return res.status(400).json({ error: { code: 'RATING_REQUIRED', message: 'overallRating (1–5) is required' } });
  const updated = await prisma.maverickFeedbackForm.update({
    where: { id: req.params.id },
    data: { overallRating: +overallRating, keyLearnings, suggestedImprovements, followUpResponse, status: 'Submitted', submittedAt: new Date() },
  });
  await recalcCycle(form.cycleId);
  res.json({ submittedAt: updated.submittedAt, formId: updated.id });
});

// ── SUPERVISOR EVALUATION FORMS ───────────────────────────
router.get('/supervisor', async (req, res) => {
  const where = req.user.role === 'Admin' ? {} : req.user.role === 'Supervisor' ? { supervisorId: req.user.id } : { maverickId: req.user.id };
  const evals = await prisma.supervisorEvaluationForm.findMany({ where, include: { cycle: { include: { session: { include: { course: true } } } }, maverick: { select: { name: true, employeeId: true } } } });
  res.json(evals);
});

router.get('/supervisor/:id', async (req, res) => {
  const ev = await prisma.supervisorEvaluationForm.findUnique({
    where: { id: req.params.id },
    include: { cycle: { include: { session: { include: { course: true } } } }, maverick: { select: { name: true, employeeId: true } }, supervisor: { select: { name: true } } },
  });
  if (!ev) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (req.user.role !== 'Admin' && ev.supervisorId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  res.json(ev);
});

router.put('/supervisor/:id/draft', async (req, res) => {
  const ev = await prisma.supervisorEvaluationForm.findUnique({ where: { id: req.params.id } });
  if (!ev || ev.supervisorId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  if (ev.status === 'Submitted') return res.status(400).json({ error: { code: 'ALREADY_SUBMITTED' } });
  const updated = await prisma.supervisorEvaluationForm.update({ where: { id: req.params.id }, data: req.body });
  res.json({ savedAt: updated.updatedAt });
});

router.post('/supervisor/:id/submit', async (req, res) => {
  const ev = await prisma.supervisorEvaluationForm.findUnique({ where: { id: req.params.id } });
  if (!ev || ev.supervisorId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  if (ev.status === 'Submitted') return res.status(400).json({ error: { code: 'ALREADY_SUBMITTED' } });
  const { technicalScore, softSkillsScore, projectPerformScore, teamCollabScore, overallReadinessScore, comments, futureTrainingRecs } = req.body;
  const scores = [technicalScore, softSkillsScore, projectPerformScore, teamCollabScore, overallReadinessScore];
  if (scores.some(s => !s || s < 1 || s > 5))
    return res.status(400).json({ error: { code: 'ALL_SCORES_REQUIRED', message: 'All 5 criteria scores (1–5) are required' } });

  const updated = await prisma.supervisorEvaluationForm.update({
    where: { id: req.params.id },
    data: { technicalScore: +technicalScore, softSkillsScore: +softSkillsScore, projectPerformScore: +projectPerformScore, teamCollabScore: +teamCollabScore, overallReadinessScore: +overallReadinessScore, comments, futureTrainingRecs: futureTrainingRecs ? JSON.stringify(futureTrainingRecs) : null, status: 'Submitted', submittedAt: new Date() },
  });

  // Check low performance alert
  const avg = scores.reduce((a, b) => a + +b, 0) / 5;
  if (avg < 2.5) {
    const admins = await prisma.user.findMany({ where: { role: 'Admin', status: 'Active' } });
    for (const admin of admins) {
      await notify(admin.id, 'LOW_PERFORMANCE_ALERT', `Maverick ${ev.maverickId} received avg effectiveness score ${avg.toFixed(2)}`, ['Portal', 'Email']);
    }
  }

  await recalcCycle(ev.cycleId);
  res.json({ submittedAt: updated.submittedAt, evalId: updated.id });
});

export default router;
