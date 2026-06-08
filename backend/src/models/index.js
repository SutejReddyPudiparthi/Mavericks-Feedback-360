import sequelize from "../db.js";
import User from "./User.js";
import Course from "./Course.js";
import Trainer from "./Trainer.js";
import Session from "./Session.js";
import SessionParticipant from "./SessionParticipant.js";
import FeedbackCycle from "./FeedbackCycle.js";
import MaverickFeedbackForm from "./MaverickFeedbackForm.js";
import SupervisorEvaluationForm from "./SupervisorEvaluationForm.js";
import SentimentResult from "./SentimentResult.js";
import ThemeCluster from "./ThemeCluster.js";
import Notification from "./Notification.js";
import AuditLog from "./AuditLog.js";
import OtpCode from "./OtpCode.js";
import TrainerRecommendation from "./TrainerRecommendation.js";

// Define associations
User.hasMany(SessionParticipant, { foreignKey: "userId" });
SessionParticipant.belongsTo(User, { foreignKey: "userId" });

User.hasMany(MaverickFeedbackForm, { foreignKey: "userId" });
MaverickFeedbackForm.belongsTo(User, { foreignKey: "userId" });

User.hasMany(SupervisorEvaluationForm, {
  foreignKey: "supervisorId",
  as: "supervisorEvals",
});
SupervisorEvaluationForm.belongsTo(User, {
  foreignKey: "supervisorId",
  as: "supervisor",
});

User.hasMany(SupervisorEvaluationForm, {
  foreignKey: "maverickId",
  as: "maverickEvals",
});
SupervisorEvaluationForm.belongsTo(User, {
  foreignKey: "maverickId",
  as: "maverick",
});

User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

User.hasMany(AuditLog, { foreignKey: "actorId" });
AuditLog.belongsTo(User, { foreignKey: "actorId", as: "actor" });

User.hasMany(OtpCode, { foreignKey: "userId" });
OtpCode.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Session, { foreignKey: "adminId" });
Session.belongsTo(User, { foreignKey: "adminId", as: "admin" });

User.hasMany(User, { foreignKey: "supervisorId", as: "mavericks" });
User.belongsTo(User, { foreignKey: "supervisorId", as: "supervisor" });

Course.hasMany(Session, { foreignKey: "courseId" });
Session.belongsTo(Course, { foreignKey: "courseId" });

Trainer.hasMany(Session, { foreignKey: "trainerId" });
Session.belongsTo(Trainer, { foreignKey: "trainerId" });

Session.hasMany(SessionParticipant, { foreignKey: "sessionId" });
SessionParticipant.belongsTo(Session, { foreignKey: "sessionId" });

Session.hasMany(FeedbackCycle, { foreignKey: "sessionId" });
FeedbackCycle.belongsTo(Session, { foreignKey: "sessionId" });

FeedbackCycle.hasMany(MaverickFeedbackForm, { foreignKey: "cycleId" });
MaverickFeedbackForm.belongsTo(FeedbackCycle, { foreignKey: "cycleId" });

FeedbackCycle.hasMany(SupervisorEvaluationForm, { foreignKey: "cycleId" });
SupervisorEvaluationForm.belongsTo(FeedbackCycle, { foreignKey: "cycleId" });

FeedbackCycle.hasMany(ThemeCluster, { foreignKey: "cycleId" });
ThemeCluster.belongsTo(FeedbackCycle, { foreignKey: "cycleId" });

MaverickFeedbackForm.hasMany(SentimentResult, { foreignKey: "formId" });
SentimentResult.belongsTo(MaverickFeedbackForm, { foreignKey: "formId" });

Trainer.hasMany(TrainerRecommendation, { foreignKey: "trainerId" });
TrainerRecommendation.belongsTo(Trainer, { foreignKey: "trainerId" });

export {
  sequelize,
  User,
  Course,
  Trainer,
  Session,
  SessionParticipant,
  FeedbackCycle,
  MaverickFeedbackForm,
  SupervisorEvaluationForm,
  SentimentResult,
  ThemeCluster,
  Notification,
  AuditLog,
  OtpCode,
  TrainerRecommendation,
};
