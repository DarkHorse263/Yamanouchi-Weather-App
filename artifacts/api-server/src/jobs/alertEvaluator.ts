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
 *   - `startAlertCron()` schedules the job (every 3h) - called from app boot
 *     in production.
 *   - `runAlertEvaluator()` runs the job once and is exposed via an admin
 *     endpoint for ad-hoc testing.
 */
import cron, { type ScheduledTask } from "node-cron";
import { db, alertSubscribersTable, dispatchedAlertsTable, pushSubscriptionsTable } from "@workspace/db";
import { eq, and, isNull, isNotNull, gte, count } from "drizzle-orm";
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
const MAX_FAILURES_PER_24H = 3;
// Anchor each region with a representative high-altitude point. The forecast
// is a regional indicator, not a per-resort prediction - when we want
// per-resort accuracy we'll move to per-mountain coords (the schema already
// has subscriber.mountains[] for that).
const REGION_ANCHORS: Record<RegionId, {
  lat: number; lon: number; elevation: number; region: "AU" | "JP" | "OTHER";
  displayName: string;
}> = {
  "snowy-mountains": { lat: -36.45, lon: 148.32, elevation: 1700, region: "AU", displayName: "Snowy Mountains" },
  "victorias-high-country": { lat: -36.9779, lon: 147.1361, elevation: 1862, region: "AU", displayName: "Victoria's High Country" },
  // Tasmania · anchor on Ben Lomond summit (Legges Tor, the highest
  // skiable point and the island's only commercial chairlift area).
  "tasmania": { lat: -41.5378, lon: 147.6736, elevation: 1572, region: "AU", displayName: "Tasmania" },
  "yamanouchi": { lat: 36.738, lon: 138.508, elevation: 1500, region: "JP", displayName: "Yamanouchi" },
  // Nozawa Onsen · single resort, anchor on Mt Kenashi summit.
  "nozawa-onsen": { lat: 36.9290, lon: 138.4500, elevation: 1650, region: "JP", displayName: "Nozawa Onsen" },
  // Iiyama · anchor on Madarao summit · the highest and most snow-prone
  // point in the cluster, best regional proxy for powder alerts.
  "iiyama": { lat: 36.9056, lon: 138.2858, elevation: 1382, region: "JP", displayName: "Iiyama" },
  // Hakuba Valley · anchor on Tsugaike Kogen (1704m, the high snowy
  // northern Otari side) as the best powder proxy for the ten-resort
  // valley. Happo-One is the highest summit (1831m) but the Otari corner
  // reliably takes the deepest snow.
  "hakuba-valley": { lat: 36.7490, lon: 137.8662, elevation: 1704, region: "JP", displayName: "Hakuba Valley" },
  // Myoko · anchor on Akakura Kanko (1500m) · central on Mt Myoko's east
  // face between the Akakura pair, Ikenotaira and Seki, a fair powder
  // proxy for the six-resort area (Suginohara is higher at 1855m but
  // sits at the far southern edge).
  "myoko": { lat: 36.8903, lon: 138.1604, elevation: 1500, region: "JP", displayName: "Myoko" },
  // Niseko · anchor on Grand Hirafu's top lift (1200m) · the central and
  // busiest of the four united resorts on Mt Niseko Annupuri, a fair
  // powder proxy for the whole interlinked area.
  "niseko": { lat: 42.8590, lon: 140.6900, elevation: 1200, region: "JP", displayName: "Niseko" },
  // Furano · anchor on Furano Ski Resort's top terrain (1074m) · the
  // region's anchor mountain directly above the base towns, a fairer
  // proxy for visitors than the outlying Kamui or Tomamu day trips.
  "furano": { lat: 43.3350, lon: 142.3610, elevation: 1074, region: "JP", displayName: "Furano" },
  // Sapporo · anchor on Sapporo Kokusai's top terrain (1100m) · the
  // snowiest lift-served point of the three city hills, above Jozankei
  // onsen, so the fairest single point for the region's alerts.
  "sapporo": { lat: 42.9870, lon: 141.1350, elevation: 1100, region: "JP", displayName: "Sapporo" },
  // Tomamu & Sahoro · anchor on Mt Tomamu (1,239m top), the snowier
  // and higher of the pair, so the fairest single point for alerts.
  "tomamu-sahoro": { lat: 43.0580, lon: 142.6210, elevation: 1239, region: "JP", displayName: "Tomamu & Sahoro" },
  // Asahikawa · anchor on Asahidake at the Sugatami ropeway top
  // (~1,600m), the snowiest lift-served point of the pair.
  "asahikawa": { lat: 43.6540, lon: 142.7970, elevation: 1600, region: "JP", displayName: "Asahikawa" },
  // Rusutsu & Kiroro · anchor on Kiroro's top terrain (1180m) · the
  // snowiest lift-served point of the pair, in one of Hokkaido's
  // heaviest snowfall pockets, so the fairest single point for alerts.
  "rusutsu-kiroro": { lat: 43.0758, lon: 140.9822, elevation: 1180, region: "JP", displayName: "Rusutsu & Kiroro" },
  // Yuzawa · anchor on Kagura's top area (1845m) · the highest and
  // snowiest terrain in the region with the longest season, so it is the
  // fairest single point for powder alerts across the six resorts.
  "yuzawa": { lat: 36.8948, lon: 138.7756, elevation: 1845, region: "JP", displayName: "Yuzawa" },
  // Zao Onsen · anchor on the Jizo Sancho top station (1,661m) · the
  // highest lift-served point, in the juhyo zone where the snow falls.
  "zao-onsen": { lat: 38.1547, lon: 140.4311, elevation: 1661, region: "JP", displayName: "Zao Onsen" },
  // Hakkoda & Aomori Spring · anchor on Tamoyachidake (1,324m), the
  // Hakkoda ropeway summit · the snowiest lift-served point of the
  // pair, so the fairest single point for powder alerts.
  "hakkoda-aomori-spring": { lat: 40.6723, lon: 140.8641, elevation: 1324, region: "JP", displayName: "Hakkoda & Aomori Spring" },
  // Appi & Shizukuishi · anchor on Mt Maemori (1,305m), the Appi
  // gondola summit · the snowiest lift-served point of the pair.
  "appi-shizukuishi": { lat: 40.0028, lon: 140.9452, elevation: 1305, region: "JP", displayName: "Appi & Shizukuishi" },
  // Bandai · anchor on Grandeco's top terrain (1590m) · the highest and
  // snowiest lift-served point of the pair, so the fairest single point
  // for alerts.
  "bandai": { lat: 37.7020, lon: 140.1350, elevation: 1590, region: "JP", displayName: "Bandai" },
  // Daisen · anchor on the Kokusai top terrain (1121m), the highest
  // lift-served point on Mt Daisen's sea-facing slopes.
  "daisen": { lat: 35.4000, lon: 133.5280, elevation: 1121, region: "JP", displayName: "Daisen" },
  // Minakami · anchor on the Tenjin Pair top (~1,500m) above the
  // Tenjindaira bowl on Tanigawa-dake · by far the snowiest lift-served
  // point in the valley.
  "minakami": { lat: 36.833, lon: 138.947, elevation: 1500, region: "JP", displayName: "Minakami" },
  // Kusatsu & Manza · anchor on Manza's Prince quad top (1,994m), the
  // highest and snowiest lift-served point of the pair.
  "kusatsu-manza": { lat: 36.644, lon: 138.507, elevation: 1994, region: "JP", displayName: "Kusatsu & Manza" },
  // Hachimantai · anchor on the Shimokura top (Mt Shimokura, ~1,180m),
  // the powder hill of the shared-ticket pair.
  "hachimantai": { lat: 39.951, lon: 140.972, elevation: 1180, region: "JP", displayName: "Hachimantai" },
  // NZ · no national model in the ensemble, so region "OTHER" (global
  // blend). Anchor each on its highest skiable summit.
  "queenstown": { lat: -45.0556, lon: 168.8194, elevation: 1943, region: "OTHER", displayName: "Queenstown" },
  "wanaka": { lat: -44.6311, lon: 168.8978, elevation: 2088, region: "OTHER", displayName: "Wanaka" },
  "mt-hutt": { lat: -43.4707, lon: 171.5306, elevation: 2075, region: "OTHER", displayName: "Mt Hutt" },
  "ruapehu": { lat: -39.3072, lon: 175.5286, elevation: 2300, region: "OTHER", displayName: "Ruapehu" },
  // CA · same posture as NZ, no national model in the ensemble so region
  // "OTHER". Anchor each on its highest lift-served summit.
  "whistler": { lat: 50.0900, lon: -122.8620, elevation: 2284, region: "OTHER", displayName: "Whistler" },
  "powder-highway": { lat: 51.2977, lon: -117.0464, elevation: 2450, region: "OTHER", displayName: "Powder Highway" },
  "banff-lake-louise": { lat: 51.0781, lon: -115.7772, elevation: 2730, region: "OTHER", displayName: "Banff & Lake Louise" },
  "canmore": { lat: 50.9422, lon: -115.1519, elevation: 2260, region: "OTHER", displayName: "Canmore" },
  "jasper": { lat: 52.8000, lon: -118.0833, elevation: 2612, region: "OTHER", displayName: "Jasper" },
  "quebec-laurentians": { lat: 46.2200, lon: -74.5530, elevation: 875, region: "OTHER", displayName: "Laurentians" },
  "quebec-charlevoix": { lat: 47.2757, lon: -70.6257, elevation: 806, region: "OTHER", displayName: "Charlevoix" },
  "quebec-eastern-townships": { lat: 45.0850, lon: -72.5500, elevation: 840, region: "OTHER", displayName: "Eastern Townships" },
  // US (Colorado) · same posture as NZ/CA, no national model in the
  // ensemble so region "OTHER". Anchor each on its highest/primary
  // lift-served summit.
  "summit-county": { lat: 39.6425, lon: -105.8719, elevation: 3286, region: "OTHER", displayName: "Summit County" },
  "vail-valley": { lat: 39.6061, lon: -106.3550, elevation: 3527, region: "OTHER", displayName: "Vail Valley" },
  "aspen-snowmass": { lat: 39.2110, lon: -106.9500, elevation: 3813, region: "OTHER", displayName: "Aspen Snowmass" },
  "steamboat": { lat: 40.4572, lon: -106.8045, elevation: 3221, region: "OTHER", displayName: "Steamboat" },
  "winter-park": { lat: 39.8868, lon: -105.7625, elevation: 3676, region: "OTHER", displayName: "Winter Park" },
  "crested-butte": { lat: 38.8992, lon: -106.9650, elevation: 3620, region: "OTHER", displayName: "Crested Butte" },
  "telluride": { lat: 37.9375, lon: -107.8123, elevation: 3815, region: "OTHER", displayName: "Telluride" },
  "durango": { lat: 37.6297, lon: -107.8144, elevation: 3299, region: "OTHER", displayName: "Durango" },
  "boulder-front-range": { lat: 39.9375, lon: -105.5828, elevation: 2853, region: "OTHER", displayName: "Boulder / Front Range" },
  // US (Utah) · same posture as Colorado above, no national model in the
  // ensemble so region "OTHER". Anchor each on its highest/primary
  // lift-served summit.
  "cottonwood-canyons": { lat: 40.5883, lon: -111.6383, elevation: 3374, region: "OTHER", displayName: "Cottonwood Canyons" },
  "park-city": { lat: 40.6514, lon: -111.5080, elevation: 3056, region: "OTHER", displayName: "Park City" },
  "ogden-valley": { lat: 41.2160, lon: -111.8567, elevation: 2917, region: "OTHER", displayName: "Ogden Valley" },
  "provo": { lat: 40.3970, lon: -111.5847, elevation: 2515, region: "OTHER", displayName: "Provo" },
  "cache-valley": { lat: 41.9742, lon: -111.4547, elevation: 2701, region: "OTHER", displayName: "Cache Valley" },
};

