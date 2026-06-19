import { useMemo } from "react";
import { Link } from "wouter";
import { Newspaper } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";
import { getAllNews } from "@/data/news";
import { NewsCard } from "@/components/news/NewsCard";
import { useAnnouncements, announcementsToNewsItems } from "@/lib/news/announcements";

/**
 * Global /news page. A flat, newest-first grid of article links · no
 * region/category filters (the list is short enough to scan). Items with no
 * body content are dropped so every card is a real article. "Deals" are
 * hidden until we have advertisers — that moratorium lives in getAllNews() /
 * getNewsForRegion() so it applies to every news surface, not just /news.
 */
export default function News() {
  const annQuery = useAnnouncements();

  const items = useMemo(() => {
    // Blend the automated announcements feed with the curated article links,
    // newest first. getAllNews() already excludes the deals category; here we
    // also drop content-less announcement cards so every tile is a real article.
    const automated = announcementsToNewsItems(annQuery.data?.announcements ?? []);
    return [...automated, ...getAllNews()]
      .filter((item) => item.blurb.trim().length > 0)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [annQuery.data]);

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title="News Articles · feelzlike"
        description="Resort news, transport updates, season passes, gear and travel guides for the mountains feelzlike covers · Snowy Mountains, Victoria's High Country and Yamanouchi."
        path="/news"
        jsonLd={[
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: "News", url: "https://feelzlike.com/news" },
          ]),
        ]}
      />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
      >
        <span aria-hidden>‹</span>
        Home
      </Link>

      <header className="mt-4">
        <p className="byline text-muted-foreground inline-flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5" />
          feelzlike
        </p>
        <h1 className="font-display font-semibold text-3xl md:text-5xl tracking-tight mt-1 text-foreground">
          News Articles
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
          Links to the best mountain, equipment and travel articles · curated for the mountains feelzlike covers.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No articles just yet · check back soon.
        </p>
      ) : (
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </section>
      )}

      <p className="mt-8 pt-5 border-t border-border text-xs text-muted-foreground/70 max-w-2xl">
        Items marked sponsored may be affiliate or commercial links · feelzlike may earn a commission at no extra cost to you. Editorial picks are not paid for.
      </p>
    </div>
  );
}
