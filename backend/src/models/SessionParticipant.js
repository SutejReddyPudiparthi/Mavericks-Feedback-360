import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const SessionParticipant = sequelize.define(
  "SessionParticipant",
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
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    supervisorId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    projectAssignmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "SessionParticipants",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["sessionId", "userId"],
      },
    ],
  },
);

export default SessionParticipant;
