import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { publicProjection, validateCatalogue, validateRecord } from "../lifecycle.js";

const complete = {
  recordId: "test-area",
  lifecycle: "published",
  lifecycleHistory: ["draft", "verified", "published"],
  classification: "verified_operating",
  country: "Test Country",
  countryCode: "TC",
  timezone: "America/Denver",
  identity: { publicId: "test-area", name: "Test Area", aliases: [] },
  coordinates: { lat: 40, lng: -105 },
  elevations: { forecastM: 2500, baseM: 2200, topM: 2800 },
  locality: {
    regionId: "test-state",
    regionName: "Test State",
    stateOrProvince: "Test State",
    localityId: "test-town",
    localityName: "Test Town",
  },
  officialUrl: "https://example.test/",
  evidenceSchemaVersion: 2,
  evidence: [{
    url: "https://example.test/facts",
    retrievedAt: "2026-01-01",
    fields: [
      { field: "identity", value: { publicId: "test-area", name: "Test Area", aliases: [] }, citation: "Official identity." },
      { field: "status", value: "verified_operating", citation: "Official current operation." },
      { field: "officialUrl", value: "https://example.test/", citation: "Official URL." },
      { field: "locality", value: { regionId: "test-state", regionName: "Test State", stateOrProvince: "Test State", localityId: "test-town", localityName: "Test Town" }, citation: "Official locality." },
    ],
  }, {
    url: "https://www.openstreetmap.org/?mlat=40&mlon=-105#map=16/40/-105",
    retrievedAt: "2026-01-01",
    fields: [{ field: "coordinates", value: { lat: 40, lng: -105 }, citation: "Exact marker." }],
  }, {
    url: "https://epqs.nationalmap.gov/v1/json?x=-105&y=40&units=Meters&wkid=4326",
    retrievedAt: "2026-01-01",
    fields: [{ field: "forecastElevation", value: 2500, citation: "EPQS value." }],
  }],
};

test("accepts the draft to verified to published lifecycle", () => {
  assert.deepEqual(validateRecord(complete), []);
  assert.deepEqual(validateRecord({
    ...complete,
    lifecycle: "verified",
    lifecycleHistory: ["draft", "verified"],
  }), []);
});

test("rejects lifecycle skips and incomplete publication", () => {
  const record = structuredClone(complete);
  record.lifecycleHistory = ["draft", "published"];
  record.classification = "unverified";
  record.officialUrl = "";
  record.evidence[0].fields = record.evidence[0].fields.slice(0, 1);
  const errors = validateRecord(record).join("\n");
  assert.match(errors, /draft -> verified -> published/);
  assert.match(errors, /verified_operating/);
  assert.match(errors, /officialUrl/);
  assert.match(errors, /evidence does not support status/);
});

test("public projection omits lifecycle and evidence internals", () => {
  const projection = publicProjection(complete);
  assert.equal(projection.route, "/test-state/mountain/test-area");
  assert.equal("evidence" in projection, false);
  assert.equal("classification" in projection, false);
  assert.equal("lifecycleHistory" in projection, false);
});

test("combined batches cannot publish duplicate identities or routes", () => {
  const duplicate = structuredClone(complete);
  duplicate.recordId = "other-source-row";
  const errors = validateCatalogue([complete, duplicate]).join("\n");
  assert.match(errors, /duplicate published publicId/);
  assert.match(errors, /duplicate published route/);
});

test("candidate ledger is a complete one-to-one-or-split reconciliation", async () => {
  const ledger = JSON.parse(await readFile(new URL("../data/candidate-universe.json", import.meta.url), "utf8"));
  assert.equal(ledger.candidates.length, ledger.expectedCounts.candidates);
  const seenRecords = new Set();
  for (const candidate of ledger.candidates) {
    assert.ok(candidate.recordIds.length > 0);
    assert.ok(["one_to_one", "split"].includes(candidate.handling));
    if (candidate.handling === "one_to_one") assert.equal(candidate.recordIds.length, 1);
    for (const recordId of candidate.recordIds) {
      assert.ok(!seenRecords.has(recordId), `${recordId} maps from multiple candidates`);
      seenRecords.add(recordId);
    }
  }
  assert.equal(seenRecords.size, ledger.expectedCounts.records);
});

