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

// Run migrations once per cold start; block requests until done (or 10s timeout)
let migrationReady: Promise<void> | null = null;

if (process.env.DATABASE_URL) {
  migrationReady = runMigrations().catch((err) =>
    console.error("[db] Migration failed (non-fatal):", err),
  );
}

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (migrationReady) {
    await Promise.race([
      migrationReady,
      new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
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
