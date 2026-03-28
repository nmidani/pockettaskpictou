import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { tasksTable } from "./tasks";

export const messagesTable = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = z.object({
  taskId: z.number(),
  senderId: z.string(),
  content: z.string().min(1),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
