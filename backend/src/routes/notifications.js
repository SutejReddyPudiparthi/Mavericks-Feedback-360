import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { sentAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
    prisma.notification.count({ where: { userId: req.user.id } }),
  ]);
  res.json({ data: notifications, total, page: +page, pageSize: +pageSize });
});

router.patch('/:id/read', async (req, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: new Date() } });
  res.json({ readAt: updated.readAt });
});

router.patch('/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ success: true });
});

export default router;
