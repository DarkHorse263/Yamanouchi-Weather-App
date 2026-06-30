---
name: feelzlike generated marketing docs
description: How the press-release / overview / partner-intro PDFs are generated, published, and kept honest.
---

# feelzlike generated marketing docs

Two tsx scripts under `artifacts/api-server/src/scripts/` render branded PDFs via puppeteer into the repo-root `exports/`:
- `build-press-release.ts` -> `feelzlike-press-release.pdf`
- `build-overview-pdfs.ts` -> `feelzlike-user-overview.pdf`, `feelzlike-investor-overview.pdf`, `feelzlike-partner-overview.pdf` (partner/industry intro is the newest, tag "Industry & partners").

## How to run
- Scripts are NOT wired into package.json. Run each with `pnpm --filter @workspace/api-server exec tsx src/scripts/<file>.ts`.
- chromium is resolved at runtime by the script; no extra setup.

## Publishing path (manual, easy to miss)
- PDFs are served by DIRECT URL only from `artifacts/feelzlike/public/downloads/`. There are NO in-app links to them.
- After regenerating you MUST manually copy `exports/*.pdf` into `artifacts/feelzlike/public/downloads/` (overwrite same names; partner-overview is an added name).
- feelzlike.com is LIVE; changes only appear after the owner (a novice) MANUALLY re-publishes. Do not assume edits go live automatically.

## Honesty rule applies to copy, not just app
**Why:** the brand is honesty-first; a marketing claim that the app can't back up is a real bug.
**How to apply:** verify every feature claim against `artifacts/feelzlike/src` before printing it. Known traps found while refreshing:
- Personalisation IS real (opt-in `personalisedScore.ts` / `ProfileSheet.tsx`, behind consent) -> a "tailors the mountain ranking" claim is accurate; reconcile with the "won't crown a winning mountain" line by framing it as the user's own opt-in profile.
- Green season is only real as Thredbo summer activities (`ThredboSummer.tsx`: summit chairlift walks, bike park). There is NO live trail status / fire danger / river-level feed -> do not claim them.
- Roads come from road authorities (NSW LiveTraffic, VicEmergency); BOM and JMA are WEATHER sources, never attribute roads to them.
- Do NOT claim snowfall heatmaps (not built).

## Voice scan before done
Run `pdftotext -layout <pdf> -` and grep for em/en dashes (`—|–`) plus stale terms. The press-release end marker must be `ENDS` (no flanking em dashes).
