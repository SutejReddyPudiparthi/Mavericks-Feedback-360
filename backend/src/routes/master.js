import { Router } from "express";
import { Op } from "sequelize";
import {
  User,
  Course,
  Trainer,
  Session,
  SessionParticipant,
  FeedbackCycle,
  MaverickFeedbackForm,
} from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

const router = Router();
router.use(authenticate);

// ── COURSES ──────────────────────────────────────────────
router.get("/courses", async (req, res) => {
  const { status, type, domain } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (domain) where.domain = { [Op.like]: `%${domain}%` };
  const courses = await Course.findAll({ where, order: [["name", "ASC"]] });
  res.json(courses);
});

router.post("/courses", authorize("Admin"), async (req, res) => {
  const { name, type, trainerType, domain, objectives, durationDays } =
    req.body;
  if (!name || !type || !trainerType || !domain || !objectives || !durationDays)
    return res.status(400).json({ error: { code: "MISSING_FIELDS" } });
  if (!["Technical", "SoftSkills", "Blended"].includes(type))
    return res.status(400).json({
      error: {
        code: "INVALID_TYPE",
        message: "type must be Technical | SoftSkills | Blended",
      },
    });
  const course = await Course.create({
    name,
    type,
    trainerType,
    domain,
    objectives,
    durationDays: +durationDays,
  });
  await audit(req.user.id, "CREATE", "Course", course.id, null, course);
  res.status(201).json(course);
});

router.put("/courses/:id", authorize("Admin"), async (req, res) => {
  const old = await Course.findOne({ where: { id: req.params.id } });
  const course = await Course.update(req.body, {
    where: { id: req.params.id },
    returning: true,
  });
  await audit(
    req.user.id,
    "UPDATE",
    "Course",
    req.params.id,
    old,
    course[1][0],
  );
  res.json(course[1][0]);
});

router.patch("/courses/:id/status", authorize("Admin"), async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Archived"].includes(status))
    return res.status(400).json({ error: { code: "INVALID_STATUS" } });
  if (status === "Archived") {
    const active = await Session.count({
      where: { courseId: req.params.id, status: "Active" },
    });
    if (active > 0)
      return res.status(400).json({
        error: {
          code: "HAS_ACTIVE_SESSIONS",
          message: "Cannot archive course with active sessions",
        },
      });
  }
  const course = await Course.update(
    { status },
    { where: { id: req.params.id }, returning: true },
  );
  await audit(req.user.id, "STATUS_CHANGE", "Course", req.params.id, null, {
    status,
  });
  res.json({ status: course[1][0].status, updatedAt: course[1][0].updatedAt });
});

// ── TRAINERS ─────────────────────────────────────────────
router.get("/trainers", async (req, res) => {
  const { domain, engagementType } = req.query;
  const where = {};
  if (domain) where.domain = { [Op.like]: `%${domain}%` };
  if (engagementType) where.engagementType = engagementType;
  const trainers = await Trainer.findAll({ where, order: [["name", "ASC"]] });
  res.json(trainers);
});

router.post("/trainers", authorize("Admin"), async (req, res) => {
  const { name, organisation, domain, engagementType } = req.body;
  if (!name || !domain || !engagementType)
    return res.status(400).json({ error: { code: "MISSING_FIELDS" } });
  if (!["Internal", "External"].includes(engagementType))
    return res.status(400).json({
      error: {
        code: "INVALID_TYPE",
        message: "engagementType must be Internal | External",
      },
    });
  const trainer = await Trainer.create({
    name,
    organisation,
    domain,
    engagementType,
  });
  await audit(req.user.id, "CREATE", "Trainer", trainer.id, null, trainer);
  res.status(201).json(trainer);
});

router.put("/trainers/:id", authorize("Admin"), async (req, res) => {
  const old = await Trainer.findOne({ where: { id: req.params.id } });
  const trainer = await Trainer.update(req.body, {
    where: { id: req.params.id },
    returning: true,
  });
  await audit(
    req.user.id,
    "UPDATE",
    "Trainer",
    req.params.id,
    old,
    trainer[1][0],
  );
  res.json(trainer[1][0]);
});

router.get("/trainers/:id/performance", authenticate, async (req, res) => {
  const sessions = await Session.findAll({
    where: { trainerId: req.params.id },
    include: [
      {
        model: FeedbackCycle,
        include: [
          { model: MaverickFeedbackForm, where: { status: "Submitted" } },
        ],
      },
      { model: Course, attributes: ["name"] },
    ],
  });
  const result = sessions.map((s) => {
    const forms =
      s.FeedbackCycles?.flatMap((c) => c.MaverickFeedbackForms || []) || [];
    const ratings = forms.map((f) => f.overallRating).filter(Boolean);
    return {
      sessionId: s.id,
      courseName: s.Course?.name,
      date: s.startDate,
      avgRating: ratings.length
        ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : null,
      responseCount: forms.length,
    };
  });
  res.json(result);
});

