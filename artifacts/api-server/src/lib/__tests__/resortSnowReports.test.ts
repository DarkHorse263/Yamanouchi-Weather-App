import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseFallsCreekJson,
  parseHothamHtml,
  parseHothamTimestamp,
  makeSnowyHydroCourseParser,
  parseNzskiJson,
  parseRemarkablesHtml,
  parseRemarkablesTimestamp,
  makeCardronaParser,
  parseWhakapapaHtml,
  parseWhakapapaTimestamp,
  parseTuroaHtml,
  parseTuroaTimestamp,
  type SnowReportAdapter,
} from "../resortSnowReports.js";

const fcAdapter: SnowReportAdapter = {
  feedUrl: "https://example.test/fc.json",
  humanUrl: "https://www.fallscreek.com.au/snowreport/",
  sourceName: "Falls Creek",
  parse: parseFallsCreekJson,
};

const hothamAdapter: SnowReportAdapter = {
  feedUrl: "https://example.test/hotham",
  humanUrl: "https://www.mthotham.com.au/mountain/conditions/snow-reports",
  sourceName: "Mt Hotham",
  parse: parseHothamHtml,
};

// ── Falls Creek JSON ─────────────────────────────────────────────────────────

const fcGood = JSON.stringify({
  LastUpdate: "2026-07-13 09:10 UTC",
  Patrol: {
    PatrolNaturalSnowDepth: 38,
    PatrolFreshSnow: 12,
    SeasonalSnowfallToDate: "",
  },
});

test("falls creek: happy path parses depth, fresh, empty season -> null", () => {
  const r = parseFallsCreekJson(fcGood, fcAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 38);
  assert.equal(r!.lastSnowfallCm, 12);
  assert.equal(r!.seasonSnowfallCm, null); // empty string is unknown, not 0
  assert.equal(r!.updatedAt, "2026-07-13T09:10:00Z");
  assert.equal(r!.sourceName, "Falls Creek");
  assert.equal(r!.sourceUrl, fcAdapter.humanUrl);
});

test("falls creek: string numerals are accepted", () => {
  const r = parseFallsCreekJson(
    JSON.stringify({
      LastUpdate: "2026-07-13 09:10:42 UTC",
      Patrol: { PatrolNaturalSnowDepth: "38.5", PatrolFreshSnow: "0" },
    }),
    fcAdapter,
  );
  assert.ok(r);
  assert.equal(r!.baseCm, 38.5);
  assert.equal(r!.lastSnowfallCm, 0); // a reported 0 is real, surfaces as 0
  assert.equal(r!.updatedAt, "2026-07-13T09:10:42Z");
});

test("falls creek: missing depth -> absent report (never 0)", () => {
  const r = parseFallsCreekJson(
    JSON.stringify({ LastUpdate: "2026-07-13 09:10 UTC", Patrol: { PatrolFreshSnow: 5 } }),
    fcAdapter,
  );
  assert.equal(r, null);
});

test("falls creek: whitespace depth string -> absent (Number(' ') trap)", () => {
  const r = parseFallsCreekJson(
    JSON.stringify({
      LastUpdate: "2026-07-13 09:10 UTC",
      Patrol: { PatrolNaturalSnowDepth: "  " },
    }),
    fcAdapter,
  );
  assert.equal(r, null);
});

test("falls creek: malformed LastUpdate -> absent (36h guard needs it)", () => {
  const r = parseFallsCreekJson(
    JSON.stringify({ LastUpdate: "13 July 2026", Patrol: { PatrolNaturalSnowDepth: 38 } }),
    fcAdapter,
  );
  assert.equal(r, null);
});

test("falls creek: non-JSON body -> absent", () => {
  assert.equal(parseFallsCreekJson("<html>maintenance</html>", fcAdapter), null);
});

// ── Mt Hotham HTML ───────────────────────────────────────────────────────────

