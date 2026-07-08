---
name: feelzlike link-rot audit
description: durable lessons from the jul 2026 full external-link audit (331 urls) — hijack risk, JP url churn, canonical replacements
---

# feelzlike link-rot audit (last full sweep: 8 jul 2026)

**Rule:** external links rot fast, and one dropped domain got HIJACKED — treat link audits as a security task, not just UX.
**Why:** `hothambus.com` lapsed and was squatted by a Chinese spam site while we linked it; the real operator is `hothambus.com.au`. A hijacked link on an "honesty-first" travel site is a trust disaster.
**How to apply:** on any future sweep, check flagged domains for content mismatch (spam/parked pages), not just HTTP status. Prefer `.com.au`/`.co.jp` official variants over `.com` for small operators.

## Churn patterns worth knowing
- JP resort sites restructure yearly: livecam pages move (`shigakogen.gr.jp/english/livecamera/` → `/english/live/index.html`), domains migrate (`kitashiga.net` → `kitashiga.co.jp`, `kumanoyu.com` → `kumanoyu.co.jp`, `hakubacortina.jp` → gone, use `hakubavalley.com/en/weather_en/detail_cortina_en/`).
- go-nagano.net killed its `/en/destination/*` and `/en/area/*` trees; durable pages are `/en/trip-idea/id*` and `db.go-nagano.net/en/topics_detail12/id=*`.
- Where an official livecam page dies with no replacement, we link a working unofficial page and relabel `source:` honestly (e.g. `madaraokogen.com (local guide)` for madarao+tangram, `steep.jp (ski media)` for togari). Never leave an official-sounding source on an unofficial URL.
- `feelzlike.app` does not exist — contact/UA strings must use `feelzlike.com` (was wrong in ~8 api-server files once).
- Sandbox fetch quirks: ENOTFOUND/EAI_AGAIN/TLS errors and some 403/404s are sandbox DNS or bot-walls, not dead links (snowmonkeyresorts, prince.jp, kijimadaira, victoriashighcountry). Re-verify via webFetch before "fixing".
- `webcams.ts` has a shared `VERIFIED` date constant surfaced in UI — only bump it when ALL entries are re-checked.
- Known unfixables (bot-walled but alive): victoriashighcountry.com.au, cortina.co.jp (403 to non-browsers).
