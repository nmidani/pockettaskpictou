import { Router, type IRouter } from "express";
import { db, userProfilesTable, tasksTable, applicationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";

const router: IRouter = Router();

async function ensureProfile(userId: string) {
  await db.execute(
    sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`
  );
}

router.get("/users/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.user.id);
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
    res.json({
      id: req.user.id,
      username: req.user.username,
      firstName: req.user.firstName ?? null,
      lastName: req.user.lastName ?? null,
      profileImage: req.user.profileImage ?? null,
      bio: profile?.bio ?? null,
      phone: profile?.phone ?? null,
      tasksPosted: profile?.tasksPosted ?? 0,
      tasksCompleted: profile?.tasksCompleted ?? 0,
      rating: profile?.rating ?? null,
      createdAt: profile?.createdAt ?? new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/users/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.user.id);
    const { bio, phone } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;

    await db.update(userProfilesTable).set(updates).where(eq(userProfilesTable.id, req.user.id));
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
    res.json({
      id: req.user.id,
      username: req.user.username,
      firstName: req.user.firstName ?? null,
      lastName: req.user.lastName ?? null,
      profileImage: req.user.profileImage ?? null,
      bio: profile?.bio ?? null,
      phone: profile?.phone ?? null,
      tasksPosted: profile?.tasksPosted ?? 0,
      tasksCompleted: profile?.tasksCompleted ?? 0,
      rating: profile?.rating ?? null,
      createdAt: profile?.createdAt ?? new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/users/me/tasks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.postedById, req.user.id)).orderBy(desc(tasksTable.createdAt));
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.get("/users/me/applications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.applicantId, req.user.id)).orderBy(desc(applicationsTable.createdAt));
    const appsWithDetails = await Promise.all(apps.map(async (app) => {
      const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, app.taskId));
      const applicant = await getUserInfo(app.applicantId);
      return {
        ...app,
        applicant: applicant || { id: app.applicantId, username: req.user!.username },
        task: task || null,
      };
    }));
    res.json({ applications: appsWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

export default router;
