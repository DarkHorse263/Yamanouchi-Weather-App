import type { RegionConfig } from "@workspace/feelzlike-shell";
import { UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS } from "./authored-village-elevation-unknowns";

type VerifiedVillageElevation = {
  elevationM: number;
  sourceUrl: string;
  citation: string;
  verifiedAt: string;
};

/**
 * Resort-specific inventory for authored mountains whose lower
 * resort/village elevation has been independently stated by a resort or
 * destination source. This manifest is also required for direct authored
 * values, so every non-fallback elevation has explicit provenance.
 */
export const VERIFIED_AUTHORED_VILLAGE_ELEVATIONS = {
  "bend/mt-bachelor": {
    elevationM: 1737,
    sourceUrl: "https://www.mtbachelor.com/the-mountain/resort-policies-safety/mountain-stats/",
    citation: "Mt. Bachelor's official mountain statistics list the lowest ski-area elevation as 5,700 ft (1,737 m).",
    verifiedAt: "2026-08-29",
  },
  "albuquerque-sandia/sandia-peak": {
    elevationM: 2630,
    sourceUrl: "https://www.skiresort.info/ski-resort/sandia-peak/",
    citation: "Sandia Peak resort statistics place the ski-area base at approximately 2,630 m.",
    verifiedAt: "2026-08-29",
  },
  "snowy-mountains/perisher": {
    elevationM: 1720,
    sourceUrl: "https://www.perisher.com.au/resort-info/mountain-operations/resort-stats",
    citation: "Perisher's official mountain statistics give a resort base elevation of 1,720 m.",
    verifiedAt: "2026-08-29",
  },
  "snowy-mountains/thredbo": {
    elevationM: 1365,
    sourceUrl: "https://www.snowymountainsholidays.com.au/thredbo_ski_resort/",
    citation: "The Snowy Mountains destination guide states that Thredbo village sits at 1,365 m.",
    verifiedAt: "2026-08-29",
  },
  "snowy-mountains/selwyn": {
    elevationM: 1492,
    sourceUrl: "https://www.skiresort.com/en/ski-resort/selwyn-snowfields/",
    citation: "The Selwyn resort profile states that the ski area begins at a base elevation of 1,492 m.",
    verifiedAt: "2026-08-29",
  },
  "snowy-mountains/charlottes-pass": {
    elevationM: 1765,
    sourceUrl: "https://charlottepass.com.au/compendium/",
    citation: "Charlotte Pass's official resort compendium states that the snow resort sits at 1,765 m.",
    verifiedAt: "2026-08-29",
  },
  "park-city/park-city-mountain": {
    elevationM: 2100,
    sourceUrl: "https://www.parkcitymountain.com/the-mountain/about-the-mountain/mountain-info.aspx",
    citation: "Park City Mountain's official mountain information lists the resort base at 6,900 ft (2,100 m).",
    verifiedAt: "2026-08-29",
  },
  "park-city/deer-valley-resort": {
    elevationM: 2003,
    sourceUrl: "https://www.deervalley.com/about-us/faqs",
    citation: "Deer Valley's official FAQ lists the Snow Park base at 6,570 ft (2,003 m).",
    verifiedAt: "2026-09-03",
  },
  "vail-valley/vail-mountain": {
    elevationM: 2475,
    sourceUrl: "https://www.vail.com/the-mountain/about-the-mountain/mountain-info.aspx",
    citation: "Vail's official mountain information lists a base elevation of 8,120 ft (2,475 m).",
    verifiedAt: "2026-08-29",
  },
  "vail-valley/beaver-creek": {
    elevationM: 2469,
    sourceUrl: "https://www.beavercreek.com/the-mountain/about-the-mountain/mountain-info.aspx",
    citation: "Beaver Creek's official mountain information lists a base elevation of 8,100 ft (2,469 m).",
    verifiedAt: "2026-08-29",
  },
  "banff-lake-louise/banff-sunshine": {
    elevationM: 1660,
    sourceUrl: "https://www.skibanff.com/explore/news-blog/sunshine-village-by-the-numbers",
    citation: "Sunshine Village's official resort statistics state a base elevation of 1,660 m.",
    verifiedAt: "2026-08-29",
  },
  "banff-lake-louise/mt-norquay": {
    elevationM: 1680,
    sourceUrl: "https://banffnorquay.com/trail-map/",
    citation: "Mt Norquay's official trail-map page states a base elevation of 1,680 m.",
    verifiedAt: "2026-09-03",
  },
  "banff-lake-louise/lake-louise-resort": {
    elevationM: 1646,
    sourceUrl: "https://www.skilouise.com/explore-winter/winter-ski-ride/mountain-stats/",
    citation: "Lake Louise's official mountain statistics list the base area at 1,646 m.",
    verifiedAt: "2026-08-29",
  },
  "niseko/grand-hirafu": {
    elevationM: 260,
    sourceUrl: "https://www.niseko.ne.jp/en/booklet.pdf",
    citation: "The official Niseko United booklet gives Grand Hirafu's lower resort elevation as 260 m.",
    verifiedAt: "2026-08-29",
  },
  "niseko/hanazono": {
    elevationM: 308,
    sourceUrl: "https://snowexplorers.com/destination/hokkaido/niseko/ski-resorts/",
    citation: "The Niseko resort guide lists Hanazono's lower station elevation as 308 m.",
    verifiedAt: "2026-08-29",
  },
  "niseko/niseko-village": {
    elevationM: 280,
    sourceUrl: "https://snowexplorers.com/destination/hokkaido/niseko/ski-resorts/",
    citation: "The Niseko resort guide lists Niseko Village's lower station elevation as 280 m.",
    verifiedAt: "2026-08-29",
  },
  "niseko/annupuri": {
    elevationM: 400,
    sourceUrl: "https://snowexplorers.com/destination/hokkaido/niseko/ski-resorts/",
    citation: "The Niseko resort guide lists Annupuri's lower station elevation as 400 m.",
    verifiedAt: "2026-08-29",
  },
  "niseko/moiwa": {
    elevationM: 330,
    sourceUrl: "https://hokkaidodo.jp/en/winter/ski/s/niseko-moiwa-ski-resort/",
    citation: "The Hokkaido resort guide states Niseko Moiwa's base elevation is 330 m.",
    verifiedAt: "2026-08-29",
  },
} as const satisfies Record<string, VerifiedVillageElevation>;

