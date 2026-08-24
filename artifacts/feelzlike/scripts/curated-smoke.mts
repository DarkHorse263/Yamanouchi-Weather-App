import { z } from "zod";
import { REGION_SLUGS, StaySchema, EatSchema, TOWNS_BY_REGION } from "../src/types/stayEat.ts";
import jindabyneStays from "../src/data/curated/by_region/snowy_mountains/jindabyne/stays.json" with { type: "json" };
import jindabyneEats  from "../src/data/curated/by_region/snowy_mountains/jindabyne/eats.json"  with { type: "json" };
import berridaleStays from "../src/data/curated/by_region/snowy_mountains/berridale/stays.json" with { type: "json" };
import berridaleEats  from "../src/data/curated/by_region/snowy_mountains/berridale/eats.json"  with { type: "json" };
import coomaStays     from "../src/data/curated/by_region/snowy_mountains/cooma/stays.json"     with { type: "json" };
import coomaEats      from "../src/data/curated/by_region/snowy_mountains/cooma/eats.json"      with { type: "json" };
import yudanakaStays  from "../src/data/curated/by_region/yamanouchi/yudanaka/stays.json"        with { type: "json" };
import yudanakaEats   from "../src/data/curated/by_region/yamanouchi/yudanaka/eats.json"         with { type: "json" };
import shibuStays     from "../src/data/curated/by_region/yamanouchi/shibu_onsen/stays.json"     with { type: "json" };
import shibuEats      from "../src/data/curated/by_region/yamanouchi/shibu_onsen/eats.json"      with { type: "json" };
import yomaseStays    from "../src/data/curated/by_region/yamanouchi/yomase/stays.json"          with { type: "json" };
import yomaseEats     from "../src/data/curated/by_region/yamanouchi/yomase/eats.json"           with { type: "json" };

const StayArr = z.array(StaySchema);
const EatArr = z.array(EatSchema);
const stays: Record<string, any[]> = {
  jindabyne: StayArr.parse(jindabyneStays), berridale: StayArr.parse(berridaleStays), cooma: StayArr.parse(coomaStays),
  yudanaka: StayArr.parse(yudanakaStays), shibu_onsen: StayArr.parse(shibuStays), yomase: StayArr.parse(yomaseStays),
};
const eats: Record<string, any[]> = {
  jindabyne: EatArr.parse(jindabyneEats), berridale: EatArr.parse(berridaleEats), cooma: EatArr.parse(coomaEats),
  yudanaka: EatArr.parse(yudanakaEats), shibu_onsen: EatArr.parse(shibuEats), yomase: EatArr.parse(yomaseEats),
};
const allStays = Object.values(stays).flat();
const allEats = Object.values(eats).flat();
let missingObject = 0;
let allNullValues = 0;
for (const s of allStays) {
  if (!s.booking_links || typeof s.booking_links !== "object" || Object.keys(s.booking_links).length === 0) {
    missingObject++;
    continue;
  }
  const links = Object.values(s.booking_links).filter((v: any) => typeof v === "string" && v.length > 0);
  if (links.length === 0) allNullValues++;
}
console.log("REGION_SLUGS:", REGION_SLUGS);
for (const r of Object.keys(TOWNS_BY_REGION)) console.log(`  ${r} towns:`, (TOWNS_BY_REGION as any)[r]);
console.log("");
for (const t of Object.keys(stays)) console.log(`  ${t.padEnd(12)} ${String(stays[t].length).padStart(3)} stays / ${String(eats[t].length).padStart(3)} eats`);
console.log("\nTotal stays:", allStays.length, "(expected 107)");
console.log("Total eats:", allEats.length, "(expected 120)");
console.log("Stays missing booking_links object:", missingObject, "(must be 0)");
console.log("Stays with booking_links keys but all values null:", allNullValues, "(curation gap, non-fatal)");
const ok = allStays.length === 107 && allEats.length === 120 && missingObject === 0;
console.log(ok ? "\n✓ SMOKE PASSED" : "\n✗ SMOKE FAILED");
process.exit(ok ? 0 : 1);