// Mirrors the real DNN markup, including the Chart.js decoy ("Depth (cm)"
// inside a JSON string) that must NOT be mistaken for the stat card.
const hothamGood = `
<script>var cfg={"scaleLabel":{"display":true,"labelString":"Depth (cm)"}};</script>
<div class="tab-pane" id="daily-snow-report"><p>Mon 13 July, 07:47AM</p>
<h4>Village Chair Open</h4></div>
<p><img src="/icon-history.svg" class="me-2 inline-svg"> Last 24hrs </p> <h2 class="mb-0 pt-5">8cm</h2>
<p><img src="/icon-calendar.svg" class="me-2 inline-svg"> Last 7 Days </p> <h2 class="mb-0 pt-5">25cm</h2>
<p><img src="/icon-analytics.svg" class="me-2 inline-svg"> Season Total </p> <h2 class="mb-0 pt-5">95cm</h2>
<p><img src="/icon-depth.svg" class="me-2 inline-svg"> Depth </p> <h2 class="mb-0 pt-5">48cm</h2>
<p class="m-0 mb-3">Issued: Mon 13 July, 06:36AM</p>
`;

test("hotham: happy path parses labelled stat cards", () => {
  const r = parseHothamHtml(hothamGood, hothamAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 48);
  assert.equal(r!.lastSnowfallCm, 8);
  assert.equal(r!.seasonSnowfallCm, 95);
  assert.equal(r!.sourceName, "Mt Hotham");
  // Most recent stamp on the page wins: 07:47AM AEST = 21:47 UTC previous day.
  assert.equal(r!.updatedAt, "2026-07-12T21:47:00.000Z");
});

test("hotham: chart-config decoy alone yields no report", () => {
  const html = `<script>var cfg={"labelString":"Depth (cm)"};</script>
    <p>Mon 13 July, 07:47AM</p>`;
  assert.equal(parseHothamHtml(html, hothamAdapter), null);
});

test("hotham: depth card without any timestamp -> absent", () => {
  const html = `<p> Depth </p> <h2>48cm</h2>`;
  assert.equal(parseHothamHtml(html, hothamAdapter), null);
});

test("hotham: timestamp without depth card -> absent", () => {
  const html = `<p>Mon 13 July, 07:47AM</p> <h2>48cm</h2>`;
  assert.equal(parseHothamHtml(html, hothamAdapter), null);
});

// ── Hotham timestamp year inference ──────────────────────────────────────────

test("timestamp: infers current year for an in-season stamp", () => {
  // "now" = 2026-07-13 00:00 UTC (10:00 AEST)
  const now = Date.UTC(2026, 6, 13, 0, 0);
  const iso = parseHothamTimestamp("<p>Mon 13 July, 07:47AM</p>", now);
  assert.equal(iso, "2026-07-12T21:47:00.000Z");
});

test("timestamp: January page still showing 31 December -> previous year", () => {
  // "now" = 2027-01-02; a naive current-year parse would land ~a year ahead.
  const now = Date.UTC(2027, 0, 2, 0, 0);
  const iso = parseHothamTimestamp("<p>Thu 31 December, 06:00PM</p>", now);
  // AEDT (+11) in December: 18:00 local = 07:00 UTC, year 2026.
  assert.equal(iso, "2026-12-31T07:00:00.000Z");
});

test("timestamp: picks the most recent of multiple stamps", () => {
  const now = Date.UTC(2026, 6, 13, 0, 0);
  const iso = parseHothamTimestamp(
    "<p>Issued: Mon 13 July, 06:36AM</p> <p>Mon 13 July, 07:47AM</p>",
    now,
  );
  assert.equal(iso, "2026-07-12T21:47:00.000Z");
});

test("timestamp: PM and comma-free variants parse", () => {
  const now = Date.UTC(2026, 6, 13, 12, 0);
  const iso = parseHothamTimestamp("<p>Mon 13 July 02:15PM</p>", now);
  // 14:15 AEST = 04:15 UTC same day.
  assert.equal(iso, "2026-07-13T04:15:00.000Z");
});

// ── Snowy Hydro snow course (Spencers Creek) ─────────────────────────────────

const shParse = makeSnowyHydroCourseParser("Spencers Creek");
const shAdapter: SnowReportAdapter = {
  humanUrl: "https://www.snowyhydro.com.au/generation/live-data/snow-depths/",
  sourceName: "Snowy Hydro · Spencers Creek",
  parse: shParse,
};

