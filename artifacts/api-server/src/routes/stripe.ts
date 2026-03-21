import { Router, type IRouter } from "express";
import Stripe from "stripe";

const router: IRouter = Router();

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout session for the PocketTask posting fee.
 * Returns { url } — the hosted Stripe checkout URL.
 *
 * Requires STRIPE_SECRET_KEY to be set in the environment.
 * Requires STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL (optional — defaults provided).
 */
router.post("/create-checkout-session", async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(503).json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY." });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ??
      `${req.headers.origin ?? "https://pockettask.replit.app"}/dashboard?payment=success`;

    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ??
      `${req.headers.origin ?? "https://pockettask.replit.app"}/post-task?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "cad",
      line_items: [
        {
          price_data: {
            currency: "cad",
            unit_amount: 200, // $2.00 CAD in cents
            product_data: {
              name: "PocketTask Posting Fee",
              description: "One-time fee to post a task on PocketTask.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[stripe] checkout session error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

export default router;
