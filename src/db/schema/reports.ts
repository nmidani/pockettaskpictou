import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reporterId: text("reporter_id").notNull(),
  targetType: text("target_type").notNull(), // 'user' | 'task'
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = z.object({
  reporterId: z.string(),
  targetType: z.enum(["user", "task"]),
  targetId: z.string(),
  reason: z.string(),
  details: z.string().optional().nullable(),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
