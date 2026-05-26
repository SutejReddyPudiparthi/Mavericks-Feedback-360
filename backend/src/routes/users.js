import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// GET /users
router.get('/', authorize('Admin'), async (req, res) => {
  const { role, status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * pageSize, take: +pageSize, select: { id: true, name: true, email: true, role: true, status: true, employeeId: true, supervisorId: true } }),
    prisma.user.count({ where }),
  ]);
  res.json({ data: users, total, page: +page, pageSize: +pageSize });
});

// POST /users
router.post('/', authorize('Admin'), async (req, res) => {
  const { name, email, mobile, employeeId, role, supervisorId, password } = req.body;
  if (!name || !email || !employeeId || !role) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'name, email, employeeId, role required' } });
  const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('Maverick@123', 10);
  const user = await prisma.user.create({ data: { name, email, mobile, employeeId, role, supervisorId, passwordHash } });
  await audit(req.user.id, 'CREATE', 'User', user.id, null, { name, email, role });
  res.status(201).json({ id: user.id, createdAt: user.createdAt });
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.id !== req.params.id)
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, mobile: true, role: true, status: true, employeeId: true, supervisorId: true } });
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  res.json(user);
});

// PUT /users/:id
router.put('/:id', authorize('Admin'), async (req, res) => {
  const old = await prisma.user.findUnique({ where: { id: req.params.id } });
  const { name, email, mobile, role, supervisorId } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { name, email, mobile, role, supervisorId } });
  await audit(req.user.id, 'UPDATE', 'User', user.id, old, { name, email, role });
  res.json(user);
});

// PATCH /users/:id/status
router.patch('/:id/status', authorize('Admin'), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Inactive'].includes(status)) return res.status(400).json({ error: { code: 'INVALID_STATUS' } });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
  await audit(req.user.id, 'STATUS_CHANGE', 'User', user.id, null, { status });
  res.json({ status: user.status, updatedAt: user.updatedAt });
});

// GET /users/:id/supervisor-mapping
router.get('/:id/supervisor-mapping', authorize('Admin'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { supervisor: { select: { id: true, name: true } } } });
  res.json({ supervisorId: user?.supervisorId, supervisorName: user?.supervisor?.name });
});

// PUT /users/:id/supervisor-mapping
router.put('/:id/supervisor-mapping', authorize('Admin'), async (req, res) => {
  const { supervisorId } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { supervisorId } });
  await audit(req.user.id, 'UPDATE_MAPPING', 'User', user.id, null, { supervisorId });
  res.json({ updated: true });
});

export default router;
