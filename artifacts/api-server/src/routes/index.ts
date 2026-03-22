import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import applicationsRouter from "./applications";
import usersRouter from "./users";
import messagesRouter from "./messages";
import ratingsRouter from "./ratings";
import reportsRouter from "./reports";
import stripeRouter from "./stripe";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(applicationsRouter);
router.use(usersRouter);
router.use(messagesRouter);
router.use(ratingsRouter);
router.use(reportsRouter);
router.use(stripeRouter);
router.use(adminRouter);

export default router;
