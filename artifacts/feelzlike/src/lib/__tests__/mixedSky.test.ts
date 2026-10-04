import test from "node:test";
import assert from "node:assert/strict";
import { hasMixedSky } from "../mixedSky";

test("partly cloudy conditions get a mixed sky even without rain", () => {
  assert.equal(hasMixedSky(2), true);
  assert.equal(hasMixedSky(2, 0), true);
});
test("sunny forecast hours with meaningful rain risk get mixed skies", () => {
  for (const code of [0, 1]) {
    for (const pop of [25, 27, 39, 41, 100]) assert.equal(hasMixedSky(code, pop), true);
    for (const pop of [undefined, null, 0, 24, -1, 101, NaN]) assert.equal(hasMixedSky(code, pop), false);
  }
});
test("rain, snow, fog, overcast and unknown conditions keep their own icons", () => {
  for (const code of [null, 3, 45, 48, 51, 61, 71, 80, 85, 95]) {
    assert.equal(hasMixedSky(code, 75), false);
  }
});