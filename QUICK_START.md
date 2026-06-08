# Quick Start Guide - Designathon with Sequelize

## What Changed?

✅ Removed Prisma ORM (caused installation issues on company laptop)  
✅ Added Sequelize ORM (pure JavaScript, no build tools needed)  
✅ All API endpoints remain the same - frontend needs NO changes!

## Installation & Running

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

✅ Server starts  
✅ Database auto-creates at `backend/data.db`  
✅ Ready for frontend to connect

### Step 3: Start Frontend (in another terminal)

```bash
cd frontend
npm run dev
```

Access at: http://localhost:5173

## What To Do If Something Breaks

### Error: "database is locked"

```bash
rm backend/data.db-wal backend/data.db-shm
npm run dev
```

### Error: "Port 5000 already in use"

```bash
PORT=5001 npm run dev
```

### Error: Database table doesn't exist

```bash
# Delete and recreate:
rm backend/data.db*
npm run dev
```

### Can't login? Try this:

1. Delete database: `rm backend/data.db*`
2. Restart server: `npm run dev`
3. Check backend console for errors
4. Verify API connection in frontend Network tab

## How To Tell It's Working

✅ Terminal shows: `Database synced successfully`  
✅ Frontend login page loads  
✅ Can submit form data  
✅ Data appears in analytics dashboard

## Files You Might Need

- **User guide**: Read `PRISMA_TO_SEQUELIZE_README.md`
- **Technical details**: Read `MIGRATION_NOTES.md`
- **Full checklist**: Read `MIGRATION_VERIFICATION_CHECKLIST.md`
- **Database file**: `backend/data.db` (SQLite)

## Backup Your Data

The database is now a single file:

```bash
# Backup before testing
cp backend/data.db backend/data.db.backup

# Restore if needed
cp backend/data.db.backup backend/data.db
```

## Quick Reference

| Task           | Command                                   |
| -------------- | ----------------------------------------- |
| Start backend  | `cd backend && npm run dev`               |
| Start frontend | `cd frontend && npm run dev`              |
| Reset database | `rm backend/data.db*`                     |
| Check logs     | Look in terminal where `npm run dev` runs |
| Stop server    | Press `Ctrl+C` in terminal                |

## No Changes Needed For:

- ✅ Frontend code (React/Vite)
- ✅ API endpoints (same URLs)
- ✅ API request/response format
- ✅ Authentication flow
- ✅ Dashboard and reports

## All Set! 🚀

Your Designathon app is now company laptop compatible!

Just run:

```bash
npm install && npm run dev
```

And you're ready to go!
