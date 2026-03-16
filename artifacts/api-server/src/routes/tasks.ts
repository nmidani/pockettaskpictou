import { Router, type IRouter } from "express";
import { db, tasksTable, applicationsTable, userProfilesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";

const router: IRouter = Router();

async function ensureProfile(userId: string) {
  await db.execute(
    sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`
  );
}

router.get("/tasks", async (req, res) => {
  try {
    const { status, category } = req.query;

    const conditions: ReturnType<typeof eq>[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(tasksTable.status, status as "open" | "in_progress" | "completed" | "cancelled"));
    }
    if (category && typeof category === "string") {
      conditions.push(eq(tasksTable.category, category));
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
    const { title, description, category, pay, lat, lng, locationName, estimatedHours } = req.body;
    if (!title || !description || !category || pay == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    await ensureProfile(req.user.id);
    const [task] = await db.insert(tasksTable).values({
      title,
      description,
      category,
      pay: Number(pay),
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      locationName: locationName || null,
      estimatedHours: estimatedHours != null ? Number(estimatedHours) : null,
      postedById: req.user.id,
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
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const postedBy = await getUserInfo(task.postedById);
    let assignedTo = null;
    if (task.assignedToId) {
      assignedTo = await getUserInfo(task.assignedToId);
    }

    const appCount = await db.select({ count: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(eq(applicationsTable.taskId, id));

    res.json({
      ...task,
      postedBy: postedBy || { id: task.postedById, username: "User" },
      assignedTo,
      applicationCount: Number(appCount[0]?.count || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (task.postedById !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { title, description, category, pay, status, lat, lng, locationName, estimatedHours } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (pay !== undefined) updates.pay = Number(pay);
    if (status !== undefined) updates.status = status;
    if (lat !== undefined) updates.lat = lat != null ? Number(lat) : null;
    if (lng !== undefined) updates.lng = lng != null ? Number(lng) : null;
    if (locationName !== undefined) updates.locationName = locationName;
    if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours != null ? Number(estimatedHours) : null;

    const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.postedById, req.user.id)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

router.get("/tasks/:id/applications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.taskId, id));
    const appsWithUsers = await Promise.all(apps.map(async (app) => {
      const applicant = await getUserInfo(app.applicantId);
      return {
        ...app,
        applicant: applicant || { id: app.applicantId, username: "User" },
        task: null,
      };
    }));
    res.json({ applications: appsWithUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.post("/tasks/:id/applications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const taskId = parseInt(req.params.id);
    const { message } = req.body;

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (task.postedById === req.user.id) {
      res.status(400).json({ error: "Cannot apply to your own task" });
      return;
    }

    await ensureProfile(req.user.id);
    const [app] = await db.insert(applicationsTable).values({
      taskId,
      applicantId: req.user.id,
      message: message || null,
    }).returning();

    const applicant = await getUserInfo(req.user.id);
    res.status(201).json({
      ...app,
      applicant: applicant || { id: req.user.id, username: req.user.username },
      task: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to apply to task" });
  }
});

export default router;