// Mirrors the real getData.php shape: lake-level rows without `snow`, and
// reading rows where `snow` is an object or an array of course entries.
const shGood = JSON.stringify({
  "2026": {
    snowyhydro: {
      level: [
        { "-date": "2026-07-20", lake: { "-name": "Eucumbene", "#text": "42.1" } },
        {
          "-date": "2026-07-14",
          snow: [
            { "-name": "Spencers Creek", "-dataTimestamp": "2026-07-14T09:00:00", "-quality": "G", "#text": "55" },
            { "-name": "Deep Creek", "-dataTimestamp": "2026-07-14T09:00:00", "-quality": "G", "#text": "31" },
          ],
        },
        {
          "-date": "2026-07-21",
          snow: { "-name": "Spencers Creek", "-dataTimestamp": "2026-07-21T09:30:00", "-quality": "G", "#text": "68" },
        },
      ],
    },
  },
  "2025": {
    snowyhydro: {
      level: [
        {
          "-date": "2025-07-22",
          snow: { "-name": "Spencers Creek", "-dataTimestamp": "2025-07-22T09:00:00", "-quality": "G", "#text": "104" },
        },
      ],
    },
  },
});

test("snowy hydro: latest good Spencers Creek reading wins across rows and years", () => {
  const r = shParse(shGood, shAdapter);
  assert.ok(r);
  assert.equal(r!.kind, "course");
  assert.equal(r!.baseCm, 68); // 21 Jul 2026, not the older 55 or last year's 104
  // Feed omits a zone -> AEST +10:00 appended, never treated as UTC.
  assert.equal(r!.updatedAt, "2026-07-21T09:30:00+10:00");
  // A course measures depth only - snowfall fields stay unknown, never 0.
  assert.equal(r!.seasonSnowfallCm, null);
  assert.equal(r!.lastSnowfallCm, null);
  assert.equal(r!.sourceName, "Snowy Hydro · Spencers Creek");
  assert.equal(r!.sourceUrl, shAdapter.humanUrl);
});

test("snowy hydro: non-G quality readings are skipped (falls back to older good one)", () => {
  const doc = JSON.stringify({
    "2026": {
      snowyhydro: {
        level: [
          { "-date": "2026-07-14", snow: { "-name": "Spencers Creek", "-quality": "G", "#text": "55" } },
          { "-date": "2026-07-21", snow: { "-name": "Spencers Creek", "-quality": "P", "#text": "12" } },
        ],
      },
    },
  });
  const r = shParse(doc, shAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 55);
  // No -dataTimestamp -> row date at local noon AEST.
  assert.equal(r!.updatedAt, "2026-07-14T12:00:00+10:00");
});

test("snowy hydro: other course names never match (Deep Creek is not Spencers)", () => {
  const doc = JSON.stringify({
    "2026": {
      snowyhydro: {
        level: [
          { "-date": "2026-07-21", snow: { "-name": "Deep Creek", "-quality": "G", "#text": "31" } },
        ],
      },
    },
  });
  assert.equal(shParse(doc, shAdapter), null);
});

test("snowy hydro: non-numeric or negative depth is skipped (never a defaulted 0)", () => {
  const doc = JSON.stringify({
    "2026": {
      snowyhydro: {
        level: [
          { "-date": "2026-07-21", snow: { "-name": "Spencers Creek", "-quality": "G", "#text": "n/a" } },
          { "-date": "2026-07-14", snow: { "-name": "Spencers Creek", "-quality": "G", "#text": "-3" } },
        ],
      },
    },
  });
  assert.equal(shParse(doc, shAdapter), null);
});

test("snowy hydro: entry without any parseable date is skipped", () => {
  const doc = JSON.stringify({
    "2026": {
      snowyhydro: {
        level: [
          { "-date": "no reading", snow: { "-name": "Spencers Creek", "-quality": "G", "#text": "68" } },
        ],
      },
    },
  });
  assert.equal(shParse(doc, shAdapter), null);
});

test("snowy hydro: non-JSON body (maintenance page) -> absent", () => {
  assert.equal(shParse("<html>down for maintenance</html>", shAdapter), null);
});

