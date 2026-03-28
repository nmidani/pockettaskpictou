import app from "./app";
import { startAssignmentScheduler } from "./lib/assignmentScheduler";

console.log("PORT:", process.env.PORT);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startAssignmentScheduler();
});
