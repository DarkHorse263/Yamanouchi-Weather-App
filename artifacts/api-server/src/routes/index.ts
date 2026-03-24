import { Router, type IRouter } from "express";
import healthRouter from "./health";
import snowRouter from "./snow";
import placesRouter from "./places";
import weatherTilesRouter from "./weather-tiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(snowRouter);
router.use(placesRouter);
router.use(weatherTilesRouter);

export default router;
