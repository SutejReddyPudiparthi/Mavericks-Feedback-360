# Maverick Feedback 360
### Training Feedback & Effectiveness Portal

---

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma 5 |
| Database | SQLite (dev) |
| Auth | JWT + OTP fallback |
| Charts | Recharts |
| AI | Stub NLP service (AWS Comprehend-ready) |

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run seed        # Seeds DB with demo users
npm run dev         # Starts API on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev         # Starts UI on http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin / L&D | admin@maverick360.com | Admin@123 |
| Supervisor | supervisor@maverick360.com | Super@123 |
| Maverick 1 | maverick1@maverick360.com | Mav@123 |
| Maverick 2 | maverick2@maverick360.com | Mav@123 |

---

## Features Implemented

### Backend API (`/api`)
- `POST /auth/login` — JWT login
- `POST /auth/otp/request` + `/otp/verify` — OTP fallback
- `GET /auth/me` — Current user
- `GET|POST|PUT|PATCH /users` — User management + supervisor mapping
- `GET|POST|PUT|PATCH /courses` — Course master
- `GET|POST|PUT /trainers` — Trainer/vendor master
- `GET|POST|PUT|PATCH /sessions` — Session scheduling + conflict detection
- `GET /sessions/:id/participants` — Roster
- `GET /participants/template` — Excel template download
- `POST /participants/upload/:sessionId` — Bulk participant upload with validation
- `GET|PUT|POST /feedback/maverick/:id` — Maverick feedback form (draft + submit)
- `GET|PUT|POST /feedback/supervisor/:id` — Supervisor evaluation form (draft + submit)
- `GET /feedback/cycles/:id` — Cycle status + completion %
- `PATCH /feedback/cycles/:id/threshold` — Configure threshold
- `POST /feedback/cycles/:id/close-override` — Admin override with audit trail
- `GET /analytics/overview` — Admin KPI dashboard
- `GET /analytics/sessions/:id/scorecard` — Session scorecard with sentiment
- `GET /analytics/trainers/:id/performance` — Trainer rating trend
- `GET /analytics/leaderboard` — Top Mavericks and Trainers
- `GET /analytics/report` — Filtered report + Excel export
- `GET|PATCH /notifications` — Notification center
- `GET /audit-logs` — Immutable audit log (Admin only)

### Frontend Pages
- **Login** — Password + OTP tabs with demo credentials panel
- **Admin Dashboard** — KPI cards, session list, alert feed
- **Sessions** — Create/edit/cancel, participant upload, cycle monitor, override modal
- **Courses** — Create/edit/archive with type and domain
- **Trainers** — Create/edit with engagement type
- **Analytics** — Trainer rating trend chart, Maverick/Trainer leaderboard
- **Reports** — Filtered report generation + Excel export
- **Users** — Create/deactivate users with role assignment
- **Audit Log** — Filterable immutable action history
- **Maverick Dashboard** — Pending forms, notifications
- **Maverick Feedback Form** — Star rating, conditional follow-up, auto-save, submit lock
- **Supervisor Dashboard** — Pending evaluations, notifications
- **Supervisor Evaluation Form** — 5-criterion rating grid, comments, submit lock
- **Leaderboard** — Top 10 Mavericks and Trainers with medal display

---

## Architecture Notes

- **Completion threshold enforcement** — Cycles auto-close when `submitted/enrolled >= threshold`. Admin override requires 20+ char reason, fully audit-logged.
- **AI sentiment** — Runs on cycle closure via keyword-based stub. Replace `src/services/ai.js` with AWS Comprehend calls for production.
- **Reminders** — Stub scheduler in place. Wire to a cron job (node-cron) or AWS EventBridge for production.
- **SSO** — Stub in `/auth/sso/callback`. Wire SAML 2.0 / OAuth 2.0 IdP token exchange for production.
- **Email/SMS** — Console-logged stubs in `src/services/notification.js`. Replace with SES/SendGrid/Twilio.

---

## Production Checklist
- [ ] Replace `JWT_SECRET` with a secure random value
- [ ] Switch `DATABASE_URL` to PostgreSQL connection string
- [ ] Wire SSO IdP (SAML 2.0 / OAuth 2.0)
- [ ] Wire email service (SES / SendGrid)
- [ ] Wire SMS gateway (Twilio / SNS)
- [ ] Replace AI stub with AWS Comprehend
- [ ] Add cron job for reminder/escalation scheduler
- [ ] Enable HTTPS / TLS termination
- [ ] Set `FRONTEND_URL` to production domain in backend `.env`
