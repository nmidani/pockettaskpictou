import { db, tasksTable, applicationsTable, userProfilesTable } from "../db";
import { eq, and, lt, sql } from "drizzle-orm";
import { haversineKm } from "./haversine";

const WINDOW_SECONDS = 30;
const EXTENSION_SECONDS = 30;

// Scoring weights — must sum to 100.
const WEIGHT_DISTANCE = 40;
const WEIGHT_FAIRNESS = 35;
const WEIGHT_RATING   = 25;

// Distance decay: half-life in km. Score = e^(-d / HALF_LIFE_KM).
// At 0 km → 1.0 (full), at 5 km → 0.37, at 10 km → 0.14.
// No 1/d singularity — someone 50m away can't score 20× a 1km applicant.
const DISTANCE_HALF_LIFE_KM = 5;

// Fairness saturates after FAIRNESS_CAP_HOURS (full boost for inactivity beyond this).
const FAIRNESS_CAP_HOURS = 72;

/**
 * Compute a 0–100 composite score from three normalized factors.
 *
 * Distance   (40 pts) – exponential decay, no singularity. Unknown = neutral (0.5).
 * Fairness   (35 pts) – hours since last completed task, capped at 72 h.
 *                       Never completed a task → maximum boost.
 * TrustScore (25 pts) – 0–100 composite of completions, rating, reports.
 *                       Normalized to [0, 1]. New users default to 0.5 (neutral).
 *
 * All components are independently bounded so no single factor can dominate.
 */
function calcScore(opts: {
  distanceKm: number | null;
  hoursSinceLastTask: number | null;
  trustScore: number | null;
}): number {
  const { distanceKm, hoursSinceLastTask, trustScore } = opts;

  // ── Distance (0–40 pts) ────────────────────────────────────────────────────
  const distFactor =
    distanceKm != null && distanceKm >= 0
      ? Math.exp(-distanceKm / DISTANCE_HALF_LIFE_KM)
      : 0.5;
  const distScore = distFactor * WEIGHT_DISTANCE;

  // ── Fairness (0–35 pts) ────────────────────────────────────────────────────
  const fairnessFactor =
    hoursSinceLastTask != null
      ? Math.min(hoursSinceLastTask / FAIRNESS_CAP_HOURS, 1.0)
      : 1.0;
  const fairnessScore = fairnessFactor * WEIGHT_FAIRNESS;

  // ── Trust score (0–25 pts) ─────────────────────────────────────────────────
  // trustScore is 0–100; normalize to [0, 1].
  // New users have trustScore 0 from the DB default, but we give them 0.5
  // (neutral) so they aren't permanently disadvantaged before any activity.
  const trustFactor =
    trustScore != null && trustScore > 0
      ? Math.min(trustScore / 100, 1.0)
      : 0.5;
  const trustScorePoints = trustFactor * WEIGHT_RATING;

  return distScore + fairnessScore + trustScorePoints;
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
            trustScore: profile?.trustScore ?? null,
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
