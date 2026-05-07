// ─────────────────────────────────────────────────────────────────────────────
// openNow.ts - timezone-aware "is this eat open right now?" classifier.
//
// Policy decisions (locked here so the playbook spec doesn't drift across
// callers - EatCard, EatFilterBar.applyEatFilters, EatFilterBar.applyEatSort
// all depend on a single source of truth):
//
//   • Timezone is DERIVED FROM `eat.country`. The curated schema deliberately
//     does NOT carry a per-eat tz field - every AU eat is in NSW (Sydney
//     wall-clock incl. DST), every JP eat is in Nagano (Tokyo wall-clock,
//     no DST). If a third country is added later, extend `TZ_BY_COUNTRY`.
//
//   • Hours strings come from curated JSON in formats like:
//       "06:30–14:00"                       (single range, en-dash)
//       "11:30–15:00, 18:00–23:30"          (two ranges, comma-separated)
//       "17:00–02:00"                       (overnight - closes next day)
//       "By appointment only"               (free-form → unparseable → ignored)
//     The `closed` key (e.g. "3rd Wed of month") is NOT honoured - exception
//     dates are out of scope; we trust the per-day strings as the source of
//     truth.
//
//   • `last_order_time` is curated as either a clean "HH:MM" or free-form
//     ("14:00 (lunch) / 20:00 (dinner) - closes when soba sells out"). We
//     intentionally do NOT let last-order influence open/closed status - the
//     visitor can still walk in to drink, and the multi-range parsing
//     ambiguity ("which range does '20:00' apply to?") makes a robust
//     implementation more brittle than valuable. Last-order is surfaced in
//     the detail sheet text only (rendered by EatCard's HoursTable).
//
//   • "closing_soon" = within 30 minutes of any active range's close time.
//
//   • Overnight ranges (close ≤ open) are normalized as [openMin, closeMin+1440]
//     and additionally checked against TODAY's window via YESTERDAY's hours
//     (so a 23:30 close on Friday correctly reports "open" at 01:00 Saturday).
//
//   • `nextChange` is best-effort: a JS Date computed from `now + deltaMinutes`.
//     The consumer (EatCard's OpenNowPill) uses this purely as a setTimeout
//     trigger - the actual displayed time comes from re-running isOpenNow at
//     that moment. Falls back to a 60-min poll when nextChange is unknown.
//
// ─────────────────────────────────────────────────────────────────────────────

import type { Eat } from "@/types/stayEat";

export type OpenNowStatus = "open" | "closing_soon" | "closed" | "unknown";

export interface OpenNowResult {
  status: OpenNowStatus;
  message: string;
  /** When the status will next change. Used to schedule a re-render. */
  nextChange?: Date;
}

const CLOSING_SOON_MINUTES = 30;
const MAX_LOOKAHEAD_DAYS = 7;
const MINUTES_PER_DAY = 1440;

const TZ_BY_COUNTRY: Record<Eat["country"], string> = {
  AU: "Australia/Sydney",
  JP: "Asia/Tokyo",
};

type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const WEEKDAY_ORDER: readonly WeekdayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

const WEEKDAY_DISPLAY: Record<WeekdayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

