import { Router } from "express";
import {
  User,
  FeedbackCycle,
  MaverickFeedbackForm,
  SupervisorEvaluationForm,
  Trainer,
  Session,
  Course,
} from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { notify } from "../services/notification.js";
import {
  runSentimentForCycle,
  runThemeClusteringForCycle,
} from "../services/ai.js";
import { audit } from "../utils/audit.js";

const router = Router();
router.use(authenticate);

// Helper: deep-convert Sequelize instances to plain JS objects
const deepPlain = (value) => {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(deepPlain);
  if (typeof value === "object") {
    // If it's a Sequelize instance with .get(), convert it
    if (typeof value.get === "function") value = value.get({ plain: true });
    // Recurse into object properties
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = deepPlain(value[k]);
    }
    return out;
  }
  return value;
};

const normalizeNestedSessionAssociations = (value) => {
  if (value == null) return value;
  if (Array.isArray(value))
    return value.map(normalizeNestedSessionAssociations);
  if (typeof value === "object") {
    if (value.FeedbackCycle && !value.cycle) {
      value.cycle = normalizeNestedSessionAssociations(value.FeedbackCycle);
      delete value.FeedbackCycle;
    }
    if (value.Session && !value.session) {
      value.session = normalizeNestedSessionAssociations(value.Session);
      delete value.Session;
    }
    if (value.Course && !value.course) {
      value.course = normalizeNestedSessionAssociations(value.Course);
      delete value.Course;
    }
    if (value.Trainer && !value.trainer) {
      value.trainer = normalizeNestedSessionAssociations(value.Trainer);
      delete value.Trainer;
    }
    for (const key of Object.keys(value)) {
      value[key] = normalizeNestedSessionAssociations(value[key]);
    }
    return value;
  }
  return value;
};

// ── CYCLE HELPERS ─────────────────────────────────────────
const recalcCycle = async (cycleId) => {
  const cycle = await FeedbackCycle.findOne({ where: { id: cycleId } });
  if (!cycle || cycle.status !== "Open") return;

  let submitted, total;
  if (cycle.cycleType === "Maverick") {
    [submitted, total] = await Promise.all([
      MaverickFeedbackForm.count({ where: { cycleId, status: "Submitted" } }),
      MaverickFeedbackForm.count({ where: { cycleId } }),
    ]);
  } else {
    [submitted, total] = await Promise.all([
      SupervisorEvaluationForm.count({
        where: { cycleId, status: "Submitted" },
      }),
      SupervisorEvaluationForm.count({ where: { cycleId } }),
    ]);
  }

  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
  if (pct >= cycle.threshold) {
    await FeedbackCycle.update(
      { status: "Closed", closedAt: new Date() },
      { where: { id: cycleId } },
    );
    // Run AI nightly batch (triggered immediately on closure for demo)
    if (cycle.cycleType === "Maverick") {
      await runSentimentForCycle(cycleId);
      await runThemeClusteringForCycle(cycleId);
    }
  }
  return pct;
};

// ── CYCLES ────────────────────────────────────────────────
router.get("/cycles", async (req, res) => {
  const { status, cycleType } = req.query;
  const where = {};
  if (status) where.status = status;
  if (cycleType) where.cycleType = cycleType;
  const cycles = await FeedbackCycle.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
  res.json(cycles);
});

router.get("/cycles/:id", async (req, res) => {
  const cycle = await FeedbackCycle.findOne({ where: { id: req.params.id } });
  if (!cycle) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  let submitted, total;
  if (cycle.cycleType === "Maverick") {
    [submitted, total] = await Promise.all([
      MaverickFeedbackForm.count({
        where: { cycleId: cycle.id, status: "Submitted" },
      }),
      MaverickFeedbackForm.count({ where: { cycleId: cycle.id } }),
    ]);
  } else {
    [submitted, total] = await Promise.all([
      SupervisorEvaluationForm.count({
        where: { cycleId: cycle.id, status: "Submitted" },
      }),
      SupervisorEvaluationForm.count({ where: { cycleId: cycle.id } }),
    ]);
  }

  res.json({
    ...cycle.toJSON(),
    completionPct: total > 0 ? Math.round((submitted / total) * 100) : 0,
    submitted,
    total,
  });
});

