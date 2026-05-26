import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// ── COURSES ──────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  const { status, type, domain } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (domain) where.domain = { contains: domain };
  const courses = await prisma.course.findMany({ where, orderBy: { name: 'asc' } });
  res.json(courses);
});

router.post('/courses', authorize('Admin'), async (req, res) => {
  const { name, type, trainerType, domain, objectives, durationDays } = req.body;
  if (!name || !type || !trainerType || !domain || !objectives || !durationDays)
    return res.status(400).json({ error: { code: 'MISSING_FIELDS' } });
  if (!['Technical', 'SoftSkills', 'Blended'].includes(type))
    return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'type must be Technical | SoftSkills | Blended' } });
  const course = await prisma.course.create({ data: { name, type, trainerType, domain, objectives, durationDays: +durationDays } });
  await audit(req.user.id, 'CREATE', 'Course', course.id, null, course);
  res.status(201).json(course);
});

router.put('/courses/:id', authorize('Admin'), async (req, res) => {
  const old = await prisma.course.findUnique({ where: { id: req.params.id } });
  const course = await prisma.course.update({ where: { id: req.params.id }, data: req.body });
  await audit(req.user.id, 'UPDATE', 'Course', course.id, old, course);
  res.json(course);
});

router.patch('/courses/:id/status', authorize('Admin'), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Archived'].includes(status)) return res.status(400).json({ error: { code: 'INVALID_STATUS' } });
  if (status === 'Archived') {
    const active = await prisma.session.count({ where: { courseId: req.params.id, status: 'Active' } });
    if (active > 0) return res.status(400).json({ error: { code: 'HAS_ACTIVE_SESSIONS', message: 'Cannot archive course with active sessions' } });
  }
  const course = await prisma.course.update({ where: { id: req.params.id }, data: { status } });
  await audit(req.user.id, 'STATUS_CHANGE', 'Course', course.id, null, { status });
  res.json({ status: course.status, updatedAt: course.updatedAt });
});

// ── TRAINERS ─────────────────────────────────────────────
router.get('/trainers', async (req, res) => {
  const { domain, engagementType } = req.query;
  const where = {};
  if (domain) where.domain = { contains: domain };
  if (engagementType) where.engagementType = engagementType;
  const trainers = await prisma.trainer.findMany({ where, orderBy: { name: 'asc' } });
  res.json(trainers);
});

router.post('/trainers', authorize('Admin'), async (req, res) => {
  const { name, organisation, domain, engagementType } = req.body;
  if (!name || !domain || !engagementType) return res.status(400).json({ error: { code: 'MISSING_FIELDS' } });
  if (!['Internal', 'External'].includes(engagementType))
    return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'engagementType must be Internal | External' } });
  const trainer = await prisma.trainer.create({ data: { name, organisation, domain, engagementType } });
  await audit(req.user.id, 'CREATE', 'Trainer', trainer.id, null, trainer);
  res.status(201).json(trainer);
});

router.put('/trainers/:id', authorize('Admin'), async (req, res) => {
  const old = await prisma.trainer.findUnique({ where: { id: req.params.id } });
  const trainer = await prisma.trainer.update({ where: { id: req.params.id }, data: req.body });
  await audit(req.user.id, 'UPDATE', 'Trainer', trainer.id, old, trainer);
  res.json(trainer);
});

router.get('/trainers/:id/performance', authenticate, async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { trainerId: req.params.id },
    include: { cycles: { include: { maverickForms: { where: { status: 'Submitted' } } } }, course: true },
  });
  const result = sessions.map(s => {
    const forms = s.cycles.flatMap(c => c.maverickForms);
    const ratings = forms.map(f => f.overallRating).filter(Boolean);
    return { sessionId: s.id, courseName: s.course.name, date: s.startDate, avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null, responseCount: forms.length };
  });
  res.json(result);
});

// ── SESSIONS ─────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  const { status, courseId, trainerId, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (courseId) where.courseId = courseId;
  if (trainerId) where.trainerId = trainerId;
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({ where, skip: (+page - 1) * +pageSize, take: +pageSize, include: { course: { select: { name: true } }, trainer: { select: { name: true } } }, orderBy: { startDate: 'desc' } }),
    prisma.session.count({ where }),
  ]);
  res.json({ data: sessions, total, page: +page, pageSize: +pageSize });
});

router.post('/sessions', authorize('Admin'), async (req, res) => {
  const { courseId, trainerId, startDate, endDate, location, virtualLink, capacity } = req.body;
  if (!courseId || !trainerId || !startDate || !endDate || !capacity)
    return res.status(400).json({ error: { code: 'MISSING_FIELDS' } });
  if (new Date(endDate) < new Date(startDate))
    return res.status(400).json({ error: { code: 'INVALID_DATES', message: 'endDate must be >= startDate' } });

  // Conflict detection
  const conflict = await prisma.session.findFirst({
    where: { trainerId, status: 'Active', OR: [{ startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } }] },
  });

  const session = await prisma.session.create({
    data: { courseId, trainerId, adminId: req.user.id, startDate: new Date(startDate), endDate: new Date(endDate), location, virtualLink, capacity: +capacity },
  });
  await audit(req.user.id, 'CREATE', 'Session', session.id, null, session);
  res.status(201).json({ ...session, conflictWarning: conflict ? `Trainer already has session ${conflict.id} on overlapping dates` : null });
});

router.get('/sessions/:id', async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { course: true, trainer: true, participants: { include: { user: { select: { id: true, name: true, email: true } } } }, cycles: true },
  });
  if (!session) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json(session);
});

router.put('/sessions/:id', authorize('Admin'), async (req, res) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (new Date() > new Date(session.startDate))
    return res.status(400).json({ error: { code: 'SESSION_STARTED', message: 'Cannot edit after session start date' } });
  const updated = await prisma.session.update({ where: { id: req.params.id }, data: req.body });
  await audit(req.user.id, 'UPDATE', 'Session', updated.id, session, updated);
  res.json(updated);
});

router.patch('/sessions/:id/status', authorize('Admin'), async (req, res) => {
  const { status, reason } = req.body;
  if (status === 'Cancelled' && !reason) return res.status(400).json({ error: { code: 'REASON_REQUIRED' } });
  const session = await prisma.session.update({ where: { id: req.params.id }, data: { status, cancelReason: reason } });
  await audit(req.user.id, 'CANCEL', 'Session', session.id, null, { status, reason });
  res.json({ status: session.status, updatedAt: session.updatedAt });
});

router.get('/sessions/:id/participants', authenticate, async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const [participants, total] = await Promise.all([
    prisma.sessionParticipant.findMany({
      where: { sessionId: req.params.id },
      skip: (+page - 1) * +pageSize, take: +pageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.sessionParticipant.count({ where: { sessionId: req.params.id } }),
  ]);
  res.json({ data: participants, total });
});

export default router;