interface Range {
  /** Minutes since midnight when the range opens (0..1439). */
  openMin: number;
  /** Minutes since midnight when the range closes. May be > 1440 for overnight. */
  closeMin: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify an eat's current open/closed status in its local timezone.
 *
 * @param eat - the curated Eat record
 * @param now - optional override for "current time" (used by tests). Defaults to `new Date()`.
 */
export function isOpenNow(eat: Eat, now: Date = new Date()): OpenNowResult {
  const hours = eat.hours;
  // Type guard: HoursSchema allows all-undefined days. Empty hours = unknown.
  if (!hours || !hasAnyDayString(hours)) {
    return { status: "unknown", message: "Hours unverified" };
  }
  const tz = TZ_BY_COUNTRY[eat.country];
  if (!tz) {
    return { status: "unknown", message: "Hours unverified" };
  }

  let zoned: ZonedNow;
  try {
    zoned = getZonedNow(now, tz);
  } catch {
    // Bad timezone string or environment without ICU data - degrade
    // gracefully rather than throwing into the React render path.
    return { status: "unknown", message: "Hours unverified" };
  }

  const todayKey = zoned.weekday;
  const yesterdayKey = WEEKDAY_ORDER[(WEEKDAY_ORDER.indexOf(todayKey) + 6) % 7];
  const todayRanges = parseHoursDay(hours[todayKey]);
  const yesterdayRanges = parseHoursDay(hours[yesterdayKey]);
  const nowMin = zoned.minutesOfDay;

  // 1) Check today's ranges (incl. those that extend past midnight).
  for (const r of todayRanges) {
    if (nowMin >= r.openMin && nowMin < r.closeMin) {
      const minutesToClose = r.closeMin - nowMin;
      const closeDisplay = formatMinuteOfDay(r.closeMin);
      const nextChange = addMinutes(now, minutesToClose);
      if (minutesToClose <= CLOSING_SOON_MINUTES) {
        return {
          status: "closing_soon",
          message: `Closes at ${closeDisplay}`,
          nextChange,
        };
      }
      return {
        status: "open",
        message: `Open · until ${closeDisplay}`,
        nextChange,
      };
    }
  }

  // 2) Check yesterday's overnight ranges that bleed into today.
  //    Effective today-window = [0, closeMin - 1440).
  for (const r of yesterdayRanges) {
    if (r.closeMin <= MINUTES_PER_DAY) continue; // not overnight
    const effectiveClose = r.closeMin - MINUTES_PER_DAY;
    if (nowMin < effectiveClose) {
      const minutesToClose = effectiveClose - nowMin;
      const closeDisplay = formatMinuteOfDay(effectiveClose);
      const nextChange = addMinutes(now, minutesToClose);
      if (minutesToClose <= CLOSING_SOON_MINUTES) {
        return {
          status: "closing_soon",
          message: `Closes at ${closeDisplay}`,
          nextChange,
        };
      }
      return {
        status: "open",
        message: `Open · until ${closeDisplay}`,
        nextChange,
      };
    }
  }

  // 3) Closed. Find the next opening within MAX_LOOKAHEAD_DAYS so we know
  //    when to re-render and what to show in the message.
  return computeClosed(eat, hours, todayKey, nowMin, now);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ZonedNow {
  weekday: WeekdayKey;
  minutesOfDay: number;
}

function getZonedNow(now: Date, timeZone: string): ZonedNow {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  let weekday: WeekdayKey = "monday";
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "weekday") {
      const lc = p.value.toLowerCase();
      if (
        lc === "monday" || lc === "tuesday" || lc === "wednesday" ||
        lc === "thursday" || lc === "friday" || lc === "saturday" || lc === "sunday"
      ) {
        weekday = lc;
      }
    } else if (p.type === "hour") {
      const n = parseInt(p.value, 10);
      // Some Intl implementations emit "24" at midnight under hour12:false.
      hour = Number.isFinite(n) ? (n === 24 ? 0 : n) : 0;
    } else if (p.type === "minute") {
      const n = parseInt(p.value, 10);
      minute = Number.isFinite(n) ? n : 0;
    }
  }
  return { weekday, minutesOfDay: hour * 60 + minute };
}

function hasAnyDayString(hours: Eat["hours"]): boolean {
  if (!hours) return false;
  for (const k of WEEKDAY_ORDER) {
    const v = hours[k];
    if (typeof v === "string" && v.trim().length > 0) return true;
  }
  return false;
}

/**
 * Parse a single day's hours string into [openMin, closeMin] ranges.
 *
 * Tolerates: en-dash (–), em-dash (-), and hyphen (-) as range separators;
 * spaces around the dash; comma-separated multi-ranges; and the "24:00"
 * literal as end-of-day.
 *
 * Silently drops:
 *   - free-form text ("By appointment only")
 *   - the "closed" key's free-form notes (caller passes only the day key)
 *   - any range where the regex doesn't fully match
 *
 * Overnight handling: when close ≤ open, bumps closeMin by +1440 so callers
 * can use the same `nowMin >= openMin && nowMin < closeMin` check uniformly.
 * The exception is "00:00–00:00", which is treated as a 24h venue
 * (range = [0, 1440]).
 */
