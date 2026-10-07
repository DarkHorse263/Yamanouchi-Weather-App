import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { REGIONS, staticRoutePaths, regionFeatures, townFeatures, regionMountains, publishedCatalogueMountainRoutes } from "./seo-regions.mjs";
import legacy from "../src/lib/legacyRoutes.json" with { type: "json" };

// Exact public identities, shared with SEO generation. Never accept an arbitrary
// mountain id just because its region exists.
const routes = new Set([...staticRoutePaths, "/about", "/account", "/admin",
  "/alerts/verify", "/alerts/manage", "/alerts/unsubscribed"]);
const redirects = { "/plan": "/compare/", "/pricing": "/premium/" };
for (const region of REGIONS) {
  const root = `/${region.slug}`;
  routes.add(root);
  // These non-indexed routes are real client routes (some redirect in-app).
  for (const feature of ["sources", "radar", "mountains/lifts", "eat", "explore"]) {
    routes.add(`${root}/${feature}`);
  }
  for (const feature of regionFeatures(region)) routes.add(`${root}/${feature}`);
  for (const mountain of regionMountains(region)) {
    routes.add(`${root}/mountain/${mountain.id}`);
    redirects[`${root}/resort/${mountain.id}`] = `${root}/mountain/${mountain.id}/`;
  }
  for (const town of region.towns) {
    const path = `${root}/${town.id}`;
    routes.add(path);
    for (const feature of townFeatures(region)) routes.add(`${path}/${feature}`);
    if (townFeatures(region).includes("roads")) redirects[`${path}/cams`] = `${path}/roads/`;
  }
}
for (const { path } of publishedCatalogueMountainRoutes) {
  const clean = path.replace(/\/+$/, "");
  routes.add(clean);
  redirects[clean.replace("/mountain/", "/resort/")] = `${clean}/`;
}
for (const { from, to, suffixes } of legacy) {
  for (const suffix of suffixes) redirects[`${from}${suffix}`.replace(/\/+$/, "")] = `${to}${suffix}/`;
}
export const pageRoutes = { routes: [...routes], redirects };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../dist/page-routes.json", import.meta.url), JSON.stringify(pageRoutes));
  console.log(`[pages] ${routes.size} exact routes and ${Object.keys(redirects).length} redirects`);
}
