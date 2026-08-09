import { test } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { resolvePinRoute } from "../resolvePinRoute";
import { REGION_DEFAULTS } from "@/regions/region-pins";

test("resolvePinRoute handles all REGION_DEFAULTS pins correctly", () => {
  const regionsDir = path.join(process.cwd(), "src/regions");
  const files = fs.readdirSync(regionsDir).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "region-pins.ts");

  const regionDb: Record<string, { id: string; baseTowns: { id: string }[]; mountains: { id: string }[] }> = {};

  for (const file of files) {
    const content = fs.readFileSync(path.join(regionsDir, file), "utf8");
    const idMatch = content.match(/id:\s*"([^"]+)"/);
    if (!idMatch) continue;
    
    const regionId = idMatch[1];
    
    // To avoid nested brackets issue, we'll just search for id: "..." globally in the whole content,
    // then categorize them based on which index they appear at compared to "baseTowns:" and "mountains:".
    const btIndex = content.indexOf("baseTowns:");
    const mIndex = content.indexOf("mountains:");
    
    // We assume the file is structured with baseTowns first, then mountains, or vice versa
    const idRegex = /id:\s*"([^"]+)"/g;
    let match;
    const btIds: string[] = [];
    const mIds: string[] = [];
    
    let matchCount = 0;
    while ((match = idRegex.exec(content)) !== null) {
      const id = match[1];
      matchCount++;
      // Skip the very first id which is the region id
      if (matchCount === 1) continue;
      
      const pos = match.index;
      if (btIndex !== -1 && mIndex !== -1) {
        if (btIndex < mIndex) {
          if (pos > btIndex && pos < mIndex) btIds.push(id);
          else if (pos > mIndex) mIds.push(id);
        } else {
          if (pos > mIndex && pos < btIndex) mIds.push(id);
          else if (pos > btIndex) btIds.push(id);
        }
      } else if (btIndex !== -1) {
        if (pos > btIndex) btIds.push(id);
      } else if (mIndex !== -1) {
        if (pos > mIndex) mIds.push(id);
      }
    }
    
    regionDb[regionId] = {
      id: regionId,
      baseTowns: btIds.map((id) => ({ id })),
      mountains: mIds.map((id) => ({ id })),
    };
  }

  const failingPins: string[] = [];

  for (const [regionId, defaults] of Object.entries(REGION_DEFAULTS)) {
    const regionConfig = regionDb[regionId];
    if (!regionConfig) continue;

    for (const pin of defaults.pins) {
      const route = resolvePinRoute(regionConfig, pin.id);
      
      if (pin.id === "kita-shiga" || pin.id === "shiga-kogen") {
        assert.equal(route, null, `Expected ${pin.id} to be non-clickable`);
      } else if (route === null) {
        failingPins.push(`${regionId}:${pin.id}`);
      }
    }
  }
  
  if (failingPins.length > 0) {
    assert.fail(`Some pins did not resolve:\n${failingPins.join('\n')}`);
  }
});
