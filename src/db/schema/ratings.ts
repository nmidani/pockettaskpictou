import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { tasksTable } from "./tasks";

export const ratingsTable = pgTable("ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  raterId: text("rater_id").notNull(),
  ratedId: text("rated_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRatingSchema = z.object({
  taskId: z.number(),
  raterId: z.string(),
  ratedId: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string().optional().nullable(),
});

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