router.patch("/cycles/:id/threshold", authorize("Admin"), async (req, res) => {
  const { threshold } = req.body;
  if (!threshold || threshold < 50 || threshold > 100)
    return res.status(400).json({
      error: {
        code: "INVALID_THRESHOLD",
        message: "Threshold must be 50–100",
      },
    });
  const cycle = await FeedbackCycle.update(
    { threshold: +threshold },
    { where: { id: req.params.id }, returning: true },
  );
  await audit(
    req.user.id,
    "UPDATE_THRESHOLD",
    "FeedbackCycle",
    req.params.id,
    null,
    { threshold },
  );
  res.json({
    threshold: cycle[1][0].threshold,
    updatedAt: cycle[1][0].updatedAt,
  });
});

router.post(
  "/cycles/:id/close-override",
  authorize("Admin"),
  async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.length < 20)
      return res.status(400).json({
        error: {
          code: "REASON_TOO_SHORT",
          message: "Reason must be at least 20 characters",
        },
      });
    const cycle = await FeedbackCycle.update(
      {
        status: "Closed-Override",
        overrideReason: reason,
        closedByAdminId: req.user.id,
        closedAt: new Date(),
      },
      { where: { id: req.params.id }, returning: true },
    );
    await audit(
      req.user.id,
      "CYCLE_OVERRIDE_CLOSE",
      "FeedbackCycle",
      req.params.id,
      null,
      { reason, closedAt: cycle[1][0].closedAt },
    );
    res.json({
      status: cycle[1][0].status,
      closedAt: cycle[1][0].closedAt,
      auditLogged: true,
    });
  },
);

// ── MAVERICK FEEDBACK FORMS ───────────────────────────────
router.get("/maverick", async (req, res) => {
  const where = req.user.role === "Admin" ? {} : { userId: req.user.id };
  const forms = await MaverickFeedbackForm.findAll({
    where,
    include: [
      {
        model: FeedbackCycle,
        include: [
          {
            model: Session,
            include: [{ model: Course }, { model: Trainer }],
          },
        ],
      },
    ],
  });
  const plain = forms.map((f) =>
    normalizeNestedSessionAssociations(deepPlain(f)),
  );
  res.json(plain);
});

router.get("/maverick/:id", async (req, res) => {
  const form = await MaverickFeedbackForm.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: FeedbackCycle,
        include: [
          {
            model: Session,
            include: [{ model: Course }, { model: Trainer }],
          },
        ],
      },
      { model: User, attributes: ["name", "employeeId"] },
    ],
  });
  if (!form) return res.status(404).json({ error: { code: "NOT_FOUND" } });
  if (req.user.role !== "Admin" && form.userId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  res.json(normalizeNestedSessionAssociations(deepPlain(form)));
});

