import { Router } from "express";
import { Op } from "sequelize";
import * as XLSX from "xlsx";
import {
  Session,
  FeedbackCycle,
  Notification,
  MaverickFeedbackForm,
  ThemeCluster,
  Trainer,
  SupervisorEvaluationForm,
  User,
  Course,
  SessionParticipant,
} from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("Admin"));

// GET /analytics/overview
router.get("/overview", async (req, res) => {
  const [activeSessions, overdueCycles, alertCount, allCycles] =
    await Promise.all([
      Session.count({ where: { status: "Active" } }),
      FeedbackCycle.count({
        where: { status: "Open", deadline: { [Op.lt]: new Date() } },
      }),
      Notification.count({
        where: {
          type: {
            [Op.in]: [
              "LOW_RATING_ALERT",
              "LOW_PERFORMANCE_ALERT",
              "COMPLETION_ALERT",
            ],
          },
          readAt: null,
        },
      }),
      FeedbackCycle.findAll({
        where: { status: { [Op.in]: ["Closed", "Closed-Override"] } },
        include: [
          { model: MaverickFeedbackForm, where: { status: "Submitted" } },
        ],
      }),
    ]);

  const totalForms = allCycles.reduce(
    (a, c) => a + (c.MaverickFeedbackForms?.length || 0),
    0,
  );
  res.json({
    activeSessions,
    overdueCycles,
    alertCount,
    closedCycles: allCycles.length,
    totalSubmissions: totalForms,
  });
});

// GET /analytics/sessions/:id/scorecard
router.get("/sessions/:id/scorecard", async (req, res) => {
  const cycle = await FeedbackCycle.findOne({
    where: { sessionId: req.params.id, cycleType: "Maverick" },
    include: [{ model: MaverickFeedbackForm, where: { status: "Submitted" } }],
  });
  if (!cycle) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  const forms = cycle.MaverickFeedbackForms || [];
  const ratings = forms.map((f) => f.overallRating).filter(Boolean);
  const avgRating = ratings.length
    ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
    : null;

  const sentimentDist = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
    "Insufficient Data": 0,
  };
  forms.forEach((f) => {
    if (f.SentimentResults) {
      f.SentimentResults.forEach((s) => {
        sentimentDist[s.sentimentLabel] =
          (sentimentDist[s.sentimentLabel] || 0) + 1;
      });
    }
  });

  const total = await MaverickFeedbackForm.count({
    where: { cycleId: cycle.id },
  });
  const completionPct =
    total > 0 ? Math.round((forms.length / total) * 100) : 0;

  const themes = await ThemeCluster.findAll({ where: { cycleId: cycle.id } });

  res.json({
    cycleId: cycle.id,
    status: cycle.status,
    avgRating,
    completionPct,
    submitted: forms.length,
    total,
    sentimentDistribution: sentimentDist,
    themes,
  });
});

// GET /analytics/trainers/:id/performance
router.get("/trainers/:id/performance", async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const where = { trainerId: req.params.id };
  if (dateFrom) where.startDate = { [Op.gte]: new Date(dateFrom) };
  if (dateTo) where.endDate = { [Op.lte]: new Date(dateTo) };

  const sessions = await Session.findAll({
    where,
    include: [
      { model: Course },
      {
        model: FeedbackCycle,
        include: [
          { model: MaverickFeedbackForm, where: { status: "Submitted" } },
        ],
      },
    ],
    order: [["startDate", "ASC"]],
  });

  const trend = sessions.map((s) => {
    const forms = (s.FeedbackCycles || []).flatMap(
      (c) => c.MaverickFeedbackForms || [],
    );
    const ratings = forms.map((f) => f.overallRating).filter(Boolean);
    return {
      sessionId: s.id,
      course: s.Course?.name,
      date: s.startDate,
      avgRating: ratings.length
        ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : null,
    };
  });

  res.json({
    trainerId: req.params.id,
    sessionCount: sessions.length,
    avgRatingTrend: trend,
  });
});

