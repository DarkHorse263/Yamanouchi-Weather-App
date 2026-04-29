import { Router, type IRouter } from "express";
import healthRouter from "./health";
import snowRouter from "./snow";
import placesRouter from "./places";
import weatherTilesRouter from "./weather-tiles";
import weatherRouter from "./weather";
import busRouter from "./bus";
import webcamsRouter from "./webcams";
import roadsRouter from "./roads";
import liftsRouter from "./lifts";
import radarRouter from "./radar";
import regionsRouter from "./regions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(snowRouter);
router.use(placesRouter);
router.use(weatherTilesRouter);
router.use(weatherRouter);
router.use(busRouter);
router.use(webcamsRouter);
router.use(roadsRouter);
router.use(liftsRouter);
router.use(radarRouter);
router.use(regionsRouter);

export default router;
