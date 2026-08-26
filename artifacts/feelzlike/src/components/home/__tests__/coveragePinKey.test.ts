import assert from "node:assert/strict";
import test from "node:test";
import { coveragePinKey, dedupeCoveragePins } from "../coveragePinKey";

test("coverage pin keys are semantic and distinguish repeated ids across regions", () => {
  assert.equal(
    coveragePinKey({ country: "JP", regionId: "yamanouchi", id: "ryuoo" }),
    "coverage-pin:JP:yamanouchi:ryuoo",
  );
  assert.notEqual(
    coveragePinKey({ country: "JP", regionId: "yamanouchi", id: "nozawa-onsen" }),
    coveragePinKey({ country: "JP", regionId: "nozawa-onsen", id: "nozawa-onsen" }),
  );
});

test("dedupe collapses identical semantic pins and preserves the first object", () => {
  const authored = {
    country: "JP",
    regionId: "yamanouchi",
    id: "ryuoo",
    name: "Authored Ryuoo",
  };
  const catalogue = {
    country: "JP",
    regionId: "yamanouchi",
    id: "ryuoo",
    name: "Catalogue Ryuoo",
  };
  const result = dedupeCoveragePins([authored, catalogue]);
  assert.equal(result.length, 1);
  assert.equal(result[0], authored);
});

test("dedupe preserves same ids in distinct regions and stable input order", () => {
  const pins = [
    { country: "JP", regionId: "yamanouchi", id: "shared", name: "first" },
    { country: "JP", regionId: "nozawa-onsen", id: "shared", name: "second" },
    { country: "US", regionId: "yamanouchi", id: "shared", name: "third" },
    { country: "JP", regionId: "yamanouchi", id: "shared", name: "duplicate" },
  ];
  const result = dedupeCoveragePins(pins);
  assert.deepEqual(result.map((pin) => pin.name), ["first", "second", "third"]);
  assert.equal(result[0], pins[0]);
  assert.equal(result[1], pins[1]);
  assert.equal(result[2], pins[2]);
});