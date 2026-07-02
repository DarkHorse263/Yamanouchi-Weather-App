---
name: feelzlike ad kit generator
description: How the print/screen advertising assets (QR posters, stickers, boards, in-store screens) are produced and the design/honesty rules baked in.
---

# feelzlike advertising kit

A standalone export script renders the whole ad kit to `exports/ad-kit/` (stickers / posters / boards / screens subfolders, plus `_preview` PNGs for at-a-glance QA). It is NOT wired into the server runtime; run it on demand the same way as the overview PDFs (via `tsx` in the api-server workspace). Depends on the `qrcode` package (added to api-server) and puppeteer/Chromium.

**What it makes:** print PDFs with bleed + crop marks (A4/A3/A2 posters, round + square die-cut stickers, 6-sheet portrait + landscape outdoor boards) and exact-pixel screen PNGs (1920x1080 + 1080x1920 for supermarket/mall/convenience-store signage). Every asset carries a QR to `https://feelzlike.com` (plain link, no tracking, per owner) plus the human-readable `feelzlike.com` for boards.

**Durable design rules (don't relearn):**
- One shared HTML/CSS template scales via a `--u` unit = 1% of a reference dimension. Portrait / sticker / round are WIDTH-bound (`--u = trimW/100`); LANDSCAPE must be HEIGHT-bound (`--u = trimH/100`). Reason: in wide formats the binding constraint is height, and width-based sizing overflowed the frame (wordmark clipped at top, region line cut off at bottom), worst on the 2:1 board. Also size the landscape wordmark by `height`, not `width`, so it stays consistent across 16:9 vs 2:1.
- Print geometry: page = trim + 2*bleed + 2*mark; bleed box offset by `mark`, trim box offset by `mark+bleed`; crop marks sit in the mark band at the trim lines. Round sticker = square page with a dashed circle die-line at trim + artwork bleeding past it.
- **Why (honesty):** copy only claims real app features. "compare every mountain your town serves" (core), "snow, roads and transport", "by bus, shuttle or car" are all backed (transport is a real navigable feature: TransportType = bus|train|shuttle|taxi|rental_car). Deliberately AVOID car-centric "before you drive" wording; owner wants buses/other transport promoted to keep cars off the roads.
- Brand voice enforced: lowercase, middot ·, NO em/en dashes, no emojis, DIN Pro (embedded base64), sky/blue gradient, white reversed wordmark on dark bg. QR is navy-on-white in a rounded card. Verify every regen with a dash audit (`pdftotext -layout | grep -E "—|–"` = 0) and check screen PNG pixel dims exactly.
- These are OWNER production assets for printers/screen operators, NOT public site downloads, so they live in `exports/ad-kit/` only (do not copy into feelzlike `public/downloads`).
