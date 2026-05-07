import { motion } from "framer-motion";
import { Compass, ExternalLink } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

import { EmptyStateCard } from "@/components/EmptyStateCard";

/**
 * TownExplore - region-tourism links list.
 *
 * Per the Apr 2026 product reset: "Explore have links to the local Tourism
 * Websites." The previous TownPlaces variant called Google Places to surface
 * attractions; that often returned thin/flaky results and competed with what
 * the local tourism boards already publish far better than we can.
 *
 * What it is now: a clean grouped list of authoritative outbound links
 * sourced from `regionConfig.tourismLinks`. Empty-state cleanly degrades.
 */
export function TownExplore() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const links = region.tourismLinks ?? [];

  // Group by category, preserving config order within groups.
  const grouped = new Map<string, typeof links>();
  for (const l of links) {
    const cat = t(l.category ?? "Links", l.categoryJa ?? l.category ?? "リンク");
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(l);
  }

  const townDisplayName = town ? t(town.name, town.nameJa) : t("Region", "地域");

  return (
    <div className="max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 md:px-10 pt-8 md:pt-12"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {townDisplayName}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Explore", "観光")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Official tourism, attraction, resort and onsen links for ${region.name}.`,
                `${region.name}の公式観光・観光地・スキー場・温泉リンク集。`,
              )}
            </p>
          </div>
          <LiveBadge label={t("Curated", "厳選")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {links.length === 0 ? (
        <section className="px-6 md:px-10 pt-10 pb-16">
          <EmptyStateCard
            icon={Compass}
            title={t("Explore links coming soon", "観光リンクは近日公開")}
            body={t(
              `We're putting together the official tourism links for ${region.name}. Check back shortly.`,
              `${region.name}の公式観光リンクを準備中です。今しばらくお待ちください。`,
            )}
          />
        </section>
      ) : (
        <section className="px-6 md:px-10 pt-8 pb-16 space-y-8">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-3">
                {category}
              </p>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {items.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 h-full"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {t(link.label, link.labelJa ?? link.label)}
                        </p>
                        {link.blurb || link.blurbJa ? (
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">
                            {t(link.blurb ?? "", link.blurbJa ?? link.blurb ?? "")}
                          </p>
                        ) : null}
                      </div>
                      <ExternalLink
                        className="w-4 h-4 text-muted-foreground/60 group-hover:text-blue-700 shrink-0 mt-0.5"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
