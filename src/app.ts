import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

app.get("/", (_req, res) => {
  res.json({
    name: "PocketTask API",
    status: "ok",
    endpoints: {
      health: "/api/healthz",
      tasks: "/api/tasks",
      auth: "/api/auth/user",
    },
  });
});

export default app;
