import { Router } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('Admin'));

// GET /analytics/overview
router.get('/overview', async (req, res) => {
  const [activeSessions, overdueCycles, alertCount, allCycles] = await Promise.all([
    prisma.session.count({ where: { status: 'Active' } }),
    prisma.feedbackCycle.count({ where: { status: 'Open', deadline: { lt: new Date() } } }),
    prisma.notification.count({ where: { type: { in: ['LOW_RATING_ALERT', 'LOW_PERFORMANCE_ALERT', 'COMPLETION_ALERT'] }, readAt: null } }),
    prisma.feedbackCycle.findMany({ where: { status: { in: ['Closed', 'Closed-Override'] } }, include: { maverickForms: { where: { status: 'Submitted' } } } }),
  ]);

  const totalForms = allCycles.reduce((a, c) => a + c.maverickForms.length, 0);
  res.json({ activeSessions, overdueCycles, alertCount, closedCycles: allCycles.length, totalSubmissions: totalForms });
});

// GET /analytics/sessions/:id/scorecard
router.get('/sessions/:id/scorecard', async (req, res) => {
  const cycle = await prisma.feedbackCycle.findFirst({
    where: { sessionId: req.params.id, cycleType: 'Maverick' },
    include: { maverickForms: { where: { status: 'Submitted' }, include: { sentimentResults: true } } },
  });
  if (!cycle) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

  const forms = cycle.maverickForms;
  const ratings = forms.map(f => f.overallRating).filter(Boolean);
  const avgRating = ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null;

  const sentimentDist = { Positive: 0, Neutral: 0, Negative: 0, 'Insufficient Data': 0 };
  forms.flatMap(f => f.sentimentResults).forEach(s => { sentimentDist[s.sentimentLabel] = (sentimentDist[s.sentimentLabel] || 0) + 1; });

  const total = await prisma.maverickFeedbackForm.count({ where: { cycleId: cycle.id } });
  const completionPct = total > 0 ? Math.round((forms.length / total) * 100) : 0;

  const themes = await prisma.themeCluster.findMany({ where: { cycleId: cycle.id } });

  res.json({ cycleId: cycle.id, status: cycle.status, avgRating, completionPct, submitted: forms.length, total, sentimentDistribution: sentimentDist, themes });
});

// GET /analytics/trainers/:id/performance
router.get('/trainers/:id/performance', async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const where = { trainerId: req.params.id };
  if (dateFrom) where.startDate = { gte: new Date(dateFrom) };
  if (dateTo) where.endDate = { lte: new Date(dateTo) };

  const sessions = await prisma.session.findMany({
    where,
    include: { course: true, cycles: { include: { maverickForms: { where: { status: 'Submitted' } } } } },
    orderBy: { startDate: 'asc' },
  });

  const trend = sessions.map(s => {
    const forms = s.cycles.flatMap(c => c.maverickForms);
    const ratings = forms.map(f => f.overallRating).filter(Boolean);
    return { sessionId: s.id, course: s.course.name, date: s.startDate, avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null };
  });

  res.json({ trainerId: req.params.id, sessionCount: sessions.length, avgRatingTrend: trend });
});

// GET /analytics/leaderboard
router.get('/leaderboard', async (req, res) => {
  const { type = 'Maverick', quarter } = req.query;

  if (type === 'Trainer') {
    const trainers = await prisma.trainer.findMany({
      include: { sessions: { include: { cycles: { include: { maverickForms: { where: { status: 'Submitted' } } } } } } },
    });
    const ranked = trainers.map(t => {
      const forms = t.sessions.flatMap(s => s.cycles.flatMap(c => c.maverickForms));
      const ratings = forms.map(f => f.overallRating).filter(Boolean);
      return { trainerId: t.id, name: t.name, sessionCount: t.sessions.length, avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0 };
    }).filter(t => t.sessionCount >= 2).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
    return res.json(ranked);
  }

  // Maverick leaderboard
  const evals = await prisma.supervisorEvaluationForm.findMany({ where: { status: 'Submitted' }, include: { maverick: { select: { id: true, name: true, employeeId: true } } } });
  const map = {};
  evals.forEach(e => {
    if (!map[e.maverickId]) map[e.maverickId] = { maverick: e.maverick, scores: [] };
    const avg = [e.technicalScore, e.softSkillsScore, e.projectPerformScore, e.teamCollabScore, e.overallReadinessScore].filter(Boolean);
    if (avg.length) map[e.maverickId].scores.push(avg.reduce((a, b) => a + b, 0) / avg.length);
  });
  const ranked = Object.values(map).map(m => ({
    maverickId: m.maverick.id, name: m.maverick.name, employeeId: m.maverick.employeeId,
    avgEffectivenessScore: m.scores.length ? +(m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(2) : 0,
  })).sort((a, b) => b.avgEffectivenessScore - a.avgEffectivenessScore).slice(0, 10);
  res.json(ranked);
});

// GET /reports/generate — inline for simplicity
router.get('/report', async (req, res) => {
  const { type = 'completion', courseId, trainerId, domain, dateFrom, dateTo, format = 'json' } = req.query;

  const where = {};
  if (courseId) where.courseId = courseId;
  if (trainerId) where.trainerId = trainerId;
  if (dateFrom) where.startDate = { gte: new Date(dateFrom) };
  if (dateTo) where.endDate = { lte: new Date(dateTo) };

  const sessions = await prisma.session.findMany({
    where,
    include: {
      course: true, trainer: true,
      cycles: { include: { maverickForms: { where: { status: 'Submitted' } } } },
      participants: true,
    },
  });

  const rows = sessions.map(s => {
    const forms = s.cycles.flatMap(c => c.maverickForms);
    const ratings = forms.map(f => f.overallRating).filter(Boolean);
    return {
      'Session ID': s.id,
      'Course': s.course.name,
      'Trainer': s.trainer.name,
      'Start Date': s.startDate.toISOString().split('T')[0],
      'End Date': s.endDate.toISOString().split('T')[0],
      'Enrolled': s.participants.length,
      'Submitted': forms.length,
      'Completion %': s.participants.length > 0 ? Math.round((forms.length / s.participants.length) * 100) : 0,
      'Avg Rating': ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 'N/A',
    };
  });

  if (format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  }

  res.json({ data: rows, count: rows.length });
});

export default router;