test("source ledger records the named PDF splits and closed Sky Valley candidate", async () => {
  const ledger = JSON.parse(await readFile(new URL("../data/candidate-universe.json", import.meta.url), "utf8"));
  const hickory = ledger.candidates.find((candidate) => candidate.sourceCandidateId === "Hickory Hills / Mt. Holiday");
  assert.deepEqual(hickory?.recordIds, ["hickory-hills", "mount-holiday"]);
  assert.equal(hickory?.handling, "split");
  const jackFrost = ledger.candidates.find((candidate) => candidate.sourceCandidateId === "Jack Frost Big Boulder");
  assert.deepEqual(jackFrost?.recordIds, ["jack-frost-pa", "big-boulder-pa"]);
  assert.equal(jackFrost?.handling, "split");
  const skyValley = ledger.candidates.find((candidate) => candidate.sourceCandidateId === "Sky Valley");
  assert.deepEqual(skyValley?.recordIds, ["sky-valley-ski-resort"]);
  assert.equal(skyValley?.classification, "closed");
  assert.equal(skyValley?.lifecycle, "draft");
  assert.deepEqual(
    {
      candidates: ledger.expectedCounts.candidates,
      records: ledger.expectedCounts.records,
      oneToOne: ledger.expectedCounts.oneToOne,
      splits: ledger.expectedCounts.splits,
    },
    { candidates: 174, records: 176, oneToOne: 172, splits: 2 },
  );
});

test("questionable US operating and identity claims stay honestly classified", async () => {
  const batchDirectory = new URL("../data/batches/", import.meta.url);
  const [miNy, paWiMn] = await Promise.all([
    readFile(new URL("mi-ny.json", batchDirectory), "utf8").then(JSON.parse),
    readFile(new URL("pa-wi-mn.json", batchDirectory), "utf8").then(JSON.parse),
  ]);
  const records = new Map([...miNy.records, ...paWiMn.records].map((record) => [record.recordId, record]));

  assert.equal(records.get("norway-mountain")?.lifecycle, "published");
  assert.equal(records.get("norway-mountain")?.classification, "verified_operating");
  assert.equal(records.get("holimont")?.lifecycle, "verified");
  assert.equal(records.get("holimont")?.classification, "private_restricted");
  assert.equal(records.get("toggenburg-mountain")?.lifecycle, "draft");
  assert.equal(records.get("toggenburg-mountain")?.classification, "closed");
  assert.equal(records.get("ski-denton-pa")?.lifecycle, "draft");
  assert.equal(records.get("ski-denton-pa")?.classification, "uncertain");
  assert.equal(records.get("big-tupper")?.lifecycle, "draft");
  assert.equal(records.get("big-tupper")?.classification, "closed");
  assert.equal(records.get("sugar-loaf-mi")?.lifecycle, "draft");
  assert.equal(records.get("sugar-loaf-mi")?.classification, "closed");

  const mountPleasant = records.get("mountain-view-at-edinboro-pa");
  assert.equal(mountPleasant?.identity.publicId, "mount-pleasant-of-edinboro");
  assert.deepEqual(mountPleasant?.identity.aliases, ["Mountain View at Edinboro", "Mount Pleasant"]);
  assert.equal(mountPleasant?.lifecycle, "published");
  assert.equal(mountPleasant?.classification, "verified_operating");

  const hickory = records.get("hickory-hills");
  const holiday = records.get("mount-holiday");
  assert.notEqual(hickory?.identity.publicId, holiday?.identity.publicId);
  assert.equal(hickory?.identity.aliases.includes("Hickory Hills / Mt. Holiday PDF candidate"), false);
  assert.equal(holiday?.identity.aliases.includes("Hickory Hills / Mt. Holiday PDF candidate"), false);
});

test("ledger classification and lifecycle mirror every mapped record", async () => {
  const ledger = JSON.parse(await readFile(new URL("../data/candidate-universe.json", import.meta.url), "utf8"));
  const batchDirectory = new URL("../data/batches/", import.meta.url);
  const batchFiles = (await readdir(batchDirectory)).filter((file) => file.endsWith(".json"));
  const batches = await Promise.all(batchFiles.map((file) => (
    readFile(new URL(file, batchDirectory), "utf8").then(JSON.parse)
  )));
  const records = new Map(batches.flatMap((batch) => batch.records).map((record) => [record.recordId, record]));
  for (const candidate of ledger.candidates) {
    for (const recordId of candidate.recordIds) {
      const record = records.get(recordId);
      assert.ok(record, `${candidate.candidateId} maps unknown ${recordId}`);
      assert.equal(candidate.classification, record.classification, `${candidate.candidateId} classification`);
      assert.equal(candidate.lifecycle, record.lifecycle, `${candidate.candidateId} lifecycle`);
    }
  }
});