// ── NZSki JSON (Mt Hutt / Coronet Peak via -winter slug) ─────────────────────

const nzskiAdapterFixture: SnowReportAdapter = {
  feedUrl: "https://example.test/mt-hutt-data.json",
  humanUrl: "https://www.mthutt.co.nz/weather-report",
  sourceName: "Mt Hutt",
  parse: parseNzskiJson,
};

test("nzski: unordered min/max pair sorts numerically (min > max in the wild)", () => {
  const r = parseNzskiJson(
    JSON.stringify({
      updatedAt: "2026-07-24T04:01:11.858Z",
      snow: { seasonTotal: 163, last7Days: 0, base: { min: 140, max: 81 } },
    }),
    nzskiAdapterFixture,
  );
  assert.ok(r);
  assert.equal(r!.baseCm, 140); // HIGHER value - skiability gates key off it
  assert.equal(r!.baseMinCm, 81);
  assert.equal(r!.seasonSnowfallCm, 163);
  assert.equal(r!.lastSnowfallCm, null); // last7Days is NOT a 24h figure
  assert.equal(r!.updatedAt, "2026-07-24T04:01:11.858Z");
  assert.equal(r!.sourceName, "Mt Hutt");
});

test("nzski: null bases (coronet pre-season) -> absent report", () => {
  const r = parseNzskiJson(
    JSON.stringify({
      updatedAt: "2026-05-06T22:00:00Z",
      snow: { seasonTotal: 255, last7Days: null, base: { min: null, max: null } },
    }),
    nzskiAdapterFixture,
  );
  assert.equal(r, null);
});

test("nzski: equal pair collapses to a single figure (no baseMinCm)", () => {
  const r = parseNzskiJson(
    JSON.stringify({ updatedAt: "2026-07-24T04:00:00Z", snow: { base: { min: 60, max: 60 } } }),
    nzskiAdapterFixture,
  );
  assert.ok(r);
  assert.equal(r!.baseCm, 60);
  assert.equal(r!.baseMinCm, undefined);
});

test("nzski: one usable value -> single figure", () => {
  const r = parseNzskiJson(
    JSON.stringify({ updatedAt: "2026-07-24T04:00:00Z", snow: { base: { min: null, max: 45 } } }),
    nzskiAdapterFixture,
  );
  assert.ok(r);
  assert.equal(r!.baseCm, 45);
  assert.equal(r!.baseMinCm, undefined);
});

test("nzski: missing updatedAt -> absent (36h guard needs it)", () => {
  const r = parseNzskiJson(
    JSON.stringify({ snow: { base: { min: 30, max: 50 } } }),
    nzskiAdapterFixture,
  );
  assert.equal(r, null);
});

test("nzski: non-JSON body -> absent", () => {
  assert.equal(parseNzskiJson("<html>edge error</html>", nzskiAdapterFixture), null);
});

// ── The Remarkables server-rendered page ─────────────────────────────────────

const remarksAdapter: SnowReportAdapter = {
  feedUrl: "https://www.theremarkables.co.nz/weather-report/",
  humanUrl: "https://www.theremarkables.co.nz/weather-report/",
  sourceName: "The Remarkables",
  parse: parseRemarkablesHtml,
};

/** Mirrors the live template exactly (multiline label/value cells, both
 *  "Last Updated" span variants) - captured July 2026. */
function remarksHtml(stats: Record<string, string>, updated = "Fri 24 Jul 16:28 PM"): string {
  const cells = Object.entries(stats)
    .map(
      ([label, value]) => `
        <div class="w_weather-status no-icon">
            <div class="w_weather-status__info">
                <p class="w_weather-status__description">
                    ${label}
                </p>
                <p class="w_weather-status__data">
                    ${value}
                </p>
            </div>
        </div>`,
    )
    .join("\n");
  return `<html><body>
    <span class="last-updated">Last Updated: ${updated}</span>
    ${cells}
    <span class="weather-report__weather__details-update print-hide">Last Updated: ${updated}</span>
  </body></html>`;
}

