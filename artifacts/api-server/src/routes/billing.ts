import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/requireAuth";
import { checkout, portal, billingReady, paidEntitlement, processBillingWebhook, InvalidWebhookSignatureError } from "../lib/billing";
import { parseBillingSelection } from "../lib/billing-policy";
import { resolvePromoSubscription } from "../lib/promo";
import { CreateBillingCheckoutBody, GetBillingStatusResponse, CreateBillingCheckoutResponse, CreateBillingPortalResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const limit = rateLimit({ windowMs: 60000, limit: 10 });
const statusLimit = rateLimit({ windowMs: 60000, limit: 30 });
router.use("/billing", (req, res, next) => {
  if (req.method === "POST" && req.get("origin") !== process.env.BILLING_ORIGIN) {
    res.status(403).json({ error: "BILLING_ORIGIN_REQUIRED" }); return;
  }
  next();
});
router.get("/billing/status", requireAuth, statusLimit, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let purchasesEnabled = false;
  let reason = "BILLING_DISABLED";
  try { await billingReady(); purchasesEnabled = true; reason = ""; } catch (e) {
    reason = e instanceof Error && e.message.startsWith("BILLING_") ? e.message : "BILLING_UNAVAILABLE";
  }
  const promo = resolvePromoSubscription(true);
  let paid = false;
  try { paid = !!await paidEntitlement(req.dbUser!.id); } catch {
    res.status(503).json({ error: "BILLING_ENTITLEMENT_UNAVAILABLE" }); return;
  }
  res.json(GetBillingStatusResponse.parse({ purchasesEnabled, reason, paid, promo: !!promo }));
});
router.post("/billing/checkout", limit, requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let selection;
  try { selection = parseBillingSelection(req.body); CreateBillingCheckoutBody.parse(req.body); } catch { res.status(400).json({ error: "INVALID_BILLING_SELECTION" }); return; }
  try { res.json(CreateBillingCheckoutResponse.parse({ url: await checkout(req.dbUser!.id, selection.plan, selection.billingCountry) })); }
  catch (e) { res.status(503).json({ error: e instanceof Error && e.message.startsWith("BILLING_") ? e.message : "BILLING_UNAVAILABLE" }); }
});
router.post("/billing/portal", limit, requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.body && Object.keys(req.body).length) { res.status(400).json({ error: "INVALID_REQUEST" }); return; }
  try { res.json(CreateBillingPortalResponse.parse({ url: await portal(req.dbUser!.id) })); }
  catch { res.status(503).json({ error: "BILLING_PORTAL_UNAVAILABLE" }); }
});
export async function billingWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  if (!Buffer.isBuffer(req.body) || typeof signature !== "string") {
    res.status(400).json({ error: "INVALID_WEBHOOK" }); return;
  }
  try { await processBillingWebhook(req.body, signature); res.json({ received: true }); }
  catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      res.status(400).json({ error: "INVALID_WEBHOOK_SIGNATURE" }); return;
    }
    res.status(503).json({ error: "WEBHOOK_NOT_PROCESSED" });
  }
}
export default router;