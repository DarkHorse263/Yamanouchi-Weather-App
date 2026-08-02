---
name: feelzlike bluebird bold palette
description: The Aug 2026 "bluebird bold" repaint — scoped blue surfaces, token semantics stay light, contrast rules.
---

Owner-approved direction (Aug 2026): "bluebird bold" — deep saturated blue #0055FF structural surfaces, crisp white cards, ink #0F172A text, strong soft shadows, snow-pink #EC008C invariant.

**Rules (hard-learned):**
- Global CSS tokens keep LIGHT-surface semantics: `--background` near-white, `--foreground` ink, `--primary` blue-on-white. Hundreds of legacy components render `text-foreground` / `text-primary` on white cards; setting those tokens to white blanks the whole app (weather stats rendered empty).
- The blue canvas is applied EXPLICITLY, never via tokens: PageHeader panel `bg-[#0055FF]` (emerald in green season), `.glass-strong` mobile top/bottom bars are solid blue, BackBar `bg-[#0055FF]/95`, TownHome/DesktopHome paint themselves with hardcoded ink/blue classes.
- White text is allowed ONLY on those confirmed blue surfaces; anything on the light canvas or white cards uses ink/slate.
- Section accents (sectionAccents.ts) are used as TEXT on white — hues must pass AA on white (deepened to 600/700-range: sky #0284C7, emerald #059669, amber #D97706, orange #EA580C, green #16A34A, gold #CA8A04). Snow-pink and Today primary-blue invariants unchanged.
- Season tone: blue = winter, emerald = green season (PageHeader + TownHome canvas both season-aware).

**Why:** the first repaint pass flipped global tokens to white-on-blue and silently blanked every white card; scoped blue is the only safe pattern here.
**How to apply:** any new page or restyle — paint blue zones explicitly, keep tokens light, check text colour against the actual surface it sits on.
