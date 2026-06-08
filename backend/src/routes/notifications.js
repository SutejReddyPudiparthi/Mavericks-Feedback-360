import { Router } from "express";
import { Notification } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const [notifications, total] = await Promise.all([
    Notification.findAll({
      where: { userId: req.user.id },
      order: [["sentAt", "DESC"]],
      offset: (+page - 1) * +pageSize,
      limit: +pageSize,
    }),
    Notification.count({ where: { userId: req.user.id } }),
  ]);
  res.json({ data: notifications, total, page: +page, pageSize: +pageSize });
});

router.patch("/:id/read", async (req, res) => {
  const n = await Notification.findOne({ where: { id: req.params.id } });
  if (!n || n.userId !== req.user.id)
    return res.status(403).json({ error: { code: "FORBIDDEN" } });
  const updated = await Notification.update(
    { readAt: new Date() },
    { where: { id: req.params.id }, returning: true },
  );
  res.json({ readAt: updated[1][0].readAt });
});

router.patch("/read-all", async (req, res) => {
  await Notification.update(
    { readAt: new Date() },
    { where: { userId: req.user.id, readAt: null } },
  );
  res.json({ success: true });
});

export default router;
