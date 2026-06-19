/**
 * feelzlike news · hand-curated link feed.
 *
 * v1 ships as a typed list in the repo. To add an item, append to
 * NEWS_ITEMS below and redeploy. When we outgrow this (probably 50+
 * items or when the editorial cadence picks up) we move the same shape
 * into the database behind a small admin page · the field names are
 * already chosen to map cleanly onto a DB row.
 *
 * IMPORTANT: every item with `sponsored: true` MUST render rel="sponsored"
 * on its outbound link (the NewsCard component does this automatically).
 * Affiliate disclosure rules vary by jurisdiction · keep the sponsored
 * pill visible and don't bury the relationship in fine print.
 */

// Region ids are plain strings · validated at the call site against the
// active region registry. Keeping this loose lets news items reference
// regions before/after they're added without a type churn.
export type RegionId = string;

export type NewsCategory =
  | "resort"      // resort-published news, snow reports, openings
  | "transport"   // road closures, chains, shuttles, airport links
  | "passes"      // Epic, Ikon, multi-resort & season pass deals
  | "gear"        // product reviews, new releases, gear guides
  | "deals"       // accommodation, package, lift+stay specials
  | "travel";     // travel guides, town features, trip planning

export const NEWS_CATEGORIES: { id: NewsCategory; label: string }[] = [
  { id: "resort", label: "Resorts" },
  { id: "transport", label: "Transport" },
  { id: "passes", label: "Passes" },
  { id: "gear", label: "Gear" },
  { id: "deals", label: "Deals" },
  { id: "travel", label: "Travel" },
];

export interface NewsItem {
  id: string;
  title: string;
  blurb: string;
  url: string;
  source: string;          // short label · shows in pill (e.g. "Thredbo", "Epic Pass")
  category: NewsCategory;
  /** Region scope · "all" means surfaces in every region's strip and on /news */
  regions: RegionId[] | "all";
  /** ISO date · used for sorting and the "X days ago" label */
  publishedAt: string;
  /** Optional thumbnail · 16:9 ideally, falls back to a category gradient */
  imageUrl?: string;
  /** Set true for any commercial / affiliate link · forces sponsored pill + rel */
  sponsored?: boolean;
  /** Daily resort snow report · these lead the /news feed (where available) */
  snowReport?: boolean;
}

/**
 * Placeholder seed · swap real curated items in as they're sourced.
 * Mix of regions, categories and one sponsored example so the UI's
 * sponsored treatment is visible from the start.
 */