test("New Zealand evidence table publishes only the directed facilities", async () => {
  const batch = JSON.parse(await readFile(new URL("../data/batches/new-zealand-148.json", import.meta.url), "utf8"));
  const published = batch.records.filter((record) => record.lifecycle === "published");
  assert.equal(published.length, 17);
  assert.equal(published.filter((record) => record.facilityType === "indoor").length, 1);
  assert.equal(published.filter((record) => record.facilityType === "nordic").length, 1);
  const snowplanet = published.find((record) => record.identity.publicId === "snowplanet");
  assert.equal(snowplanet.weatherEligible, false);
  assert.equal(snowplanet.alertEligible, false);
  for (const record of published) {
    assert.ok(record.accessModel);
    assert.ok(record.publicCopy);
    assert.ok(record.evidenceTable?.officialUrl);
    assert.ok(record.evidenceTable?.coordinatesUrl);
    assert.equal(record.evidenceTable?.retrievedAt, "2026-08-29");
    for (const field of ["identity", "status", "coordinates", "forecastElevation", "locality", "officialUrl"]) {
      assert.ok(record.evidenceTable?.fieldCitations?.[field], `${record.recordId} lacks ${field} evidence`);
      assert.ok(record.evidenceTable.fieldCitations[field].url, `${record.recordId} ${field} lacks a source URL`);
    }
    assert.match(record.evidenceTable.fieldCitations.status.citation, new RegExp(record.identity.name.split(" ")[0], "i"));
    assert.match(record.evidenceTable.fieldCitations.forecastElevation.citation, new RegExp(String(record.elevations.baseM)));
    assert.match(record.evidenceTable.fieldCitations.forecastElevation.citation, new RegExp(String(record.elevations.topM)));
    const normalizeEvidenceText = (value) => value
      .normalize("NFD")
      .replace(/[\u0300-\u036f'’]/g, "");
    assert.match(
      normalizeEvidenceText(record.evidenceTable.fieldCitations.locality.citation),
      new RegExp(normalizeEvidenceText(record.locality.localityName.split(" ")[0]), "i"),
    );
  }
  const excluded = new Map(batch.records
    .filter((record) => record.lifecycle !== "published")
    .map((record) => [record.identity.publicId, record.classification]));
  assert.equal(excluded.get("hanmer-springs"), "gateway_town");
  assert.equal(excluded.get("invincible-snowfields"), "heli_only");
  assert.equal(excluded.get("mt-robert"), "no_lift_field");
  assert.equal(excluded.get("snow-park-nz"), "closed");
  assert.equal(excluded.get("mt-potts-erewhon"), "excluded_backcountry");
  for (const record of batch.records.filter((candidate) => candidate.lifecycle !== "published")) {
    assert.ok(record.evidenceTable.fieldCitations.status.citation.length > 55);
    assert.ok(record.evidenceTable.fieldCitations.locality.citation.length > 55);
  }
});

test("New Zealand publication rejects evidence tables without each field citation", async () => {
  const batch = JSON.parse(await readFile(new URL("../data/batches/new-zealand-148.json", import.meta.url), "utf8"));
  const record = structuredClone(batch.records.find((candidate) => candidate.lifecycle === "published"));
  delete record.evidenceTable.fieldCitations.coordinates;
  const errors = validateRecord(record).join("\n");
  assert.match(errors, /lacks coordinates citation/);
});

test("New Zealand publication rejects boilerplate status, elevation, and locality evidence", async () => {
  const batch = JSON.parse(await readFile(new URL("../data/batches/new-zealand-148.json", import.meta.url), "utf8"));
  const record = structuredClone(batch.records.find((candidate) => candidate.lifecycle === "published"));
  record.evidenceTable.fieldCitations.status.citation =
    "Official operator page publishes the current facility and visitor operation information.";
  record.evidenceTable.fieldCitations.forecastElevation.citation =
    "Official operator access, trail or mountain information supports the stated forecast elevation band.";
  record.evidenceTable.fieldCitations.locality.citation =
    "Official operator page identifies this practical gateway locality for access.";
  const errors = validateRecord(record).join("\n");
  assert.match(errors, /status citation is boilerplate/);
  assert.match(errors, /forecastElevation citation is boilerplate/);
  assert.match(errors, /locality citation is boilerplate/);
});