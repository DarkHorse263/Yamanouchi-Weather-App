import assert from "node:assert/strict";
import test from "node:test";
import { usStateForRegion } from "../us-states";

test("derives states for authored, generic-code, and non-US regions", () => {
  assert.equal(
    usStateForRegion({ id: "killington-pico", shortTag: "VT", subtitle: "Vermont · USA" }),
    "Vermont",
  );
  assert.equal(
    usStateForRegion({ id: "summit-county", shortTag: "CO", subtitle: "Colorado · USA" }),
    "Colorado",
  );
  assert.equal(
    usStateForRegion({ id: "niseko", shortTag: "JP", subtitle: "Hokkaido · Japan" }),
    undefined,
  );
});