// nowMs fixed inside the season so year inference is deterministic.
const REMARKS_NOW = Date.parse("2026-07-24T08:00:00Z");

test("remarkables: full report (range base + 24h + season)", () => {
  const html = remarksHtml({
    "Mountain Status": "Open",
    "Last 24 Hours": "3cm",
    "Snow Base": "15 - 80cm",
    "Season Snowfall": "80cm",
  });
  const r = parseRemarkablesHtml(html, remarksAdapter);
  assert.ok(r);
  assert.equal(r!.kind, "resort");
  assert.equal(r!.baseCm, 80);
  assert.equal(r!.baseMinCm, 15);
  assert.equal(r!.lastSnowfallCm, 3);
  assert.equal(r!.seasonSnowfallCm, 80);
  assert.equal(r!.sourceName, "The Remarkables");
  // 16:28 NZST (+12) -> 04:28 UTC same day
  assert.equal(r!.updatedAt.startsWith("2026-07-24T04:28"), true);
});

test("remarkables: single-figure base collapses (no baseMinCm)", () => {
  const r = parseRemarkablesHtml(remarksHtml({ "Snow Base": "40cm" }), remarksAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 40);
  assert.equal(r!.baseMinCm, undefined);
  assert.equal(r!.lastSnowfallCm, null);
  assert.equal(r!.seasonSnowfallCm, null);
});

test("remarkables: non-cm / blank base -> absent, never 0", () => {
  assert.equal(
    parseRemarkablesHtml(remarksHtml({ "Snow Base": "n/a" }), remarksAdapter),
    null,
  );
  assert.equal(
    parseRemarkablesHtml(remarksHtml({ "Snow Base": '6"' }), remarksAdapter),
    null,
  );
  assert.equal(
    parseRemarkablesHtml(remarksHtml({ "Last 24 Hours": "3cm" }), remarksAdapter),
    null,
  );
});

test("remarkables: missing Last Updated stamp -> absent (36h guard needs it)", () => {
  const html = remarksHtml({ "Snow Base": "40cm" }).replace(/Last Updated:[^<]*/g, "");
  assert.equal(parseRemarkablesHtml(html, remarksAdapter), null);
});

test("remarkables timestamp: 24h clock with redundant PM suffix", () => {
  // 16:28 "PM" is already 24h - must NOT become 28:28 or shift.
  const iso = parseRemarkablesTimestamp("Last Updated: Fri 24 Jul 16:28 PM", REMARKS_NOW);
  assert.equal(iso, "2026-07-24T04:28:00.000Z"); // NZST +12
});

test("remarkables timestamp: genuine 12h clock still honours AM/PM", () => {
  assert.equal(
    parseRemarkablesTimestamp("Last Updated: Fri 24 Jul 4:28 PM", REMARKS_NOW),
    "2026-07-24T04:28:00.000Z",
  );
  assert.equal(
    parseRemarkablesTimestamp("Last Updated: Fri 24 Jul 12:05 AM", REMARKS_NOW),
    "2026-07-23T12:05:00.000Z", // midnight NZ
  );
});

test("remarkables timestamp: no-year inference falls back a year when future", () => {
  // Dec stamp seen in July -> must resolve to LAST year's December.
  const iso = parseRemarkablesTimestamp("Last Updated: Mon 14 Dec 9:00 AM", REMARKS_NOW);
  assert.ok(iso);
  assert.equal(iso!.startsWith("2025-12-1"), true);
});

test("remarkables timestamp: garbage -> null", () => {
  assert.equal(parseRemarkablesTimestamp("Last Updated: soon", REMARKS_NOW), null);
});

// ── Cardrona / Treble Cone shared XML ────────────────────────────────────────

const ctcXml = `<?xml version="1.0" encoding="utf-8"?>
<report>
  <date>2026-07-24</date>
  <generated>2026-07-24T20:59:01</generated>
  <skiareas>
    <skiarea>
      <mountainid>cardrona</mountainid>
      <snow><base>40cm</base>
        <snowfall><overnight>0</overnight><twentyfourhours>0</twentyfourhours><sevendays>3</sevendays></snowfall>
      </snow>
    </skiarea>
    <skiarea>
      <mountainid>treblecone</mountainid>
      <snow><base>64cm</base>
        <snowfall><overnight>2</overnight><twentyfourhours>2</twentyfourhours><sevendays>8</sevendays></snowfall>
      </snow>
    </skiarea>
  </skiareas>
</report>`;

