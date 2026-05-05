/**
 * Powder-alert evaluator. Runs on a schedule, looks at every active
 * subscriber, asks the ensemble forecast whether their threshold is met
 * within their look-ahead horizon, and dispatches email + push if so.
 *
 * Hygiene rules baked in:
 *   - Dedupe: never re-send the same (subscriber, region, alertWindow) within
 *     24h. The alertWindow is derived from `today` so daily storms don't get
 *     suppressed against last week's storm.
 *   - Per-subscriber rate limit: max one alert per 12h, regardless of region.
 *   - Quiet hours: skip 22:00-06:00 in the subscriber's local timezone unless
 *     forecast snow ≥ QUIET_HOURS_OVERRIDE_CM (you'd want to know about that).
 *
 * Run modes:
 *   - `startAlertCron()` schedules the job (every 3h) — called from app boot
 *     in production.
 *   - `runAlertEvaluator()` runs the job once and is exposed via an admin
 *     endpoint for ad-hoc testing.
 */
import cron from "node-cron";
import { db, alertSubscribersTable, dispatchedAlertsTable, pushSubscriptionsTable } from "@workspace/db";
import { eq, and, isNull, isNotNull, gte } from "drizzle-orm";
import * as Sentry from "@sentry/node";
import { getEnsembleForecast } from "../lib/ensemble-forecast.js";
import { sendEmail } from "../lib/emailSender.js";
import { sendPush } from "../lib/pushSender.js";
import { powderAlertEmail } from "../lib/emailTemplates.js";
import { issueToken } from "../lib/alertTokens.js";
import { getAppPublicUrl } from "../lib/appUrl.js";
import type { RegionId } from "../lib/regions.js";

const QUIET_HOURS_OVERRIDE_CM = 50;
const PER_SUBSCRIBER_RATE_LIMIT_HOURS = 12;
// Anchor each region with a representative high-altitude point. The forecast
// is a regional indicator, not a per-resort prediction — when we want
// per-resort accuracy we'll move to per-mountain coords (the schema already
// has subscriber.mountains[] for that).
const REGION_ANCHORS: Record<RegionId, {
  lat: number; lon: number; elevation: number; region: "AU" | "JP";
  displayName: string;
}> = {
  "snowy-mountains": { lat: -36.45, lon: 148.32, elevation: 1700, region: "AU", displayName: "Snowy Mountains" },
  "yamanouchi": { lat: 36.738, lon: 138.508, elevation: 1500, region: "JP", displayName: "Yamanouchi" },
};

interface EvaluatorReport {
  startedAt: string;
  finishedAt: string;
  subscribersChecked: number;
  alertsSent: number;
  errors: number;
  skipped: { dedupe: number; rateLimit: number; quietHours: number; belowThreshold: number };
}

