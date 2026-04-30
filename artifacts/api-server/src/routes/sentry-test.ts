import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/__sentry-test", (_req, _res) => {
  if (process.env.NODE_ENV === "production") {
    _res.status(404).end();
    return;
  }
  throw new Error("Sentry test: server throw from /api/__sentry-test");
});

export default router;
