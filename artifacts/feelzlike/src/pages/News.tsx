import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Newspaper } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";
import { getAllNews, NEWS_CATEGORIES, type NewsCategory } from "@/data/news";
import { NewsCard } from "@/components/news/NewsCard";
import { useAnnouncements, announcementsToNewsItems } from "@/lib/news/announcements";

type RegionFilter = "all" | "snowy-mountains" | "victorias-high-country" | "yamanouchi";

const REGION_FILTERS: { id: RegionFilter; label: string }[] = [
  { id: "all", label: "All regions" },
  { id: "snowy-mountains", label: "Snowy Mountains" },
  { id: "victorias-high-country", label: "Victoria's High Country" },
  { id: "yamanouchi", label: "Yamanouchi" },
];

/**
 * Global /news page. Filterable by region and category, sorted newest
 * first. v1 is a flat grid · pagination only matters once we're north
 * of ~30 items. Until then we'd rather render everything and let users
 * scan.
 */
export default function News() {
  const [region, setRegion] = useState<RegionFilter>("all");
  const [category, setCategory] = useState<NewsCategory | "all">("all");

  const annQuery = useAnnouncements();

  const items = useMemo(() => {
    // Blend the automated announcements feed with the curated affiliate items so
    // /news is never a dead end · adding more sources fills this page too.
    const automated = announcementsToNewsItems(annQuery.data?.announcements ?? []);
    return [...automated, ...getAllNews()]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((item) => {
        if (region !== "all") {
          if (item.regions !== "all" && !item.regions.includes(region)) return false;
        }
        if (category !== "all" && item.category !== category) return false;
        return true;
      });
  }, [region, category, annQuery.data]);

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title="News & updates · feelzlike"
        description="Resort news, transport updates, season passes, gear and travel deals for the mountains feelzlike covers · Snowy Mountains, Victoria's High Country and Yamanouchi."
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
          News & updates
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
          Resort news, road & transport updates, season passes, gear reviews and travel deals · curated for the mountains feelzlike covers.
        </p>
      </header>

      <div className="mt-5 space-y-3">
        <FilterRow
          label="Region"
          options={REGION_FILTERS.map((r) => ({ id: r.id, label: r.label }))}
          active={region}
          onChange={(v) => setRegion(v as RegionFilter)}
        />
        <FilterRow
          label="Category"
          options={[{ id: "all", label: "All categories" }, ...NEWS_CATEGORIES]}
          active={category}
          onChange={(v) => setCategory(v as NewsCategory | "all")}
        />
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No items match these filters · try widening the region or category.
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

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/70 mr-1">
        {label}
      </span>
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={
              isActive
                ? "px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
                : "px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-border text-foreground hover:border-primary/40 hover:text-primary transition-colors"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
