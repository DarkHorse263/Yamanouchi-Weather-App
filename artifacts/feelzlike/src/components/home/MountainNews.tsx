import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Bus,
  CableCar,
  CalendarDays,
  CloudSnow,
  DoorOpen,
  Megaphone,
  Mountain,
  Newspaper,
  Package,
  Plane,
  Snowflake,
  Tag,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { getAllNews, type NewsCategory, type NewsItem } from "@/data/news";
import { readFavourites } from "@/lib/favourites";
import {
  isKnownRegionId,
  readFavouriteRegion,
  readLastTown,
} from "@/lib/favouriteRegion";
import { getRegion } from "@/regions";
import {
  useAnnouncements,
  type Announcement,
  type AnnouncementCategory,
} from "@/lib/news/announcements";

// How many blended items to show on the home strip. Kept short so the home
// page stays scannable · "see all news" links through to the full feed.
const MAX_ITEMS = 4;
// How many distinct regions we treat as "your mountains" · the union of saved
// towns + last visited + favourite region, capped so the feed stays focused.
const MAX_REGIONS = 3;

// Live announcements (GET /api/announcements) and their NewsItem mapping live
// in the shared module so the home strip and /news render the same feed.

// Unified row model · curated link + live resort update collapse into one
// shape so the strip can sort and render them together.
interface FeedItem {
  key: string;
  kind: "news" | "announcement";
  title: string;
  href: string;
  external: boolean;
  source: string;
  publishedAt: string;
  pinned: boolean;
  sponsored: boolean;
  Icon: LucideIcon;
  regionId?: string;
}

const NEWS_ICON: Record<NewsCategory, LucideIcon> = {
  resort: Mountain,
  transport: Bus,
  passes: Ticket,
  gear: Package,
  deals: Tag,
  travel: Plane,
};

const ANNOUNCEMENT_ICON: Record<AnnouncementCategory, LucideIcon> = {
  opening: DoorOpen,
  snowmaking: Snowflake,
  lifts: CableCar,
  event: CalendarDays,
  conditions: CloudSnow,
  general: Megaphone,
  news: Newspaper,
};

/**
 * The regions to personalise the strip around: saved favourites first, then
 * the last town the user opened, then any favourite region · de-duped and
 * capped. Read once synchronously (client-only SPA) so the heading and scope
 * are correct on first paint with no "all -> personalised" flash.
 */
function personalisedRegions(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  const add = (id: string | null | undefined) => {
    if (isKnownRegionId(id) && !ids.includes(id)) ids.push(id);
  };
  try {
    for (const f of readFavourites()) add(f.regionId);
    add(readLastTown()?.regionId);
    add(readFavouriteRegion());
  } catch {
    /* localStorage blocked · fall back to the generic feed */
  }
  return ids.slice(0, MAX_REGIONS);
}

function newsToFeed(n: NewsItem): FeedItem {
  return {
    key: `news:${n.id}`,
    kind: "news",
    title: n.title,
    href: n.url,
    external: true,
    source: n.source,
    publishedAt: n.publishedAt,
    pinned: false,
    sponsored: !!n.sponsored,
    Icon: NEWS_ICON[n.category] ?? Newspaper,
  };
}

function announcementToFeed(a: Announcement): FeedItem {
  const regionLabel =
    a.sourceName?.trim() ||
    a.resort?.trim() ||
    getRegion(a.region)?.name ||
    a.region.replace(/-/g, " ");
  return {
    key: `ann:${a.id}`,
    kind: "announcement",
    title: a.title,
    // Link inward to the region hub (where the full resort-updates list lives)
    // rather than out · the goal is to pull people into their mountains.
    href: `/${a.region}`,
    external: false,
    source: regionLabel,
    publishedAt: a.publishedAt,
    pinned: !!a.pinned,
    sponsored: false,
    Icon: ANNOUNCEMENT_ICON[a.category] ?? Megaphone,
    regionId: a.region,
  };
}

// Brand-voice relative time · lowercase, no abbreviations. Handles both the
// date-only curated dates and the ISO datetimes from announcements.
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const day = 86_400_000;
  const diff = Date.now() - t;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function FeedRow({ item }: { item: FeedItem }) {
  const onOpen = () =>
    track("home_news_open", {
      category: item.sponsored ? "affiliate" : "navigation",
      data: {
        kind: item.kind,
        source: item.source,
        region_id: item.regionId ?? null,
        sponsored: item.sponsored,
      },
    });

  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-100">
        <item.Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-900">
          {item.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] text-slate-500">
          <span className="truncate">{item.source.toLowerCase()}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="tabular-nums">{timeAgo(item.publishedAt)}</span>
          {item.kind === "announcement" ? (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              update
            </span>
          ) : null}
          {item.sponsored ? (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              sponsored
            </span>
          ) : null}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-sky-600 transition-transform group-hover:translate-x-0.5" />
    </>
  );

  const className =
    "group flex items-center gap-3 border-t border-sky-100 py-3.5 pl-5 pr-3 transition-colors first:border-t-0 hover:bg-sky-50/60";

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel={item.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        onClick={onOpen}
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onOpen} className={className}>
      {inner}
    </Link>
  );
}

/**
 * Home-page "latest from your mountains" strip. Blends the curated news feed
 * with live resort announcements, scoped to the user's saved/visited regions
 * when we know them (otherwise a generic feed). Announcements and fresh news
 * naturally sort to the top by date; pinned announcements always lead. Renders
 * nothing only if there is genuinely nothing to show.
 */
export function MountainNews() {
  const [regionIds] = useState<string[]>(personalisedRegions);
  const personalised = regionIds.length > 0;

  // One shared request for all announcements (pinned-first, newest-first
  // server-side); we scope client-side. Degrades silently · curated news still
  // renders.
  const annQuery = useAnnouncements();

  const feed = useMemo<FeedItem[]>(() => {
    const allNews = getAllNews();
    const news = personalised
      ? allNews.filter(
          (n) => n.regions === "all" || n.regions.some((r) => regionIds.includes(r)),
        )
      : allNews;

    const allAnns = annQuery.data?.announcements ?? [];
    const anns = personalised
      ? allAnns.filter((a) => regionIds.includes(a.region))
      : allAnns;

    const items = [...anns.map(announcementToFeed), ...news.map(newsToFeed)];
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    return items.slice(0, MAX_ITEMS);
  }, [annQuery.data, personalised, regionIds]);

  if (feed.length === 0) return null;

  return (
    <section className="px-4 pt-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_24px_rgb(56,128,210,0.06)]"
      >
        <div className="flex items-center gap-1.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">
          <Newspaper className="h-3.5 w-3.5" />
          {personalised ? "latest from your mountains" : "from the mountains"}
        </div>

        {feed.map((item) => (
          <FeedRow key={item.key} item={item} />
        ))}

        <Link
          href="/news"
          onClick={() => track("home_news_see_all", { category: "navigation" })}
          className="group flex items-center justify-between gap-3 border-t border-sky-100 px-5 py-3 transition-colors hover:bg-sky-50/60"
        >
          <span className="text-[12px] font-semibold text-sky-700">see all news</span>
          <ArrowRight className="h-4 w-4 text-sky-700 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  );
}
