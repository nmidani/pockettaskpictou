import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { runMigrations } from "./db/migrate";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const clientDist = path.resolve(process.cwd(), "client", "dist");

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Run migrations once per cold start — promise is kept for /api routes to await
let migrationReady: Promise<void> | null = null;

if (process.env.DATABASE_URL) {
  migrationReady = runMigrations().catch((err) =>
    console.error("[db] Migration failed (non-fatal):", err),
  );
}

// ─── /api routes only: wait for migration + run auth ────────────────────────
// Static asset requests NEVER hit the DB; they skip straight to express.static.
app.use("/api", async (_req: Request, _res: Response, next: NextFunction) => {
  if (migrationReady) {
    await Promise.race([
      migrationReady,
      new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
    ]);
  }
  next();
});

app.use("/api", authMiddleware);
app.use("/api", router);

// ─── Static file serving ─────────────────────────────────────────────────────
// Must come after /api so API routes win, but before the SPA catch-all.
app.use(
  express.static(clientDist, {
    // Hashed filenames in /assets/ are safe to cache forever
    setHeaders(res, filePath) {
      if (filePath.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// ─── SPA catch-all: only for non-/api, non-/assets paths ─────────────────────
app.get("*", (req: Request, res: Response) => {
  // If something under /api or /assets reached here, it genuinely doesn't exist
  if (req.path.startsWith("/api") || req.path.startsWith("/assets")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

export default app;
