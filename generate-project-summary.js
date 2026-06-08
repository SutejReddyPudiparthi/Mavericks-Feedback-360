import fs from "fs";
import PDFDocument from "pdfkit";

const outputPath = "Maverick_Feedback_360_Detailed_Analysis.pdf";
const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const writeHeading = (text) => {
  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(16).text(text);
  doc.moveDown(0.3);
};

const writeSubheading = (text) => {
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).text(text);
  doc.moveDown(0.2);
};

const writeParagraph = (text) => {
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .text(text, { paragraphGap: 6, lineGap: 2 });
};

const writeList = (items) => {
  items.forEach((item) => {
    doc
      .font("Helvetica")
      .fontSize(10.5)
      .text(`• ${item}`, { indent: 10, paragraphGap: 3, lineGap: 2 });
  });
  doc.moveDown(0.2);
};

writeHeading("Maverick Feedback 360 — Detailed Project Analysis");
writeParagraph(
  "This document provides an in-depth summary of the Designathon project, including technical architecture, implementation details, feature coverage, database design, frontend/back-end behavior, and demo-ready talking points. It is based on the workspace files and route implementations found in the repository.",
);

writeHeading("Project Overview");
writeParagraph(
  "Maverick Feedback 360 is a full-stack application for training feedback management. It supports separate Admin, Maverick, and Supervisor roles, and implements training session management, feedback cycles, analytics, notifications, and audit logging.",
);

writeHeading("Tech Stack");
writeSubheading("Backend");
writeList([
  "Node.js with Express for REST API server",
  "Prisma ORM with SQLite database for data storage",
  "JWT-based authentication with jsonwebtoken",
  "Password hashing using bcryptjs",
  "CORS and JSON request handling through express middleware",
  "File upload via multer and Excel support via xlsx",
  "Email/notification stubs using custom service and nodemailer package",
  "Development support with nodemon and dotenv configuration",
]);

writeSubheading("Frontend");
writeList([
  "React 19 for the user interface",
  "Vite as the build and dev server",
  "React Router DOM for client-side routing",
  "Axios for API communication",
  "Tailwind CSS for utility-based styling",
  "Lucide-react icons for UI elements",
  "React Hot Toast for toast notifications",
  "Recharts for analytics/charting use cases",
]);

writeHeading("Architecture and Structure");
writeSubheading("Backend");
writeParagraph(
  "The backend is organized into modular route files. The main server entry point is backend/src/server.js, which configures CORS, JSON parsing, and registers route modules for auth, users, master data, participants, feedback, analytics, notifications, and audit logs.",
);
writeParagraph(
  "Core services are implemented in backend/src/services and backend/src/utils, while the Prisma schema and seed data are stored in backend/prisma. Authentication middleware protects routes and enforces role-based access.",
);

writeSubheading("Frontend");
writeParagraph(
  "The frontend uses React and a context-based authentication approach. App.jsx configures BrowserRouter, protected routes, and role-specific route access. Layout.jsx renders a sidebar navigation based on the signed-in user role and wraps pages in a consistent layout.",
);
writeParagraph(
  "AuthContext.jsx stores user state and token information in localStorage. Axios interceptors automatically attach the token to API requests and redirect the user to login on unauthorized responses.",
);

writeHeading("Key Backend Features");
writeSubheading("Authentication");
writeList([
  "Standard email/password login route",
  "OTP request and verification flow for alternate login",
  "User details endpoint returning id, name, email, role, employeeId, supervisorId",
  "JWT tokens with 8-hour expiry support",
]);

writeSubheading("Role-based Access Control");
writeParagraph(
  "Admin-only routes are enforced via authorization middleware. Routes also verify ownership on user-specific resources, so regular users cannot access other users’ private feedback and forms.",
);

writeSubheading("User Management");
writeList([
  "Admin can list users with paging, filtering by role or status",
  "Create users with hashed passwords",
  "Update user profiles and supervisor mappings",
  "Activate or deactivate users with status changes",
  "Audit logging on admin actions",
]);

writeSubheading("Training Management");
writeList([
  "CRUD operations for courses, trainers, and sessions",
  "Session conflict detection for trainer schedule overlap",
  "Participant upload by Excel template for bulk enrollment",
  "Participant supervisor mapping and notification on enrollment",
]);

writeSubheading("Feedback Workflows");
writeList([
  "Maverick feedback forms support draft saving and final submission",
  "Supervisor evaluation forms support draft saving and final submission",
  "Feedback cycles automatically close when completion threshold is met",
  "Admin override closing of cycles with reason and audit log",
]);

writeSubheading("Analytics and Reporting");
writeList([
  "Dashboard overview metrics for active sessions, overdue cycles, closed cycles, and total submissions",
  "Session scorecards including average rating, completion percentage, sentiment distribution, and theme clusters",
  "Trainer performance endpoints returning rating trends",
  "Leaderboards for Mavericks and Trainers",
  "Report generation with JSON or Excel export",
]);

writeSubheading("Notifications and Audit");
writeList([
  "Notification list and pagination per user",
  "Mark individual notifications as read or mark all as read",
  "Audit logs for admin activity with actor, action, entity type, and payload",
  "Audit routes available to Admin role only",
]);

writeHeading("Data Model Highlights");
writeParagraph(
  "The Prisma schema defines the following key entities: User, Course, Trainer, Session, SessionParticipant, FeedbackCycle, MaverickFeedbackForm, SupervisorEvaluationForm, SentimentResult, ThemeCluster, Notification, AuditLog, TrainerRecommendation, and OtpCode.",
);
writeParagraph(
  "This model supports rich relationships between sessions, enrollments, feedback cycles, and roles, enabling the full feedback lifecycle.",
);

writeHeading("Frontend Pages and Role Experience");
writeSubheading("Admin");
writeList([
  "Dashboard with metrics, recent sessions, and alerts",
  "Courses management page",
  "Trainers management page",
  "Sessions management and detail views",
  "Analytics and performance insights",
  "Reports view for export",
  "Leaderboard and user audit log",
]);
writeSubheading("Maverick");
writeList([
  "Personal dashboard",
  "Feedback form list and submission flow",
  "Training history page",
  "Leaderboard access",
]);
writeSubheading("Supervisor");
writeList([
  "Supervisor dashboard",
  "Evaluations list and detailed evaluation forms",
  "Managed mavericks list",
  "Leaderboard access",
]);

writeHeading("Demo Talking Points");
writeList([
  "Show login and authentication flow for a role-based user",
  "Demonstrate Admin dashboard metrics and recent alerts",
  "Create or edit a course, trainer, and session",
  "Upload participants with Excel template and enroll users",
  "Complete a Maverick feedback submission and show its status",
  "Complete a Supervisor evaluation and trigger analytics",
  "Display analytics charts, leaderboards, and session scorecards",
  "Open the audit log to show traceability and compliance",
]);

writeHeading("Commands");
writeList([
  "Backend: cd backend && npm install && npm run dev",
  "Frontend: cd frontend && npm install && npm run dev",
  "Seed database: cd backend && npm run seed",
]);

writeParagraph(
  "The application is ready for a product demo that highlights training feedback lifecycle, role-based workflows, analytics, and admin governance. The backend is modular and extensible, while the frontend supports quick navigation and real-time feedback for each user role.",
);

doc.end();
stream.on("finish", () => console.log(`Generated PDF: ${outputPath}`));
