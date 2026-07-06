/**
 * Section accent colours · the "section tinting" colour direction.
 *
 * Each app section owns a colour, surfaced as colour-coded navigation
 * (desktop sidebar + mobile bottom nav) and the home section tiles. Keyed
 * by the nav item's PATH (region-relative, e.g. "/weather") so it survives
 * region navOverrides and href rewriting (/:region/weather, ~/premium) ·
 * resolve accents from `path`, never from the rendered href.
 *
 * Deliberately excluded:
 *  - "/" (Today) · the aggregator hub · stays on the brand blue (--primary).
 *  - snowfall amounts · always render in --color-snow-accent pink (#ec008c),
 *    never a section colour.
 *
 * The brand blue (--primary) remains the base for generic UI and for any
 * path not listed here (unknown/custom region nav entries fall back to it).
 */
export const SECTION_ACCENTS: Record<string, string> = {
  "/weather": "#1276D8", // sky blue · forecast + radar
  "/roads": "#0E8C7A", // teal · roads & cams
  "/transport": "#4F5BD5", // indigo · getting there
  "/stay": "#D98A17", // amber · where to stay
  "/eat": "#E5533D", // coral · where to eat
  "/explore": "#2FA36B", // green · explore
  "/plan": "#7A5AF0", // violet · trip planner
  "/premium": "#A6781E", // deep gold · premium hub
};

/** Look up a section's accent hex by its region-relative nav path. */
export function sectionAccentFor(path: string): string | undefined {
  return SECTION_ACCENTS[path];
}

/**
 * Tint a section hex toward white · mirrors the approved mockup's
 * `color-mix(in srgb, <hue> <pct>%, white)`. Used for soft backgrounds,
 * borders and icon chips so a section reads as "owned" without shouting.
 * color-mix has baseline browser support (2023+).
 */
export function mixSection(hex: string, pct: number): string {
  return `color-mix(in srgb, ${hex} ${pct}%, white)`;
}
