const fs = require('fs');

let radarMap = fs.readFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.tsx', 'utf8');
radarMap = radarMap.replace(/import\("\.\/RadarMap\.inner"\)\.RegionKey/g, 'import("@/regions/region-pins").RegionKey');
radarMap = radarMap.replace(/export type \{ RegionKey as RadarRegionKey \} from "\.\/RadarMap\.inner";/g, 'export type { RegionKey as RadarRegionKey } from "@/regions/region-pins";');
fs.writeFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.tsx', radarMap);

let coverageInner = fs.readFileSync('artifacts/feelzlike/src/components/home/CoverageMap.inner.tsx', 'utf8');
coverageInner = coverageInner.replace(/import \{ REGION_DEFAULTS \} from "@\/regions\/snowy-mountains\/components\/RadarMap\.inner";/g, 'import { REGION_DEFAULTS } from "@/regions/region-pins";');
fs.writeFileSync('artifacts/feelzlike/src/components/home/CoverageMap.inner.tsx', coverageInner);

let radarInner = fs.readFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx', 'utf8');
radarInner = radarInner.replace(/import \{ type RegionKey, type PinSpec, REGION_DEFAULTS \} from "@\/regions\/region-pins";/g, 'import { type RegionKey, type PinSpec, REGION_DEFAULTS } from "@/regions/region-pins";\nexport type { RegionKey };');
fs.writeFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx', radarInner);

let resolveRoute = fs.readFileSync('artifacts/feelzlike/src/components/home/resolvePinRoute.ts', 'utf8');
resolveRoute = resolveRoute.replace(/import type \{ RegionConfig \} from "@\/regions";/g, 'import type { RegionConfig } from "@workspace/feelzlike-shell";');
resolveRoute = resolveRoute.replace(/\(t\) =>/g, '(t: any) =>');
resolveRoute = resolveRoute.replace(/\(m\) =>/g, '(m: any) =>');
fs.writeFileSync('artifacts/feelzlike/src/components/home/resolvePinRoute.ts', resolveRoute);
