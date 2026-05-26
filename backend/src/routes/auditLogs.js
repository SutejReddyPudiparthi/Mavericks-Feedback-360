import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('Admin'));

router.get('/', async (req, res) => {
  const { actorId, action, entityType, dateFrom, dateTo, page = 1, pageSize = 50 } = req.query;
  const where = {};
  if (actorId) where.actorId = actorId;
  if (action) where.action = { contains: action };
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) where.timestamp = {};
  if (dateFrom) where.timestamp.gte = new Date(dateFrom);
  if (dateTo) where.timestamp.lte = new Date(dateTo);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { timestamp: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize, include: { actor: { select: { name: true, email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ data: logs, total, page: +page, pageSize: +pageSize });
});

export default router;
