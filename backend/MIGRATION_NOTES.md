# Prisma to Sequelize Migration Guide

## Completed Migrations

✅ package.json - Replaced Prisma dependencies with Sequelize
✅ src/db.js - Created Sequelize database configuration  
✅ src/models/ - Created all Sequelize models (15 models)
✅ src/server.js - Updated to initialize Sequelize
✅ routes/auth.js - Migrated all authentication routes
✅ routes/users.js - Migrated user management routes
✅ routes/notifications.js - Migrated notification routes
✅ routes/auditLogs.js - Migrated audit log routes
✅ routes/master.js - Migrated courses, trainers, sessions routes
✅ utils/audit.js - Updated audit logging utility
✅ services/notification.js - Updated notification service

## Remaining Migrations

⏳ routes/analytics.js - Complex analytics queries
⏳ routes/participants.js - Bulk participant upload and management
⏳ routes/feedback.js - Feedback form and cycle management

## Key Changes from Prisma to Sequelize

### Query Methods

- `findUnique()` → `findOne()`
- `findMany()` → `findAll()`
- `findFirst()` → `findOne()`
- `count()` → `count()`
- `create()` → `create()`
- `update()` → `update()` (returns [1, [updated_record]] with returning: true)
- `createMany()` → `bulkCreate()`

### Where Clause

- `{ field: value }` → `{ where: { field: value } }`
- `{ contains: 'text' }` → `{ [Op.like]: '%text%' }`
- `{ gt: date }` → `{ [Op.gt]: date }`
- `{ gte: date }` → `{ [Op.gte]: date }`
- `{ lte: date }` → `{ [Op.lte]: date }`
- `{ in: [values] }` → `{ [Op.in]: [values] }`
- `{ OR: [...] }` → `{ [Op.or]: [...] }`

### Pagination

- `skip: n` → `offset: n`
- `take: n` → `limit: n`

### Ordering

- `orderBy: { field: 'asc' }` → `order: [['field', 'ASC']]`

### Relationships

- `include: { relation: {...} }` → `include: [{ association: 'relation', ... }]`
- Requires associations defined in model index.js

### Database Initialization

- Prisma: `npx prisma migrate dev`
- Sequelize: `sequelize.sync({ alter: true })` (in server.js)
