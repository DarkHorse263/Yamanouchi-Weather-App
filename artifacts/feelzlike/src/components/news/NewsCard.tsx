import { ArrowUpRight, Newspaper, Bus, Ticket, Package, Tag, MapPin } from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import type { NewsItem, NewsCategory } from "@/data/news";

const CATEGORY_ICON: Record<NewsCategory, React.ReactNode> = {
  resort: <Newspaper className="w-3 h-3" />,
  transport: <Bus className="w-3 h-3" />,
  passes: <Ticket className="w-3 h-3" />,
  gear: <Package className="w-3 h-3" />,
  deals: <Tag className="w-3 h-3" />,
  travel: <MapPin className="w-3 h-3" />,
};

const CATEGORY_GRADIENT: Record<NewsCategory, string> = {
  resort: "from-sky-500/30 to-blue-700/30",
  transport: "from-amber-500/30 to-orange-600/30",
  passes: "from-violet-500/30 to-purple-700/30",
  gear: "from-emerald-500/30 to-teal-700/30",
  deals: "from-rose-500/30 to-pink-700/30",
  travel: "from-cyan-500/30 to-sky-700/30",
};

interface Props {
  item: NewsItem;
  /** Compact variant for the per-region strip · hides the blurb on small screens */
  compact?: boolean;
}

/**
 * News link card. External links · always open in a new tab. Sponsored
 * items get a visible pill and rel="sponsored nofollow noopener" per
 * Google's link best practices and AU consumer law disclosure norms.
 */
export function NewsCard({ item, compact = false }: Props) {
  const rel = item.sponsored
    ? "sponsored nofollow noopener noreferrer"
    : "noopener noreferrer";
  const ago = formatDistanceToNowStrict(parseISO(item.publishedAt), { addSuffix: true });

  return (
    <a
      href={item.url}
      target="_blank"
      rel={rel}
      className="group block rounded-2xl border border-border bg-white overflow-hidden transition-all hover:border-primary/40 hover:shadow-md h-full"
    >
      <div className={`relative aspect-[16/9] bg-gradient-to-br ${CATEGORY_GRADIENT[item.category]}`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-foreground/30">
            {CATEGORY_ICON[item.category]}
          </div>
        )}
        {item.sponsored && (
          <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/90 text-amber-950 text-[10px] font-bold uppercase tracking-widest">
            Sponsored
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-widest font-semibold">
          <span className="inline-flex items-center gap-1 text-primary">
            {CATEGORY_ICON[item.category]}
            {item.category}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground truncate">{item.source}</span>
        </div>

        <h3 className="font-display font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {!compact && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-snug line-clamp-2">
            {item.blurb}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span>{ago}</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </a>
  );
}
