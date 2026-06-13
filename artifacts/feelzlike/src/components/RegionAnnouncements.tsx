import {
  useGetAnnouncements,
  type Announcement,
  type RegionFilterParameter,
} from "@workspace/api-client-react";
import { useRegion } from "@workspace/feelzlike-shell";
import { motion } from "framer-motion";
import {
  Megaphone,
  Snowflake,
  CloudSnow,
  CableCar,
  CalendarDays,
  Mountain,
  Info,
  Pin,
  Newspaper,
  ExternalLink,
} from "lucide-react";

/**
 * Shared in-app "resort updates" feed for the Australian regions
 * (snowy-mountains, victorias-high-country, tasmania). Reads the
 * GET /announcements endpoint, scoped to the active region, and polls
 * so opening-weekend news lands without a manual refresh.
 *
 * Brand voice: lowercase, middot separators, no em/en dashes, no emojis.
 */

const CATEGORY_META: Record<
  Announcement["category"],
  { label: string; icon: typeof Megaphone; accent: string }
> = {
  opening: { label: "opening", icon: Snowflake, accent: "border-l-sky-400" },
  snowmaking: { label: "snowmaking", icon: CloudSnow, accent: "border-l-cyan-400" },
  lifts: { label: "lifts", icon: CableCar, accent: "border-l-indigo-400" },
  event: { label: "event", icon: CalendarDays, accent: "border-l-violet-400" },
  conditions: { label: "conditions", icon: Mountain, accent: "border-l-blue-400" },
  general: { label: "update", icon: Info, accent: "border-l-slate-300" },
  news: { label: "news", icon: Newspaper, accent: "border-l-amber-400" },
};

function relativeTime(raw: string): string {
  try {
    const then = new Date(raw).getTime();
    if (isNaN(then)) return "";
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(raw)
      .toLocaleDateString("en-AU", { day: "numeric", month: "short" })
      .toLowerCase();
  } catch {
    return "";
  }
}

interface RegionAnnouncementsProps {
  /** Heading shown above the feed · omit on pages that supply their own. */
  heading?: boolean;
}

export function RegionAnnouncements({ heading = true }: RegionAnnouncementsProps) {
  const { region } = useRegion();
  const { data, isLoading, error } = useGetAnnouncements(
    { region: region.id as RegionFilterParameter },
    { query: { refetchInterval: 300000 } as never },
  );

  const announcements = data?.announcements ?? [];

  return (
    <section className="space-y-5">
      {heading && (
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-primary" />
            resort updates
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
            opening dates, snowmaking and lift news across {region.name.toLowerCase()}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-secondary/40 p-5 animate-pulse h-28"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-5 text-sm text-rose-700">
          couldn't load updates right now · pull to refresh in a moment.
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl bg-secondary/50 border border-dashed border-border text-center py-9 px-4">
          <Info className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-foreground">no updates yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            resort news for this region will appear here as the season ramps up.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((a, idx) => {
            const meta = CATEGORY_META[a.category] ?? CATEGORY_META.general;
            const Icon = meta.icon;
            return (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 6) * 0.06 }}
                className={`rounded-2xl glass border border-border border-l-2 ${meta.accent} p-5 shadow-sm`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[11px] uppercase tracking-wider font-black text-muted-foreground">
                      {meta.label}
                    </span>
                    {a.resort && (
                      <span className="text-sm font-bold text-foreground truncate">
                        · {a.resort.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-sky-500" />}
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {relativeTime(a.publishedAt)}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {a.title}
                </h3>

                {a.body && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {a.body}
                  </p>
                )}

                {a.sourceUrl && (
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mt-3 hover:underline"
                  >
                    {a.sourceName ? a.sourceName.toLowerCase() : "source"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RegionAnnouncements;
