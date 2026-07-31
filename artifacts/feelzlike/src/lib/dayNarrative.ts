/**
 * one-line plain-english day summary · "people aren't looking for data, but
 * an easy way to make a decision." derived entirely from data the page
 * already fetched — no extra requests, deterministic, works offline.
 *
 * brand voice: lowercase, clauses joined with a middot ·
 */

/** minimal hourly shape · both the town and mountain payloads satisfy it */
export interface NarrativeHour {
  time: string;
  weatherCode?: number | null;
  precipitation?: number | null;
  snowfall?: number | null;
  windSpeed?: number | null;
}

export interface DayNarrativeInput {
  hourly: NarrativeHour[];
  current: {
    temperature?: number | null;
    weatherCode?: number | null;
    windSpeed?: number | null;
  };
  /** naive-local hourly times are interpreted against this offset */
  utcOffsetSeconds: number;
  /** mountain pages say "on the tops", town pages say "later" */
  isMountain?: boolean;
}

export interface DayNarrative {
  en: string;
  ja: string;
}

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([61, 63, 65, 66, 67, 80, 81, 82]);
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const THUNDER_CODES = new Set([95, 96, 99]);

function isSnowyHour(h: NarrativeHour): boolean {
  return (h.snowfall ?? 0) > 0.1 || SNOW_CODES.has(h.weatherCode ?? -1);
}

function isRainyHour(h: NarrativeHour): boolean {
  if (isSnowyHour(h)) return false;
  return (
    (h.precipitation ?? 0) > 0.2 ||
    RAIN_CODES.has(h.weatherCode ?? -1) ||
    THUNDER_CODES.has(h.weatherCode ?? -1)
  );
}

function feelWord(tempC: number): { en: string; ja: string } {
  if (tempC <= -5) return { en: "bitterly cold", ja: "厳しい冷え込み" };
  if (tempC <= 0) return { en: "freezing", ja: "氷点下" };
  if (tempC <= 5) return { en: "cold", ja: "寒い" };
  if (tempC <= 12) return { en: "cool", ja: "肌寒い" };
  if (tempC <= 22) return { en: "mild", ja: "穏やか" };
  return { en: "warm", ja: "暖かい" };
}

function conditionWord(code: number | null | undefined): { en: string; ja: string } {
  const c = code ?? -1;
  if (SNOW_CODES.has(c)) return { en: "snowing", ja: "雪" };
  if (THUNDER_CODES.has(c)) return { en: "stormy", ja: "雷雨" };
  if (RAIN_CODES.has(c)) return { en: "raining", ja: "雨" };
  if (DRIZZLE_CODES.has(c)) return { en: "drizzly", ja: "小雨" };
  if (c === 45 || c === 48) return { en: "foggy", ja: "霧" };
  if (c === 3) return { en: "overcast", ja: "曇り" };
  if (c === 2) return { en: "partly cloudy", ja: "晴れ時々曇り" };
  if (c === 0 || c === 1) return { en: "clear", ja: "晴れ" };
  return { en: "settled", ja: "落ち着いた天気" };
}

function daypartWord(hour: number): { en: string; ja: string } {
  if (hour < 5) return { en: "overnight", ja: "未明" };
  if (hour < 12) return { en: "this morning", ja: "午前中" };
  if (hour < 17) return { en: "this afternoon", ja: "午後" };
  if (hour < 21) return { en: "this evening", ja: "夕方以降" };
  return { en: "tonight", ja: "今夜" };
}

function hourLabel(hour: number): { en: string; ja: string } {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  if (hour < 12) return { en: `${h12}am`, ja: `午前${hour}時` };
  return { en: `${h12}pm`, ja: `午後${hour - 12 === 0 ? 12 : hour - 12}時` };
}