type ApplyVerifiedVillageElevationOptions = {
  strict?: boolean;
  completeInventory?: boolean;
};

export function applyVerifiedVillageElevations(
  regions: RegionConfig[],
  { strict = false, completeInventory = false }: ApplyVerifiedVillageElevationOptions = {},
): RegionConfig[] {
  const missing: string[] = [];
  const invalidDirect: string[] = [];
  const seenKeys = new Set<string>();
  const regionIds = new Set(regions.map((region) => region.id));
  const enriched = regions.map((region) => ({
    ...region,
    mountains: region.mountains?.map((mountain) => {
      const key = `${region.id}/${mountain.id}`;
      seenKeys.add(key);
      const verified = VERIFIED_AUTHORED_VILLAGE_ELEVATIONS[key as keyof typeof VERIFIED_AUTHORED_VILLAGE_ELEVATIONS];
      if (mountain.baseElevationM != null) {
        if (strict && (!verified || mountain.baseElevationM !== verified.elevationM)) {
          invalidDirect.push(
            verified
              ? `${key} (authored ${mountain.baseElevationM}, verified ${verified.elevationM})`
              : `${key} (no provenance manifest record)`,
          );
        }
        return mountain;
      }

      if (verified) return { ...mountain, baseElevationM: verified.elevationM };

      if (strict && !UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.has(key)) missing.push(key);
      return mountain;
    }),
  }));

  const overlap = Object.keys(VERIFIED_AUTHORED_VILLAGE_ELEVATIONS)
    .filter((key) => UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.has(key));
  const orphanSources = Object.keys(VERIFIED_AUTHORED_VILLAGE_ELEVATIONS)
    .filter((key) => regionIds.has(key.slice(0, key.indexOf("/"))) && !seenKeys.has(key));
  const orphanUnknowns = [...UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS]
    .filter((key) => regionIds.has(key.slice(0, key.indexOf("/"))) && !seenKeys.has(key));
  const errors: string[] = [];
  if (invalidDirect.length > 0) {
    errors.push(`Unsourced or mismatched authored village elevations: ${invalidDirect.join(", ")}`);
  }
  if (missing.length > 0) {
    errors.push(`Missing authored village elevations: ${missing.join(", ")}`);
  }
  if (strict && overlap.length > 0) {
    errors.push(`Authored village elevation source/unknown overlap: ${overlap.join(", ")}`);
  }
  if (strict && completeInventory && orphanSources.length > 0) {
    errors.push(`Orphan authored village elevation sources: ${orphanSources.join(", ")}`);
  }
  if (strict && completeInventory && orphanUnknowns.length > 0) {
    errors.push(`Orphan authored village elevation unknowns: ${orphanUnknowns.join(", ")}`);
  }
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  return enriched;
}