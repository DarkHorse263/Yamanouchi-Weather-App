const BOM_PRODUCT = "IDN60801";
const BOM_MAX_AGE_MS = 90 * 60_000;
const BOM_MAX_FUTURE_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "feelzlike-weather-app/1.0 (+https://feelzlike.com)";

interface BomObservation {
  aifstime_utc?: string | null;
  wind_spd_kmh?: number | null;
  gust_kmh?: number | null;
  wind_dir?: string | null;
}

export interface ThredboWindReading {
  observedAt: Date;
  windKmh: number | null;
  gustKmh: number | null;
  direction: string | null;
}

export interface ThredboWindSnapshot {
  village: ThredboWindReading | null;
  top: ThredboWindReading | null;
}

function bomUtcDate(raw: string | null | undefined): Date | null {
  if (!raw || !/^\d{12,14}$/.test(raw)) return null;
  const date = new Date(
    `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:00Z`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseFreshWindReading(
  observations: BomObservation[] | null,
  nowMs = Date.now(),
): ThredboWindReading | null {
  const observation = observations?.[0];
  const observedAt = bomUtcDate(observation?.aifstime_utc);
  if (
    !observation ||
    !observedAt ||
    nowMs - observedAt.getTime() > BOM_MAX_AGE_MS ||
    observedAt.getTime() - nowMs > BOM_MAX_FUTURE_MS
  ) return null;
  return {
    observedAt,
    windKmh: typeof observation.wind_spd_kmh === "number" ? observation.wind_spd_kmh : null,
    gustKmh: typeof observation.gust_kmh === "number" ? observation.gust_kmh : null,
    direction: observation.wind_dir && observation.wind_dir !== "-" ? observation.wind_dir : null,
  };
}

async function fetchStation(wmoId: number): Promise<BomObservation[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://www.bom.gov.au/fwo/${BOM_PRODUCT}/${BOM_PRODUCT}.${wmoId}.json`,
      {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { observations?: { data?: BomObservation[] } };
    return body.observations?.data ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchThredboWindSnapshot(): Promise<ThredboWindSnapshot> {
  const now = Date.now();
  const [village, top] = await Promise.all([fetchStation(95908), fetchStation(95909)]);
  return {
    village: parseFreshWindReading(village, now),
    top: parseFreshWindReading(top, now),
  };
}
