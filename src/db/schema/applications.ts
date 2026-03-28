import { pgTable, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { tasksTable } from "./tasks";

export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected"]);

export const applicationsTable = pgTable("applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  applicantId: text("applicant_id").notNull(),
  message: text("message"),
  status: applicationStatusEnum("status").notNull().default("pending"),
  applicantLat: real("applicant_lat"),
  applicantLng: real("applicant_lng"),
  score: real("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApplicationSchema = z.object({
  taskId: z.number(),
  applicantId: z.string(),
  message: z.string().optional().nullable(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
