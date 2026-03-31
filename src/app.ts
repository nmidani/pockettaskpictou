import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const clientDist = path.resolve(process.cwd(), "client", "dist");

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Run migrations once per cold start; block requests until done
let migrationReady: Promise<void> | null = null;

if (process.env.DATABASE_URL) {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  console.log("[db] Running migrations from:", migrationsFolder);
  migrationReady = migrate(db, { migrationsFolder })
    .then(() => console.log("[db] Migrations applied successfully"))
    .catch((err) => console.error("[db] Migration failed (non-fatal):", err));
}

// Wait for migration before processing requests (with 8s timeout so server can still start)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (migrationReady) {
    await Promise.race([
      migrationReady,
      new Promise<void>((resolve) => setTimeout(resolve, 8000)),
    ]);
  }
  next();
});

app.use(authMiddleware);
app.use("/api", router);

// Serve the built React frontend (works both locally and on Vercel via includeFiles)
app.use(express.static(clientDist));
app.use((_req: Request, res: Response) => {
  const indexPath = path.join(clientDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: "Not found" });
    }
  });
});

export default app;
