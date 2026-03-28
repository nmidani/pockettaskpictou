import { Router, type IRouter } from "express";
import { db, applicationsTable, tasksTable } from "../db";
import { eq } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";

const router: IRouter = Router();

router.patch("/applications/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status || !["accepted", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, app.taskId));
    if (!task || task.postedById !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db.update(applicationsTable)
      .set({ status })
      .where(eq(applicationsTable.id, id))
      .returning();

    if (status === "accepted") {
      await db.update(tasksTable)
        .set({ assignedToId: app.applicantId, status: "in_progress" })
        .where(eq(tasksTable.id, app.taskId));
    }

    const applicant = await getUserInfo(updated.applicantId);
    res.json({
      ...updated,
      applicant: applicant || { id: updated.applicantId, username: "User" },
      task: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

export default router;
