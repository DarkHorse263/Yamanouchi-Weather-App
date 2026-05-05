import { z } from "zod";

import jindabyneStaysJson from "./curated/by_region/snowy_mountains/jindabyne/stays.json";
import jindabyneEatsJson from "./curated/by_region/snowy_mountains/jindabyne/eats.json";
import berridaleStaysJson from "./curated/by_region/snowy_mountains/berridale/stays.json";
import berridaleEatsJson from "./curated/by_region/snowy_mountains/berridale/eats.json";
import coomaStaysJson from "./curated/by_region/snowy_mountains/cooma/stays.json";
import coomaEatsJson from "./curated/by_region/snowy_mountains/cooma/eats.json";
import yudanakaStaysJson from "./curated/by_region/yamanouchi/yudanaka/stays.json";
import yudanakaEatsJson from "./curated/by_region/yamanouchi/yudanaka/eats.json";
import shibuOnsenStaysJson from "./curated/by_region/yamanouchi/shibu_onsen/stays.json";
import shibuOnsenEatsJson from "./curated/by_region/yamanouchi/shibu_onsen/eats.json";
import yomaseStaysJson from "./curated/by_region/yamanouchi/yomase/stays.json";
import yomaseEatsJson from "./curated/by_region/yamanouchi/yomase/eats.json";

import {
  REGION_OF_TOWN,
  REGION_SLUGS,
  StaySchema,
  EatSchema,
  TOWNS_BY_REGION,
  type Eat,
  type RegionSlug,
  type Stay,
  type TownSlug,
} from "@/types/stayEat";

const StayArraySchema = z.array(StaySchema);
const EatArraySchema = z.array(EatSchema);

function validate<T>(label: string, schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `  • ${issue.path.join(".") || "(root)"} – ${issue.message}`)
      .join("\n");
    throw new Error(
      `[curated-data] Schema validation failed for ${label} (${parsed.error.issues.length} issue(s)):\n${issues}`,
    );
  }
  return parsed.data;
}

const STAYS_BY_TOWN: Record<TownSlug, Stay[]> = {
  jindabyne: validate("jindabyne stays", StayArraySchema, jindabyneStaysJson),
  berridale: validate("berridale stays", StayArraySchema, berridaleStaysJson),
  cooma: validate("cooma stays", StayArraySchema, coomaStaysJson),
  yudanaka: validate("yudanaka stays", StayArraySchema, yudanakaStaysJson),
  shibu_onsen: validate("shibu_onsen stays", StayArraySchema, shibuOnsenStaysJson),
  yomase: validate("yomase stays", StayArraySchema, yomaseStaysJson),
};

const EATS_BY_TOWN: Record<TownSlug, Eat[]> = {
  jindabyne: validate("jindabyne eats", EatArraySchema, jindabyneEatsJson),
  berridale: validate("berridale eats", EatArraySchema, berridaleEatsJson),
  cooma: validate("cooma eats", EatArraySchema, coomaEatsJson),
  yudanaka: validate("yudanaka eats", EatArraySchema, yudanakaEatsJson),
  shibu_onsen: validate("shibu_onsen eats", EatArraySchema, shibuOnsenEatsJson),
  yomase: validate("yomase eats", EatArraySchema, yomaseEatsJson),
};

export function getStaysByTown(town: TownSlug): Stay[] {
  return STAYS_BY_TOWN[town] ?? [];
}

export function getEatsByTown(town: TownSlug): Eat[] {
  return EATS_BY_TOWN[town] ?? [];
}

export function getStaysByRegion(region: RegionSlug): Stay[] {
  return TOWNS_BY_REGION[region].flatMap((town) => STAYS_BY_TOWN[town]);
}

export function getEatsByRegion(region: RegionSlug): Eat[] {
  return TOWNS_BY_REGION[region].flatMap((town) => EATS_BY_TOWN[town]);
}

export function getAllStays(): Stay[] {
  return Object.values(STAYS_BY_TOWN).flat();
}

export function getAllEats(): Eat[] {
  return Object.values(EATS_BY_TOWN).flat();
}

export function getTowns(region: RegionSlug): readonly TownSlug[] {
  return TOWNS_BY_REGION[region];
}

export function getRegions(): readonly RegionSlug[] {
  return REGION_SLUGS;
}

export function getRegionOfTown(town: TownSlug): RegionSlug {
  return REGION_OF_TOWN[town];
}

export const CURATED_COUNTS = {
  stays: getAllStays().length,
  eats: getAllEats().length,
  total: getAllStays().length + getAllEats().length,
} as const;

export type { Stay, Eat, RegionSlug, TownSlug } from "@/types/stayEat";
