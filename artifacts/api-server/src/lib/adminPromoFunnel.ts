export type PromoFunnelTotals = Record<
  string,
  { last30d: number; last7d: number }
>;

export interface PromoFunnelRow {
  event: string;
  day: string;
  count: number | string;
}

export interface PromoFunnelDeps {
  loadRowsSince(sinceDay: string): Promise<PromoFunnelRow[]>;
  logError(error: unknown): void;
}

function utcDayDaysAgo(now: Date, daysAgo: number): string {
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - daysAgo);
  return day.toISOString().slice(0, 10);
}

export async function loadPromoFunnel(
  deps: PromoFunnelDeps,
  now = new Date(),
): Promise<PromoFunnelTotals | undefined> {
  const since30dDay = utcDayDaysAgo(now, 29);
  const since7dDay = utcDayDaysAgo(now, 6);

  try {
    const rows = await deps.loadRowsSince(since30dDay);
    const totals: PromoFunnelTotals = {};

    for (const row of rows) {
      const eventTotals = (totals[row.event] ??= { last30d: 0, last7d: 0 });
      const count = Number(row.count);
      eventTotals.last30d += count;
      if (row.day >= since7dDay) eventTotals.last7d += count;
    }

    return totals;
  } catch (error) {
    deps.logError(error);
    return undefined;
  }
}
