import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  bio: text("bio"),
  phone: text("phone"),
  tasksPosted: integer("tasks_posted").notNull().default(0),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  rating: real("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = z.object({
  id: z.string(),
  bio: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  tasksPosted: z.number().optional(),
  tasksCompleted: z.number().optional(),
  rating: z.number().optional().nullable(),
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