/** local "now" for the location as { key: "YYYY-MM-DDTHH", hour } */
function localNow(utcOffsetSeconds: number): { key: string; hour: number } {
  const d = new Date(Date.now() + utcOffsetSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}`,
    hour: d.getUTCHours(),
  };
}

function hourOf(time: string): number {
  const h = Number(time.slice(11, 13));
  return Number.isFinite(h) ? h : 0;
}

export function buildDayNarrative(input: DayNarrativeInput): DayNarrative | null {
  const { hourly, current, utcOffsetSeconds, isMountain } = input;
  if (!Array.isArray(hourly) || hourly.length === 0) return null;
  if (typeof current?.temperature !== "number") return null;

  const now = localNow(utcOffsetSeconds);
  // future hours only (payload mixes past observations + forecast), next ~18h
  const upcoming = hourly
    .filter((h) => typeof h?.time === "string" && h.time.slice(0, 13) >= now.key)
    .slice(0, 18);

  const clausesEn: string[] = [];
  const clausesJa: string[] = [];

  // 1 · how it feels right now
  const feel = feelWord(current.temperature);
  const cond = conditionWord(current.weatherCode);
  const part = daypartWord(now.hour);
  clausesEn.push(`${feel.en} and ${cond.en} ${part.en}`);
  clausesJa.push(`${part.ja}は${feel.ja}・${cond.ja}`);

  // 2 · the next precipitation change worth planning around
  if (upcoming.length > 0) {
    const wetNow = isSnowyHour(upcoming[0]) || isRainyHour(upcoming[0]);
    if (!wetNow) {
      const firstWet = upcoming.findIndex((h) => isSnowyHour(h) || isRainyHour(h));
      if (firstWet > 0) {
        const kind = isSnowyHour(upcoming[firstWet])
          ? { en: "snow", ja: "雪" }
          : { en: "rain", ja: "雨" };
        const sameDay = upcoming[firstWet].time.slice(0, 10) === now.key.slice(0, 10);
        if (sameDay) {
          const at = hourLabel(hourOf(upcoming[firstWet].time));
          clausesEn.push(`${kind.en} arriving after ${at.en}`);
          clausesJa.push(`${at.ja}以降に${kind.ja}`);
        } else {
          clausesEn.push(`${kind.en} arriving overnight`);
          clausesJa.push(`夜間に${kind.ja}の見込み`);
        }
      }
    } else {
      const kind = isSnowyHour(upcoming[0]) ? { en: "snow", ja: "雪" } : { en: "rain", ja: "雨" };
      // first index where this hour AND the next are dry = a real break
      let easeAt = -1;
      for (let i = 1; i < upcoming.length; i++) {
        const dry = (h: NarrativeHour | undefined) =>
          !h || (!isSnowyHour(h) && !isRainyHour(h));
        if (dry(upcoming[i]) && dry(upcoming[i + 1])) {
          easeAt = i;
          break;
        }
      }
      if (easeAt > 0 && upcoming[easeAt].time.slice(0, 10) === now.key.slice(0, 10)) {
        const at = hourLabel(hourOf(upcoming[easeAt].time));
        clausesEn.push(`${kind.en} easing by ${at.en}`);
        clausesJa.push(`${kind.ja}は${at.ja}頃に弱まる`);
      } else {
        clausesEn.push(`${kind.en} continuing through the day`);
        clausesJa.push(`${kind.ja}は一日続く見込み`);
      }
    }
  }

  // 3 · wind trend · only when we actually have future wind samples —
  // an empty window must yield NO clause, never a fabricated "easing"
  const windNow = typeof current.windSpeed === "number" ? current.windSpeed : null;
  const windSamples = upcoming
    .slice(0, 12)
    .filter((h) => typeof h.windSpeed === "number" && Number.isFinite(h.windSpeed));
  const windMax = windSamples.reduce((m, h) => Math.max(m, h.windSpeed as number), 0);
  if (windNow != null && windSamples.length > 0) {
    if (windMax >= 40 && windMax - windNow >= 15) {
      clausesEn.push(isMountain ? "winds picking up on the tops" : "winds picking up later");
      clausesJa.push(isMountain ? "山頂部で風が強まる" : "風が次第に強まる");
    } else if (windNow >= 40 && windMax <= 28) {
      clausesEn.push("winds easing later");
      clausesJa.push("風は次第におさまる");
    }
  }

  return {
    en: clausesEn.join(" · "),
    ja: clausesJa.join(" · "),
  };
}
