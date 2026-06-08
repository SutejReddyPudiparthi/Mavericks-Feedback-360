import bcrypt from "bcryptjs";
import {
  sequelize,
  User,
  Course,
  Trainer,
  Session,
  SessionParticipant,
  FeedbackCycle,
  MaverickFeedbackForm,
  SupervisorEvaluationForm,
  Notification,
  AuditLog,
} from "../models/index.js";

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const seedUsers = async () => {
  const admin = await User.create({
    employeeId: "ADM001",
    name: "Morgan Ellis",
    email: "admin@maverick360.com",
    mobile: "555-010-0001",
    passwordHash: hashPassword("Admin@123"),
    role: "Admin",
    status: "Active",
  });

  const supervisorA = await User.create({
    employeeId: "SUP001",
    name: "Priya Sharma",
    email: "priya.sharma@maverick360.com",
    mobile: "555-020-0011",
    passwordHash: hashPassword("Supervisor@123"),
    role: "Supervisor",
    status: "Active",
  });

  const supervisorB = await User.create({
    employeeId: "SUP002",
    name: "Jason Kim",
    email: "jason.kim@maverick360.com",
    mobile: "555-020-0022",
    passwordHash: hashPassword("Supervisor@123"),
    role: "Supervisor",
    status: "Active",
  });

  const demoSupervisor = await User.create({
    employeeId: "SUP999",
    name: "Supervisor One",
    email: "supervisor@maverick360.com",
    mobile: "555-020-0000",
    passwordHash: hashPassword("Supervisor@123"),
    role: "Supervisor",
    status: "Active",
  });

  const mavericks = await Promise.all([
    User.create({
      employeeId: "MAV101",
      name: "Aisha Patel",
      email: "aisha.patel@maverick360.com",
      mobile: "555-030-0101",
      passwordHash: hashPassword("Maverick@123"),
      role: "Maverick",
      status: "Active",
      supervisorId: supervisorA.id,
    }),
    User.create({
      employeeId: "MAV102",
      name: "Noah Rivera",
      email: "noah.rivera@maverick360.com",
      mobile: "555-030-0102",
      passwordHash: hashPassword("Maverick@123"),
      role: "Maverick",
      status: "Active",
      supervisorId: supervisorA.id,
    }),
    User.create({
      employeeId: "MAV103",
      name: "Lina Chen",
      email: "lina.chen@maverick360.com",
      mobile: "555-030-0103",
      passwordHash: hashPassword("Maverick@123"),
      role: "Maverick",
      status: "Active",
      supervisorId: supervisorB.id,
    }),
    User.create({
      employeeId: "MAV104",
      name: "Ethan Brooks",
      email: "ethan.brooks@maverick360.com",
      mobile: "555-030-0104",
      passwordHash: hashPassword("Maverick@123"),
      role: "Maverick",
      status: "Active",
      supervisorId: supervisorB.id,
    }),
  ]);

  const demoMaverick = await User.create({
    employeeId: "MAV999",
    name: "Maverick One",
    email: "maverick@maverick360.com",
    mobile: "555-030-0000",
    passwordHash: hashPassword("Maverick@123"),
    role: "Maverick",
    status: "Active",
    supervisorId: demoSupervisor.id,
  });

  return {
    admin,
    supervisorA,
    supervisorB,
    demoSupervisor,
    mavericks,
    demoMaverick,
  };
};

const seedTrainers = async () => {
  return Promise.all([
    Trainer.create({
      name: "Tara Singh",
      organisation: "Maverick Learning",
      domain: "Leadership",
      engagementType: "Internal",
      status: "Active",
    }),
    Trainer.create({
      name: "Daniel Lee",
      organisation: "Maverick Learning",
      domain: "Data Science",
      engagementType: "External",
      status: "Active",
    }),
    Trainer.create({
      name: "Nina Alvarez",
      organisation: "Maverick Learning",
      domain: "Product Management",
      engagementType: "Internal",
      status: "Active",
    }),
  ]);
};

