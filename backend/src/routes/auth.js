import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User, OtpCode } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    },
  );

// POST /auth/login — email + password
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Email and password required",
      },
    });
  const user = await User.findOne({ where: { email } });
  if (!user || user.status !== "Active")
    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
    });
  const valid = await bcrypt.compare(password, user.passwordHash || "");
  if (!valid)
    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
    });
  res.json({ accessToken: signToken(user), expiresIn: 28800 });
});

// POST /auth/otp/request
router.post("/otp/request", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user)
    return res
      .status(404)
      .json({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OtpCode.create({ userId: user.id, code, expiresAt });
  console.log(`[OTP] ${user.email} → ${code}`); // Replace with email/SMS in prod
  res.json({ otpSent: true, expiresIn: 600 });
});

// POST /auth/otp/verify
router.post("/otp/verify", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user)
    return res
      .status(404)
      .json({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
  const record = await OtpCode.findOne({
    where: { userId: user.id, used: false, expiresAt: { [Op.gt]: new Date() } },
    order: [["createdAt", "DESC"]],
  });
  if (!record)
    return res.status(401).json({
      error: { code: "OTP_EXPIRED", message: "OTP expired or not found" },
    });
  if (record.attempts >= 3)
    return res
      .status(429)
      .json({ error: { code: "OTP_LOCKED", message: "Too many attempts" } });
  if (record.code !== otp) {
    await record.update({ attempts: record.attempts + 1 });
    return res
      .status(401)
      .json({ error: { code: "INVALID_OTP", message: "Invalid OTP" } });
  }
  await record.update({ used: true });
  res.json({ accessToken: signToken(user), expiresIn: 28800 });
});

// GET /auth/me
router.get("/me", authenticate, async (req, res) => {
  const user = await User.findOne({
    where: { id: req.user.id },
    attributes: ["id", "name", "email", "role", "employeeId", "supervisorId"],
  });
  res.json(user);
});

export default router;
