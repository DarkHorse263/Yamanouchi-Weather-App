import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPerisherStatusFresh,
  parsePerisherLiftHtml,
  type PerisherLiveLiftStatus,
} from "../perisherLiftStatus.js";

const NOW = Date.parse("2026-08-30T13:00:00+10:00");
const AREAS = ["Perisher Valley", "Smiggin Holes", "Blue Cow", "Guthega"]
  .map((name) => `<div>${name}</div>`)
  .join("");

function report(
  rows: string,
  counts = "Open: 1 | Closed: 1 | Busy: 0 | On Hold: 0 | On Standby: 0",
  heading = "<h1>Current Lift Status</h1>",
): string {
  return `${heading}${AREAS}<div>${counts}</div><table>${rows}</table>`;
}

function snowReport(
  updated = "30 Aug 7:12am",
  expectedLifts = 1,
  label: "Lifts Open" | "Expected Lifts" = "Lifts Open",
): string {
  return `<p>Report Updated: ${updated}</p><div>${label}</div><div class="psr-snow-report__tab-big">${expectedLifts}</div>`;
}

function row(status: string, name: string, opens = "8:30AM", closes = "4:30PM"): string {
  return `<tr><td><img class="lift_image" alt="${status}"></td><td>${name}</td><td>${opens}</td><td>${closes}</td></tr>`;
}

test("parses official rows, entities, types, times, and conservative statuses", () => {
  const html = report(
    row("Open", "Mt Perisher 6") +
      row("Closed", "Harry&#039;s &amp; Herman&#039;s Conveyor"),
  );
  const result = parsePerisherLiftHtml(html, snowReport(), NOW);
  assert.ok(result);
  assert.equal(result.lifts.length, 2);
  assert.deepEqual(result.lifts[0], {
    id: "perisher-mt-perisher-6",
    name: "Mt Perisher 6",
    type: "chairlift",
    status: "open",
    openingTime: "8:30AM",
    closingTime: "4:30PM",
  });
  assert.equal(result.lifts[1]!.name, "Harry's & Herman's Conveyor");
  assert.equal(result.lifts[1]!.type, "magic-carpet");
  assert.equal(result.lifts[1]!.status, "closed");
});

test("maps Busy to open, On Hold to hold, and On Standby to scheduled", () => {
  const html = report(
    row("Busy", "Village 8 Express Chair") +
      row("On Hold", "Eyre T-Bar") +
      row("On Standby", "Summit Quad Chair"),
    "Open: 0 | Closed: 0 | Busy: 1 | On Hold: 1 | On Standby: 1",
  );
  const result = parsePerisherLiftHtml(html, snowReport("30 Aug 7:12am", 1), NOW);
  assert.ok(result);
  assert.deepEqual(result.lifts.map((lift) => lift.status), ["open", "on-hold", "scheduled"]);
});

test("rejects a stale official response timestamp", () => {
  assert.equal(
    parsePerisherLiftHtml(
      report(row("Open", "A") + row("Closed", "B")),
      snowReport("27 Aug 7:12am"),
      NOW,
    ),
    null,
  );
});

test("rejects an empty lift list", () => {
  assert.equal(
    parsePerisherLiftHtml(
      report("", "Open: 0 | Closed: 0 | Busy: 0 | On Hold: 0 | On Standby: 0"),
      snowReport("30 Aug 7:12am", 0),
      NOW,
    ),
    null,
  );
});

test("rejects missing report proof, unknown statuses, and summary/row mismatches", () => {
  const validRows = row("Open", "A") + row("Closed", "B");
  assert.equal(parsePerisherLiftHtml(report(validRows), "", NOW), null);
  assert.equal(
    parsePerisherLiftHtml(
      report(
        row("Open", "A") + row("Mystery", "Unknown status"),
        "Open: 1 | Closed: 0 | Busy: 0 | On Hold: 0 | On Standby: 0",
      ),
      snowReport(),
      NOW,
    ),
    null,
  );
  assert.equal(
    parsePerisherLiftHtml(report(row("Open", "Only one")), snowReport(), NOW),
    null,
  );
});

test("rejects missing area sections and implausible timestamped report counts", () => {
  const valid = report(row("Open", "A") + row("Closed", "B"));
  assert.equal(
    parsePerisherLiftHtml(valid.replace("<div>Guthega</div>", ""), snowReport(), NOW),
    null,
  );
  assert.equal(parsePerisherLiftHtml(valid, snowReport("30 Aug 7:12am", 0), NOW), null);
  assert.equal(parsePerisherLiftHtml(valid, snowReport("30 Aug 7:12am", 3), NOW), null);
});

test("accepts the current Expected Lifts label and later live-count movement", () => {
  const valid = report(
    row("Open", "A") + row("Open", "B") + row("Closed", "C"),
    "Open: 2 | Closed: 1 | Busy: 0 | On Hold: 0 | On Standby: 0",
    "<h1>Lift Report</h1><h1>Lifts expected to open&nbsp;today</h1>",
  );
  const result = parsePerisherLiftHtml(
    valid,
    snowReport("30 Aug 7:12am", 1, "Expected Lifts"),
    NOW,
  );
  assert.ok(result);
  assert.equal(result.lifts.filter((lift) => lift.status === "open").length, 2);
});

test("rejects a generic Lift Report page without the official operations heading", () => {
  const generic = report(
    row("Open", "A") + row("Closed", "B"),
    undefined,
    "<h1>Lift Report</h1>",
  );
  assert.equal(parsePerisherLiftHtml(generic, snowReport(), NOW), null);
});

test("cached status becomes unusable exactly when its source crosses 24 hours", () => {
  const value: PerisherLiveLiftStatus = {
    lifts: [{
      id: "perisher-a",
      name: "A",
      type: "surface",
      status: "open",
    }],
    updatedAt: new Date(NOW - 24 * 3600_000).toISOString(),
  };
  assert.equal(isPerisherStatusFresh(value, NOW), true, "exactly 24h remains valid");
  assert.equal(
    isPerisherStatusFresh(value, NOW + 1),
    false,
    "cache TTL or outage fallback must not extend source freshness",
  );
});