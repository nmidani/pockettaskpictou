import app from "./app";
import { startAssignmentScheduler } from "./lib/assignmentScheduler";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

console.log("=== ENV VAR CHECK ===");
console.log("GOOGLE_CLIENT_ID:", !!process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("SESSION_SECRET:", !!process.env.SESSION_SECRET);
console.log("DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("STRIPE_SECRET_KEY:", !!process.env.STRIPE_SECRET_KEY);
console.log("=====================");

const port = Number(process.env.PORT) || 3000;

if (!process.env.VERCEL) {
  console.log("PORT:", port);
  try {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
      startAssignmentScheduler();
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
}

export default app;
