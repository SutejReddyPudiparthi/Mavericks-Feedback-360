import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

const router = Router();
router.use(authenticate);

// GET /users (list with pagination)
router.get("/", authorize("Admin"), async (req, res) => {
  const { role, status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  const [users, total] = await Promise.all([
    User.findAll({
      where,
      offset: (page - 1) * pageSize,
      limit: +pageSize,
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "status",
        "employeeId",
        "supervisorId",
      ],
    }),
    User.count({ where }),
  ]);
  res.json({ data: users, total, page: +page, pageSize: +pageSize });
});

// POST /users (create user)
router.post("/", authorize("Admin"), async (req, res) => {
  const { name, email, mobile, employeeId, role, supervisorId, password } =
    req.body;
  if (!name || !email || !employeeId || !role)
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "name, email, employeeId, role required",
      },
    });
  const passwordHash = password
    ? await bcrypt.hash(password, 10)
    : await bcrypt.hash("Maverick@123", 10);
  const user = await User.create({
    name,
    email,
    mobile,
    employeeId,
    role,
    supervisorId,
    passwordHash,
  });
  await audit(req.user.id, "CREATE", "User", user.id, null, {
    name,
    email,
    role,
  });
  res.status(201).json({ id: user.id, createdAt: user.createdAt });
});

// ========== SUPERVISOR MAPPING ROUTES (specific routes BEFORE :id routes) ==========

// GET /supervisor-mapping (list all mappings)
router.get("/supervisor-mapping", authorize("Admin"), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "supervisorId"],
      include: [{ association: "supervisor", attributes: ["id", "name"] }],
    });
    const mappings = {};
    users.forEach((user) => {
      mappings[user.id] = {
        supervisorId: user.supervisorId,
        supervisorName: user.supervisor?.name || null,
      };
    });
    res.json(mappings);
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch mappings" },
    });
  }
});

// PUT /supervisor-mapping (update supervisor mapping)
router.put("/supervisor-mapping", authorize("Admin"), async (req, res) => {
  const { userId, supervisorId } = req.body;
  if (!userId)
    return res.status(400).json({ error: { code: "MISSING_FIELDS" } });
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    await User.update({ supervisorId }, { where: { id: userId } });
    await audit(req.user.id, "UPDATE_MAPPING", "User", userId, user, {
      supervisorId,
    });
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to update mapping" },
    });
  }
});

// ========== ID-BASED ROUTES (parameterized routes AFTER specific routes) ==========

// GET /users/:id
router.get("/:id", async (req, res) => {
  if (req.user.role !== "Admin" && req.user.id !== req.params.id)
    return res
      .status(403)
      .json({ error: { code: "FORBIDDEN", message: "Access denied" } });
  const user = await User.findOne({
    where: { id: req.params.id },
    attributes: [
      "id",
      "name",
      "email",
      "mobile",
      "role",
      "status",
      "employeeId",
      "supervisorId",
    ],
  });
  if (!user)
    return res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "User not found" } });
  res.json(user);
});

// PUT /users/:id
router.put("/:id", authorize("Admin"), async (req, res) => {
  const old = await User.findOne({ where: { id: req.params.id } });
  const { name, email, mobile, role, supervisorId } = req.body;
  const user = await User.update(
    { name, email, mobile, role, supervisorId },
    { where: { id: req.params.id }, returning: true },
  );
  await audit(req.user.id, "UPDATE", "User", req.params.id, old, {
    name,
    email,
    role,
  });
  res.json(user[1][0]);
});

// PATCH /users/:id/status
router.patch("/:id/status", authorize("Admin"), async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status))
    return res.status(400).json({ error: { code: "INVALID_STATUS" } });
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    await User.update({ status }, { where: { id: req.params.id } });
    const updatedUser = await User.findOne({ where: { id: req.params.id } });
    await audit(req.user.id, "STATUS_CHANGE", "User", req.params.id, user, {
      status,
    });
    res.json({ status: updatedUser.status, updatedAt: updatedUser.updatedAt });
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to update status" },
    });
  }
});

// GET /users/:id/supervisor-mapping
router.get("/:id/supervisor-mapping", authorize("Admin"), async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id },
      include: [{ association: "supervisor", attributes: ["id", "name"] }],
    });
    if (!user)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    res.json({
      supervisorId: user.supervisorId,
      supervisorName: user.supervisor?.name || null,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch mapping" },
    });
  }
});

// PUT /users/:id/supervisor-mapping
router.put("/:id/supervisor-mapping", authorize("Admin"), async (req, res) => {
  const { supervisorId } = req.body;
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    await User.update({ supervisorId }, { where: { id: req.params.id } });
    await audit(req.user.id, "UPDATE_MAPPING", "User", req.params.id, user, {
      supervisorId,
    });
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to update mapping" },
    });
  }
});

export default router;
