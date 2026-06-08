import { Router } from "express";
import { Op } from "sequelize";
import { AuditLog, User } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("Admin"));

router.get("/", async (req, res) => {
  const {
    actorId,
    action,
    entityType,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 50,
  } = req.query;
  const where = {};
  if (actorId) where.actorId = actorId;
  if (action) where.action = { [Op.like]: `%${action}%` };
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) where.timestamp = {};
  if (dateFrom) where.timestamp[Op.gte] = new Date(dateFrom);
  if (dateTo) where.timestamp[Op.lte] = new Date(dateTo);

  const [logs, total] = await Promise.all([
    AuditLog.findAll({
      where,
      order: [["timestamp", "DESC"]],
      offset: (+page - 1) * +pageSize,
      limit: +pageSize,
      include: [{ model: User, as: "actor", attributes: ["name", "email"] }],
    }),
    AuditLog.count({ where }),
  ]);
  res.json({ data: logs, total, page: +page, pageSize: +pageSize });
});

export default router;
