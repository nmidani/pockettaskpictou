import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, tasksTable, usersTable, userProfilesTable, reportsTable } from "../db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Total tasks, active tasks, completed tasks, total users
 */
router.get("/admin/stats", async (_req, res) => {
  try {
    const [taskStats] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where status in ('open', 'claimed', 'in_progress'))`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        cancelled: sql<number>`count(*) filter (where status = 'cancelled')`,
      })
      .from(tasksTable);

    const [userStats] = await db.select({ total: count() }).from(usersTable);

    res.json({
      totalTasks: Number(taskStats.total),
      activeTasks: Number(taskStats.active),
      completedTasks: Number(taskStats.completed),
      cancelledTasks: Number(taskStats.cancelled),
      totalUsers: Number(userStats.total),
    });
  } catch (err: any) {
    console.error("[admin/stats]", err.message);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

/**
 * GET /api/admin/tasks
 * All tasks with title, status, poster info
 */
router.get("/admin/tasks", async (_req, res) => {
  try {
    const tasks = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        status: tasksTable.status,
        pay: tasksTable.pay,
        town: tasksTable.town,
        category: tasksTable.category,
        createdAt: tasksTable.createdAt,
        postedById: tasksTable.postedById,
        posterEmail: usersTable.email,
        posterFirstName: usersTable.firstName,
        posterLastName: usersTable.lastName,
      })
      .from(tasksTable)
      .leftJoin(usersTable, eq(tasksTable.postedById, usersTable.id))
      .orderBy(sql`${tasksTable.createdAt} desc`);

    res.json(tasks);
  } catch (err: any) {
    console.error("[admin/tasks]", err.message);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});

/**
 * DELETE /api/admin/tasks/:id
 */
router.delete("/admin/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID." });
    return;
  }
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[admin/delete-task]", err.message);
    res.status(500).json({ error: "Failed to delete task." });
  }
});

/**
 * GET /api/admin/users
 * All users with profile info
 */
router.get("/admin/users", async (_req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        role: usersTable.role,
        suspended: usersTable.suspended,
        createdAt: usersTable.createdAt,
        rating: userProfilesTable.rating,
        reportsCount: userProfilesTable.reportsCount,
        tasksCompleted: userProfilesTable.tasksCompleted,
        trustScore: userProfilesTable.trustScore,
      })
      .from(usersTable)
      .leftJoin(userProfilesTable, eq(usersTable.id, userProfilesTable.id))
      .orderBy(sql`${usersTable.createdAt} desc`);

    res.json(users);
  } catch (err: any) {
    console.error("[admin/users]", err.message);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Toggle suspended flag
 */
router.post("/admin/users/:id/suspend", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Invalid user ID." });
    return;
  }
  try {
    await db
      .update(usersTable)
      .set({ suspended: sql`NOT suspended` })
      .where(eq(usersTable.id, id));

    const [user] = await db
      .select({ suspended: usersTable.suspended })
      .from(usersTable)
      .where(eq(usersTable.id, id));

    res.json({ suspended: user?.suspended ?? false });
  } catch (err: any) {
    console.error("[admin/suspend]", err.message);
    res.status(500).json({ error: "Failed to update user." });
  }
});

/**
 * GET /api/admin/reports
 * All reports
 */
router.get("/admin/reports", async (_req, res) => {
  try {
    const reports = await db
      .select({
        id: reportsTable.id,
        targetType: reportsTable.targetType,
        targetId: reportsTable.targetId,
        reason: reportsTable.reason,
        details: reportsTable.details,
        createdAt: reportsTable.createdAt,
        reporterEmail: usersTable.email,
        reporterFirstName: usersTable.firstName,
        reporterLastName: usersTable.lastName,
      })
      .from(reportsTable)
      .leftJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
      .orderBy(sql`${reportsTable.createdAt} desc`);

    res.json(reports);
  } catch (err: any) {
    console.error("[admin/reports]", err.message);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

export default router;
