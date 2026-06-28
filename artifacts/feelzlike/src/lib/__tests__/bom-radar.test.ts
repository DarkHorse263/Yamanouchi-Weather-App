/**
 * BOM radar catalogue + nearest-radar lookup tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:bomRadar
 *
 * Pattern: tsx --test + node:assert (matches regionProximity / tripPlanner).
 * Guards the /near-you "official radar" override: every Australian capital must
 * resolve to its real local BOM radar product, remote/overseas coords must
 * resolve to null (so the caller falls back to the global interactive radar),
 * and every emitted product (imageUrl / href / attribution) must agree and
 * reference a radar that exists in the catalogue.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOM_RADARS,
  RANGE_KM,
  nearestBomRadar,
  type OfficialRadarSource,
} from "../bom-radar";

function productOf(src: OfficialRadarSource): string {
  const m = src.imageUrl?.match(/IDR\d+/);
  assert.ok(m, `imageUrl should contain an IDR product: ${src.imageUrl}`);
  return m![0];
}

// [name, lat, lng, expected radar id prefix (IDR<id>), expected label substring]
const COVERED: Array<[string, number, number, string, string]> = [
  ["Sydney", -33.8688, 151.2093, "IDR71", "Sydney"],
  ["Melbourne", -37.8136, 144.9631, "IDR02", "Melbourne"],
  ["Perth", -31.9523, 115.8613, "IDR26", "Perth"],
  ["Brisbane", -27.4698, 153.0251, "IDR66", "Brisbane"],
  ["Adelaide", -34.9285, 138.6007, "IDR64", "Adelaide"],
  ["Darwin", -12.4634, 130.8456, "IDR63", "Darwin"],
  ["Hobart", -42.8821, 147.3272, "IDR76", "Hobart"],
  ["Canberra", -35.2809, 149.13, "IDR40", "Canberra"],
  ["Cairns", -16.9203, 145.771, "IDR19", "Cairns"],
];

test("each capital resolves to its real local BOM radar", () => {
  for (const [name, lat, lng, idPrefix, labelPart] of COVERED) {
    const r = nearestBomRadar(lat, lng);
    assert.ok(r, `${name} should be covered`);
    assert.ok(
      r!.imageUrl!.startsWith(`https://www.bom.gov.au/radar/${idPrefix}`),
      `${name} -> expected ${idPrefix}, got ${r!.imageUrl}`,
    );
    assert.ok(r!.label.includes(labelPart), `${name} label: ${r!.label}`);
  }
});

test("Sydney picks the sharp 64 km product and reports distance", () => {
  const r = nearestBomRadar(-33.8688, 151.2093);
  assert.ok(r);
  assert.equal(productOf(r!), "IDR714"); // Terrey Hills, range 4 = 64 km
  assert.equal(r!.imageUrl, "https://www.bom.gov.au/radar/IDR714.gif");
  assert.equal(r!.href, "https://www.bom.gov.au/products/IDR714.loop.shtml");
  assert.match(
    r!.attribution,
    /^Bureau of Meteorology · IDR714 · 64 km · \d+ km away$/,
  );
});

test("Launceston is covered by a wider-range Tasmanian radar", () => {
  // West Takone (NW Tas) publishes no gif, so Launceston honestly falls back to
  // the Hobart Airport 256 km product · still a real, covering radar.
  const r = nearestBomRadar(-41.4332, 147.1441);
  assert.ok(r, "Launceston should be covered");
  assert.match(r!.attribution, /· 256 km · /);
});

test("Alice Springs has its own radar (covered, not null)", () => {
  const r = nearestBomRadar(-23.698, 133.8807);
  assert.ok(r, "Alice Springs has a real BOM radar");
  assert.equal(productOf(r!).slice(0, 5), "IDR25");
});

test("remote inland Australia with no radar in range returns null", () => {
  // Birdsville sits >460 km (512 km * 0.9) from every catalogued radar.
  assert.equal(nearestBomRadar(-25.8975, 139.352), null);
});

test("overseas and open-ocean coords return null", () => {
  assert.equal(nearestBomRadar(35.6762, 139.6503), null); // Tokyo
  assert.equal(nearestBomRadar(51.5074, -0.1278), null); // London
  assert.equal(nearestBomRadar(-55.0, 158.0), null); // Southern Ocean
});

test("emitted product is internally consistent and exists in the catalogue", () => {
  const samples: Array<[number, number]> = [
    [-33.8688, 151.2093],
    [-37.8136, 144.9631],
    [-31.9523, 115.8613],
    [-42.8821, 147.3272],
    [-19.2589, 146.8169], // Townsville (falls back to Bowen)
  ];
  for (const [lat, lng] of samples) {
    const r = nearestBomRadar(lat, lng);
    assert.ok(r);
    const fromImg = r!.imageUrl!.match(/IDR(\d+)\.gif$/);
    const fromHref = r!.href.match(/IDR(\d+)\.loop\.shtml$/);
    const fromAttr = r!.attribution.match(/IDR(\d+)/);
    assert.ok(fromImg && fromHref && fromAttr);
    assert.equal(fromImg![1], fromHref![1]);
    assert.equal(fromImg![1], fromAttr![1]);
    const id = fromImg![1].slice(0, 2);
    const range = Number(fromImg![1].slice(2));
    const radar = BOM_RADARS.find((x) => x.id === id);
    assert.ok(radar, `product references unknown radar id ${id}`);
    assert.ok(radar!.ranges.includes(range), `range ${range} not published for ${id}`);
  }
});

test("catalogue integrity: unique ids, valid ranges, plausible AU coords", () => {
  const ids = new Set<string>();
  for (const radar of BOM_RADARS) {
    assert.equal(radar.id.length, 2, `id should be 2 chars: ${radar.id}`);
    assert.ok(!ids.has(radar.id), `duplicate id ${radar.id}`);
    ids.add(radar.id);
    assert.ok(radar.ranges.length > 0, `${radar.id} has no ranges`);
    for (const range of radar.ranges) {
      assert.ok(RANGE_KM[range] != null, `${radar.id} bad range ${range}`);
    }
    // Coords sit within a generous Australasian box (incl. Norfolk Island).
    assert.ok(radar.lat < -10 && radar.lat > -45, `${radar.id} lat ${radar.lat}`);
    assert.ok(radar.lon > 110 && radar.lon < 170, `${radar.id} lon ${radar.lon}`);
  }
  assert.equal(BOM_RADARS.length, 58);
});
