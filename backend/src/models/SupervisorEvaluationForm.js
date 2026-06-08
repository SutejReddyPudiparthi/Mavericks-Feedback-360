import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const SupervisorEvaluationForm = sequelize.define(
  "SupervisorEvaluationForm",
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
    supervisorId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    maverickId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    technicalScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    softSkillsScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectPerformScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    teamCollabScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    overallReadinessScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    futureTrainingRecs: {
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
    tableName: "SupervisorEvaluationForms",
    timestamps: true,
  },
);

export default SupervisorEvaluationForm;
