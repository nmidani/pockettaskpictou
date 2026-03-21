import { db, userProfilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Recalculate and persist a user's trust score.
 *
 * Formula (clamped 0–100):
 *   trustScore = (tasksCompleted × 5) + (rating × 10) − (reportsCount × 15)
 *
 * New users (no rating yet) default to a rating of 3.0 so they start at 30.
 * The score is penalised more heavily by reports than it is boosted by activity,
 * which makes abuse expensive while still rewarding honest users.
 */
export async function recalcTrustScore(userId: string): Promise<number> {
  const [profile] = await db
    .select({
      tasksCompleted: userProfilesTable.tasksCompleted,
      rating: userProfilesTable.rating,
      reportsCount: userProfilesTable.reportsCount,
    })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, userId));

  if (!profile) return 0;

  const tasksCompleted = profile.tasksCompleted ?? 0;
  const rating = profile.rating ?? 3.0;
  const reportsCount = profile.reportsCount ?? 0;

  const raw = tasksCompleted * 5 + rating * 10 - reportsCount * 15;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  await db
    .update(userProfilesTable)
    .set({ trustScore: score, updatedAt: new Date() })
    .where(eq(userProfilesTable.id, userId));

  return score;
}

/**
 * Check and enforce anti-spam limits for a user action.
 *
 * Limits (reset daily at midnight UTC):
 *   - post: max 3 per day
 *   - apply: max 10 per day
 *
 * Cooldown: 10 seconds between any actions.
 *
 * Returns null if the action is allowed (and increments counters),
 * or a human-readable error string if the action should be blocked.
 */
export async function checkSpamLimits(
  userId: string,
  action: "post" | "apply"
): Promise<string | null> {
  const now = new Date();

  const [profile] = await db
    .select({
      postsToday: userProfilesTable.postsToday,
      appliesToday: userProfilesTable.appliesToday,
      dailyResetAt: userProfilesTable.dailyResetAt,
      lastActionAt: userProfilesTable.lastActionAt,
    })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, userId));

  if (!profile) return null; // no profile yet — allow, task route will create it

  // 10-second cooldown between actions
  if (profile.lastActionAt) {
    const secondsAgo = (now.getTime() - new Date(profile.lastActionAt).getTime()) / 1000;
    if (secondsAgo < 10) {
      const wait = Math.ceil(10 - secondsAgo);
      return `Please wait ${wait} second${wait !== 1 ? "s" : ""} before your next action.`;
    }
  }

  // Daily reset: if dailyResetAt is null or older than today's midnight UTC, reset counts
  const todayMidnight = new Date(now);
  todayMidnight.setUTCHours(0, 0, 0, 0);

  const needsReset =
    !profile.dailyResetAt || new Date(profile.dailyResetAt) < todayMidnight;

  let postsToday = needsReset ? 0 : (profile.postsToday ?? 0);
  let appliesToday = needsReset ? 0 : (profile.appliesToday ?? 0);

  // Check daily limits
  if (action === "post" && postsToday >= 3) {
    return "You have reached your daily limit of 3 task posts. Please try again tomorrow.";
  }
  if (action === "apply" && appliesToday >= 10) {
    return "You have reached your daily limit of 10 applications. Please try again tomorrow.";
  }

  // Increment and persist
  if (action === "post") postsToday += 1;
  if (action === "apply") appliesToday += 1;

  await db
    .update(userProfilesTable)
    .set({
      postsToday,
      appliesToday,
      dailyResetAt: needsReset ? now : profile.dailyResetAt,
      lastActionAt: now,
      updatedAt: now,
    })
    .where(eq(userProfilesTable.id, userId));

  return null; // allowed
}
