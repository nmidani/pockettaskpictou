import { pgTable, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "completed", "cancelled"]);

export const tasksTable = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  pay: real("pay").notNull(),
  status: taskStatusEnum("status").notNull().default("open"),
  lat: real("lat"),
  lng: real("lng"),
  locationName: text("location_name"),
  estimatedHours: real("estimated_hours"),
  postedById: text("posted_by_id").notNull(),
  assignedToId: text("assigned_to_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string(),
  pay: z.number().min(1),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  postedById: z.string(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
