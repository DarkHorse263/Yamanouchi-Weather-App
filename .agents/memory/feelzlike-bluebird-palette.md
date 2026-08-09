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

> Aug 2026 update: blue now painted across ENTIRE page canvases (AppShell main container + out-of-shell pages Welcome/Countries/CountryHome/NearYouWeather/Premium/Account/TripPlanner), still EXPLICITLY per surface · global tokens remain light. White cards float on blue; text directly on blue must be white or white/70+. Loading/empty/error states on blue wrappers must NOT use text-muted-foreground. White logo asset = public/branding/logo-white.png (generated from logo-full-colour, use as-is, no invert filters). Mobile bottom nav = Today/Weather/Roads/Plan/Account with a Plan sheet (travelOpen state lives at AppShell top level, not in the render IIFE); mobile tab labels render first word only.

> Aug 2026 green-season sweep DONE (both seasons verified desktop+mobile). The unreadable leftovers were pages the repaint never touched: MountainsList (light backdrop band + dark header), region alerts pages, RegionSources footer note, bespoke transport pages' on-canvas section labels (snowy/vhc/yamanouchi). Rule of thumb: any page rendered inside AppShell without its own canvas sits on the seasonal blue/emerald — every on-canvas label must be white/70+, and `bg-secondary`/translucent cards must become solid white before holding ink text.

## Detail-page repaint gotchas (Aug 2026, mountain/resort pages)
- The three resort/mountain detail pages (snowy LocationDetail, generic MountainDetail, yamanouchi resort) paint their OWN seasonal canvas: `isGreen/isSummer ? #059669 : #0055FF`. Fallback states (not-found / loading / error) must return INSIDE that wrapper or they flash the white body with unreadable text.
- Hero aurora backdrops fade into the canvas via a hardcoded gradient stop — it must match the seasonal canvas colour (LocationDetail inline; ResortHero takes a `canvasColor` prop).
- `.byline` (index.css) is now inside `@layer components` so Tailwind `text-*` utilities can override its muted-foreground default; on blue/green canvases every byline still needs an explicit `text-white/70`-style class.
- snowy LoadingState/ErrorState components take an `onCanvas` prop that flips them white for on-canvas use.
