import { Router, type IRouter } from "express";
import { db, userProfilesTable, tasksTable, applicationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getUserInfo } from "../lib/userInfo";
import { recalcTrustScore } from "../lib/trustScore";

const router: IRouter = Router();

async function ensureProfile(userId: string) {
  await db.execute(
    sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`
  );
}

function buildProfileResponse(userId: string, user: any, profile: any) {
  return {
    id: userId,
    username: user.username,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImage: user.profileImage ?? null,
    role: profile?.role ?? null,
    town: profile?.town ?? null,
    bio: profile?.bio ?? null,
    phone: profile?.phone ?? null,
    isPhoneVerified: profile?.isPhoneVerified ?? false,
    tasksPosted: profile?.tasksPosted ?? 0,
    tasksCompleted: profile?.tasksCompleted ?? 0,
    rating: profile?.rating ?? null,
    reviewCount: profile?.reviewCount ?? 0,
    trustScore: profile?.trustScore ?? 0,
    reportsCount: profile?.reportsCount ?? 0,
    isFlagged: (profile?.reportsCount ?? 0) >= 3,
    createdAt: profile?.createdAt ?? new Date(),
  };
}

router.get("/users/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.user.id);
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, req.user.id));
    res.json(buildProfileResponse(req.user.id, req.user, profile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/users/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.user.id);
    const { bio, phone, role, town, firstName, lastName } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (bio !== undefined) updates.bio = bio;
    if (role !== undefined) updates.role = role;
    if (town !== undefined) updates.town = town;
    if (phone !== undefined) {
      updates.phone = phone;
      // Changing phone number resets verification
      updates.isPhoneVerified = false;
      updates.phoneVerificationCode = null;
    }

    await db.update(userProfilesTable).set(updates).where(eq(userProfilesTable.id, req.user.id));
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
    res.json(buildProfileResponse(req.user.id, req.user, profile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── Phone verification (simulated) ──────────────────────────────────────────

/**
 * POST /users/me/phone/send-code
 * Generates a 6-digit verification code and stores it.
 * In production, this would send an SMS. Here we return it in the response
 * so the user can complete the flow without a real SMS gateway.
 */
router.post("/users/me/phone/send-code", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureProfile(req.user.id);
    const { phone } = req.body;
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      res.status(400).json({ error: "Please enter a valid phone number" });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await db
      .update(userProfilesTable)
      .set({
        phone: phone.trim(),
        phoneVerificationCode: code,
        isPhoneVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(userProfilesTable.id, req.user.id));

    // NOTE: In production, send `code` via SMS instead of returning it.
    res.json({
      success: true,
      simulatedCode: code, // remove when real SMS is wired up
      message: `Verification code sent to ${phone} (simulated — code shown for demo purposes).`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

/**
 * POST /users/me/phone/verify
 * Verifies the code and marks the phone as verified.
 */
router.post("/users/me/phone/verify", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Verification code is required" });
      return;
    }

    const [profile] = await db
      .select({ phoneVerificationCode: userProfilesTable.phoneVerificationCode })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, req.user.id));

    if (!profile?.phoneVerificationCode) {
      res.status(400).json({ error: "No verification code was requested. Please send a code first." });
      return;
    }

    if (profile.phoneVerificationCode !== String(code).trim()) {
      res.status(400).json({ error: "Incorrect verification code. Please try again." });
      return;
    }

    await db
      .update(userProfilesTable)
      .set({
        isPhoneVerified: true,
        phoneVerificationCode: null,
        updatedAt: new Date(),
      })
      .where(eq(userProfilesTable.id, req.user.id));

    // Verified phone boosts trust score
    await recalcTrustScore(req.user.id);

    res.json({ success: true, message: "Phone number verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify phone number" });
  }
});

// ── Public user profile ──────────────────────────────────────────────────────

router.get("/users/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, id));

    const userInfo = await getUserInfo(id);

    res.json({
      id,
      username: userInfo?.username ?? "User",
      firstName: userInfo?.firstName ?? null,
      lastName: userInfo?.lastName ?? null,
      profileImage: userInfo?.profileImage ?? null,
      town: profile?.town ?? null,
      bio: profile?.bio ?? null,
      tasksCompleted: profile?.tasksCompleted ?? 0,
      rating: profile?.rating ?? null,
      trustScore: profile?.trustScore ?? 0,
      isFlagged: (profile?.reportsCount ?? 0) >= 3,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ── My tasks / applications ──────────────────────────────────────────────────

router.get("/users/me/tasks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.postedById, req.user.id))
      .orderBy(desc(tasksTable.createdAt));
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.get("/users/me/applications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.applicantId, req.user.id))
      .orderBy(desc(applicationsTable.createdAt));

    const appsWithDetails = await Promise.all(
      apps.map(async (app) => {
        const [task] = await db
          .select()
          .from(tasksTable)
          .where(eq(tasksTable.id, app.taskId));
        const applicant = await getUserInfo(app.applicantId);
        return {
          ...app,
          applicant: applicant || { id: app.applicantId, username: req.user!.username },
          task: task || null,
        };
      })
    );

    res.json({ applications: appsWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

export default router;
