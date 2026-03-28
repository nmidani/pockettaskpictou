import { Router, type IRouter } from "express";
import { db, ratingsTable, userProfilesTable } from "../db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/ratings", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { taskId, ratedId, rating, review } = req.body;
    if (!taskId || !ratedId || !rating) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be 1-5" });
      return;
    }

    const [newRating] = await db.insert(ratingsTable).values({
      taskId: Number(taskId),
      raterId: req.user.id,
      ratedId,
      rating: Number(rating),
      review: review || null,
    }).returning();

    // Update user's average rating
    const allRatings = await db.select().from(ratingsTable).where(eq(ratingsTable.ratedId, ratedId));
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await db.execute(sql`
      INSERT INTO user_profiles (id, rating, review_count)
      VALUES (${ratedId}, ${avg}, ${allRatings.length})
      ON CONFLICT (id) DO UPDATE SET
        rating = ${avg},
        review_count = ${allRatings.length},
        updated_at = NOW()
    `);

    res.status(201).json(newRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

router.get("/ratings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await db.select().from(ratingsTable)
      .where(eq(ratingsTable.ratedId, userId))
      .orderBy(ratingsTable.createdAt);

    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

    res.json({
      ratings,
      averageRating: avg,
      totalCount: ratings.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

export default router;
