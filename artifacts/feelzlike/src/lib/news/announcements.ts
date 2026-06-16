import { useQuery } from "@tanstack/react-query";
import type { NewsItem } from "@/data/news";

/**
 * Live resort announcements (GET /api/announcements) · resort-published updates
 * and server-side aggregated snow news. Shared by the home strip and the /news
 * page so both surfaces render the same automated feed.
 */
export type AnnouncementCategory =
  | "opening"
  | "snowmaking"
  | "lifts"
  | "event"
  | "conditions"
  | "general"
  | "news";

export interface Announcement {
  id: string;
  region: string;
  resort: string | null;
  category: AnnouncementCategory;
  title: string;
  body: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  pinned: boolean;
  publishedAt: string;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
}

/** One shared query (5-min cache) for every announcements-consuming surface. */
export function useAnnouncements() {
  return useQuery<AnnouncementsResponse>({
    queryKey: ["announcements", "all"],
    queryFn: async () => {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error(`announcements ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Map live announcements onto the curated NewsItem shape so the /news grid can
 * render them alongside the hand-curated affiliate links.
 *
 * Announcements are fanned out across the AU regions server-side (one row per
 * region), so we COLLAPSE by article (sourceUrl, else title) into a single card
 * whose `regions` is the union · this keeps the region filter working while
 * "all regions" never shows the same story three times. Every announcement is
 * editorial (sponsored: false); only curated items carry affiliate links.
 */
export function announcementsToNewsItems(anns: Announcement[]): NewsItem[] {
  const byArticle = new Map<string, { ann: Announcement; regions: Set<string> }>();
  for (const a of anns) {
    const key = (a.sourceUrl || a.title).trim().toLowerCase();
    if (!key) continue;
    const existing = byArticle.get(key);
    if (existing) {
      existing.regions.add(a.region);
      if (a.publishedAt > existing.ann.publishedAt) existing.ann = a;
    } else {
      byArticle.set(key, { ann: a, regions: new Set([a.region]) });
    }
  }
  return [...byArticle.values()].map(({ ann, regions }) => ({
    id: `ann:${ann.id}`,
    title: ann.title,
    blurb: ann.body ?? "",
    url: ann.sourceUrl ?? `/${ann.region}`,
    source: ann.sourceName ?? ann.resort ?? "feelzlike",
    // All live announcements surface under the "resort" filter · the curated
    // categories (transport/passes/gear/deals/travel) stay editorial-only.
    category: "resort",
    regions: [...regions],
    publishedAt: ann.publishedAt,
    sponsored: false,
  }));
}
