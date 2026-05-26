import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const hash = (p) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@maverick360.com' },
    update: {},
    create: { employeeId: 'EMP001', name: 'Admin User', email: 'admin@maverick360.com', mobile: '9000000001', role: 'Admin', passwordHash: await hash('Admin@123') },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@maverick360.com' },
    update: {},
    create: { employeeId: 'EMP002', name: 'Sarah Manager', email: 'supervisor@maverick360.com', mobile: '9000000002', role: 'Supervisor', passwordHash: await hash('Super@123') },
  });

  const maverick1 = await prisma.user.upsert({
    where: { email: 'maverick1@maverick360.com' },
    update: {},
    create: { employeeId: 'EMP003', name: 'Alex Maverick', email: 'maverick1@maverick360.com', mobile: '9000000003', role: 'Maverick', supervisorId: supervisor.id, passwordHash: await hash('Mav@123') },
  });

  const maverick2 = await prisma.user.upsert({
    where: { email: 'maverick2@maverick360.com' },
    update: {},
    create: { employeeId: 'EMP004', name: 'Jordan Maverick', email: 'maverick2@maverick360.com', mobile: '9000000004', role: 'Maverick', supervisorId: supervisor.id, passwordHash: await hash('Mav@123') },
  });

  const course = await prisma.course.upsert({
    where: { name: 'Java Full Stack Bootcamp' },
    update: {},
    create: { name: 'Java Full Stack Bootcamp', type: 'Technical', trainerType: 'Internal', domain: 'Java', objectives: 'Build production-ready Java applications', durationDays: 10 },
  });

  const trainer = await prisma.trainer.upsert({
    where: { id: 'trainer-seed-001' },
    update: {},
    create: { id: 'trainer-seed-001', name: 'Ravi Kumar', domain: 'Java', engagementType: 'Internal' },
  });

  const session = await prisma.session.upsert({
    where: { id: 'session-seed-001' },
    update: {},
    create: {
      id: 'session-seed-001',
      courseId: course.id,
      trainerId: trainer.id,
      adminId: admin.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-10'),
      location: 'Training Room A',
      capacity: 30,
    },
  });

  for (const user of [maverick1, maverick2]) {
    await prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
      update: {},
      create: { sessionId: session.id, userId: user.id, supervisorId: supervisor.id, projectAssignmentDate: new Date('2025-07-15') },
    });
  }

  const cycle = await prisma.feedbackCycle.upsert({
    where: { id: 'cycle-seed-001' },
    update: {},
    create: { id: 'cycle-seed-001', sessionId: session.id, cycleType: 'Maverick', threshold: 75, deadline: new Date('2025-07-24') },
  });

  for (const user of [maverick1, maverick2]) {
    await prisma.maverickFeedbackForm.upsert({
      where: { id: `form-${user.id}` },
      update: {},
      create: { id: `form-${user.id}`, cycleId: cycle.id, userId: user.id, sessionId: session.id },
    });
  }

  const supCycle = await prisma.feedbackCycle.upsert({
    where: { id: 'cycle-seed-002' },
    update: {},
    create: { id: 'cycle-seed-002', sessionId: session.id, cycleType: 'Supervisor', threshold: 75, deadline: new Date('2025-10-24') },
  });

  for (const user of [maverick1, maverick2]) {
    await prisma.supervisorEvaluationForm.upsert({
      where: { id: `eval-${user.id}` },
      update: {},
      create: { id: `eval-${user.id}`, cycleId: supCycle.id, supervisorId: supervisor.id, maverickId: user.id },
    });
  }

  console.log('\n✅ Seed complete');
  console.log('  Admin:      admin@maverick360.com  / Admin@123');
  console.log('  Supervisor: supervisor@maverick360.com / Super@123');
  console.log('  Maverick 1: maverick1@maverick360.com / Mav@123');
  console.log('  Maverick 2: maverick2@maverick360.com / Mav@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
