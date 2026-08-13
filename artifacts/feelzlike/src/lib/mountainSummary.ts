/**
 * "what it's like up there today" · a short plain-english conditions
 * paragraph for mountain/resort pages, composed ENTIRELY from data the
 * page already fetched (day narrative + headline snow outlook + wind
 * hold read + reported/model base). no new requests, deterministic,
 * fails soft clause-by-clause — missing input just drops its clause.
 *
 * brand voice: lowercase, clauses joined with a middot ·, honest
 * hedging ("models suggest", "may hold") because the snow figures are
 * model output and no AU/NZ resort has a verified live lift feed
 * except Thredbo (see feelzlike-lift-honesty memory — this copy never
 * asserts lifts ARE open or closed, only what the wind read suggests).
 *
 * PURE module: must not import @/regions (tsx --test isolation rule).
 */
import { buildDayNarrative, type DayNarrativeInput } from "./dayNarrative";
import { snowNext24SoWhat, windSoWhat } from "./soWhat";

/** display-edge formatters · supplied by useUnits at the component layer */
export interface SummaryFormat {
  snow: (cm: number, dp?: number) => string | number;
  snowUnit: string;
  wind: (kmh: number) => string | number;
  windUnit: string;
  elev: (m: number) => string | number;
  elevUnit: string;
}

export interface MountainSummaryInput extends DayNarrativeInput {
  /** headline snow next 24h (cm) · already resolved at the outlook elevation */
  snowNext24Cm?: number | null;
  /** the elevation the headline snow ACTUALLY resolved to (never the requested mid) */
  snowfallOutlookElevationM?: number | null;
  /** "mid-mountain" | "village" · only mid-mountain earns an elevation label */
  snowfallOutlookLevel?: string | null;
  /** resort-reported base (cm) · REPLACES any model figure when present */
  reportedBaseCm?: number | null;
  /** lower reading of a two-station range report */
  reportedBaseMinCm?: number | null;
  /** "course" = official off-resort snow-course measurement */
  reportedBaseSource?: "reported" | "course" | null;
  /** model snow depth (cm) · pass ONLY when trusted (off-season) — in
   * season the model reads ~0 under running lifts and must stay silent */
  trustedModelBaseCm?: number | null;
  fmt: SummaryFormat;
}

export interface MountainSummary {
  en: string;
  ja: string;
}

export function buildMountainSummary(input: MountainSummaryInput): MountainSummary | null {
  const { fmt } = input;
  const en: string[] = [];
  const ja: string[] = [];

  // 1 · how the day feels + next change (reuse the day narrative verbatim)
  const narrative = buildDayNarrative(input);
  if (narrative) {
    en.push(narrative.en);
    ja.push(narrative.ja);
  }

  // 2 · headline snow outlook · hedged as model output, labelled with the
  // RESOLVED elevation only when it truly is the mid-mountain figure
  const snow24 = input.snowNext24Cm;
  if (snow24 != null && Number.isFinite(snow24)) {
    if (snow24 < 0.5) {
      en.push("no fresh snow expected in the next 24h");
      ja.push("今後24時間は新雪の予想なし");
    } else {
      const atMid =
        input.snowfallOutlookLevel === "mid-mountain" &&
        input.snowfallOutlookElevationM != null &&
        Number.isFinite(input.snowfallOutlookElevationM);
      const elevEn = atMid
        ? ` around ${fmt.elev(input.snowfallOutlookElevationM as number)} ${fmt.elevUnit}`
        : "";
      const elevJa = atMid
        ? `標高${fmt.elev(input.snowfallOutlookElevationM as number)}${fmt.elevUnit}付近で`
        : "";
      en.push(
        `models suggest ~${fmt.snow(snow24, 1)} ${fmt.snowUnit}${elevEn} in the next 24h`,
      );
      ja.push(`${elevJa}今後24時間に約${fmt.snow(snow24, 1)}${fmt.snowUnit}の降雪予想`);
      const so = snowNext24SoWhat(snow24);
      if (so && snow24 >= 5) {
        en.push(so.en);
        ja.push(so.ja);
      }
    }
  }

  // 3 · wind vs lifts · only when the wind read is actually notable, and
  // ALWAYS conditional language — a wind model never claims a lift's status
  const wind = input.current?.windSpeed;
  if (wind != null && Number.isFinite(wind) && wind >= 50) {
    const so = windSoWhat(wind);
    if (so) {
      en.push(`wind near ${fmt.wind(wind)} ${fmt.windUnit} · ${so.en}`);
      ja.push(`風速約${fmt.wind(wind)}${fmt.windUnit}・${so.ja}`);
    }
  }

  // 4 · base depth · reported figure beats everything; the model figure
  // speaks only when trusted (off-season); otherwise the clause is omitted
  // (never a confidently wrong 0, never "no base" from a course reading)
  if (input.reportedBaseCm != null && Number.isFinite(input.reportedBaseCm)) {
    const min = input.reportedBaseMinCm;
    const range =
      min != null &&
      Number.isFinite(min) &&
      Math.round(min) !== Math.round(input.reportedBaseCm)
        ? `${fmt.snow(min)}-${fmt.snow(input.reportedBaseCm)}`
        : `${fmt.snow(input.reportedBaseCm)}`;
    if (input.reportedBaseSource === "course") {
      en.push(`base ${range} ${fmt.snowUnit} · official snow course`);
      ja.push(`積雪${range}${fmt.snowUnit}・公式観測`);
    } else {
      en.push(`base ${range} ${fmt.snowUnit} · resort reported`);
      ja.push(`積雪${range}${fmt.snowUnit}・リゾート報告`);
    }
  } else if (
    input.trustedModelBaseCm != null &&
    Number.isFinite(input.trustedModelBaseCm) &&
    input.trustedModelBaseCm >= 1
  ) {
    en.push(`base ~${fmt.snow(input.trustedModelBaseCm)} ${fmt.snowUnit} · model estimate`);
    ja.push(`積雪約${fmt.snow(input.trustedModelBaseCm)}${fmt.snowUnit}・予測値`);
  }

  if (en.length === 0) return null;
  return { en: en.join(" · "), ja: ja.join(" · ") };
}
