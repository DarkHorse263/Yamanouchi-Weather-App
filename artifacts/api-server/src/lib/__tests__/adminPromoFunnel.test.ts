import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  loadPromoFunnel,
  type PromoFunnelRow,
} from "../adminPromoFunnel.js";

const NOW = new Date("2026-08-30T15:00:00.000Z");
const EVENTS = ["shown", "clicked", "dismissed"] as const;

describe("admin promo funnel windows", () => {
  test("excludes old events and includes recent events in both windows", async () => {
    const rows: PromoFunnelRow[] = EVENTS.flatMap((event) => [
      { event, day: "2026-07-31", count: 100 },
      { event, day: "2026-08-01", count: 10 },
      { event, day: "2026-08-24", count: 2 },
    ]);
    let requestedSinceDay: string | undefined;

    const result = await loadPromoFunnel(
      {
        async loadRowsSince(sinceDay) {
          requestedSinceDay = sinceDay;
          return rows.filter((row) => row.day >= sinceDay);
        },
        logError() {
          assert.fail("the successful query must not log an error");
        },
      },
      NOW,
    );

    assert.equal(requestedSinceDay, "2026-08-01");
    for (const event of EVENTS) {
      assert.deepEqual(result?.[event], { last30d: 12, last7d: 2 });
    }
  });

  test("returns undefined when the counter query fails", async () => {
    const failure = new Error("counter table unavailable");
    let logged: unknown;

    const result = await loadPromoFunnel(
      {
        async loadRowsSince() {
          throw failure;
        },
        logError(error) {
          logged = error;
        },
      },
      NOW,
    );

    assert.equal(result, undefined);
    assert.equal(logged, failure);
  });
});
