import assert from "node:assert/strict";
import test from "node:test";
import {
  CHARLOTTE_PASS_LIFT_REPORT_URL,
  isCharlottePassStatusFresh,
  parseCharlottePassLiftHtml,
  type CharlottePassLiveLiftStatus,
} from "../charlottePassLiftStatus.js";

const NOW = Date.parse("2026-08-30T02:00:00.000Z");
const NAMES = [
  "Kosciuszko Triple Chair",
  "Kosi Carpet",
  "Guthries Double Chair",
  "Pulpit T-Bar",
  "Basin Poma",
];

test("uses the current official report page for both live data and fallback links", () => {
  assert.equal(CHARLOTTE_PASS_LIFT_REPORT_URL, "https://charlottepass.com.au/on-mountain/");
});

function page(
  statuses = ["OPEN TO THE TOP FOR THE BETTER SKIERS AND BOARDERS", "OPEN", "CLOSED", "ON HOLD", "WIND HOLD"],
  modified = "2026-08-30T00:47:12",
  date = "30 August 2026",
): string {
  const controls = NAMES.map(
    (name, index) => `<li class="et_pb_tab_${index}${index === 0 ? " et_pb_tab_active" : ""}"><a href="#">${name}</a></li>`,
  ).join("");
  const tabs = statuses.map(
    (status, index) =>
      `<div class="et_pb_tab et_pb_tab_${index} clearfix"><div class="et_pb_tab_content">${index === 4 ? "<p>OPEN</p>" : ""}<h4>Lift Status: ${status}</h4></div></div>`,
  ).join("");
  return `<meta property="article:modified_time" content="${modified}Z" /><h6>As at ${date}</h6><ul class="et_pb_tabs_controls clearfix">${controls}</ul><div class="et_pb_all_tabs">${tabs}</div>`;
}

function parse(
  statuses?: string[],
  modified?: string,
  date?: string,
): CharlottePassLiveLiftStatus | null {
  return parseCharlottePassLiftHtml(page(statuses, modified, date), NOW);
}

test("parses the complete official five-lift report", () => {
  const result = parse();
  assert.ok(result);
  assert.equal(result.updatedAt, "2026-08-30T00:47:12.000Z");
  assert.deepEqual(result.lifts.map((lift) => [lift.name, lift.type, lift.status]), [
    ["Kosciuszko Triple Chair", "chairlift", "open"],
    ["Kosi Carpet", "magic-carpet", "open"],
    ["Guthries Double Chair", "chairlift", "closed"],
    ["Pulpit T-Bar", "t-bar", "on-hold"],
    ["Basin Poma", "poma", "wind-hold"],
  ]);
});

test("maps the official partial-height OPEN TO MID STATION status to open", () => {
  const result = parse(["OPEN TO MID STATION", "CLOSED", "CLOSED", "CLOSED", "CLOSED"]);
  assert.ok(result);
  assert.equal(result.lifts[0]?.status, "open");
});

test("rejects stale or future source timestamps", () => {
  assert.equal(parse(undefined, "2026-08-28T00:47:12"), null);
  assert.equal(parse(undefined, "2026-08-30T03:47:12"), null);
});

test("rejects a report date that does not match the source update date", () => {
  assert.equal(parse(undefined, undefined, "29 August 2026"), null);
});

test("rejects missing, reordered, duplicate, or unknown lift data", () => {
  const missing = page().replace(
    '<li class="et_pb_tab_4"><a href="#">Basin Poma</a></li>',
    "",
  );
  assert.equal(parseCharlottePassLiftHtml(missing, NOW), null);

  const reordered = page().replace("Kosciuszko Triple Chair</a>", "Basin Poma</a>");
  assert.equal(parseCharlottePassLiftHtml(reordered, NOW), null);
  assert.equal(parse(["OPEN", "OPEN", "CLOSED", "MYSTERY", "OPEN"]), null);
  assert.equal(parseCharlottePassLiftHtml("", NOW), null);
});

test("rejects swapped tab bindings and headings outside tab-content", () => {
  const swapped = page().replace(
    'class="et_pb_tab_0 et_pb_tab_active"',
    'class="et_pb_tab_1 et_pb_tab_active"',
  );
  assert.equal(parseCharlottePassLiftHtml(swapped, NOW), null);
  const escaped = page().replace(
    '<div class="et_pb_tab_content"><h4>Lift Status: OPEN TO THE TOP FOR THE BETTER SKIERS AND BOARDERS</h4>',
    '<div class="et_pb_tab_content"></div><h4>Lift Status: OPEN TO THE TOP FOR THE BETTER SKIERS AND BOARDERS</h4>',
  );
  assert.equal(parseCharlottePassLiftHtml(escaped, NOW), null);
});

test("rejects near-match open wording rather than inventing an open claim", () => {
  assert.equal(parse(["OPENING SOON", "OPEN", "CLOSED", "CLOSED", "OPEN"]), null);
  assert.equal(parse(["OPEN WEATHER PERMITTING", "OPEN", "CLOSED", "CLOSED", "OPEN"]), null);
});

test("serve-time freshness expires independently of cache age", () => {
  const value: CharlottePassLiveLiftStatus = {
    lifts: [],
    updatedAt: "2026-08-30T00:00:00.000Z",
  };
  assert.equal(isCharlottePassStatusFresh(value, Date.parse("2026-08-31T00:00:00.000Z")), true);
  assert.equal(isCharlottePassStatusFresh(value, Date.parse("2026-08-31T00:00:00.001Z")), false);
});