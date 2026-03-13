import { Router, type IRouter } from "express";
import healthRouter from "./health";
import snowRouter from "./snow";
import placesRouter from "./places";

const router: IRouter = Router();

router.use(healthRouter);
router.use(snowRouter);
router.use(placesRouter);

export default router;
