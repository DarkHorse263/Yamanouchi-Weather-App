import { test } from "node:test";
import assert from "node:assert/strict";
import { selectSnowObservation, type Station, type RawObs } from "../amedas.js";

// Synthetic winter-shaped AMeDAS map fixtures. JMA only publishes snow keys
// while the snow network runs (Nov-May) and does not retain archived maps, so
// out of season this pure selection function can ONLY be verified against
// fixtures shaped like the documented winter payload:
//   "snow": [depthCm, flag], "snow24h": [cm, flag], ...
// Anchor point: Nozawa Onsen village (36.92N, 138.44E, ~600m).

const NOZAWA = { lat: 36.92, lon: 138.44 };

function st(id: string, lat: number, lon: number, alt: number | null, name?: string): Station {
  return { id, lat, lon, alt, name: name ?? id };
}

test("picks the nearest station reporting a snow depth", () => {
  const stations = [
    st("close", 36.93, 138.45, 600, "Nozawa"),
    st("far", 36.7, 138.2, 610, "Nagano"),
  ];
  const obs: Record<string, RawObs> = {
    close: { snow: [55, 0], snow24h: [12, 0], temp: [-3.1, 0] },
    far: { snow: [20, 0], snow24h: [3, 0] },
  };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA, refElevationM: 600 });
  assert.ok(r);
  assert.equal(r!.stationName, "Nozawa");
  assert.equal(r!.depthCm, 55);
  assert.equal(r!.snowfall24hCm, 12);
  assert.equal(r!.stationElevationM, 600);
  assert.ok(r!.distanceKm < 2);
});

test("out-of-season map (no snow keys anywhere) -> null, never 0", () => {
  const stations = [st("close", 36.93, 138.45, 600)];
  const obs: Record<string, RawObs> = {
    close: { temp: [22.4, 0], precipitation1h: [0.0, 0] }, // July-shaped
  };
  assert.equal(selectSnowObservation({ stations, obs, ...NOZAWA }), null);
});

test("a reported 0cm depth is a real reading and surfaces as 0", () => {
  const stations = [st("close", 36.93, 138.45, 600)];
  const obs: Record<string, RawObs> = { close: { snow: [0, 0] } };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA });
  assert.ok(r);
  assert.equal(r!.depthCm, 0);
  assert.equal(r!.snowfall24hCm, null); // missing 24h key stays unknown
});

test("negative depth (sensor glitch) disqualifies the station", () => {
  const stations = [
    st("glitchy", 36.93, 138.45, 600),
    st("good", 36.95, 138.47, 620, "Backup"),
  ];
  const obs: Record<string, RawObs> = {
    glitchy: { snow: [-1, 2] },
    good: { snow: [40, 0] },
  };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA });
  assert.ok(r);
  assert.equal(r!.stationName, "Backup");
});

test("negative snow24h is dropped but the depth still reports", () => {
  const stations = [st("close", 36.93, 138.45, 600)];
  const obs: Record<string, RawObs> = { close: { snow: [33, 0], snow24h: [-5, 2] } };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA });
  assert.ok(r);
  assert.equal(r!.depthCm, 33);
  assert.equal(r!.snowfall24hCm, null);
});

test("elevation penalty: similar-altitude sensor beats a closer valley one", () => {
  // Ref elevation 1000m. Valley station 5km away at 100m (penalty 45 -> score
  // ~50) loses to a 15km station at 950m (penalty 2.5 -> score ~17.5). This is
  // the same rule that fixed "sunny while raining" for precip.
  const stations = [
    st("valley", 36.965, 138.44, 100, "Valley"),
    st("ridge", 36.92, 138.608, 950, "Ridge"),
  ];
  const obs: Record<string, RawObs> = {
    valley: { snow: [5, 0] },
    ridge: { snow: [120, 0] },
  };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA, refElevationM: 1000 });
  assert.ok(r);
  assert.equal(r!.stationName, "Ridge");
  assert.equal(r!.depthCm, 120);
});

test("without a ref elevation, plain distance wins", () => {
  const stations = [
    st("valley", 36.965, 138.44, 100, "Valley"),
    st("ridge", 36.92, 138.608, 950, "Ridge"),
  ];
  const obs: Record<string, RawObs> = {
    valley: { snow: [5, 0] },
    ridge: { snow: [120, 0] },
  };
  const r = selectSnowObservation({ stations, obs, ...NOZAWA });
  assert.ok(r);
  assert.equal(r!.stationName, "Valley");
});

test("stations beyond 25km never qualify", () => {
  const stations = [st("far", 37.2, 138.9, 600)]; // ~50km away
  const obs: Record<string, RawObs> = { far: { snow: [80, 0] } };
  assert.equal(selectSnowObservation({ stations, obs, ...NOZAWA }), null);
});
