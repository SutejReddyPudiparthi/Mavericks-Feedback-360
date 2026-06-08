# Maverick Feedback 360 — Designathon Presentation Outline

## Slide 1: Project Title & Elevator Pitch

- Title: **Maverick Feedback 360**
- Subtitle: A role-based training feedback platform for Admins, Mavericks, and Supervisors.
- Speaker note: "This project solves the gap between training delivery and feedback analysis by bringing everyone into one digital workflow."
- Mention: built with React, Vite, Express, Prisma, SQLite.

## Slide 2: Problem Statement

- Training feedback is often scattered across spreadsheets, email, and manual notes.
- Supervisors cannot easily track performance, and admins cannot reliably audit training outcomes.
- Feedback is hard to analyze, especially when data is collected manually.
- Speaker note: "Imagine a training program where you don't know who submitted feedback, how many forms are pending, or whether a Maverick is underperforming. This is the problem we solve."

## Slide 3: Solution Overview

- Centralized training feedback lifecycle.
- Role-based dashboards and secure access.
- Automated cycle tracking and submission thresholds.
- Notifications, audit logs, analytics, and report export.
- Speaker note: "Our solution manages courses, sessions, participants, and feedback from start to finish, while keeping each user in their appropriate role."

## Slide 4: Roles & Pages

### Admin

- Dashboard
- Courses
- Trainers
- Sessions
- Analytics
- Reports
- Leaderboard
- Users
- Audit log

### Maverick

- Dashboard
- My Feedback
- Training History
- Leaderboard

### Supervisor

- Dashboard
- Evaluations
- My Mavericks
- Leaderboard

- Speaker note: "Each role sees only the pages they need, and every action is protected by role-based authorization."

## Slide 5: Architecture

### Backend

- Node.js + Express API
- Prisma ORM with SQLite
- JWT authentication
- Excel support with `xlsx`
- File upload via `multer`

### Frontend

- React + Vite
- React Router for navigation
- Axios for API calls
- Tailwind CSS for UI
- React Hot Toast for notifications

- Speaker note: "We used a lightweight but modern stack so the app is fast, easy to develop, and easy to extend."

## Slide 6: Data Model

- `User` for Admin/Maverick/Supervisor
- `Course`, `Trainer`, `Session`
- `SessionParticipant`
- `FeedbackCycle`
- `MaverickFeedbackForm`
- `SupervisorEvaluationForm`
- `Notification`, `AuditLog`
- `SentimentResult`, `ThemeCluster`

- Speaker note: "The database is built with Prisma, which makes relationships explicit and easy to extend for future features."

## Slide 7: Key Features — Admin

- Create and manage courses, trainers, sessions
- Upload participants using Excel template
- Monitor session status and overdue cycles
- Review analytics and leaderboards
- View audit log of all admin actions
- Speaker note: "Admin gets full control and transparency over the training program."

## Slide 8: Key Features — Maverick

- View pending feedback at a glance
- Complete forms with 1–5 rating and comments
- Auto-save drafts every 60 seconds
- Submit final feedback
- Access training history
- Speaker note: "Mavericks have a simple, guided experience to capture their learning feedback."

## Slide 9: Key Features — Supervisor

- Manage assigned Mavericks
- Complete evaluations across five criteria
- Save drafts and submit final reviews
- Trigger alerts for low performance
- Speaker note: "Supervisors can assess effectiveness and quickly identify Mavericks who need attention."

## Slide 10: Analytics & Reporting

- Dashboard overview metrics
- Session scorecards
- Trainer performance tracking
- Leaderboards for Mavericks and Trainers
- Export reports as JSON or Excel
- Speaker note: "Analytics turn feedback data into actionable insights for training improvement."

## Slide 11: Security & Governance

- JWT-based authentication
- `authenticate()` middleware for protected APIs
- `authorize()` middleware for role safety
- Audit logs record admin actions with before/after values
- Notification system for important events
- Speaker note: "This app includes security controls and audit trails, making it suitable for enterprise-style workflows."

## Slide 12: Demo Flow

### Admin demo

1. Login as Admin
2. Show dashboard metrics
3. Create course/trainer/session
4. Upload participants via Excel
5. View audit log and analytics

### Maverick demo

1. Login as Maverick
2. Show pending feedback
3. Open form and fill rating/comments
4. Save draft and submit

### Supervisor demo

1. Login as Supervisor
2. Show pending evaluations
3. Fill scorecards and submit
4. Mention low performance alert

- Speaker note: "This flow showcases the entire lifecycle from setup to feedback completion and analytics."

## Slide 13: Tech Implementation Highlights

- Modular backend routes for each feature area
- Frontend protected routes and role-based navigation
- Auto-save and draft support in forms
- Feedback cycle auto-closes when thresholds are met
- Simulated AI analytics with sentiment and theme extraction
- Speaker note: "We built both functional workflows and analytics stubs that demonstrate how the system can scale further."

## Slide 14: Future Enhancements

- Replace sentiment stub with real NLP service
- Add real email/SMS delivery
- Add richer charts and dashboards
- Add reminder/notification automation
- Add test coverage for backend and frontend
- Speaker note: "This project is already strong, and these improvements make it even more production-ready."

## Slide 15: Conclusion

- Solves real training feedback challenges
- Delivers role-specific experiences
- Supports analytics, audit, and governance
- Built with modern full-stack technologies
- Speaker note: "Maverick Feedback 360 is a complete demoable product that can be extended into a production training feedback system."

## Appendix: Run Instructions

- Backend:
  - `cd backend`
  - `npm install`
  - `npm run dev`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`
- Seed data:
  - `cd backend`
  - `npm run seed`

## Notes for Q&A

- Why Prisma? It simplifies database schema and relationships.
- Why Tailwind? For fast and consistent UI styling.
- How is security enforced? Role-based auth via middleware and JWT.
- How can this scale? Add real analytics, notifications, and testing.
