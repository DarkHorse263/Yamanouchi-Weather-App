---
name: feelzlike ad kit generator
description: How the print/screen advertising assets (QR posters, stickers, boards, in-store screens) are produced and the design/honesty rules baked in.
---

# feelzlike advertising kit

A standalone export script (`artifacts/api-server/src/scripts/build-ad-kit.ts`) renders the whole ad kit to `exports/ad-kit/`. It is NOT wired into the server runtime; run it on demand via `tsx` in the api-server workspace (same pattern as the overview PDFs). Depends on the `qrcode` package (added to api-server) and puppeteer/Chromium.

**Run it:** `pnpm --filter @workspace/api-server exec tsx ./src/scripts/build-ad-kit.ts` builds BOTH themes by default into `exports/ad-kit/dark/...` and `exports/ad-kit/light/...` (subfolders: stickers / posters / boards / screens, plus `_preview` PNGs for at-a-glance QA). `AD_THEME=dark|light` limits to one theme. `AD_EXPLORE=1` renders just the two screens for both themes into `exports/ad-kit/_explore/` for quick mood comparison before a full run.

**What it makes:** print PDFs with bleed + crop marks (A4/A3/A2 posters, round + square die-cut stickers, 6-sheet portrait + landscape outdoor boards) and exact-pixel screen PNGs (1920x1080 + 1080x1920 for supermarket/mall/convenience-store signage). Every asset carries a QR to `https://feelzlike.com` (plain link, no tracking, per owner) plus the human-readable `feelzlike.com`.

**Design direction (settled after two rejected drafts):** CLEAN / MINIMAL, brand-led. The photo + gradient + fake-triangle-mountains v1 was rejected ("horrible"); a photo-hero redesign was also dropped. Final = the FULL brand logo + copy + QR/URL on a refined brand background, nothing else. NO photography, NO illustration, NO snow specks.
- **"the logo" = the full combination mark** (mountain emblem with the river/"z" swoosh ABOVE the `feelzlike` wordmark), NOT the plain wordmark. Using the wordmark alone gets bounced ("why aren't you using the logo?"). Files: dark-bg (reversed/white) = `attached_assets/feelzlike_dark/feelzlike_colour_150426_1777334678271_dark.png`; light-bg (colour) = `attached_assets/feelzlike_colour_150426_1777334678271.png`. Icon-only (no words) = `attached_assets/feelzlike_colour_NoWords_210526_1779335485767.png` (not used in the kit).
- Two themes via `AD_THEME` + CSS custom properties on `.page` (see `THEMES`): **dark** = deep navy gradient + reversed logo + white ink; **light** = ice-white gradient + colour logo + navy ink. QR is always navy-on-white in a rounded card (bordered on light so it reads).
- The full logo is roughly SQUARE (emblem stacked over wordmark), unlike the old wide wordmark. Size it accordingly: portrait/sticker/round by `width` (~40-52%), landscape by `height` (~30 of the height-based `--u`). Do not reuse wordmark widths (they render the square logo far too tall).

**Durable layout/print rules (don't relearn):**
- One shared HTML/CSS template scales via a `--u` unit = 1% of a reference dimension. Portrait / sticker / round are WIDTH-bound (`--u = trimW/100`); LANDSCAPE must be HEIGHT-bound (`--u = trimH/100`). Reason: in wide formats height is the binding constraint; width-based sizing overflowed the frame (worst on the 2:1 board).
- Print geometry: page = trim + 2*bleed + 2*mark; bleed box offset by `mark`, trim box offset by `mark+bleed`; crop marks sit in the mark band at the trim lines. Round sticker = square page with a dashed circle die-line at trim + artwork bleeding past it.

**Copy (honesty-first; only claims real app features):**
- Headline: `which mountain today?`
- Sub: `the daily snow, road and transport check for the resort town you are staying in. compare every mountain your town serves and how to get there.` (owner trimmed the old "· and how to get there by bus, shuttle or car" tail down to "and how to get there"; removed the middot before "and").
- The regions/count line ("10 resort regions · australia · japan · new zealand") was REMOVED by the owner — do not reintroduce.
- Deliberately AVOID car-centric "before you drive" wording; owner wants buses/other transport promoted. Transport IS a real feature (TransportType = bus|train|shuttle|taxi|rental_car).
- Brand voice: lowercase, middot ·, NO em/en dashes, no emojis, DIN Pro (embedded base64), sky/blue. `dotify()` wraps ` · ` separators in a sky-blue span; safe even when copy has no middots.

**These are OWNER production assets** for printers/screen operators, NOT public site downloads, so they live in `exports/ad-kit/` only (do NOT copy into feelzlike `public/downloads`).
