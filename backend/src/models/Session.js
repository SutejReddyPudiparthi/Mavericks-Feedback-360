import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../db.js";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    courseId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Courses",
        key: "id",
      },
    },
    trainerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Trainers",
        key: "id",
      },
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    virtualLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Active",
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Sessions",
    timestamps: true,
  },
);

export default Session;
