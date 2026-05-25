---
name: feelzlike brand voice
description: Strict typography and casing rules for the feelzlike PWA, including how they interact with legal pages.
---

Rules (absolute):
- Lowercase voice in UI copy and disclosures.
- Separator is middot `·` (`&middot;`). Never em-dash, never en-dash.
- No emojis anywhere.
- Operating entity is "Navigate Work Digital Pty Ltd".

**Why:** consistent terse mountain-conditions tone is the brand. Em/en dashes break it visually because the site is built around middot as a separator (sources lists, footer nav, section title separators).

**How to apply:**
- New legal sections in `artifacts/feelzlike/src/pages/legal/Terms.tsx` and `Privacy.tsx`: body copy is sentence case, lowercase voice; section *titles* follow the existing title-case pattern in those files ("4 · Third-party content"). Do NOT lowercase the existing section titles in a drive-by edit — the convention is set.
- Affiliate disclosure pattern lives in `HomeFooter.tsx` (footer paragraph linking to `/legal/terms#affiliate-links`). When affiliate outbound links get wired into town Stay cards / platform bars, add a near-link inline label too (FTC/ACL conspicuousness).
