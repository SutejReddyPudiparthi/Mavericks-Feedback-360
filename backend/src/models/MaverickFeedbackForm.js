import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const MaverickFeedbackForm = sequelize.define(
  "MaverickFeedbackForm",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    cycleId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "FeedbackCycles",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    overallRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    keyLearnings: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    suggestedImprovements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    followUpResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Draft",
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "MaverickFeedbackForms",
    timestamps: true,
  },
);

export default MaverickFeedbackForm;
