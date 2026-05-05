/**
 * Region-isolation guard.
 *
 * Defends against a class of bug where a record intended for one region
 * (e.g. an Australian bus operator) accidentally renders inside another
 * region's UI (e.g. the Yamanouchi Transport page). The bug shipped in
 * v0.3 — see Sprint 1, Prompt 1.1 of the Replit playbook.
 *
 * Behaviour:
 *  - dev: throws — surfaces the problem on first navigation.
 *  - prod: never throws (we don't blank the page in front of a user); we
 *    log to console.error, drop a Sentry breadcrumb so we get telemetry
 *    if it ever recurs, and capture an exception so it shows up in the
 *    Sentry issue list. The caller chooses whether to render the
 *    surviving (filtered) records or an empty state.
 *
 * Returns the records that actually belong in `regionId`. In dev this
 * will always equal the input (we threw on the first violation); in prod
 * this is the safe-to-render subset.
 */
import * as Sentry from "@sentry/react";
import type { RegionId } from "@workspace/api-client-react";

interface RegionScoped {
  id: string;
  regions: RegionId[];
}

interface AssertOptions {
  /** Friendly source label for the error message (e.g. "transport providers"). */
  source: string;
  /** Optional URL/page identifier for breadcrumb context. */
  page?: string;
}

export function assertProvidersForRegion<T extends RegionScoped>(
  records: readonly T[],
  regionId: RegionId,
  opts: AssertOptions,
): T[] {
  const leaks = records.filter((r) => !r.regions.includes(regionId));

  if (leaks.length === 0) {
    return [...records];
  }

  const summary =
    `[regionGuard] ${leaks.length} ${opts.source} record(s) leaked into region '${regionId}'. ` +
    `Offending ids: ${leaks.map((r) => r.id).join(", ")}.`;

  // Always emit a Sentry breadcrumb so we get telemetry even when we
  // don't throw / don't capture an exception.
  try {
    Sentry.addBreadcrumb({
      category: "regionGuard",
      level: "warning",
      message: summary,
      data: {
        regionId,
        source: opts.source,
        page: opts.page,
        offendingIds: leaks.map((r) => r.id),
        offendingRegions: leaks.map((r) => ({ id: r.id, regions: r.regions })),
      },
    });
  } catch {
    // Sentry not initialised (e.g. in unit tests) — swallow.
  }

  if (import.meta.env.DEV) {
    // In dev we want to fail loud the moment a developer introduces a leak.
    throw new Error(summary);
  }

  // Production: do not crash the page.
  // eslint-disable-next-line no-console
  console.error(summary);
  try {
    Sentry.captureException(new Error(summary), {
      tags: { regionGuard: "leak", region: regionId, source: opts.source },
    });
  } catch {
    // Sentry not initialised — swallow.
  }
  return records.filter((r) => r.regions.includes(regionId));
}
