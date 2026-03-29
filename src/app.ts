import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Static file serving only when not on Vercel (Vercel CDN handles it there)
if (!process.env.VERCEL) {
  const clientDist = path.resolve(process.cwd(), "client", "dist");
  app.use(express.static(clientDist));
  app.use((_req, res) => {
    const indexPath = path.join(clientDist, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.json({
          name: "PocketTask API",
          status: "ok",
          endpoints: { health: "/api/healthz", tasks: "/api/tasks", auth: "/api/auth/user" },
        });
      }
    });
  });
}

export default app;
