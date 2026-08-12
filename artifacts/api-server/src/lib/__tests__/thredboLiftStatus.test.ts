// Unit tests for parseThredboLiftXml - the strict parser behind the Thredbo
// live lift feed. Honesty rules under test: entity decoding in names,
// standby -> scheduled mapping, stale-feed rejection, empty-list rejection.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseThredboLiftXml } from "../thredboLiftStatus.js";

const NOW = Date.parse("2026-08-12T10:00:00.000+10:00");
const FRESH = "2026-08-12T09:25:03.000+10:00";

function feedXml(liftsXml: string, updated: string = FRESH): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<liftStatusReport updated="${updated}">
  <area name="Thredbo">
    ${liftsXml}
  </area>
</liftStatusReport>`;
}

test("parses a fresh feed and decodes numeric entities in lift names", () => {
  const result = parseThredboLiftXml(
    feedXml(
      `<lift name="Syd&#039;s Snow Runner" open="true" openingTime="08:30 am" closingTime="04:30 pm" liftType="surface" status="open"/>
       <lift name="Kosciuszko Chairlift" open="true" openingTime="08:30 am" closingTime="04:30 pm" liftType="quad" status="open"/>`,
    ),
    NOW,
  );
  assert.ok(result, "fresh two-lift feed must parse");
  assert.equal(result.updatedAt, FRESH);
  assert.equal(result.lifts.length, 2);
  const syds = result.lifts[0]!;
  assert.equal(syds.name, "Syd's Snow Runner", "numeric entity must decode to an apostrophe");
  assert.equal(syds.type, "magic-carpet", "surface + 'Snow Runner' name reads as a carpet");
  assert.equal(syds.status, "open");
  assert.equal(result.lifts[1]!.type, "chairlift");
  assert.equal(result.lifts[1]!.id, "thredbo-kosciuszko-chairlift");
});

test("maps standby to scheduled, wind wording to wind-hold, unknown words to closed", () => {
  const result = parseThredboLiftXml(
    feedXml(
      `<lift name="Gunbarrel Express" open="false" liftType="quad" status="standby"/>
       <lift name="Basin T-Bar" open="false" liftType="tbar" status="Wind Hold"/>
       <lift name="Cruiser" open="false" liftType="quad" status="mystery-word"/>
       <lift name="Snowgums" open="false" liftType="triple" status=""/>`,
    ),
    NOW,
  );
  assert.ok(result);
  const byName = new Map(result.lifts.map((l) => [l.name, l]));
  assert.equal(byName.get("Gunbarrel Express")!.status, "scheduled", "standby means scheduled, not closed");
  assert.equal(byName.get("Basin T-Bar")!.status, "wind-hold");
  assert.equal(byName.get("Cruiser")!.status, "closed", "unknown status words never invent open");
  assert.equal(byName.get("Snowgums")!.status, "closed");
});

test("open=true is authoritative over the status word", () => {
  const result = parseThredboLiftXml(
    feedXml(`<lift name="Kosciuszko Chairlift" open="true" liftType="quad" status="standby"/>`),
    NOW,
  );
  assert.ok(result);
  assert.equal(result.lifts[0]!.status, "open");
});

test("rejects a stale feed (updated more than 24h ago)", () => {
  const stale = "2026-08-10T09:25:03.000+10:00"; // ~2 days before NOW
  const result = parseThredboLiftXml(
    feedXml(`<lift name="Kosciuszko Chairlift" open="true" liftType="quad" status="open"/>`, stale),
    NOW,
  );
  assert.equal(result, null, "a day-old claim is not live status");
});

test("accepts a feed just inside the 24h freshness window", () => {
  const justInside = new Date(NOW - 23 * 3600_000).toISOString();
  const result = parseThredboLiftXml(
    feedXml(`<lift name="Kosciuszko Chairlift" open="true" liftType="quad" status="open"/>`, justInside),
    NOW,
  );
  assert.ok(result, "23h-old feed is still within the freshness guard");
});

test("rejects an empty lift list - parse failure, not 'all lifts removed'", () => {
  assert.equal(parseThredboLiftXml(feedXml(""), NOW), null);
});

test("rejects rows without a usable open flag; drops only the bad rows when others are valid", () => {
  // All rows invalid -> null (empty-list rejection path).
  assert.equal(
    parseThredboLiftXml(
      feedXml(`<lift name="Kosciuszko Chairlift" open="maybe" status="open"/>
               <lift name="" open="true" status="open"/>`),
      NOW,
    ),
    null,
  );
  // One valid row among invalid ones -> keep just the valid row.
  const mixed = parseThredboLiftXml(
    feedXml(`<lift name="Kosciuszko Chairlift" open="maybe" status="open"/>
             <lift name="Cruiser" open="true" liftType="quad" status="open"/>`),
    NOW,
  );
  assert.ok(mixed);
  assert.equal(mixed.lifts.length, 1);
  assert.equal(mixed.lifts[0]!.name, "Cruiser");
});

test("rejects missing/unparseable updated stamp and non-XML garbage", () => {
  assert.equal(
    parseThredboLiftXml(
      `<liftStatusReport><area name="Thredbo"><lift name="A" open="true"/></area></liftStatusReport>`,
      NOW,
    ),
    null,
    "no updated attribute -> null",
  );
  assert.equal(
    parseThredboLiftXml(feedXml(`<lift name="A" open="true"/>`, "not-a-date"), NOW),
    null,
    "unparseable updated -> null",
  );
  assert.equal(parseThredboLiftXml("<html>502 Bad Gateway</html>", NOW), null);
  assert.equal(parseThredboLiftXml("", NOW), null);
});

test("deduplicates colliding slugs across repeated names", () => {
  const result = parseThredboLiftXml(
    feedXml(`<lift name="Merritts Gondola" open="true" liftType="gondola" status="open"/>
             <lift name="Merritts Gondola" open="false" liftType="gondola" status="closed"/>`),
    NOW,
  );
  assert.ok(result);
  assert.equal(result.lifts.length, 2);
  assert.notEqual(result.lifts[0]!.id, result.lifts[1]!.id);
});