const seedCourses = async () => {
  return Promise.all([
    Course.create({
      name: "Leadership Essentials",
      type: "Soft Skills",
      trainerType: "Internal",
      domain: "Leadership",
      objectives: "Build confidence, influence teams, and lead with impact.",
      durationDays: 5,
      status: "Active",
    }),
    Course.create({
      name: "Data Analytics Bootcamp",
      type: "Technical Skills",
      trainerType: "External",
      domain: "Data Science",
      objectives:
        "Apply data-driven decision making with real-world analytics tools.",
      durationDays: 4,
      status: "Active",
    }),
    Course.create({
      name: "Product Strategy Workshop",
      type: "Business Skills",
      trainerType: "Internal",
      domain: "Product",
      objectives:
        "Align product vision with market needs and stakeholder expectations.",
      durationDays: 3,
      status: "Active",
    }),
  ]);
};

const seedSessions = async ({ admin, courses, trainers }) => {
  const now = Date.now();

  const sessionA = await Session.create({
    courseId: courses[0].id,
    trainerId: trainers[0].id,
    adminId: admin.id,
    startDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
    location: "Boardroom 2",
    virtualLink: "https://meet.example.com/leadership-sprint",
    capacity: 18,
    status: "Active",
  });

  const sessionB = await Session.create({
    courseId: courses[1].id,
    trainerId: trainers[1].id,
    adminId: admin.id,
    startDate: new Date(now - 12 * 24 * 60 * 60 * 1000),
    endDate: new Date(now - 8 * 24 * 60 * 60 * 1000),
    location: "Training Lab 1",
    virtualLink: "https://meet.example.com/data-bootcamp",
    capacity: 22,
    status: "Active",
  });

  const sessionC = await Session.create({
    courseId: courses[2].id,
    trainerId: trainers[2].id,
    adminId: admin.id,
    startDate: new Date(now + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(now + 13 * 24 * 60 * 60 * 1000),
    location: "Innovation Studio",
    virtualLink: "https://meet.example.com/product-workshop",
    capacity: 16,
    status: "Active",
  });

  return [sessionA, sessionB, sessionC];
};

const seedParticipants = async ({
  sessions,
  mavericks,
  supervisors,
  demoMaverick,
  demoSupervisor,
}) => {
  await SessionParticipant.bulkCreate([
    {
      sessionId: sessions[0].id,
      userId: mavericks[0].id,
      supervisorId: supervisors[0].id,
      projectAssignmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      sessionId: sessions[0].id,
      userId: mavericks[1].id,
      supervisorId: supervisors[0].id,
      projectAssignmentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      sessionId: sessions[1].id,
      userId: mavericks[2].id,
      supervisorId: supervisors[1].id,
      projectAssignmentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
    {
      sessionId: sessions[2].id,
      userId: mavericks[3].id,
      supervisorId: supervisors[1].id,
      projectAssignmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      sessionId: sessions[0].id,
      userId: demoMaverick.id,
      supervisorId: demoSupervisor.id,
      projectAssignmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);
};

const seedFeedbackCycles = async ({ sessions }) => {
  const maverickCycleA = await FeedbackCycle.create({
    sessionId: sessions[0].id,
    cycleType: "Maverick",
    threshold: 75,
    status: "Open",
    openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const maverickCycleB = await FeedbackCycle.create({
    sessionId: sessions[1].id,
    cycleType: "Maverick",
    threshold: 80,
    status: "Closed",
    openedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  const supervisorCycleA = await FeedbackCycle.create({
    sessionId: sessions[0].id,
    cycleType: "Supervisor",
    threshold: 80,
    status: "Open",
    openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { maverickCycleA, maverickCycleB, supervisorCycleA };
};

const seedFeedbackForms = async ({
  cycles,
  mavericks,
  supervisors,
  sessions,
  demoMaverick,
  demoSupervisor,
}) => {
  await MaverickFeedbackForm.bulkCreate([
    {
      cycleId: cycles.maverickCycleA.id,
      userId: mavericks[0].id,
      sessionId: sessions[0].id,
      status: "Draft",
      overallRating: 4,
      keyLearnings:
        "Team collaboration frameworks helped me align goals more clearly.",
      suggestedImprovements:
        "Add one extra hands-on activity for the final module.",
      followUpResponse: "I will share learnings with my project team.",
    },
    {
      cycleId: cycles.maverickCycleA.id,
      userId: demoMaverick.id,
      sessionId: sessions[0].id,
      status: "Draft",
      overallRating: null,
      keyLearnings: "",
      suggestedImprovements: "",
      followUpResponse: "",
    },
    {
      cycleId: cycles.maverickCycleA.id,
      userId: mavericks[1].id,
      sessionId: sessions[0].id,
      status: "Submitted",
      overallRating: 5,
      keyLearnings: "Strong facilitation and practical leadership examples.",
      suggestedImprovements: "More time on coaching conversations.",
      followUpResponse: "I plan to lead the next sprint using these ideas.",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      cycleId: cycles.maverickCycleB.id,
      userId: mavericks[2].id,
      sessionId: sessions[1].id,
      status: "Submitted",
      overallRating: 4,
      keyLearnings: "Advanced analytics dashboard workflows were very helpful.",
      suggestedImprovements: "Include a dataset from our current product.",
      followUpResponse:
        "I will apply the new reporting templates next quarter.",
      submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  ]);

  await SupervisorEvaluationForm.bulkCreate([
    {
      cycleId: cycles.supervisorCycleA.id,
      supervisorId: demoSupervisor.id,
      maverickId: demoMaverick.id,
      status: "Draft",
      technicalScore: null,
      softSkillsScore: null,
      projectPerformScore: null,
      teamCollabScore: null,
      overallReadinessScore: null,
      comments: "",
      futureTrainingRecs: null,
    },
    {
      cycleId: cycles.supervisorCycleA.id,
      supervisorId: supervisors[0].id,
      maverickId: mavericks[0].id,
      status: "Draft",
      technicalScore: 4,
      softSkillsScore: 5,
      projectPerformScore: 4,
      teamCollabScore: 5,
      overallReadinessScore: 4,
      comments: "Strong progress in communication and team coordination.",
      futureTrainingRecs: JSON.stringify([
        "Advanced leadership lab",
        "Cross-functional project shadowing",
      ]),
    },
    {
      cycleId: cycles.maverickCycleB.id,
      supervisorId: supervisors[1].id,
      maverickId: mavericks[2].id,
      status: "Submitted",
      technicalScore: 5,
      softSkillsScore: 4,
      projectPerformScore: 5,
      teamCollabScore: 5,
      overallReadinessScore: 5,
      comments: "Excellent analytics delivery and stakeholder communication.",
      futureTrainingRecs: JSON.stringify(["Executive data storytelling"]),
      submittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },
  ]);
};

const seedNotifications = async ({ admin, supervisors }) => {
  await Notification.bulkCreate([
    {
      userId: admin.id,
      channel: "Portal",
      type: "SYSTEM_ALERT",
      message:
        "Quarterly feedback cycles now include new supervisor evaluation workflows.",
      isRead: false,
    },
    {
      userId: supervisors[0].id,
      channel: "Email",
      type: "REMINDER",
      message: "You have 1 pending supervisor evaluation for Aisha Patel.",
      isRead: false,
    },
    {
      userId: supervisors[1].id,
      channel: "Portal",
      type: "REMINDER",
      message: "Lina Chen has submitted analytics feedback for review.",
      isRead: true,
    },
  ]);
};

const seedAuditLogs = async ({ admin }) => {
  await AuditLog.bulkCreate([
    {
      actorId: admin.id,
      action: "INITIAL_SEED",
      entityType: "Database",
      entityId: "seed",
      oldValue: null,
      newValue: JSON.stringify({ note: "Seeded production-like dummy data." }),
    },
  ]);
};

const resetDatabase = async () => {
  await sequelize.query("PRAGMA foreign_keys = OFF");
  await sequelize.drop();
  await sequelize.query("PRAGMA foreign_keys = ON");
};

const run = async () => {
  await resetDatabase();
  await sequelize.sync();
  console.log("Seeding database with fresh dummy data...");

  const {
    admin,
    supervisorA,
    supervisorB,
    demoSupervisor,
    mavericks,
    demoMaverick,
  } = await seedUsers();
  const trainers = await seedTrainers();
  const courses = await seedCourses();
  const sessions = await seedSessions({ admin, courses, trainers });
  await seedParticipants({
    sessions,
    mavericks,
    supervisors: [supervisorA, supervisorB],
    demoMaverick,
    demoSupervisor,
  });
  const cycles = await seedFeedbackCycles({ sessions });
  await seedFeedbackForms({
    cycles,
    mavericks,
    supervisors: [supervisorA, supervisorB],
    sessions,
    demoMaverick,
    demoSupervisor,
  });
  await seedNotifications({
    admin,
    supervisors: [supervisorA, supervisorB, demoSupervisor],
  });
  await seedAuditLogs({ admin });

  console.log("Seed completed successfully.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
