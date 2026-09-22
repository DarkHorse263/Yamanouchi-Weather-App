import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function testFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? testFiles(path)
      : /\.test\.(?:tsx?|mjs)$/.test(entry.name) ? [path] : [];
  }).sort();
}

const files = [...testFiles("src"), ...testFiles("scripts")];
if (!files.length) throw new Error("No frontend tests discovered");
console.log(`Running all ${files.length} frontend test files`);

for (const args of [
  ["run", "test:tripPlannerClock"],
  ["exec", "tsx", "--tsconfig", "tsconfig.test.json", "--test", "--test-concurrency=2", ...files],
  ["exec", "node", "scripts/validate-catalogue-route-parity.mjs"],
]) {
  const result = spawnSync("pnpm", args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}