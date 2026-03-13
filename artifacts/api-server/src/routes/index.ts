import { Router, type IRouter } from "express";
import healthRouter from "./health";
import snowRouter from "./snow";
import placesRouter from "./places";
import eigomenyuRouter from "./eigomenyu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(snowRouter);
router.use(placesRouter);
router.use("/eigomenyu", eigomenyuRouter);

export default router;
