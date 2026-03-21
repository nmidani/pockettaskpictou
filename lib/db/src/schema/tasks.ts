import { pgTable, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const taskStatusEnum = pgEnum("task_status", ["open", "claimed", "in_progress", "completed", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "etransfer"]);

export const tasksTable = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  pay: real("pay").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  estimatedHours: real("estimated_hours"),
  status: taskStatusEnum("status").notNull().default("open"),
  lat: real("lat"),
  lng: real("lng"),
  locationName: text("location_name"),
  town: text("town"),
  postedById: text("posted_by_id").notNull(),
  claimedById: text("claimed_by_id"),
  claimedAt: timestamp("claimed_at"),
  assignedToId: text("assigned_to_id"),
  assignedAt: timestamp("assigned_at"),
  applicationWindowEndsAt: timestamp("application_window_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string(),
  pay: z.number().min(1),
  paymentMethod: z.enum(["cash", "etransfer"]).optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  postedById: z.string(),
  status: z.enum(["open", "claimed", "in_progress", "completed", "cancelled"]).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