// GET /analytics/leaderboard
router.get("/leaderboard", async (req, res) => {
  const { type = "Maverick", quarter } = req.query;

  if (type === "Trainer") {
    const trainers = await Trainer.findAll({
      include: [
        {
          model: Session,
          include: [
            {
              model: FeedbackCycle,
              include: [
                { model: MaverickFeedbackForm, where: { status: "Submitted" } },
              ],
            },
          ],
        },
      ],
    });
    const ranked = trainers
      .map((t) => {
        const forms = (t.Sessions || []).flatMap((s) =>
          (s.FeedbackCycles || []).flatMap(
            (c) => c.MaverickFeedbackForms || [],
          ),
        );
        const ratings = forms.map((f) => f.overallRating).filter(Boolean);
        return {
          trainerId: t.id,
          name: t.name,
          sessionCount: t.Sessions?.length || 0,
          avgRating: ratings.length
            ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : 0,
        };
      })
      .filter((t) => t.sessionCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
    return res.json(ranked);
  }

  // Maverick leaderboard
  const evals = await SupervisorEvaluationForm.findAll({
    where: { status: "Submitted" },
    include: [
      {
        model: User,
        as: "maverick",
        attributes: ["id", "name", "employeeId"],
      },
    ],
  });
  const map = {};
  evals.forEach((e) => {
    if (!map[e.maverickId])
      map[e.maverickId] = { maverick: e.maverick, scores: [] };
    const avg = [
      e.technicalScore,
      e.softSkillsScore,
      e.projectPerformScore,
      e.teamCollabScore,
      e.overallReadinessScore,
    ].filter(Boolean);
    if (avg.length)
      map[e.maverickId].scores.push(
        avg.reduce((a, b) => a + b, 0) / avg.length,
      );
  });
  const ranked = Object.values(map)
    .map((m) => ({
      maverickId: m.maverick.id,
      name: m.maverick.name,
      employeeId: m.maverick.employeeId,
      avgEffectivenessScore: m.scores.length
        ? +(m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(2)
        : 0,
    }))
    .sort((a, b) => b.avgEffectivenessScore - a.avgEffectivenessScore)
    .slice(0, 10);
  res.json(ranked);
});

// GET /reports/generate — inline for simplicity
router.get("/report", async (req, res) => {
  const {
    type = "completion",
    courseId,
    trainerId,
    domain,
    dateFrom,
    dateTo,
    format = "json",
  } = req.query;

  const where = {};
  if (courseId) where.courseId = courseId;
  if (trainerId) where.trainerId = trainerId;
  if (dateFrom) where.startDate = { [Op.gte]: new Date(dateFrom) };
  if (dateTo) where.endDate = { [Op.lte]: new Date(dateTo) };

  const sessions = await Session.findAll({
    where,
    include: [
      { model: Course },
      { model: Trainer },
      {
        model: FeedbackCycle,
        include: [
          { model: MaverickFeedbackForm, where: { status: "Submitted" } },
        ],
      },
      { model: SessionParticipant },
    ],
  });

  const rows = sessions.map((s) => {
    const forms = (s.FeedbackCycles || []).flatMap(
      (c) => c.MaverickFeedbackForms || [],
    );
    const ratings = forms.map((f) => f.overallRating).filter(Boolean);
    return {
      "Session ID": s.id,
      Course: s.Course?.name,
      Trainer: s.Trainer?.name,
      "Start Date": s.startDate.toISOString().split("T")[0],
      "End Date": s.endDate.toISOString().split("T")[0],
      Enrolled: s.SessionParticipants?.length || 0,
      Submitted: forms.length,
      "Completion %":
        (s.SessionParticipants?.length || 0) > 0
          ? Math.round(
              (forms.length / (s.SessionParticipants?.length || 0)) * 100,
            )
          : 0,
      "Avg Rating": ratings.length
        ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : "N/A",
    };
  });

  if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return res.send(buf);
  }

  res.json({ data: rows, count: rows.length });
});

export default router;
