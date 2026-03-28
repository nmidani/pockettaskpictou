import { Router, type IRouter } from "express";
import { db, tasksTable, applicationsTable, userProfilesTable } from "../db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";
import { APPLICATION_WINDOW_SECONDS } from "../lib/assignmentScheduler";
import { checkSpamLimits, recalcTrustScore } from "../lib/trustScore";

const router: IRouter = Router();

async function ensureProfile(userId: string) {
  await db.execute(
    sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`
  );
}

router.get("/tasks", async (req, res) => {
  try {
    const { status, category, town } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(tasksTable.status, status as "open" | "claimed" | "in_progress" | "completed" | "cancelled"));
    }
    if (category && typeof category === "string") {
      conditions.push(eq(tasksTable.category, category));
    }
    if (town && typeof town === "string") {
      conditions.push(eq(tasksTable.town, town));
    }
    const tasks = conditions.length > 0
      ? await db.select().from(tasksTable).where(and(...conditions)).orderBy(desc(tasksTable.createdAt))
      : await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { title, description, category, pay, paymentMethod, lat, lng, locationName, town, estimatedHours } = req.body;
    if (!title || !description || !category || pay == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    await ensureProfile(req.user.id);

    // Anti-spam: daily post limit + cooldown
    const spamErr = await checkSpamLimits(req.user.id, "post");
    if (spamErr) {
      res.status(429).json({ error: spamErr });
      return;
    }

    // Set the 30-second application window starting now
    const windowEndsAt = new Date(Date.now() + APPLICATION_WINDOW_SECONDS * 1000);

    const [task] = await db.insert(tasksTable).values({
      title, description, category,
      pay: Number(pay),
      paymentMethod: paymentMethod || "cash",
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      locationName: locationName || null,
      town: town || null,
      estimatedHours: estimatedHours != null ? Number(estimatedHours) : null,
      postedById: req.user.id,
      applicationWindowEndsAt: windowEndsAt,
    }).returning();

    await db.execute(
      sql`INSERT INTO user_profiles (id, tasks_posted) VALUES (${req.user.id}, 1)
          ON CONFLICT (id) DO UPDATE SET tasks_posted = user_profiles.tasks_posted + 1, updated_at = NOW()`
    );
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.get("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }

    const postedBy = await getUserInfo(task.postedById);
    let claimedBy = null;
    if (task.claimedById) claimedBy = await getUserInfo(task.claimedById);

    const appCount = await db.select({ count: sql<number>`count(*)` })
      .from(applicationsTable).where(eq(applicationsTable.taskId, id));

    // Check if current user has applied
    let userApplication = null;
    if ((req as any).user?.id) {
      const [existing] = await db.select().from(applicationsTable)
        .where(and(eq(applicationsTable.taskId, id), eq(applicationsTable.applicantId, (req as any).user.id)));
      userApplication = existing ?? null;
    }

    res.json({
      ...task,
      postedBy: postedBy || { id: task.postedById, username: "User" },
      claimedBy,
      applicationCount: Number(appCount[0]?.count || 0),
      userApplication,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (task.postedById !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }

    const { title, description, category, pay, paymentMethod, status, lat, lng, locationName, town, estimatedHours } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (pay !== undefined) updates.pay = Number(pay);
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (status !== undefined) updates.status = status;
    if (lat !== undefined) updates.lat = lat != null ? Number(lat) : null;
    if (lng !== undefined) updates.lng = lng != null ? Number(lng) : null;
    if (locationName !== undefined) updates.locationName = locationName;
    if (town !== undefined) updates.town = town;
    if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours != null ? Number(estimatedHours) : null;

    const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const id = parseInt(req.params.id);
    await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.postedById, req.user.id)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Fair apply — replaces first-come-first-served claim
router.post("/tasks/:id/apply", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const taskId = parseInt(req.params.id);
    const { lat, lng } = req.body;

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (task.postedById === req.user.id) {
      res.status(400).json({ error: "You cannot apply to your own task" }); return;
    }
    if (task.status !== "open") {
      res.status(409).json({ error: "This task is no longer accepting applications" }); return;
    }

    // Check the application window is still open
    const now = new Date();
    if (task.applicationWindowEndsAt && task.applicationWindowEndsAt < now) {
      res.status(409).json({ error: "The application window for this task has closed" }); return;
    }

    await ensureProfile(req.user.id);

    // Anti-spam: daily apply limit + cooldown
    const spamErr = await checkSpamLimits(req.user.id, "apply");
    if (spamErr) {
      res.status(429).json({ error: spamErr });
      return;
    }

    // Check active task limit (max 2 assigned tasks at once)
    const activeResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM tasks
      WHERE (claimed_by_id = ${req.user.id} OR assigned_to_id = ${req.user.id})
        AND status IN ('claimed', 'in_progress')
    `);
    const activeCount = activeResult.rows[0];
    if (Number((activeCount as any).count) >= 2) {
      res.status(400).json({ error: "You already have 2 active tasks. Complete one before applying to more." }); return;
    }

    // Check not already applied
    const [existing] = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.taskId, taskId), eq(applicationsTable.applicantId, req.user.id)));
    if (existing) {
      res.status(409).json({ error: "You have already applied to this task" }); return;
    }

    const [app] = await db.insert(applicationsTable).values({
      taskId,
      applicantId: req.user.id,
      applicantLat: lat != null ? Number(lat) : null,
      applicantLng: lng != null ? Number(lng) : null,
    }).returning();

    res.status(201).json({ ...app, message: "Application submitted! Results are assigned fairly within 30 seconds." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to apply to task" });
  }
});