interface EvaluatorReport {
  startedAt: string;
  finishedAt: string;
  subscribersChecked: number;
  alertsSent: number;
  errors: number;
  skipped: { dedupe: number; rateLimit: number; quietHours: number; belowThreshold: number; failureBackoff: number };
}

/**
 * Insert a success=true claim row for a (subscriber, alertWindow, delivery)
 * triple. Returns `{claimed: true, id}` on success and `{claimed: false}` if
 * the partial unique index already holds a successful row - meaning another
 * evaluator run got there first.
 */
async function claimDispatchSlot(values: {
  subscriberId: string; mountain: string; region: string; alertWindow: string;
  snowfallCm: number; delivery: "email" | "push";
}): Promise<{ claimed: true; id: string } | { claimed: false; id: string }> {
  try {
    const inserted = await db.insert(dispatchedAlertsTable).values({
      ...values, success: true, errorMessage: null, payload: null,
    }).returning({ id: dispatchedAlertsTable.id });
    return { claimed: true, id: inserted[0]!.id };
  } catch (err) {
    // 23505 = Postgres unique_violation. Anything else is a real error.
    const code = (err as { code?: string })?.code;
    if (code === "23505") return { claimed: false, id: "" };
    throw err;
  }
}

export async function runAlertEvaluator(opts?: { dryRun?: boolean }): Promise<EvaluatorReport> {
  const dryRun = opts?.dryRun === true;
  const startedAt = new Date();
  const report: EvaluatorReport = {
    startedAt: startedAt.toISOString(), finishedAt: "",
    subscribersChecked: 0, alertsSent: 0, errors: 0,
    skipped: { dedupe: 0, rateLimit: 0, quietHours: 0, belowThreshold: 0, failureBackoff: 0 },
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

    // Per-subscriber rate limit - last alert any region, in last 12h.
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

    // Dedupe key uses the subscriber's LOCAL date, not UTC. With UTC, an AEDT
    // user (UTC+11) would see the "daily" window roll over at 11am local -
    // re-alerting them mid-morning, or suppressing a real new storm late
    // evening local. dateKey() now formats in `sub.timezone`.
    const alertWindow = `${bestMatch.region}:${dateKey(startedAt, sub.timezone)}`;
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

    // Failure backoff - if we've tried and failed >=3 times in the last 24h
    // with no success, stop hammering SMTP/push for this subscriber. Without
    // this, a permanently-bouncing address gets retried every cron tick
    // forever (lastAlertedAt is only bumped on success).
    const failureCountRows = await db.select({ n: count() })
      .from(dispatchedAlertsTable)
      .where(and(
        eq(dispatchedAlertsTable.subscriberId, sub.id),
        eq(dispatchedAlertsTable.success, false),
        gte(dispatchedAlertsTable.sentAt, yesterday),
      ));
    if ((failureCountRows[0]?.n ?? 0) >= MAX_FAILURES_PER_24H) {
      report.skipped.failureBackoff++;
      continue;
    }

    if (dryRun) {
      report.alertsSent++;
      continue;
    }

    // Build email + push and dispatch using a CLAIM-FIRST pattern: insert a
    // success=true row before sending. If that insert hits the partial unique
    // index `alert_dispatched_success_uidx (subscriberId, alertWindow,
    // delivery) WHERE success=true`, another evaluator instance has already
    // claimed this slot and we skip - preventing duplicate sends when two runs
    // overlap (e.g. cron + manual /internal/alerts/run). On send failure we
    // mark the row success=false so future runs can retry.
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
      const claim = await claimDispatchSlot({
        subscriberId: sub.id, mountain: anchor.displayName, region: bestMatch.region,
        alertWindow, snowfallCm: bestMatch.snowCm, delivery: "email",
      });
      if (!claim.claimed) {
        report.skipped.dedupe++;
      } else {
        const r = await sendEmail({ to: sub.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text, tag: "powder_alert" });
        dispatched.emailOk = r.delivered;
        if (!r.delivered) {
          await db.update(dispatchedAlertsTable)
            .set({ success: false, errorMessage: r.error ?? null, payload: { provider: r.provider } })
            .where(eq(dispatchedAlertsTable.id, claim.id));
        } else {
          await db.update(dispatchedAlertsTable)
            .set({ payload: { provider: r.provider } })
            .where(eq(dispatchedAlertsTable.id, claim.id));
        }
      }
    }
    if (sub.delivery === "push" || sub.delivery === "both") {
      const targets = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.subscriberId, sub.id));
      // Push uses a single claim row for "push delivery to this subscriber for
      // this window". Per-endpoint failures (e.g. one stale browser) shouldn't
      // unclaim the slot - we still consider push delivered if at least one
      // endpoint succeeded.
      const claim = targets.length > 0 ? await claimDispatchSlot({
        subscriberId: sub.id, mountain: anchor.displayName, region: bestMatch.region,
        alertWindow, snowfallCm: bestMatch.snowCm, delivery: "push",
      }) : { claimed: false as const, id: "" };
      if (claim.claimed) {
        const errors: string[] = [];
        for (const t of targets) {
          const pr = await sendPush(
            { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
            { title: tmpl.subject, body: `${bestMatch.snowCm}cm forecast at ${anchor.displayName}`, url: `/${bestMatch.region}/today`, tag: alertWindow },
          );
          if (!pr.ok && pr.gone) {
            await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, t.id));
          }
          if (pr.ok) dispatched.pushOk = true;
          else if (pr.error) errors.push(pr.error);
        }
        if (!dispatched.pushOk) {
          await db.update(dispatchedAlertsTable)
            .set({ success: false, errorMessage: errors.join("; ").slice(0, 500) || "all endpoints failed" })
            .where(eq(dispatchedAlertsTable.id, claim.id));
        }
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

