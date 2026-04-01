import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { runMigrations } from "./db/migrate";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

// Anchor the static path to this file's location, not process.cwd().
// When esbuild compiles to dist/index.cjs, import.meta.url → __filename of that
// bundle, so __dirname = /var/task/dist on Vercel.
// path.resolve(__dirname, "..", "client", "dist") = /var/task/client/dist ✓
// Locally (src/app.ts via tsx): /workspace/src → /workspace/client/dist ✓
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "..", "client", "dist");

const app: Express = express();

const ALLOWED_ORIGINS = [
  "https://pockettaskpictou.vercel.app",
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
  }),
);
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
// Comes after /api (so API routes win) but before the SPA catch-all.
// express.static calls next() when a file isn't found — never returns JSON.
app.use(
  express.static(clientDist, {
    setHeaders(res, filePath) {
      if (filePath.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// ─── SPA catch-all ───────────────────────────────────────────────────────────
// Express 5 requires "/{*path}" — bare "*" is rejected by path-to-regexp v8.
// Only /api misses should return JSON; everything else serves index.html so
// client-side routing works.
app.get("/{*path}", (req: Request, res: Response) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(500).json({ error: "Failed to serve app" });
  });
});

export default app;