export async function runAlertEvaluator(opts?: { dryRun?: boolean }): Promise<EvaluatorReport> {
  const dryRun = opts?.dryRun === true;
  const startedAt = new Date();
  const report: EvaluatorReport = {
    startedAt: startedAt.toISOString(), finishedAt: "",
    subscribersChecked: 0, alertsSent: 0, errors: 0,
    skipped: { dedupe: 0, rateLimit: 0, quietHours: 0, belowThreshold: 0 },
  };

  Sentry.addBreadcrumb({ category: "alert-evaluator", message: `run started${dryRun ? " (dryRun)" : ""}`, level: "info" });

  // 1. Snapshot the live forecast for each anchor once per run, so two
  //    subscribers in the same region don't trigger two upstream fetches.
  const forecastByRegion = new Map<RegionId, { snowByDay: number[] }>();
  for (const [regionId, anchor] of Object.entries(REGION_ANCHORS) as Array<[RegionId, typeof REGION_ANCHORS[RegionId]]>) {
    try {
      const f = await getEnsembleForecast({
        latitude: anchor.lat, longitude: anchor.lon, elevation: anchor.elevation,
        region: anchor.region, days: 4,
      });
      forecastByRegion.set(regionId, {
        snowByDay: f.days.map((d) => {
          const v = typeof d.snowMean === "number" && Number.isFinite(d.snowMean) ? d.snowMean : 0;
          return Math.max(0, v);
        }),
      });
    } catch (err) {
      report.errors++;
      console.warn(`[alertEvaluator] forecast fetch failed for ${regionId}:`, err);
      Sentry.captureException(err, { tags: { component: "alert-evaluator", region: regionId } });
    }
  }

  // 2. Active subscribers = verified AND not unsubscribed. Both filters are
  //    pushed into SQL so the table can grow without dragging the cron.
  const active = await db.select().from(alertSubscribersTable).where(
    and(
      isNotNull(alertSubscribersTable.verifiedAt),
      isNull(alertSubscribersTable.unsubscribedAt),
    ),
  );

  for (const sub of active) {
    report.subscribersChecked++;

    // Per-subscriber rate limit — last alert any region, in last 12h.
    if (sub.lastAlertedAt) {
      const ageH = (Date.now() - sub.lastAlertedAt.getTime()) / 3_600_000;
      if (ageH < PER_SUBSCRIBER_RATE_LIMIT_HOURS) {
        report.skipped.rateLimit++;
        continue;
      }
    }

    // Find the most-impactful matching region for this subscriber (highest snow).
    let bestMatch: { region: RegionId; snowCm: number; horizonDays: number } | null = null;
    const horizonDays = Math.max(1, Math.ceil(sub.horizonHours / 24));
    for (const region of sub.regions as RegionId[]) {
      const f = forecastByRegion.get(region);
      if (!f) continue;
      const snowSum = f.snowByDay.slice(0, horizonDays).reduce((a, b) => a + b, 0);
      if (snowSum >= sub.snowfallThresholdCm && (!bestMatch || snowSum > bestMatch.snowCm)) {
        bestMatch = { region, snowCm: Math.round(snowSum), horizonDays };
      }
    }
    if (!bestMatch) {
      report.skipped.belowThreshold++;
      continue;
    }

    // Quiet hours in subscriber's local timezone.
    if (isQuietHour(sub.timezone) && bestMatch.snowCm < QUIET_HOURS_OVERRIDE_CM) {
      report.skipped.quietHours++;
      continue;
    }

    // Dedupe — only suppress when we've already SUCCESSFULLY delivered to
    // this subscriber for this region+window in the last 24h. Failed rows
    // are kept in the audit log but don't block a retry, otherwise a
    // transient SMTP/push 5xx would silently swallow the alert for a day.
    const alertWindow = `${bestMatch.region}:${dateKey(startedAt)}`;
    const yesterday = new Date(Date.now() - 24 * 3_600_000);
    const recent = await db.select({ id: dispatchedAlertsTable.id })
      .from(dispatchedAlertsTable)
      .where(and(
        eq(dispatchedAlertsTable.subscriberId, sub.id),
        eq(dispatchedAlertsTable.alertWindow, alertWindow),
        eq(dispatchedAlertsTable.success, true),
        gte(dispatchedAlertsTable.sentAt, yesterday),
      ))
      .limit(1);
    if (recent.length > 0) {
      report.skipped.dedupe++;
      continue;
    }

    if (dryRun) {
      report.alertsSent++;
      continue;
    }

    // Build email + push and dispatch.
    const anchor = REGION_ANCHORS[bestMatch.region]!;
    const manageToken = issueToken(sub.id, "manage");
    const unsubToken = issueToken(sub.id, "unsub");
    const baseUrl = getAppPublicUrl();
    const tmpl = powderAlertEmail({
      topMountain: { name: anchor.displayName, region: bestMatch.region, snowfallCm: bestMatch.snowCm },
      otherMountains: [],
      todaysCallUrl: `${baseUrl}/${bestMatch.region}/today`,
      manageUrl: `${baseUrl}/alerts/manage?token=${encodeURIComponent(manageToken)}`,
      unsubscribeUrl: `${baseUrl}/api/alerts/unsubscribe?token=${encodeURIComponent(unsubToken)}`,
    });

    const dispatched = { emailOk: false, pushOk: false };
    if (sub.delivery === "email" || sub.delivery === "both") {
      const r = await sendEmail({ to: sub.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text, tag: "powder_alert" });
      dispatched.emailOk = r.delivered;
      await db.insert(dispatchedAlertsTable).values({
        subscriberId: sub.id, mountain: anchor.displayName, region: bestMatch.region,
        alertWindow, snowfallCm: bestMatch.snowCm, delivery: "email",
        success: r.delivered, errorMessage: r.error ?? null, payload: { provider: r.provider },
      });
    }
    if (sub.delivery === "push" || sub.delivery === "both") {
      const targets = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.subscriberId, sub.id));
      for (const t of targets) {
        const pr = await sendPush(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
          { title: tmpl.subject, body: `${bestMatch.snowCm}cm forecast at ${anchor.displayName}`, url: `/${bestMatch.region}/today`, tag: alertWindow },
        );
        if (!pr.ok && pr.gone) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, t.id));
        }
        if (pr.ok) dispatched.pushOk = true;
        await db.insert(dispatchedAlertsTable).values({
          subscriberId: sub.id, mountain: anchor.displayName, region: bestMatch.region,
          alertWindow, snowfallCm: bestMatch.snowCm, delivery: "push",
          success: pr.ok, errorMessage: pr.ok ? null : pr.error, payload: { endpoint: t.endpoint.slice(0, 60) + "…" },
        });
      }
    }

    if (dispatched.emailOk || dispatched.pushOk) {
      report.alertsSent++;
      await db.update(alertSubscribersTable).set({ lastAlertedAt: startedAt }).where(eq(alertSubscribersTable.id, sub.id));
    } else {
      report.errors++;
    }
  }

  report.finishedAt = new Date().toISOString();
  Sentry.addBreadcrumb({
    category: "alert-evaluator", level: "info",
    message: `run finished: ${report.alertsSent} sent, ${report.subscribersChecked} checked, ${report.errors} errors`,
  });
  return report;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isQuietHour(tz: string): boolean {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false });
    const h = parseInt(fmt.format(new Date()), 10);
    return h >= 22 || h < 6;
  } catch {
    return false;
  }
}

let cronTask: cron.ScheduledTask | null = null;

export function startAlertCron(): void {
  if (cronTask) return;
  // Every 3 hours, on the hour. Replit dev workflows are long-running so this
  // works fine in development. For Replit Deployments, prefer a Scheduled
  // Deployment that hits POST /api/internal/alerts/run instead so the job
  // doesn't depend on a server staying warm.
  if (process.env.ALERT_CRON_DISABLED === "1") {
    console.log("[alertEvaluator] ALERT_CRON_DISABLED=1 — cron not started");
    return;
  }
  cronTask = cron.schedule("0 */3 * * *", () => {
    runAlertEvaluator().then((r) => {
      console.log(`[alertEvaluator] run done: sent=${r.alertsSent} checked=${r.subscribersChecked} errors=${r.errors}`);
    }).catch((err) => {
      console.error("[alertEvaluator] run failed:", err);
      Sentry.captureException(err, { tags: { component: "alert-evaluator-cron" } });
    });
  });
  console.log("[alertEvaluator] cron scheduled (every 3 hours)");
}
