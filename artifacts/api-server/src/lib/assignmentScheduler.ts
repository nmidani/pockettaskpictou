import { db, tasksTable, applicationsTable, userProfilesTable } from "@workspace/db";
import { eq, and, lt, sql } from "drizzle-orm";
import { haversineKm } from "./haversine";

const WINDOW_SECONDS = 30;
const EXTENSION_SECONDS = 30;

function calcScore(opts: {
  distanceKm: number | null;
  hoursSinceLastTask: number | null;
  rating: number | null;
}): number {
  const { distanceKm, hoursSinceLastTask, rating } = opts;

  // Distance score: closer = higher. Default 10 km if unknown.
  const dist = distanceKm != null && distanceKm > 0 ? distanceKm : 10;
  const distScore = (1 / dist) * 50;

  // Fairness score: longer since last task = higher priority (max benefit at 100 h).
  const fairness = hoursSinceLastTask != null
    ? Math.min(hoursSinceLastTask / 100, 1.0)
    : 1.0; // Never done a task → maximum fairness boost
  const fairnessScore = fairness * 30;

  // Rating score: 1-5 scale, default 3.0 for new users.
  const rat = rating != null ? rating : 3.0;
  const ratingScore = rat * 20;

  return distScore + fairnessScore + ratingScore;
}

async function processExpiredWindows() {
  try {
    const now = new Date();

    // Find all open tasks whose application window has closed
    const expiredTasks = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.status, "open"),
          lt(tasksTable.applicationWindowEndsAt, now)
        )
      );

    for (const task of expiredTasks) {
      const applications = await db
        .select()
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.taskId, task.id),
            eq(applicationsTable.status, "pending")
          )
        );

      if (applications.length === 0) {
        // No applicants — extend the window by EXTENSION_SECONDS
        const extended = new Date(now.getTime() + EXTENSION_SECONDS * 1000);
        await db
          .update(tasksTable)
          .set({ applicationWindowEndsAt: extended, updatedAt: now })
          .where(eq(tasksTable.id, task.id));
        console.log(`[scheduler] Task ${task.id}: no applicants, window extended`);
        continue;
      }

      // Score each applicant
      const scored = await Promise.all(
        applications.map(async (app) => {
          // Distance between applicant and task
          let distanceKm: number | null = null;
          if (
            task.lat != null && task.lng != null &&
            app.applicantLat != null && app.applicantLng != null
          ) {
            distanceKm = haversineKm(
              task.lat, task.lng,
              app.applicantLat, app.applicantLng
            );
          }

          // Fetch applicant's profile for fairness and rating
          const [profile] = await db
            .select()
            .from(userProfilesTable)
            .where(eq(userProfilesTable.id, app.applicantId));

          let hoursSinceLastTask: number | null = null;
          if (profile?.lastTaskCompletedAt) {
            const diffMs = now.getTime() - new Date(profile.lastTaskCompletedAt).getTime();
            hoursSinceLastTask = diffMs / (1000 * 60 * 60);
          }

          const score = calcScore({
            distanceKm,
            hoursSinceLastTask,
            rating: profile?.rating ?? null,
          });

          return { app, score };
        })
      );

      // Sort descending — highest score wins
      scored.sort((a, b) => b.score - a.score);
      const winner = scored[0];

      // Update the winning application
      await db
        .update(applicationsTable)
        .set({ status: "accepted", score: winner.score })
        .where(eq(applicationsTable.id, winner.app.id));

      // Reject all other applicants
      const loserIds = scored.slice(1).map((s) => s.app.id);
      if (loserIds.length > 0) {
        await db.execute(
          sql`UPDATE applications SET status = 'rejected' WHERE id = ANY(${loserIds})`
        );
      }

      // Assign the task
      await db
        .update(tasksTable)
        .set({
          status: "claimed",
          claimedById: winner.app.applicantId,
          claimedAt: now,
          assignedToId: winner.app.applicantId,
          assignedAt: now,
          updatedAt: now,
        })
        .where(eq(tasksTable.id, task.id));

      console.log(
        `[scheduler] Task ${task.id}: assigned to ${winner.app.applicantId} ` +
        `(score ${winner.score.toFixed(2)}) from ${applications.length} applicant(s)`
      );
    }
  } catch (err) {
    console.error("[scheduler] Error processing expired windows:", err);
  }
}

export function startAssignmentScheduler() {
  console.log("[scheduler] Fair assignment scheduler started (5s interval)");
  setInterval(processExpiredWindows, 5000);
  // Also run immediately on boot
  processExpiredWindows();
}

export const APPLICATION_WINDOW_SECONDS = WINDOW_SECONDS;
