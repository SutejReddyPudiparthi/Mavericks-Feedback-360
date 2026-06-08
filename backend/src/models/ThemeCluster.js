import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const ThemeCluster = sequelize.define(
  "ThemeCluster",
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
    themeLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequencyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sampleResponses: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ThemeClusters",
    timestamps: false,
  },
);

export default ThemeCluster;
