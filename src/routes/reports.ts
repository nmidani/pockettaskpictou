import { Router, type IRouter } from "express";
import { db, reportsTable, userProfilesTable } from "../db";
import { eq, sql } from "drizzle-orm";
import { recalcTrustScore } from "../lib/trustScore";

const router: IRouter = Router();

const REPORT_REASONS = [
  "Did not show up",
  "Payment issue",
  "Spam",
  "Harassment",
  "Unsafe task",
];

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
    if (!["user", "task"].includes(targetType)) {
      res.status(400).json({ error: "Invalid targetType" });
      return;
    }

    // Prevent self-reports
    if (targetType === "user" && String(targetId) === req.user.id) {
      res.status(400).json({ error: "You cannot report yourself" });
      return;
    }

    await db.insert(reportsTable).values({
      reporterId: req.user.id,
      targetType,
      targetId: String(targetId),
      reason,
      details: details || null,
    });

    // For user reports: increment reportsCount and recalculate trust score
    if (targetType === "user") {
      const profileExists = await db
        .select({ id: userProfilesTable.id })
        .from(userProfilesTable)
        .where(eq(userProfilesTable.id, String(targetId)));

      if (profileExists.length > 0) {
        await db.execute(sql`
          UPDATE user_profiles
          SET reports_count = reports_count + 1, updated_at = NOW()
          WHERE id = ${String(targetId)}
        `);
        await recalcTrustScore(String(targetId));
      }
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
