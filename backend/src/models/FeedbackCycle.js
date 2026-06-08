import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const FeedbackCycle = sequelize.define(
  "FeedbackCycle",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Sessions",
        key: "id",
      },
    },
    cycleType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    threshold: {
      type: DataTypes.INTEGER,
      defaultValue: 75,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Open",
    },
    overrideReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    closedByAdminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    openedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "FeedbackCycles",
    timestamps: true,
  },
);

export default FeedbackCycle;
