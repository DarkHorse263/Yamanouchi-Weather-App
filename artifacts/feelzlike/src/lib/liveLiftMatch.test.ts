import test from "node:test";
import assert from "node:assert/strict";
import { normaliseLiftName, matchLiveLiftsToSeeds, type LiveLiftRow } from "./liveLiftMatch";

// Thredbo seed names (data/lifts.ts) - inlined so this test never imports the
// catalogue (see memory: tsx test isolation vs @/regions PNG assets).
const SEEDS = [
  { id: "kosciuszko-express", name: "Kosciuszko Express" },
  { id: "merritts-gondola", name: "Merritts Gondola" },
  { id: "snowgums-chair", name: "Snowgums Chair" },
  { id: "cruiser", name: "Cruiser" },
  { id: "karels-tbar", name: "Karels T-Bar" },
  { id: "antons-tbar", name: "Antons T-Bar" },
  { id: "easy-does-it", name: "Easy Does It" },
  { id: "friday-flat", name: "Friday Flat" },
  { id: "gunbarrel-chair", name: "Gunbarrel Express" },
  { id: "basin-tbar", name: "Basin T-Bar" },
  { id: "sponars-tbar", name: "Sponars T-Bar" },
  { id: "easy-rider-tbar", name: "Easy Rider T-Bar" },
];

// Real feed names captured from Thredbo's live XML (Aug 2026).
const FEED: LiveLiftRow[] = [
  { id: "thredbo-easy-does-it-chairlift", name: "Easy Does It Chairlift", status: "open" },
  { id: "thredbo-merritts-gondola-scenic", name: "Merritts Gondola (Scenic)", status: "open" },
  { id: "thredbo-wombats-snow-runner", name: "Wombats Snow Runner", status: "closed" },
  { id: "thredbo-kosciuszko-chairlift", name: "Kosciuszko Chairlift", status: "open" },
  { id: "thredbo-merritts-gondola", name: "Merritts Gondola", status: "open" },
  { id: "thredbo-gunbarrel-chairlift", name: "Gunbarrel Chairlift", status: "open" },
  { id: "thredbo-cruiser-chairlift", name: "Cruiser Chairlift", status: "closed" },
  { id: "thredbo-snowgums-chairlift", name: "Snowgums Chairlift", status: "open" },
  { id: "thredbo-karels-t-bar", name: "Karels T-Bar", status: "scheduled" },
  { id: "thredbo-basin-t-bar", name: "Basin T-Bar", status: "open" },
  { id: "thredbo-antons-t-bar", name: "Antons T-Bar", status: "open" },
  { id: "thredbo-easy-rider-t-bar", name: "Easy Rider T-Bar", status: "open" },
  { id: "thredbo-sponars-t-bar", name: "Sponars T-Bar", status: "open" },
  { id: "thredbo-the-burrow-snow-runner", name: "The Burrow Snow Runner", status: "open" },
  { id: "thredbo-syds-snow-runner", name: "Syd's Snow Runner", status: "open" },
  { id: "thredbo-friday-flat-chairlift", name: "Friday Flat Chairlift", status: "wind-hold" },
];

test("normalisation strips marketing suffixes but keeps qualifiers", () => {
  assert.equal(normaliseLiftName("Kosciuszko Chairlift"), "kosciuszko");
  assert.equal(normaliseLiftName("Kosciuszko Express"), "kosciuszko");
  assert.equal(normaliseLiftName("Snowgums Chair"), normaliseLiftName("Snowgums Chairlift"));
  assert.equal(normaliseLiftName("Karel's T-Bar"), normaliseLiftName("Karels T-Bar"));
  // Parenthetical qualifier must stay distinct from the base name.
  assert.notEqual(normaliseLiftName("Merritts Gondola (Scenic)"), normaliseLiftName("Merritts Gondola"));
  // Never reduce a name to nothing.
  assert.equal(normaliseLiftName("Chairlift"), "chairlift");
});

test("every Thredbo seed matches its real feed row", () => {
  const { liveBySeedId, unmatchedLive } = matchLiveLiftsToSeeds(SEEDS, FEED);
  assert.equal(liveBySeedId["kosciuszko-express"]?.name, "Kosciuszko Chairlift");
  assert.equal(liveBySeedId["merritts-gondola"]?.name, "Merritts Gondola");
  assert.equal(liveBySeedId["snowgums-chair"]?.name, "Snowgums Chairlift");
  assert.equal(liveBySeedId["cruiser"]?.status, "closed");
  assert.equal(liveBySeedId["karels-tbar"]?.status, "scheduled");
  assert.equal(liveBySeedId["antons-tbar"]?.status, "open");
  assert.equal(liveBySeedId["easy-does-it"]?.name, "Easy Does It Chairlift");
  assert.equal(liveBySeedId["friday-flat"]?.name, "Friday Flat Chairlift");
  assert.equal(liveBySeedId["gunbarrel-chair"]?.name, "Gunbarrel Chairlift");
  assert.equal(liveBySeedId["basin-tbar"]?.name, "Basin T-Bar");
  assert.equal(liveBySeedId["sponars-tbar"]?.name, "Sponars T-Bar");
  assert.equal(liveBySeedId["easy-rider-tbar"]?.name, "Easy Rider T-Bar");
  assert.equal(Object.keys(liveBySeedId).length, SEEDS.length);
  // Appendix is now carpets + the scenic Merritts duplicate only.
  const names = unmatchedLive.map((r) => r.name).sort();
  assert.deepEqual(names, [
    "Merritts Gondola (Scenic)",
    "Syd's Snow Runner",
    "The Burrow Snow Runner",
    "Wombats Snow Runner",
  ]);
});

test("ambiguous duplicate feed names match nothing", () => {
  const dupFeed: LiveLiftRow[] = [
    { id: "a", name: "Cruiser Chairlift", status: "open" },
    { id: "b", name: "Cruiser Quad", status: "closed" },
  ];
  const { liveBySeedId, unmatchedLive } = matchLiveLiftsToSeeds(SEEDS, dupFeed);
  assert.equal(liveBySeedId["cruiser"], undefined);
  assert.equal(unmatchedLive.length, 2);
});

test("a seed missing from the feed is simply unmatched", () => {
  const { liveBySeedId } = matchLiveLiftsToSeeds(SEEDS, FEED.slice(0, 3));
  assert.equal(liveBySeedId["kosciuszko-express"], undefined);
  assert.equal(liveBySeedId["easy-does-it"]?.name, "Easy Does It Chairlift");
});
