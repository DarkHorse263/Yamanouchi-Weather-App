/**
 * Region-isolated transport data - single source of truth for the
 * Transport page and any future analytics/region-overview consumers.
 *
 * Loader-time invariants enforced here (so a curation drift never reaches
 * the UI):
 *  - every provider must declare a non-empty `regions[]`
 *  - every provider's `regions[]` must include the region key under which
 *    it is registered (e.g. an entry under "yamanouchi" must list
 *    "yamanouchi" in its regions[])
 *
 * Throws synchronously at module-load time on any violation. This is the
 * desired behaviour: if the data is bad, fail loud at startup rather than
 * leak it into another region.
 */
import type { RegionId } from "@workspace/api-client-react";
import type { TransportProvider, TransportProviderList } from "@/types/transport";
import { SNOWY_MOUNTAINS_TRANSPORT } from "./snowy-mountains";
import { VICTORIAS_HIGH_COUNTRY_TRANSPORT } from "./victorias-high-country";
import { TASMANIA_TRANSPORT } from "./tasmania";
import { YAMANOUCHI_TRANSPORT } from "./yamanouchi";
import { NOZAWA_ONSEN_TRANSPORT } from "./nozawa-onsen";
import { IIYAMA_TRANSPORT } from "./iiyama";
import { HAKUBA_VALLEY_TRANSPORT } from "./hakuba-valley";
import { MYOKO_TRANSPORT } from "./myoko";
import { NISEKO_TRANSPORT } from "./niseko";
import { FURANO_TRANSPORT } from "./furano";
import { SAPPORO_TRANSPORT } from "./sapporo";
import { TOMAMU_SAHORO_TRANSPORT } from "./tomamu-sahoro";
import { ASAHIKAWA_TRANSPORT } from "./asahikawa";
import { RUSUTSU_KIRORO_TRANSPORT } from "./rusutsu-kiroro";
import { YUZAWA_TRANSPORT } from "./yuzawa";
import { ZAO_ONSEN_TRANSPORT } from "./zao-onsen";
import { HAKKODA_AOMORI_SPRING_TRANSPORT } from "./hakkoda-aomori-spring";
import { APPI_SHIZUKUISHI_TRANSPORT } from "./appi-shizukuishi";
import { QUEENSTOWN_TRANSPORT } from "./queenstown";
import { WANAKA_TRANSPORT } from "./wanaka";
import { MT_HUTT_TRANSPORT } from "./mt-hutt";
import { RUAPEHU_TRANSPORT } from "./ruapehu";

const REGISTRY: Record<RegionId, TransportProviderList> = {
  "snowy-mountains": SNOWY_MOUNTAINS_TRANSPORT,
  "victorias-high-country": VICTORIAS_HIGH_COUNTRY_TRANSPORT,
  tasmania: TASMANIA_TRANSPORT,
  yamanouchi: YAMANOUCHI_TRANSPORT,
  "nozawa-onsen": NOZAWA_ONSEN_TRANSPORT,
  iiyama: IIYAMA_TRANSPORT,
  "hakuba-valley": HAKUBA_VALLEY_TRANSPORT,
  myoko: MYOKO_TRANSPORT,
  niseko: NISEKO_TRANSPORT,
  furano: FURANO_TRANSPORT,
  sapporo: SAPPORO_TRANSPORT,
  "tomamu-sahoro": TOMAMU_SAHORO_TRANSPORT,
  asahikawa: ASAHIKAWA_TRANSPORT,
  "rusutsu-kiroro": RUSUTSU_KIRORO_TRANSPORT,
  yuzawa: YUZAWA_TRANSPORT,
  "zao-onsen": ZAO_ONSEN_TRANSPORT,
  "hakkoda-aomori-spring": HAKKODA_AOMORI_SPRING_TRANSPORT,
  "appi-shizukuishi": APPI_SHIZUKUISHI_TRANSPORT,
  // NZ · verified ski-season operators only (resort ski buses, RealNZ +
  // local mountain shuttles, InterCity). Unverified phone/website/schedule
  // fields are null per the no-guess rule.
  queenstown: QUEENSTOWN_TRANSPORT,
  wanaka: WANAKA_TRANSPORT,
  "mt-hutt": MT_HUTT_TRANSPORT,
  ruapehu: RUAPEHU_TRANSPORT,
};

// Loader-time integrity check.
const seenIds = new Map<string, RegionId>();
for (const [regionKey, providers] of Object.entries(REGISTRY) as [RegionId, TransportProviderList][]) {
  for (const p of providers) {
    if (!Array.isArray(p.regions) || p.regions.length === 0) {
      throw new Error(
        `[transport] provider '${p.id}' (under '${regionKey}') has empty regions[]`,
      );
    }
    if (!p.regions.includes(regionKey)) {
      throw new Error(
        `[transport] provider '${p.id}' is registered under region '${regionKey}' but its regions[] is ${JSON.stringify(p.regions)} - missing self-reference`,
      );
    }
    const previous = seenIds.get(p.id);
    if (previous !== undefined) {
      throw new Error(
        `[transport] duplicate provider id '${p.id}' (registered under both '${previous}' and '${regionKey}')`,
      );
    }
    seenIds.set(p.id, regionKey);
  }
}

/** Get all transport providers for a region. Returns an empty array if the region has no curated transport yet. */
export function getProvidersForRegion(regionId: RegionId): TransportProviderList {
  return REGISTRY[regionId] ?? [];
}

/** All providers across all regions. Useful for admin/analytics views. */
export function getAllProviders(): TransportProvider[] {
  return Object.values(REGISTRY).flat();
}

export type { TransportProvider, TransportProviderList };
