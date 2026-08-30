export interface LiftWindTransition {
  liftId: string;
  liftName: string;
  previousStatus: string | null;
  status: string;
  feedUpdatedAt: Date;
  villageWindKmh: number | null;
  villageGustKmh: number | null;
  topWindKmh: number | null;
  topGustKmh: number | null;
}

export interface CuratedLiftThreshold {
  liveLiftIds: string[];
  seedLiftId: string;
  name: string;
  thresholdKmh: number;
  verifiedAt: string;
}

export type EvidenceFlag =
  | "no_events"
  | "sparse_starts"
  | "sparse_releases"
  | "missing_wind"
  | "mixed_wind_stations"
  | "conflicting_samples";

interface WindSample {
  kmh: number;
  station: "top" | "village";
}

export interface LiftWindAnalysis {
  liveLiftIds: string[];
  seedLiftId: string;
  name: string;
  currentThresholdKmh: number;
  verifiedAt: string;
  windHoldStarts: number[];
  releases: number[];
  ignoredMissingWind: number;
  flags: EvidenceFlag[];
  recommendation: {
    thresholdKmh: number;
    startMedianKmh: number;
    releaseMedianKmh: number;
    basis: string;
  } | null;
}

export const MIN_EVENT_SAMPLES = 3;

function windAtTransition(row: LiftWindTransition): WindSample | null {
  const top = [row.topWindKmh, row.topGustKmh].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (top.length) return { kmh: Math.max(...top), station: "top" };

  const village = [row.villageWindKmh, row.villageGustKmh].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  return village.length
    ? { kmh: Math.max(...village), station: "village" }
    : null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

export function analyzeThredboLiftWindHistory(
  transitions: LiftWindTransition[],
  thresholds: CuratedLiftThreshold[],
): LiftWindAnalysis[] {
  const byLift = new Map<string, LiftWindTransition[]>();
  for (const transition of transitions) {
    const rows = byLift.get(transition.liftId) ?? [];
    rows.push(transition);
    byLift.set(transition.liftId, rows);
  }

  return thresholds.map((threshold) => {
    const rows = threshold.liveLiftIds.flatMap(
      (liveLiftId) => byLift.get(liveLiftId) ?? [],
    );
    const starts: WindSample[] = [];
    const releases: WindSample[] = [];
    let ignoredMissingWind = 0;

    for (const row of rows) {
      // A start is evidence only when the recorder saw the lift operating
      // immediately beforehand. Initial observations and administrative moves
      // from closed/scheduled/on-hold do not prove when wind stopped the lift.
      const isStart =
        row.status === "wind-hold" && row.previousStatus === "open";
      // Only a return to open proves a release. A move to closed/scheduled may
      // simply be end-of-day housekeeping and is not operational wind evidence.
      const isRelease =
        row.previousStatus === "wind-hold" && row.status === "open";
      if (!isStart && !isRelease) continue;
      const wind = windAtTransition(row);
      if (!wind) {
        ignoredMissingWind += 1;
      } else if (isStart) {
        starts.push(wind);
      } else {
        releases.push(wind);
      }
    }

    const startValues = starts.map(({ kmh }) => kmh);
    const releaseValues = releases.map(({ kmh }) => kmh);
    const flags: EvidenceFlag[] = [];
    if (!rows.length) flags.push("no_events");
    if (startValues.length < MIN_EVENT_SAMPLES) flags.push("sparse_starts");
    if (releaseValues.length < MIN_EVENT_SAMPLES) flags.push("sparse_releases");
    if (ignoredMissingWind) flags.push("missing_wind");
    const stations = new Set(
      [...starts, ...releases].map(({ station }) => station),
    );
    if (stations.size > 1) flags.push("mixed_wind_stations");

    let recommendation: LiftWindAnalysis["recommendation"] = null;
    if (
      startValues.length >= MIN_EVENT_SAMPLES &&
      releaseValues.length >= MIN_EVENT_SAMPLES
    ) {
      const startMedianKmh = median(startValues);
      const releaseMedianKmh = median(releaseValues);
      const startsBelowReleases =
        startValues.filter((start) => start <= releaseMedianKmh).length /
        startValues.length;
      const releasesAboveStarts =
        releaseValues.filter((release) => release >= startMedianKmh).length /
        releaseValues.length;
      const conflicting =
        startMedianKmh <= releaseMedianKmh ||
        startsBelowReleases > 0.34 ||
        releasesAboveStarts > 0.34;

      if (conflicting) {
        flags.push("conflicting_samples");
      } else if (!flags.includes("mixed_wind_stations")) {
        recommendation = {
          thresholdKmh: roundToFive((startMedianKmh + releaseMedianKmh) / 2),
          startMedianKmh,
          releaseMedianKmh,
          basis: `${startValues.length} wind-hold starts and ${releaseValues.length} open releases`,
        };
      }
    }

    return {
      liveLiftIds: threshold.liveLiftIds,
      seedLiftId: threshold.seedLiftId,
      name: threshold.name,
      currentThresholdKmh: threshold.thresholdKmh,
      verifiedAt: threshold.verifiedAt,
      windHoldStarts: startValues.sort((a, b) => a - b),
      releases: releaseValues.sort((a, b) => a - b),
      ignoredMissingWind,
      flags,
      recommendation,
    };
  });
}
