import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import prisma from '../prismaClient.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { notify } from '../services/notification.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate, authorize('Admin'));

// GET /participants/template
router.get('/template', (req, res) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Employee ID', 'Full Name', 'Email Address', 'Mobile Number', 'Supervisor ID', 'Project Assignment Date'],
    ['EMP001', 'John Doe', 'john@company.com', '9876543210', 'SUP001', ''],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Participants');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=participant_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// POST /participants/upload/:sessionId
router.post('/upload/:sessionId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE' } });

  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  const errors = [];
  const valid = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const rowErrors = [];

    if (!row['Employee ID']) rowErrors.push({ row: rowNum, field: 'Employee ID', message: 'Required' });
    if (!row['Full Name']) rowErrors.push({ row: rowNum, field: 'Full Name', message: 'Required' });
    if (!row['Email Address']) rowErrors.push({ row: rowNum, field: 'Email Address', message: 'Required' });
    else if (!emailRegex.test(row['Email Address'])) rowErrors.push({ row: rowNum, field: 'Email Address', message: 'Invalid format' });
    if (!row['Supervisor ID']) rowErrors.push({ row: rowNum, field: 'Supervisor ID', message: 'Required' });
    if (seenIds.has(row['Employee ID'])) rowErrors.push({ row: rowNum, field: 'Employee ID', message: 'Duplicate in file' });
    else seenIds.add(row['Employee ID']);

    if (rowErrors.length) errors.push(...rowErrors);
    else valid.push(row);
  }

  if (errors.length) return res.status(422).json({ imported: 0, skipped: rows.length, errors });

  let imported = 0, skipped = 0;
  const importErrors = [];

  for (const row of valid) {
    const user = await prisma.user.findFirst({ where: { employeeId: row['Employee ID'] } });
    if (!user) { importErrors.push({ employeeId: row['Employee ID'], message: 'User not found in system' }); skipped++; continue; }

    const supervisor = await prisma.user.findFirst({ where: { employeeId: row['Supervisor ID'], role: 'Supervisor' } });

    const existing = await prisma.sessionParticipant.findUnique({ where: { sessionId_userId: { sessionId: req.params.sessionId, userId: user.id } } });
    if (existing) { skipped++; continue; }

    await prisma.sessionParticipant.create({
      data: {
        sessionId: req.params.sessionId,
        userId: user.id,
        supervisorId: supervisor?.id,
        projectAssignmentDate: row['Project Assignment Date'] ? new Date(row['Project Assignment Date']) : null,
      },
    });

    if (supervisor?.id && user.supervisorId !== supervisor.id) {
      await prisma.user.update({ where: { id: user.id }, data: { supervisorId: supervisor.id } });
    }

    await notify(user.id, 'ENROLLED', `You have been enrolled in a training session.`, ['Portal', 'Email']);
    imported++;
  }

  res.json({ imported, skipped, errors: importErrors });
});

export default router;
