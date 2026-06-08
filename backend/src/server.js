import "dotenv/config";
import express from "express";
import cors from "cors";
import { sequelize } from "./models/index.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import masterRoutes from "./routes/master.js";
import participantRoutes from "./routes/participants.js";
import feedbackRoutes from "./routes/feedback.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import auditRoutes from "./routes/auditLogs.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Maverick Feedback 360 API running on port ${PORT}`),
    );
  })
  .catch((err) => {
    console.error("Database sync error:", err);
    process.exit(1);
  });
