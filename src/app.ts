import express, { type Express } from "express";
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
app.use(authMiddleware);

app.use("/api", router);

// Serve the built React frontend (works both locally and on Vercel via includeFiles)
app.use(express.static(clientDist));
app.use((_req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: "Not found" });
    }
  });
});

// Run migrations on startup (idempotent — safe to run every cold start)
if (process.env.DATABASE_URL) {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  migrate(db, { migrationsFolder })
    .then(() => console.log("[db] Migrations applied successfully"))
    .catch((err) => console.error("[db] Migration failed:", err));
}

export default app;