router.put("/maverick/:id/draft", async (req, res) => {
  const form = await MaverickFeedbackForm.findOne({
    where: { id: req.params.id },
  });
  if (!form || form.userId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  if (form.status === "Submitted")
    return res.status(400).json({ error: { code: "ALREADY_SUBMITTED" } });
  const {
    overallRating,
    keyLearnings,
    suggestedImprovements,
    followUpResponse,
  } = req.body;
  const updated = await MaverickFeedbackForm.update(
    { overallRating, keyLearnings, suggestedImprovements, followUpResponse },
    { where: { id: req.params.id }, returning: true },
  );
  res.json({ savedAt: updated[1][0].updatedAt });
});

router.post("/maverick/:id/submit", async (req, res) => {
  const form = await MaverickFeedbackForm.findOne({
    where: { id: req.params.id },
  });
  if (!form || form.userId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  if (form.status === "Submitted")
    return res.status(400).json({ error: { code: "ALREADY_SUBMITTED" } });
  const {
    overallRating,
    keyLearnings,
    suggestedImprovements,
    followUpResponse,
  } = req.body;
  if (!overallRating || overallRating < 1 || overallRating > 5)
    return res.status(400).json({
      error: {
        code: "RATING_REQUIRED",
        message: "overallRating (1–5) is required",
      },
    });
  const updated = await MaverickFeedbackForm.update(
    {
      overallRating: +overallRating,
      keyLearnings,
      suggestedImprovements,
      followUpResponse,
      status: "Submitted",
      submittedAt: new Date(),
    },
    { where: { id: req.params.id }, returning: true },
  );
  await recalcCycle(form.cycleId);
  res.json({
    submittedAt: updated[1][0].submittedAt,
    formId: updated[1][0].id,
  });
});

// ── SUPERVISOR EVALUATION FORMS ───────────────────────────
router.get("/supervisor", async (req, res) => {
  const where =
    req.user.role === "Admin"
      ? {}
      : req.user.role === "Supervisor"
        ? { supervisorId: req.user.id }
        : { maverickId: req.user.id };
  const evals = await SupervisorEvaluationForm.findAll({
    where,
    include: [
      {
        model: FeedbackCycle,
        include: [
          {
            model: Session,
            include: [{ model: Course }, { model: Trainer }],
          },
        ],
      },
      { model: User, as: "maverick", attributes: ["name", "employeeId"] },
    ],
  });
  const plainEvals = evals.map((e) =>
    normalizeNestedSessionAssociations(deepPlain(e)),
  );
  res.json(plainEvals);
});

router.get("/supervisor/:id", async (req, res) => {
  const ev = await SupervisorEvaluationForm.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: FeedbackCycle,
        include: [
          {
            model: Session,
            include: [{ model: Course }, { model: Trainer }],
          },
        ],
      },
      { model: User, as: "maverick", attributes: ["name", "employeeId"] },
      { model: User, as: "supervisor", attributes: ["name"] },
    ],
  });
  if (!ev) return res.status(404).json({ error: { code: "NOT_FOUND" } });
  if (req.user.role !== "Admin" && ev.supervisorId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  res.json(normalizeNestedSessionAssociations(deepPlain(ev)));
});

router.put("/supervisor/:id/draft", async (req, res) => {
  const ev = await SupervisorEvaluationForm.findOne({
    where: { id: req.params.id },
  });
  if (!ev || ev.supervisorId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  if (ev.status === "Submitted")
    return res.status(400).json({ error: { code: "ALREADY_SUBMITTED" } });
  const updated = await SupervisorEvaluationForm.update(req.body, {
    where: { id: req.params.id },
    returning: true,
  });
  res.json({ savedAt: updated[1][0].updatedAt });
});

router.post("/supervisor/:id/submit", async (req, res) => {
  const ev = await SupervisorEvaluationForm.findOne({
    where: { id: req.params.id },
  });
  if (!ev || ev.supervisorId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  if (ev.status === "Submitted")
    return res.status(400).json({ error: { code: "ALREADY_SUBMITTED" } });
  const {
    technicalScore,
    softSkillsScore,
    projectPerformScore,
    teamCollabScore,
    overallReadinessScore,
    comments,
    futureTrainingRecs,
  } = req.body;
  const scores = [
    technicalScore,
    softSkillsScore,
    projectPerformScore,
    teamCollabScore,
    overallReadinessScore,
  ];
  if (scores.some((s) => !s || s < 1 || s > 5))
    return res.status(400).json({
      error: {
        code: "ALL_SCORES_REQUIRED",
        message: "All 5 criteria scores (1–5) are required",
      },
    });

  const updated = await SupervisorEvaluationForm.update(
    {
      technicalScore: +technicalScore,
      softSkillsScore: +softSkillsScore,
      projectPerformScore: +projectPerformScore,
      teamCollabScore: +teamCollabScore,
      overallReadinessScore: +overallReadinessScore,
      comments,
      futureTrainingRecs: futureTrainingRecs
        ? JSON.stringify(futureTrainingRecs)
        : null,
      status: "Submitted",
      submittedAt: new Date(),
    },
    { where: { id: req.params.id }, returning: true },
  );

  // Check low performance alert
  const avg = scores.reduce((a, b) => a + +b, 0) / 5;
  if (avg < 2.5) {
    const admins = await User.findAll({
      where: { role: "Admin", status: "Active" },
    });
    for (const admin of admins) {
      await notify(
        admin.id,
        "LOW_PERFORMANCE_ALERT",
        `Maverick ${ev.maverickId} received avg effectiveness score ${avg.toFixed(2)}`,
        ["Portal", "Email"],
      );
    }
  }

  await recalcCycle(ev.cycleId);
  res.json({
    submittedAt: updated[1][0].submittedAt,
    evalId: updated[1][0].id,
  });
});

export default router;
