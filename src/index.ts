import app from "./app";
import { startAssignmentScheduler } from "./lib/assignmentScheduler";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

console.log("PORT:", process.env.PORT);

const port = Number(process.env.PORT) || 3000;

try {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    startAssignmentScheduler();
  });
} catch (error) {
  console.error("Startup error:", error);
}
