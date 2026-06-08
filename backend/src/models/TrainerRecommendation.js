import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const TrainerRecommendation = sequelize.define(
  "TrainerRecommendation",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    trainerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Trainers",
        key: "id",
      },
    },
  },
  {
    tableName: "TrainerRecommendations",
    timestamps: true,
  },
);

export default TrainerRecommendation;