const cardronaAdapter: SnowReportAdapter = {
  feedUrl: "https://example.test/snowReportXml",
  humanUrl: "https://cardrona-treblecone.com/snow-report",
  sourceName: "Cardrona",
  parse: makeCardronaParser("cardrona"),
};

test("cardrona: picks its own skiarea block from the shared feed", () => {
  const r = makeCardronaParser("cardrona")(ctcXml, cardronaAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 40);
  assert.equal(r!.baseMinCm, undefined);
  assert.equal(r!.lastSnowfallCm, 0); // a reported 0 is real
  // <generated> is request-time; <date> at 07:00 NZST anchors freshness.
  assert.equal(r!.updatedAt, "2026-07-24T07:00:00+12:00");
});

test("treble cone: same feed, other block", () => {
  const r = makeCardronaParser("treblecone")(ctcXml, cardronaAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 64);
  assert.equal(r!.lastSnowfallCm, 2);
});

test("cardrona: non-cm base string (blank or imperial) -> absent, never 0", () => {
  const blank = ctcXml.replace("<base>40cm</base>", "<base></base>");
  assert.equal(makeCardronaParser("cardrona")(blank, cardronaAdapter), null);
  const imperial = ctcXml.replace("<base>40cm</base>", "<base>16in</base>");
  assert.equal(makeCardronaParser("cardrona")(imperial, cardronaAdapter), null);
  // Other block untouched - treble cone still parses.
  assert.ok(makeCardronaParser("treblecone")(blank, cardronaAdapter));
});

test("cardrona: malformed report date -> absent (guard would be blind)", () => {
  const bad = ctcXml.replace("<date>2026-07-24</date>", "<date>24 July</date>");
  assert.equal(makeCardronaParser("cardrona")(bad, cardronaAdapter), null);
});

test("cardrona: october date gets the NZDT +13 offset", () => {
  const oct = ctcXml.replace("<date>2026-07-24</date>", "<date>2026-10-03</date>");
  const r = makeCardronaParser("cardrona")(oct, cardronaAdapter);
  assert.ok(r);
  assert.equal(r!.updatedAt, "2026-10-03T07:00:00+13:00");
});

test("cardrona: non-XML body -> absent", () => {
  assert.equal(makeCardronaParser("cardrona")("<html>503</html>", cardronaAdapter), null);
});

// ── Whakapapa lit-SSR report page ────────────────────────────────────────────

// Mirrors the real lit-rendered markup: comment nodes between label and value.
const whakaGood = `
<div class="lastUpdated_UNVLm">Last updated: <!--lit-part-->6:50am Fri 24th Jul<!--/lit-part--></div>
<div class="dataCellTitle_1pp0Bo">Snow Base</div>
<!--lit-node 2--><div class="dataCellContent_1pp0Bo"><!--lit-part-->16<!--/lit-part--><!--lit-part-->cm<!--/lit-part--></div>
<div class="dataCellTitle_1pp0Bo">24 hr Snowfall</div>
<div class="dataCellContent_1pp0Bo"><!--lit-part-->0<!--/lit-part--><!--lit-part-->cm<!--/lit-part--></div>
<div class="dataCellTitle_1pp0Bo">Snow Base</div>
<!--lit-node 2--><div class="dataCellContent_1pp0Bo"><!--lit-part-->38<!--/lit-part--><!--lit-part-->cm<!--/lit-part--></div>
<div class="dataCellTitle_1pp0Bo">24 hr Snowfall</div>
<div class="dataCellContent_1pp0Bo"><!--lit-part-->2<!--/lit-part--><!--lit-part-->cm<!--/lit-part--></div>
`;

const whakaAdapter: SnowReportAdapter = {
  feedUrl: "https://example.test/report",
  humanUrl: "https://www.whakapapa.com/report",
  sourceName: "Whakapapa",
  parse: parseWhakapapaHtml,
};

