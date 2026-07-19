---
name: feelzlike link-rot audit
description: durable lessons from the jul 2026 full external-link audit (331 urls) — hijack risk, JP url churn, canonical replacements
---

# feelzlike link-rot audit (last full sweep: 8 jul 2026)

**Rule:** external links rot fast, and one dropped domain got HIJACKED — treat link audits as a security task, not just UX.
**Why:** `hothambus.com` lapsed and was squatted by a Chinese spam site while we linked it; the real operator is `hothambus.com.au`. A hijacked link on an "honesty-first" travel site is a trust disaster.
**How to apply:** on any future sweep, check flagged domains for content mismatch (spam/parked pages), not just HTTP status. Prefer `.com.au`/`.co.jp` official variants over `.com` for small operators.

## Churn patterns worth knowing
- **Second confirmed hijack (jul 2026):** `sekionsen.com` (Seki Onsen, Myoko) 301s to a spam domain (`sip33fg.com`); the real official site is `http://sekionsen.jp/` (HTTP-only, no TLS). Small JP resort `.com` domains are prime squat targets — verify the `.jp` variant first.
- JP resort sites restructure yearly: livecam pages move (`shigakogen.gr.jp/english/livecamera/` → `/english/live/index.html`), domains migrate (`kitashiga.net` → `kitashiga.co.jp`, `kumanoyu.com` → `kumanoyu.co.jp`, `hakubacortina.jp` → gone, use `hakubavalley.com/en/weather_en/detail_cortina_en/`).
- go-nagano.net killed its `/en/destination/*` and `/en/area/*` trees; durable pages are `/en/trip-idea/id*` and `db.go-nagano.net/en/topics_detail12/id=*`.
- Where an official livecam page dies with no replacement, we link a working unofficial page and relabel `source:` honestly (e.g. `madaraokogen.com (local guide)` for madarao+tangram, `steep.jp (ski media)` for togari). Never leave an official-sounding source on an unofficial URL.
- `feelzlike.app` does not exist — contact/UA strings must use `feelzlike.com` (was wrong in ~8 api-server files once).
- Sandbox fetch quirks: ENOTFOUND/EAI_AGAIN/TLS errors and some 403/404s are sandbox DNS or bot-walls, not dead links (snowmonkeyresorts, prince.jp, kijimadaira, victoriashighcountry). Re-verify via webFetch before "fixing".
- `webcams.ts` has a shared `VERIFIED` date constant surfaced in UI — only bump it when ALL entries are re-checked.
- Known unfixables (bot-walled but alive): victoriashighcountry.com.au, cortina.co.jp (403 to non-browsers). The smoke test already classifies 401/403/429 etc. as "blocked, reachable" — never "fix" these.
- **Manifest blind spots:** `generate-link-manifest.mjs` scans feelzlike `src/data` + `src/regions` + `src/pages` only. api-server route data also carries user-facing URLs (hardcoded `websiteUrl` in routes/snow.ts, `webcamPageUrl` in routes/webcams.ts) and is NOT scanned — sweep it manually on every audit, it rotted with the exact same dead domains once.
- Same URL often lives in several shapes for one business: JSON `website` AND `booking_links.official` AND `source_urls` (by_region files AND the legacy feelzlike_data.json mirror). A dead-link fix must sweep all of them or the manifest keeps resurfacing the domain.
- Kita-Shiga portal `kitashiga.co.jp` is dead (jul 2026): area link → `ryuoo.com/winter/kitashiga/`; per-resort → `x-jam.jp` (X-JAM + Yomase), `komaruyama.jp`.
- Permanently-closed businesses: null the `website`/`booking_links.official` (schema is nullable) or delete the entry outright if the business is gone (e.g. out-of-bounds-berridale-pizza, closed jan 2026) — never leave a parked/NXDOMAIN link.
