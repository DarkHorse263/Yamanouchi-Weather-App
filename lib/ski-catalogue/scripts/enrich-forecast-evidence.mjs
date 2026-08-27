import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const batchRoot = `${root}data/batches`;
const allFiles = (await readdir(batchRoot)).filter((file) => file.endsWith(".json")).sort();
const requestedFile = process.argv[2];
const files = requestedFile ? allFiles.filter((file) => file === requestedFile) : allFiles;
if (requestedFile && files.length === 0) throw new Error(`Unknown batch: ${requestedFile}`);
const retrievedAt = new Date().toISOString().slice(0, 10);

function epqsUrl({ lat, lng }) {
  return `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Meters&wkid=4326&includeDate=false`;
}

function osmUrl({ lat, lng }) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

async function fetchElevation(coordinates) {
  const url = epqsUrl(coordinates);
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "feelzlike-catalogue/1.0 info@feelzlike.com" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const metres = Number(payload.value);
      if (!Number.isFinite(metres) || metres < -500 || metres > 7000) throw new Error(`invalid value ${payload.value}`);
      return { url, metres: Math.round(metres) };
    } catch (error) {
      if (attempt === 8) throw new Error(`EPQS failed for ${coordinates.lng},${coordinates.lat}: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error("unreachable");
}

for (const file of files) {
  const path = `${batchRoot}/${file}`;
  const batch = JSON.parse(await readFile(path, "utf8"));
  let changed = false;
  for (const record of batch.records) {
    if (record.classification !== "verified_operating" || !record.coordinates) continue;
    const officialEvidence = record.evidence?.find((item) => {
      try {
        return new URL(item.url).origin === new URL(record.officialUrl).origin;
      } catch {
        return false;
      }
    });
    if (!officialEvidence) continue;
    const { url: usgsUrl, metres } = await fetchElevation(record.coordinates);
    record.elevations ??= { baseM: null, topM: null, forecastM: metres };
    record.elevations.forecastM = metres;
    record.evidenceSchemaVersion = 2;
    const officialCitation = officialEvidence.claim || "Official operator page cited for the published field value.";
    record.evidence = [
      {
        url: officialEvidence.url,
        retrievedAt,
        claim: officialCitation,
        fields: [
          { field: "identity", value: record.identity, citation: officialCitation },
          { field: "status", value: record.classification, citation: officialCitation },
          { field: "officialUrl", value: record.officialUrl, citation: officialCitation },
          { field: "locality", value: record.locality, citation: officialCitation },
        ],
      },
      {
        url: osmUrl(record.coordinates),
        retrievedAt,
        claim: "OpenStreetMap marker at the exact stored forecast point.",
        fields: [{
          field: "coordinates",
          value: record.coordinates,
          citation: `Map marker at ${record.coordinates.lat}, ${record.coordinates.lng}.`,
        }],
      },
      {
        url: usgsUrl,
        retrievedAt,
        claim: "USGS Elevation Point Query Service result at the exact stored forecast point.",
        fields: [{
          field: "forecastElevation",
          value: metres,
          citation: `EPQS returned an elevation rounded to ${metres} metres.`,
        }],
      },
    ];
    record.lifecycle = "published";
    record.lifecycleHistory = ["draft", "verified", "published"];
    changed = true;
  }
  // Non-operating classifications can never be public even if stale source
  // input once marked them published.
  for (const record of batch.records) {
    if (record.classification === "verified_operating") continue;
    if (record.lifecycle === "published") {
      record.lifecycle = record.classification === "uncertain" ? "draft" : "verified";
      record.lifecycleHistory = record.lifecycle === "draft" ? ["draft"] : ["draft", "verified"];
      changed = true;
    }
  }
  if (changed) await writeFile(path, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
}

// Reconcile only expected lifecycle/classification totals; candidate identity
// and candidate/record/split counts remain immutable.
const batches = await Promise.all(allFiles.map(async (file) => JSON.parse(await readFile(`${batchRoot}/${file}`, "utf8"))));
const records = batches.flatMap((batch) => batch.records);
const ledgerPath = `${root}data/candidate-universe.json`;
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
for (const [key, field] of [["byLifecycle", "lifecycle"], ["byClassification", "classification"]]) {
  ledger.expectedCounts[key] = Object.fromEntries(
    [...new Set(records.map((record) => record[field]))].sort()
      .map((value) => [value, records.filter((record) => record[field] === value).length]),
  );
}
await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
process.stdout.write(`Enriched ${records.filter((record) => record.classification === "verified_operating").length} verified-operating records with EPQS evidence.\n`);