test("whakapapa: two station bases -> sorted range, 24h snowfall = max station", () => {
  const r = parseWhakapapaHtml(whakaGood, whakaAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 38);
  assert.equal(r!.baseMinCm, 16);
  assert.equal(r!.lastSnowfallCm, 2);
  assert.equal(r!.seasonSnowfallCm, null);
});

test("whakapapa: no-year stamp infers current year with NZ offset (+12 in July)", () => {
  const now = Date.parse("2026-07-24T08:00:00Z");
  const iso = parseWhakapapaTimestamp(whakaGood, now);
  // 6:50am NZST 24 Jul = 18:50 UTC 23 Jul.
  assert.equal(iso, "2026-07-23T18:50:00.000Z");
});

test("whakapapa: a december stamp read in january rolls back a year", () => {
  const html = `Last updated: <!--lit-part-->8:00am Mon 28th Dec<!--/lit-part-->`;
  const now = Date.parse("2027-01-02T00:00:00Z");
  const iso = parseWhakapapaTimestamp(html, now);
  // Dec = NZDT +13: 8:00am 28 Dec 2026 = 19:00 UTC 27 Dec 2026.
  assert.equal(iso, "2026-12-27T19:00:00.000Z");
});

test("whakapapa: missing timestamp -> absent report", () => {
  const noStamp = whakaGood.replace(/Last updated:[^\n]*/, "");
  assert.equal(parseWhakapapaHtml(noStamp, whakaAdapter), null);
});

test("whakapapa: no snow base cells -> absent (never 0)", () => {
  const html = `<div class="lastUpdated">Last updated: 6:50am Fri 24th Jul</div>`;
  assert.equal(parseWhakapapaHtml(html, whakaAdapter), null);
});

// ── Turoa Webflow snow report ────────────────────────────────────────────────

// Mirrors the real value-then-label pair markup.
const turoaGood = `
<div class="weather-widget-margin-small"><h5 class="text-size-regular">0cm</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-tiny text-weight-light">Last 24hrs</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-regular">15cm</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-tiny text-weight-light">7 Days</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-regular">90cm</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-tiny text-weight-light">Lower Snow Base</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-regular">65cm</h5></div>
<div class="weather-widget-margin-small"><h5 class="text-size-tiny text-weight-light">Upper Snow Base</h5></div>
<div>Updated on: <span>|</span> 24/7/2026 6:03 AM</div>
`;

const turoaAdapter: SnowReportAdapter = {
  feedUrl: "https://example.test/snow-report",
  humanUrl: "https://www.pureturoa.nz/snow-report",
  sourceName: "Turoa",
  parse: parseTuroaHtml,
};

test("turoa: label-anchored pairs -> sorted range (lower 90 > upper 65 today)", () => {
  const r = parseTuroaHtml(turoaGood, turoaAdapter);
  assert.ok(r);
  assert.equal(r!.baseCm, 90);
  assert.equal(r!.baseMinCm, 65);
  assert.equal(r!.lastSnowfallCm, 0); // a reported 0 surfaces
  // 6:03am NZST 24 Jul = 18:03 UTC 23 Jul (D/M/YYYY - NZ date order).
  assert.equal(r!.updatedAt, "2026-07-23T18:03:00.000Z");
});

test("turoa: D/M/YYYY is parsed as day-first (24/7 is 24 July, not month 24)", () => {
  const iso = parseTuroaTimestamp("Updated on: 24/7/2026 6:03 AM");
  assert.equal(iso, "2026-07-23T18:03:00.000Z");
});

test("turoa: missing Updated-on stamp -> absent report", () => {
  const noStamp = turoaGood.replace("Updated on:", "As at:");
  assert.equal(parseTuroaHtml(noStamp, turoaAdapter), null);
});

test("turoa: no base labels -> absent (24hr figure alone is not a report)", () => {
  const html = `
<div><h5>0cm</h5></div><div><h5>Last 24hrs</h5></div>
<div>Updated on: 24/7/2026 6:03 AM</div>`;
  assert.equal(parseTuroaHtml(html, turoaAdapter), null);
});