// Legacy claim route kept for backward compatibility
router.post("/tasks/:id/claim", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (task.postedById === req.user.id) {
      res.status(400).json({ error: "You cannot claim your own task" }); return;
    }
    if (task.status !== "open") {
      res.status(409).json({ error: "This task has already been taken." }); return;
    }

    const result = await db.execute(sql`
      UPDATE tasks SET
        claimed_by_id = ${req.user.id},
        claimed_at = NOW(),
        status = 'claimed',
        updated_at = NOW()
      WHERE id = ${id} AND status = 'open' AND claimed_by_id IS NULL
      RETURNING *
    `);

    if (result.rows.length === 0) {
      res.status(409).json({ error: "This task has already been taken." }); return;
    }

    await ensureProfile(req.user.id);
    const [updated] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to claim task" });
  }
});

// Mark task as completed
router.post("/tasks/:id/complete", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }

    const isAllowed = task.postedById === req.user.id || task.claimedById === req.user.id;
    if (!isAllowed) { res.status(403).json({ error: "Forbidden" }); return; }

    const [updated] = await db.update(tasksTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(tasksTable.id, id))
      .returning();

    // Update task taker's completed count and last completed timestamp
    if (task.claimedById) {
      await db.execute(sql`
        INSERT INTO user_profiles (id, tasks_completed, last_task_completed_at)
        VALUES (${task.claimedById}, 1, NOW())
        ON CONFLICT (id) DO UPDATE SET
          tasks_completed = user_profiles.tasks_completed + 1,
          last_task_completed_at = NOW(),
          updated_at = NOW()
      `);
      // Recalculate trust score after new completion
      await recalcTrustScore(task.claimedById);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

router.get("/tasks/:id/applications", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const id = parseInt(req.params.id);
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.taskId, id));
    const appsWithUsers = await Promise.all(apps.map(async (app) => {
      const applicant = await getUserInfo(app.applicantId);
      return { ...app, applicant: applicant || { id: app.applicantId, username: "User" }, task: null };
    }));
    res.json({ applications: appsWithUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.post("/tasks/:id/applications", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const taskId = parseInt(req.params.id);
    const { message } = req.body;
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (task.postedById === req.user.id) { res.status(400).json({ error: "Cannot apply to your own task" }); return; }
    await ensureProfile(req.user.id);
    const [app] = await db.insert(applicationsTable).values({
      taskId, applicantId: req.user.id, message: message || null,
    }).returning();
    const applicant = await getUserInfo(req.user.id);
    res.status(201).json({ ...app, applicant: applicant || { id: req.user.id, username: req.user.username }, task: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to apply to task" });
  }
});

export default router;
