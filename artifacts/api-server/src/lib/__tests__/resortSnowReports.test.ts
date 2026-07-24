import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseFallsCreekJson,
  parseHothamHtml,
  parseHothamTimestamp,
  makeSnowyHydroCourseParser,
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
