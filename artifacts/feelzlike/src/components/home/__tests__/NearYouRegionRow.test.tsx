/**
 * NearYou region-row · wording lock.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:nearYouRegionRow
 *
 * Pattern: tsx --test + node:assert (matches the other lib tests), but renders
 * the real presentational component to static HTML with react-dom/server so the
 * *visible label/copy* for each proximity state is asserted - not just the
 * underlying classify() decision (that lives in regionProximity.test.ts).
 *
 * Why this exists: classifyRegionProximity already guards the far-vs-near
 * decision, but a refactor of NearYou could still wire the right proximity to
 * the wrong string ("nearest mountain region" where the region is 9,500 km
 * away). This locks each rendered state to its honest wording.
 *
 * The component is rendered inside a wouter <Router ssrPath> because its <Link>
 * needs a routing context during SSR (otherwise it reaches for `location`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { NearYouRegionRow, type SuggestedRegion } from "../NearYouRegionRow";

function renderRow(suggested: SuggestedRegion): string {
  return renderToStaticMarkup(
    <Router ssrPath="/">
      <NearYouRegionRow suggested={suggested} />
    </Router>,
  );
}

const NEAR: SuggestedRegion = {
  id: "thredbo",
  name: "Thredbo",
  href: "/au/thredbo",
  feelsLikeC: -2,
  distanceKm: 12,
};

test("near region: reads as the visitor's 'nearest mountain region'", () => {
  const html = renderRow(NEAR);
  assert.match(html, /nearest mountain region/);
  // never the softened far/suggested framing for a genuinely close region
  assert.doesNotMatch(html, /a long way from you/);
  assert.doesNotMatch(html, /suggested region/);
  // shows the real distance + feelzlike temp
  assert.match(html, /12 km away/);
  assert.match(html, /feelzlike/);
});

test("far region: drops 'nearest' and warns it's a long way", () => {
  const html = renderRow({ ...NEAR, distanceKm: 9500 });
  assert.match(html, /the mountains are a long way from you/);
  assert.match(html, /mountain region/);
  // crucially NOT "nearest mountain region" for a distant region
  assert.doesNotMatch(html, /nearest mountain region/);
  // still honest about the distance
  assert.match(html, /km away/);
});

test("null-distance fallback: reads as a softer 'suggested region'", () => {
  const html = renderRow({ ...NEAR, feelsLikeC: null, distanceKm: null });
  assert.match(html, /suggested region/);
  assert.doesNotMatch(html, /nearest mountain region/);
  assert.doesNotMatch(html, /a long way from you/);
  // no distance claimed when we don't know where the visitor is
  assert.doesNotMatch(html, /km away/);
  assert.match(html, /tap to explore the mountains/);
});
