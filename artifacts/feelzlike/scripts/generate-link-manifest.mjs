#!/usr/bin/env node
/**
 * Extracts every user-facing external URL from the frontend data files and
 * writes them to artifacts/api-server/src/data/external-links.json for the
 * daily smoke test (jobs/smokeTest.ts) to health-check.
 *
 * Regex scan on source text (no imports) so PNG-importing data files can't
 * crash the extraction, and the manifest never drifts from what is literally
 * in the code. Re-run after adding/removing links or regions:
 *   node scripts/generate-link-manifest.mjs
 *
 * Exclusions (deliberate):
 *  - affiliate/tracking hosts (awin1, tidd.ly, CJ domains): a bot GET would
 *    register fake clicks and can breach network ToS. Never check these.
 *  - map tile/api infra (openstreetmap, open-meteo, jma tiles, windy embeds):
 *    checked implicitly by the app's own weather calls, and tile servers
 *    throttle unfamiliar clients aggressively - too noisy to alert on.
 *  - our own domain (the smoke test audits it separately via the sitemap).
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = [join(ROOT, "src/data"), join(ROOT, "src/regions"), join(ROOT, "src/pages")];
const OUT = join(ROOT, "../api-server/src/data/external-links.json");

// Files whose external links must NOT enter the nightly smoke test. The Canada
// "every ski hill" directory carries ~225 links to small-town operators; a
// nightly bot visiting all of them would hammer tiny sites for no benefit (and
// they rot too fast to alert on usefully). The page links them out directly at
// runtime instead. Match on basename so the path separator never matters.
const SKIP_FILES = new Set(["canadaDirectory.ts"]);

// Only assert identity text for operators whose branding is stable across all
// linked pages. Other transport links still get conservative parking/hijack
// checks, without a brittle text assertion that would create alert noise.
const STABLE_OPERATOR_IDENTITIES = new Map([
  ["gunnisonvalleyrta.com", ["Gunnison Valley RTA"]],
]);

const EXCLUDE_HOSTS = [
  // affiliate / tracking - never machine-visit
  "awin1.com", "tidd.ly", "anrdoezrs.net", "dpbolvw.net", "jdoqocy.com",
  "kqzyfj.com", "tkqlhce.com", "emjcd.com", "cj.com",
  // infra / embeds / standards boilerplate
  "openstreetmap.org", "open-meteo.com", "openweathermap.org",
  "jma.go.jp/bosai/jmatile", "windy.com", "w3.org", "schema.org",
  "googleapis.com", "gstatic.com", "google.com/maps", "goo.gl",
  "arcgisonline.com", "basemaps.cartocdn.com", "tile.opentopomap.org",
  // social - permanent bot walls make machine checks meaningless
  "facebook.com", "instagram.com", "twitter.com", "x.com/",
  // our own properties
  "feelzlike.com", "localhost", "replit",
];

const URL_RE = /https?:\/\/[A-Za-z0-9][A-Za-z0-9./_%~#?&=+-]*/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (SKIP_FILES.has(name)) continue;
    else if (/\.(ts|tsx|json)$/.test(name)) yield p;
  }
}

function cleanUrl(raw) {
  // Strip trailing punctuation the regex can drag in from prose/comments.
  let url = raw.replace(/[.,;:)\]}'"`\\]+$/, "");
  // Template-literal fragments (contain ${) are dynamic - skip.
  if (url.includes("$%7B") || raw.includes("${")) return null;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Curated stay/eat JSON carries `source_urls` - research provenance for the
 * entry, never rendered in the UI (verified: no component reads the field).
 * Checking them alarms the owner about pages no visitor can reach (and
 * directory sites rot constantly), so strip them before the regex scan.
 * Non-JSON files and unparseable JSON fall through to a raw text scan.
 */
function scannableText(file, text) {
  if (!file.endsWith(".json")) return text;
  try {
    const drop = (node) => {
      if (Array.isArray(node)) node.forEach(drop);
      else if (node && typeof node === "object") {
        delete node.source_urls;
        Object.values(node).forEach(drop);
      }
    };
    const parsed = JSON.parse(text);
    drop(parsed);
    return JSON.stringify(parsed);
  } catch {
    return text;
  }
}

const byUrl = new Map();
let scanned = 0;
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    scanned++;
    const text = scannableText(file, readFileSync(file, "utf8"));
    for (const m of text.match(URL_RE) ?? []) {
      const url = cleanUrl(m);
      if (!url) continue;
      const lower = url.toLowerCase();
      if (EXCLUDE_HOSTS.some((h) => lower.includes(h))) continue;
      const entry = byUrl.get(url) ?? { url, sources: [] };
      const src = relative(ROOT, file);
      if (!entry.sources.includes(src)) entry.sources.push(src);
      if (src.startsWith("src/data/transport/")) {
        const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        entry.contentCheck = {
          ...(STABLE_OPERATOR_IDENTITIES.has(hostname)
            ? { expectedAny: STABLE_OPERATOR_IDENTITIES.get(hostname) }
            : {}),
        };
      }
      byUrl.set(url, entry);
    }
  }
}

const links = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: "generated by feelzlike/scripts/generate-link-manifest.mjs - do not edit by hand",
      count: links.length,
      links,
    },
    null,
    2,
  ) + "\n",
);
console.log(`[link-manifest] scanned ${scanned} files, wrote ${links.length} unique external links → ${relative(process.cwd(), OUT)}`);