export function parseHoursDay(s: string | null | undefined): Range[] {
  if (!s) return [];
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const ranges: Range[] = [];
  // Allow optional whitespace around the separator; accept en-dash, em-dash, hyphen.
  const re = /^(\d{1,2}):(\d{2})\s*[-–-]\s*(\d{1,2}):(\d{2})$/;
  for (const part of parts) {
    const m = re.exec(part);
    if (!m) continue;
    const openH = parseInt(m[1], 10);
    const openMm = parseInt(m[2], 10);
    const closeH = parseInt(m[3], 10);
    const closeMm = parseInt(m[4], 10);
    if (openH < 0 || openH > 24 || closeH < 0 || closeH > 24) continue;
    if (openMm < 0 || openMm > 59 || closeMm < 0 || closeMm > 59) continue;
    const openMin = openH * 60 + openMm;
    let closeMin = closeH * 60 + closeMm;
    // 24h venue: openMin=0 closeMin=0 → treat as full-day [0, 1440]
    if (openMin === 0 && closeMin === 0) {
      ranges.push({ openMin: 0, closeMin: MINUTES_PER_DAY });
      continue;
    }
    if (closeMin <= openMin) closeMin += MINUTES_PER_DAY; // overnight
    ranges.push({ openMin, closeMin });
  }
  return ranges;
}

function formatMinuteOfDay(mins: number): string {
  // mins may be > 1440 for overnight ranges; normalize for display.
  const norm = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  // Special-case midnight (close at 00:00 reads as "midnight" rather than the
  // ambiguous "00:00" - venues with hours like "17:00–00:00" are common AU
  // pubs that close at end-of-day, and "Open · until 00:00" parses to the
  // visitor as "closed already" instead of "closes at midnight").
  if (norm === 0) return "midnight";
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function computeClosed(
  eat: Eat,
  hours: NonNullable<Eat["hours"]>,
  todayKey: WeekdayKey,
  nowMin: number,
  now: Date,
): OpenNowResult {
  const todayIdx = WEEKDAY_ORDER.indexOf(todayKey);

  // Look at today's later ranges first.
  const todayRanges = parseHoursDay(hours[todayKey]);
  for (const r of todayRanges) {
    if (r.openMin > nowMin) {
      const minutesToOpen = r.openMin - nowMin;
      const openDisplay = formatMinuteOfDay(r.openMin);
      return {
        status: "closed",
        message: `Closed · opens ${openDisplay}`,
        nextChange: addMinutes(now, minutesToOpen),
      };
    }
  }

  // Then scan tomorrow … +7 days.
  for (let dayOffset = 1; dayOffset <= MAX_LOOKAHEAD_DAYS; dayOffset++) {
    const futureKey = WEEKDAY_ORDER[(todayIdx + dayOffset) % 7];
    const futureRanges = parseHoursDay(hours[futureKey]);
    if (futureRanges.length === 0) continue;
    const earliest = futureRanges.reduce((min, r) => Math.min(min, r.openMin), Number.POSITIVE_INFINITY);
    if (!Number.isFinite(earliest)) continue;
    const minutesToOpen = (dayOffset * MINUTES_PER_DAY) + earliest - nowMin;
    const openDisplay = formatMinuteOfDay(earliest);
    const dayLabel = dayOffset === 1 ? "tomorrow" : WEEKDAY_DISPLAY[futureKey];
    return {
      status: "closed",
      message: `Closed · opens ${dayLabel} ${openDisplay}`,
      nextChange: addMinutes(now, minutesToOpen),
    };
  }

  // No openings in the next week. Don't auto-rerender - the data is stale
  // or the venue is genuinely shuttered.
  // (eat is here for future logging hooks; intentionally unused.)
  void eat;
  return { status: "closed", message: "Closed" };
}
