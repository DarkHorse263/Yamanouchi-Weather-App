import { Router, type IRouter } from "express";
import authRouter from "./auth";
import restaurantsRouter from "./restaurants";
import translateRouter from "./translate";

const router: IRouter = Router();

router.use(authRouter);
router.use(restaurantsRouter);
router.use(translateRouter);

export default router;
