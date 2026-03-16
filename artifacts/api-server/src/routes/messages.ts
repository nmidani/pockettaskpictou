import { Router, type IRouter } from "express";
import { db, messagesTable, tasksTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";

const router: IRouter = Router();

router.get("/messages/:taskId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const taskId = parseInt(req.params.taskId);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Only allow task poster and claimed-by user to see messages
    const isAllowed = task.postedById === req.user.id || task.claimedById === req.user.id;
    if (!isAllowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.taskId, taskId))
      .orderBy(messagesTable.createdAt);

    const msgsWithSenders = await Promise.all(msgs.map(async (m) => {
      const sender = await getUserInfo(m.senderId);
      return { ...m, sender: sender || { id: m.senderId, username: "User" } };
    }));

    res.json({ messages: msgsWithSenders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/messages/:taskId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const taskId = parseInt(req.params.taskId);
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const isAllowed = task.postedById === req.user.id || task.claimedById === req.user.id;
    if (!isAllowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [msg] = await db.insert(messagesTable).values({
      taskId,
      senderId: req.user.id,
      content: content.trim(),
    }).returning();

    const sender = await getUserInfo(req.user.id);
    res.status(201).json({ ...msg, sender: sender || { id: req.user.id, username: req.user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get all conversations for the current user
router.get("/users/me/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const userId = req.user.id;

    // Get tasks where user is poster or claimer
    const allTasks = await db.select().from(tasksTable);
    const myTasks = allTasks.filter(t => t.postedById === userId || t.claimedById === userId);

    const conversations = await Promise.all(myTasks.map(async (task) => {
      const otherUserId = task.postedById === userId ? task.claimedById : task.postedById;
      if (!otherUserId) return null;

      const latestMsgs = await db.select().from(messagesTable)
        .where(eq(messagesTable.taskId, task.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const unreadMsgs = await db.select().from(messagesTable)
        .where(and(
          eq(messagesTable.taskId, task.id),
          eq(messagesTable.read, false)
        ));

      const unreadCount = unreadMsgs.filter(m => m.senderId !== userId).length;
      const otherUser = await getUserInfo(otherUserId);
      const lastMsg = latestMsgs[0];

      return {
        taskId: task.id,
        taskTitle: task.title,
        otherUser: otherUser || { id: otherUserId, username: "User" },
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
        unreadCount,
      };
    }));

    res.json({ conversations: conversations.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;
