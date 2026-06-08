# Maverick Feedback 360 — Local Run & Integration

Quick steps to run the app locally (frontend + backend) and demo credentials.

Prerequisites

- Node.js 18+ installed

Backend

```bash
cd backend
npm install
# seed the DB (creates demo users)
npm run seed
# start backend
npm start
```

Frontend (dev)

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Frontend UI tests

```bash
cd frontend
npm run test:e2e
```

Frontend (build)

```bash
cd frontend
npm run build
# serve the built site via any static server, or use `vite preview`
```

API

- Backend default port: `5000`
- Frontend dev server proxies `/api` → `http://localhost:5000`

Demo credentials (seeded):

- Admin: `admin@maverick360.com` / `Admin@123`
- Supervisor: `supervisor@maverick360.com` / `Supervisor@123`
- Maverick: `maverick@maverick360.com` / `Maverick@123`

Notes

- The backend was migrated from Prisma to Sequelize. The SQLite file `data.db` is used by default (configured in `backend/src/db.js`).
- If you need to reset data, remove `backend/data.db` then re-run `npm run seed` in `backend`.

If you want, I can add a `make`/script to orchestrate starting both servers.
