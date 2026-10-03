import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { CJ_ADVERTISER_AIDS } from "../cj";

// The production module uses Vite's BASE_URL; exercise it under Vite rather
// than changing production environment access solely for a Node test.
const vite = await createServer({
  configFile: false, server: { middlewareMode: true }, appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { platformsForCountry, platformDeepLink } = await vite.ssrLoadModule("/src/lib/places.ts") as typeof import("../places");
await vite.close();

test("Expedia AU retirement covers all AU/NZ country and state tags", () => {
  for (const country of ["AU", "AUS", "Australia", "NSW", "VIC", "TAS", "ACT", "NZ", "NZL", "New Zealand"]) {
    assert.ok(!platformsForCountry(country).some(p => p.id === "expedia"), country);
    assert.equal(platformDeepLink("expedia", { query: "Test town", country }), "", country);
    assert.ok(platformsForCountry(country).some(p => p.id === "hotels"), country);
  }
});

test("international direct Expedia and Hotels.com CJ destinations remain intact", () => {
  for (const country of ["JP", "BC", "CO"]) {
    assert.ok(platformsForCountry(country).some(p => p.id === "expedia"));
    assert.equal(new URL(platformDeepLink("expedia", { query: "Test", country })).hostname, "www.expedia.com");
    assert.equal(new URL(platformDeepLink("hotels", { query: "Test", country })).hostname, "www.hotels.com");
  }
  assert.equal(CJ_ADVERTISER_AIDS.hotels?.aid, "11327743");
});

test("all accommodation rendering paths opt Hotels.com and Expedia out of Awin conversion", () => {
  for (const file of [
    "../../pages/town/TownStay.tsx", "../../components/StayPlatformBar.tsx",
    "../../components/StayCard.tsx", "../../components/StayMap.inner.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(source, /data-awinignore=/, file);
  }
});