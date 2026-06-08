import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const SentimentResult = sequelize.define(
  "SentimentResult",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    formId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "MaverickFeedbackForms",
        key: "id",
      },
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sentimentLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    confidenceScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "SentimentResults",
    timestamps: false,
  },
);

export default SentimentResult;