export const NEWS_ITEMS: NewsItem[] = [
  // Daily resort snow reports · link-out cards to each resort's official
  // morning report page. No live numbers in-card (the resorts publish those
  // client-side) · these are evergreen quick links during the AU season.
  {
    id: "perisher-snow-report",
    title: "Perisher daily snow report",
    blurb: "Official morning report from the resort · base and surface conditions, overnight snow and which lifts and runs are open today.",
    url: "https://www.perisher.com.au/reports-cams/reports/snow-report",
    source: "Perisher",
    category: "resort",
    regions: ["snowy-mountains"],
    publishedAt: "2026-06-16",
    snowReport: true,
  },
  {
    id: "falls-creek-snow-report",
    title: "Falls Creek daily snow report",
    blurb: "Official morning report from the resort · base and surface conditions, overnight snow and today's open lifts and runs.",
    url: "https://www.fallscreek.com.au/snowreport/",
    source: "Falls Creek",
    category: "resort",
    regions: ["victorias-high-country"],
    publishedAt: "2026-06-16",
    snowReport: true,
  },
  {
    id: "hotham-snow-report",
    title: "Mt Hotham daily snow report",
    blurb: "Official morning report from the resort · base and surface conditions, overnight snow and today's open lifts and runs.",
    url: "https://www.mthotham.com.au/mountain/conditions/snow-reports",
    source: "Mt Hotham",
    category: "resort",
    regions: ["victorias-high-country"],
    publishedAt: "2026-06-16",
    snowReport: true,
  },
  {
    id: "mt-buller-snow-report",
    title: "Mt Buller daily snow report",
    blurb: "Official morning report from the resort · base and surface conditions, overnight snow and today's open lifts and runs.",
    url: "https://www.mtbuller.com.au/winter/snow-weather/snow-report",
    source: "Mt Buller",
    category: "resort",
    regions: ["victorias-high-country"],
    publishedAt: "2026-06-16",
    snowReport: true,
  },
  {
    id: "thredbo-2026-season-pass",
    title: "Thredbo 2026 season pass · early bird closes soon",
    blurb: "Pre-season pricing on adult, family and Freedom Pass tiers · resort confirms June 7 lift opening target.",
    url: "https://www.thredbo.com.au/lift-tickets/season-passes/",
    source: "Thredbo",
    category: "resort",
    regions: ["snowy-mountains"],
    publishedAt: "2026-05-08",
  },
  {
    id: "perisher-epic-2026",
    title: "Perisher confirmed on Epic Pass for 2026 winter",
    blurb: "Unlimited days at Perisher plus Vail Resorts mountains in North America and Japan · Epic Australia Pass on sale now.",
    url: "https://www.epicpass.com/passes/epic-australia-pass.aspx",
    source: "Epic Pass",
    category: "passes",
    regions: ["snowy-mountains"],
    publishedAt: "2026-05-05",
    sponsored: true,
  },
  {
    id: "snowy-mountains-hwy-update",
    title: "Snowy Mountains Highway · Adaminaby to Cooma resurfacing",
    blurb: "Transport for NSW resurfacing works, expect single-lane stop-go between Adaminaby and Cooma weekdays through May.",
    url: "https://www.transport.nsw.gov.au/projects/current-projects",
    source: "Transport for NSW",
    category: "transport",
    regions: ["snowy-mountains"],
    publishedAt: "2026-05-02",
  },
  {
    id: "hotham-ikon-2026",
    title: "Mt Hotham & Falls Creek on Ikon Pass for 2026",
    blurb: "5 or 7 days at each resort included on the full Ikon Pass · Ikon Base Pass holders get blackouts in peak weeks.",
    url: "https://www.ikonpass.com/en/shop/pass",
    source: "Ikon Pass",
    category: "passes",
    regions: ["victorias-high-country"],
    publishedAt: "2026-05-01",
    sponsored: true,
  },
  {
    id: "great-alpine-rd-omeo",
    title: "Great Alpine Road · Omeo to Hotham winter access guide",
    blurb: "VicTraffic on what to expect on the southern approach · chains-fit point, fuel stops and live cam locations.",
    url: "https://traffic.vicroads.vic.gov.au/",
    source: "VicTraffic",
    category: "transport",
    regions: ["victorias-high-country"],
    publishedAt: "2026-04-29",
  },
  {
    id: "buller-stay-and-ski",
    title: "Mt Buller stay & ski packages from $189pp/night",
    blurb: "Mid-week packages bundling lift tickets, accommodation and lessons · Mansfield Mt Buller Tourism listings.",
    url: "https://www.mansfieldmtbuller.com.au/accommodation",
    source: "Mansfield Mt Buller",
    category: "deals",
    regions: ["victorias-high-country"],
    publishedAt: "2026-04-25",
    sponsored: true,
  },
  {
    id: "shiga-kogen-season-2026",
    title: "Shiga Kogen 2025-26 season wrap · 2026-27 dates announced",
    blurb: "Japan's largest ski area confirms its 2026-27 opening calendar across the 18 connected resorts.",
    url: "https://www.shigakogen.gr.jp/english/",
    source: "Shiga Kogen",
    category: "resort",
    regions: ["yamanouchi"],
    publishedAt: "2026-04-20",
  },
  {
    id: "snow-monkey-park-winter",
    title: "Jigokudani Snow Monkey Park · winter opening hours",
    blurb: "Operating hours and live conditions for the famous onsen-bathing macaques · 30 min from Yudanaka.",
    url: "https://en.jigokudani-yaenkoen.co.jp/",
    source: "Jigokudani Park",
    category: "travel",
    regions: ["yamanouchi"],
    publishedAt: "2026-04-15",
  },
  {
    id: "powder-ski-roundup-2026",
    title: "Powder ski of the year 2026 · 12-board shootout",
    blurb: "Independent test of all-mountain and powder skis from Black Crows, Atomic, Salomon, Volkl and more.",
    url: "https://www.skicanada.org/",
    source: "Ski Test",
    category: "gear",
    regions: "all",
    publishedAt: "2026-04-10",
  },
  {
    id: "snowys-clearance-may",
    title: "Snowys clearance · base layers & shells up to 40% off",
    blurb: "End-of-season clearance on Helly Hansen, Outdoor Research and Smartwool · ships across Australia.",
    url: "https://www.snowys.com.au/",
    source: "Snowys",
    category: "deals",
    regions: "all",
    publishedAt: "2026-04-08",
    sponsored: true,
  },
  {
    id: "avalanche-au-handbook",
    title: "Australian backcountry · 2026 avalanche awareness primer",
    blurb: "Mountain Safety Collective on snowpack, terrain choice and the new AU danger scale · free to read.",
    url: "https://www.mountainsafetycollective.org/",
    source: "Mountain Safety Collective",
    category: "travel",
    regions: ["snowy-mountains", "victorias-high-country"],
    publishedAt: "2026-04-05",
  },
  {
    id: "qantas-snow-season-routes",
    title: "Qantas adds extra Cooma & Albury services for snow season",
    blurb: "Increased frequency on Sydney-Cooma and Melbourne-Albury · onward shuttles to Thredbo, Perisher and Buller.",
    url: "https://www.qantas.com",
    source: "Qantas",
    category: "transport",
    regions: ["snowy-mountains", "victorias-high-country"],
    publishedAt: "2026-04-01",
    sponsored: true,
  },
  {
    id: "japan-rail-pass-snow",
    title: "JR Pass for ski trips · Yamanouchi via Nagano shinkansen",
    blurb: "Routing guide from Tokyo to Yudanaka via Nagano · whether the JR Pass still pays off after 2024 price changes.",
    url: "https://www.japan-guide.com/e/e2361.html",
    source: "Japan Guide",
    category: "travel",
    regions: ["yamanouchi"],
    publishedAt: "2026-03-28",
  },
  {
    id: "feelzlike-launch-note",
    title: "feelzlike · what's new this week",
    blurb: "Daily resort pick, simplified 6-day forecast and Thredbo summer mode · plus Omeo added in VIC.",
    url: "https://feelzlike.com/",
    source: "feelzlike",
    category: "travel",
    regions: "all",
    publishedAt: "2026-05-13",
  },
];

/**
 * Deals are hidden across every news surface (/news and the per-region
 * NewsStrip) until we have advertisers to fill the category. Remove this
 * predicate — and re-add the Deals category filter on /news — to bring them
 * back.
 */
const isVisibleNews = (n: NewsItem): boolean => n.category !== "deals";

/**
 * Daily snow reports are evergreen link-outs to each resort's morning report
 * page, so their date must roll forward to today each day · otherwise they read
 * as stale ("3 days ago"). We stamp snowReport items with the current local
 * date at read time. The live Thredbo report keeps its real feed timestamp (it
 * is already current), and a same-day feed datetime still sorts ahead of this
 * date-only stamp, so the live report leads the section.
 */
function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const withCurrentSnowReportDate = (n: NewsItem): NewsItem =>
  n.snowReport ? { ...n, publishedAt: todayIso() } : n;

export function getNewsForRegion(regionId: RegionId): NewsItem[] {
  return NEWS_ITEMS
    .filter(isVisibleNews)
    .filter((n) => n.regions === "all" || n.regions.includes(regionId))
    .map(withCurrentSnowReportDate)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getAllNews(): NewsItem[] {
  return NEWS_ITEMS
    .filter(isVisibleNews)
    .map(withCurrentSnowReportDate)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
