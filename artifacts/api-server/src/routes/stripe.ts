import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, tasksTable, userProfilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { APPLICATION_WINDOW_SECONDS } from "../lib/assignmentScheduler";
import { checkSpamLimits } from "../lib/trustScore";

const router: IRouter = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

async function ensureProfile(userId: string) {
  await db.execute(
    sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`
  );
}

/**
 * POST /api/create-checkout-session
 *
 * Validates form data, stores it in Stripe metadata, and returns the hosted
 * checkout URL. No task is created until payment succeeds (GET /api/success).
 */
router.post("/create-checkout-session", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(503).json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY." });
    return;
  }

  const { title, description, category, pay, paymentMethod, estimatedHours, town, locationName } = req.body;

  // Validate required fields
  if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 100) {
    res.status(400).json({ error: "Title must be 3–100 characters." });
    return;
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    res.status(400).json({ error: "Description must be at least 10 characters." });
    return;
  }
  if (!category || typeof category !== "string") {
    res.status(400).json({ error: "Category is required." });
    return;
  }
  const payNum = Number(pay);
  if (!pay || Number.isNaN(payNum) || payNum < 1) {
    res.status(400).json({ error: "Payment must be at least $1." });
    return;
  }

  try {
    const stripe = getStripe();

    const origin =
      req.headers.origin ??
      (req.headers.host ? `https://${req.headers.host}` : "https://pockettask.replit.app");

    // Stripe metadata values are limited to 500 chars — truncate description defensively
    const safeDescription = description.trim().slice(0, 490);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "cad",
      // Store task data so we can create it after payment
      client_reference_id: req.user.id,
      metadata: {
        title: title.trim(),
        description: safeDescription,
        category: category.trim(),
        pay: String(payNum),
        paymentMethod: paymentMethod ?? "cash",
        estimatedHours: estimatedHours != null ? String(estimatedHours) : "",
        town: town ?? "",
        locationName: locationName ?? "",
      },
      line_items: [
        {
          price_data: {
            currency: "cad",
            unit_amount: 200, // $2.00 CAD
            product_data: {
              name: "PocketTask Posting Fee",
              description: "One-time fee to post a task on PocketTask.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/api/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/post-task?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[stripe] checkout session error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

/**
 * GET /api/success?session_id=xxx
 *
 * Called when Stripe redirects the user after a completed payment.
 * Verifies payment, prevents duplicate task creation, then creates the task
 * and redirects the browser to the new task page.
 */
router.get("/success", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    res.status(400).send("Missing session_id.");
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.redirect("/post-task?payment=error");
    return;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Payment must be confirmed
    if (session.payment_status !== "paid") {
      res.redirect("/post-task?payment=unpaid");
      return;
    }

    // Duplicate-creation guard — check if we already created a task for this session
    const existing = await db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(eq(tasksTable.stripeSessionId, session_id))
      .limit(1);

    if (existing.length > 0) {
      // Already processed — redirect to the task that was created
      res.redirect(`/tasks/${existing[0].id}`);
      return;
    }

    // Extract task data from Stripe metadata
    const meta = session.metadata ?? {};
    const userId = session.client_reference_id;

    if (!userId || !meta.title || !meta.description || !meta.category || !meta.pay) {
      console.error("[stripe/success] incomplete metadata:", meta, "userId:", userId);
      res.redirect("/post-task?payment=error");
      return;
    }

    await ensureProfile(userId);

    // Anti-spam check
    const spamErr = await checkSpamLimits(userId, "post");
    if (spamErr) {
      // Payment was taken but post is blocked — log and redirect gracefully
      console.warn("[stripe/success] spam limit hit for userId:", userId, spamErr);
      res.redirect("/dashboard?payment=blocked");
      return;
    }

    const windowEndsAt = new Date(Date.now() + APPLICATION_WINDOW_SECONDS * 1000);

    const [task] = await db
      .insert(tasksTable)
      .values({
        title: meta.title,
        description: meta.description,
        category: meta.category,
        pay: Number(meta.pay),
        paymentMethod: (meta.paymentMethod as "cash" | "etransfer") || "cash",
        estimatedHours: meta.estimatedHours ? Number(meta.estimatedHours) : null,
        town: meta.town || null,
        locationName: meta.locationName || null,
        postedById: userId,
        status: "open",
        applicationWindowEndsAt: windowEndsAt,
        stripeSessionId: session_id,
      })
      .returning({ id: tasksTable.id });

    console.log(`[stripe/success] task ${task.id} created for user ${userId} (session ${session_id})`);
    res.redirect(`/tasks/${task.id}`);
  } catch (err: any) {
    console.error("[stripe/success] error:", err.message);
    res.redirect("/post-task?payment=error");
  }
});

export default router;