/**
 * Derive a YYYY-MM-DD key in the subscriber's local timezone. Using UTC here
 * caused the "daily" alert window to roll over mid-morning for non-UTC users,
 * triggering duplicate alerts and missing late-evening storms.
 */
function dateKey(d: Date, timezone: string): string {
  try {
    // en-CA uses ISO YYYY-MM-DD formatting natively.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
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

let cronTask: ScheduledTask | null = null;

/**
 * Start the in-process alert evaluator cron.
 *
 * IMPORTANT — singleton semantics. The cron is OFF by default and only
 * starts when `RUN_ALERT_CRON=1` is set. This guarantees that scaling
 * the API to multiple replicas does NOT cause duplicate alert emails /
 * push notifications · only the replica(s) explicitly opted in via the
 * env var will tick.
 *
 * Recommended deployment patterns, in order of preference:
 *   1. Replit Scheduled Deployment hitting POST /api/internal/alerts/run
 *      every 3 hours. The web/API replicas all leave RUN_ALERT_CRON
 *      unset · zero risk of duplicates regardless of replica count.
 *   2. A single dedicated worker replica with RUN_ALERT_CRON=1 set,
 *      while the user-facing replicas leave it unset.
 *   3. Single-replica deployment (current default for Replit Autoscale
 *      with min=max=1) with RUN_ALERT_CRON=1 set on that one replica.
 *
 * Legacy kill switch ALERT_CRON_DISABLED=1 is still honoured for
 * backwards compatibility, but is now redundant since the default is
 * already off.
 */
export function startAlertCron(): void {
  if (cronTask) return;
  if (process.env.ALERT_CRON_DISABLED === "1") {
    console.log("[alertEvaluator] ALERT_CRON_DISABLED=1 · cron not started");
    return;
  }
  if (process.env.RUN_ALERT_CRON !== "1") {
    console.log(
      "[alertEvaluator] RUN_ALERT_CRON not set · cron not started on this replica. " +
      "Set RUN_ALERT_CRON=1 on exactly one replica, or hit /api/internal/alerts/run from a Scheduled Deployment.",
    );
    return;
  }
  // Every 3 hours, on the hour.
  cronTask = cron.schedule("0 */3 * * *", () => {
    runAlertEvaluator().then((r) => {
      console.log(`[alertEvaluator] run done: sent=${r.alertsSent} checked=${r.subscribersChecked} errors=${r.errors}`);
    }).catch((err) => {
      console.error("[alertEvaluator] run failed:", err);
      Sentry.captureException(err, { tags: { component: "alert-evaluator-cron" } });
    });
  });
  console.log("[alertEvaluator] cron scheduled (every 3 hours, RUN_ALERT_CRON=1)");
}
