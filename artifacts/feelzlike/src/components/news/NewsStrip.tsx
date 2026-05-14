import { Link } from "wouter";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { getNewsForRegion, type RegionId } from "@/data/news";
import { NewsCard } from "./NewsCard";

interface Props {
  regionId: RegionId;
  /** Max items to show in the strip · default 3 */
  limit?: number;
}

/**
 * Per-region news strip · drops onto the region landing page below the
 * towns picker. Shows the most recent items scoped to this region (plus
 * any "all"-tagged items like global gear reviews). Links to /news for
 * the full feed.
 */
export function NewsStrip({ regionId, limit = 3 }: Props) {
  const items = getNewsForRegion(regionId).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="byline text-muted-foreground inline-flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            News & updates
          </p>
          <h2 className="font-display font-semibold text-lg md:text-xl mt-1 text-foreground">
            From the mountains
          </h2>
        </div>
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
        >
          See all
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} compact />
        ))}
      </div>
    </section>
  );
}