// ── SESSIONS ─────────────────────────────────────────────
const normalizeSessionAssociations = (session) => {
  const payload = session.toJSON();
  if (payload.Course) {
    payload.course = payload.Course;
    delete payload.Course;
  }
  if (payload.Trainer) {
    payload.trainer = payload.Trainer;
    delete payload.Trainer;
  }
  return payload;
};

router.get("/sessions", async (req, res) => {
  const { status, courseId, trainerId, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (courseId) where.courseId = courseId;
  if (trainerId) where.trainerId = trainerId;
  const [sessions, total] = await Promise.all([
    Session.findAll({
      where,
      offset: (+page - 1) * +pageSize,
      limit: +pageSize,
      include: [
        { model: Course, attributes: ["name"] },
        { model: Trainer, attributes: ["name"] },
      ],
      order: [["startDate", "DESC"]],
    }),
    Session.count({ where }),
  ]);
  res.json({
    data: sessions.map(normalizeSessionAssociations),
    total,
    page: +page,
    pageSize: +pageSize,
  });
});

router.post("/sessions", authorize("Admin"), async (req, res) => {
  const {
    courseId,
    trainerId,
    startDate,
    endDate,
    location,
    virtualLink,
    capacity,
  } = req.body;
  if (!courseId || !trainerId || !startDate || !endDate || !capacity)
    return res.status(400).json({ error: { code: "MISSING_FIELDS" } });
  if (new Date(endDate) < new Date(startDate))
    return res.status(400).json({
      error: {
        code: "INVALID_DATES",
        message: "endDate must be >= startDate",
      },
    });

  // Conflict detection
  const conflict = await Session.findOne({
    where: {
      trainerId,
      status: "Active",
      [Op.or]: [
        {
          startDate: { [Op.lte]: new Date(endDate) },
          endDate: { [Op.gte]: new Date(startDate) },
        },
      ],
    },
  });

  const session = await Session.create({
    courseId,
    trainerId,
    adminId: req.user.id,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    location,
    virtualLink,
    capacity: +capacity,
  });
  await audit(req.user.id, "CREATE", "Session", session.id, null, session);
  res.status(201).json({
    ...session.toJSON(),
    conflictWarning: conflict
      ? `Trainer already has session ${conflict.id} on overlapping dates`
      : null,
  });
});

router.get("/sessions/:id", async (req, res) => {
  const session = await Session.findOne({
    where: { id: req.params.id },
    include: [
      { model: Course },
      { model: Trainer },
      {
        model: SessionParticipant,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
      { model: FeedbackCycle },
    ],
  });
  if (!session) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  const payload = normalizeSessionAssociations(session);
  payload.cycles = payload.FeedbackCycles || [];
  payload.participants = (payload.SessionParticipants || []).map(
    (participant) => {
      const normalized = { ...participant };
      normalized.user = normalized.User || normalized.user;
      delete normalized.User;
      return normalized;
    },
  );
  delete payload.FeedbackCycles;
  delete payload.SessionParticipants;

  res.json(payload);
});

router.put("/sessions/:id", authorize("Admin"), async (req, res) => {
  const session = await Session.findOne({ where: { id: req.params.id } });
  if (new Date() > new Date(session.startDate))
    return res.status(400).json({
      error: {
        code: "SESSION_STARTED",
        message: "Cannot edit after session start date",
      },
    });
  const updated = await Session.update(req.body, {
    where: { id: req.params.id },
    returning: true,
  });
  await audit(
    req.user.id,
    "UPDATE",
    "Session",
    req.params.id,
    session,
    updated[1][0],
  );
  res.json(updated[1][0]);
});

router.patch("/sessions/:id/status", authorize("Admin"), async (req, res) => {
  const { status, reason } = req.body;
  if (status === "Cancelled" && !reason)
    return res.status(400).json({ error: { code: "REASON_REQUIRED" } });
  const session = await Session.update(
    { status, cancelReason: reason },
    { where: { id: req.params.id }, returning: true },
  );
  await audit(req.user.id, "CANCEL", "Session", req.params.id, null, {
    status,
    reason,
  });
  res.json({
    status: session[1][0].status,
    updatedAt: session[1][0].updatedAt,
  });
});

router.get("/sessions/:id/participants", authenticate, async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const [participants, total] = await Promise.all([
    SessionParticipant.findAll({
      where: { sessionId: req.params.id },
      offset: (+page - 1) * +pageSize,
      limit: +pageSize,
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    }),
    SessionParticipant.count({ where: { sessionId: req.params.id } }),
  ]);
  res.json({ data: participants, total });
});

export default router;
