import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { cataloguePublicRuntime } from "../public-runtime.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(`${root}generated/public-runtime.json`, "utf8");
const forbidden = new Set(["classification", "evidence", "lifecycle", "lifecycleHistory", "supports", "retrievedAt"]);
const errors = [];
function walk(value, path = "$") {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.has(key)) errors.push(`${path}.${key} is internal`);
    walk(item, `${path}.${key}`);
  }
}
walk(cataloguePublicRuntime);
if (JSON.stringify(JSON.parse(source)) !== JSON.stringify(cataloguePublicRuntime)) errors.push("runtime import differs from JSON");
if (errors.length) throw new Error(errors.join("\n"));
process.stdout.write(`Ski catalogue valid: ${cataloguePublicRuntime.publishedRecords.length} published records.\n`);