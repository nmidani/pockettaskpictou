import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/reports", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    await db.insert(reportsTable).values({
      reporterId: req.user.id,
      targetType,
      targetId: String(targetId),
      reason,
      details: details || null,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
