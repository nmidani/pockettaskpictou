import { pgTable, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const PICTOU_TOWNS = [
  "New Glasgow", "Stellarton", "Trenton", "Westville",
  "Pictou", "River John", "Abercrombie", "Scotsburn"
] as const;

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  role: text("role"), // task_giver | task_taker
  town: text("town"),
  bio: text("bio"),
  phone: text("phone"),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  phoneVerificationCode: text("phone_verification_code"),
  tasksPosted: integer("tasks_posted").notNull().default(0),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  rating: real("rating"),
  reviewCount: integer("review_count").notNull().default(0),
  trustScore: integer("trust_score").notNull().default(0),
  reportsCount: integer("reports_count").notNull().default(0),
  lastTaskCompletedAt: timestamp("last_task_completed_at"),
  // Anti-spam daily limits
  postsToday: integer("posts_today").notNull().default(0),
  appliesToday: integer("applies_today").notNull().default(0),
  dailyResetAt: timestamp("daily_reset_at"),
  lastActionAt: timestamp("last_action_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = z.object({
  id: z.string(),
  role: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  tasksPosted: z.number().optional(),
  tasksCompleted: z.number().optional(),
  rating: z.number().optional().nullable(),
  reviewCount: z.number().optional(),
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
