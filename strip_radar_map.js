const fs = require('fs');

let content = fs.readFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx', 'utf8');

// replace the exported RegionKey, PinSpec, and REGION_DEFAULTS with an import
content = content.replace(/export type RegionKey =[\s\S]*?\| "quebec-eastern-townships";/, '');
content = content.replace(/export interface PinSpec[\s\S]*?accent: string }/, '');
content = content.replace(/\/\/ Per-region defaults: centre \+ pins\. Used when the caller[\s\S]*?export const REGION_DEFAULTS: Record<RegionKey, { center: { lat: number; lng: number }; pins: PinSpec\[\] }> = {[\s\S]*?^};/m, '');

content = 'import { type RegionKey, type PinSpec, REGION_DEFAULTS } from "@/regions/region-pins";\n' + content;

fs.writeFileSync('artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx', content);
