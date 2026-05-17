import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Bus,
  Phone,
  Globe,
  CalendarCheck,
  Train,
  Car,
  Footprints,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  LiveBadge,
  PageHeader,
} from "@workspace/feelzlike-shell";
import type { RegionId } from "@workspace/api-client-react";
import {
  getProvidersForRegion,
  type TransportProvider,
} from "@/data/transport";
import { assertProvidersForRegion } from "@/lib/regionGuard";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  RideshareUnavailableNotice,
  townHasRideshare,
} from "@/components/RideshareUnavailableNotice";

/**
 * Generic, region-isolated Transport page.
 *
 * - Reads providers from the per-region static data layer (no shared API
 *   that could leak NSW data into a JP region - the original v0.3 bug).
 * - Runs `assertProvidersForRegion` before render so any future drift is
 *   caught loudly in dev and surfaced via Sentry in prod.
 * - Used as the default Transport route for any region that does not
 *   provide a custom override via `RegionRouter.Transport`.
 *
 * Yamanouchi ships a custom rich Transport page (winter timetables, kanji
 * sections, etc.) wired through `yamanouchiRouter.Transport`, so JP towns
 * never reach this generic component - but if they did, they would still
 * see only Japanese providers thanks to the data layer + guard.
 */
export function TownTransport() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const providers = useMemo<TransportProvider[]>(() => {
    const all = getProvidersForRegion(region.id as RegionId);
    const guarded = assertProvidersForRegion(all, region.id as RegionId, {
      source: "transport providers",
      page: `/${region.id}/${town?.id ?? ""}/transport`,
    });
    // Per-town relevance: when a provider declares `mountains_served`,
    // require overlap with the active town's `nearbyMountainIds`. Rail
    // spines and region-wide ops (shinkansen, snow shuttles) leave
    // `mountains_served` undefined and surface in every town.
    const townMountainIds = new Set(town?.nearbyMountainIds ?? []);
    if (townMountainIds.size === 0) return guarded;
    return guarded.filter((p) => {
      if (!p.mountains_served) return true;
      return p.mountains_served.some((m) => townMountainIds.has(m));
    });
  }, [region.id, town?.id, town?.nearbyMountainIds]);

  return (
    <div className="px-4 md:px-10 py-5 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        byline={`${region.name} · ${town ? t(town.name, town.nameJa) : t("Town", "町")}`}
        title={t("Transport", "交通")}
        description={t(
          `Buses, shuttles, trains and shared transport serving ${town?.name ?? "town"}.`,
          `${town ? t(town.name, town.nameJa) : "町"}を発着するバス・送迎・電車。`,
        )}
        badge={<LiveBadge tone="onDark" label={t("Curated", "編集済")} />}
      />
      <div className="mb-6" />

      {town && !townHasRideshare(town.id) && (
        <RideshareUnavailableNotice
          townName={t(town.name, town.nameJa)}
          t={t}
        />
      )}

      {providers.length === 0 ? (
        <EmptyStateCard
          icon={Bus}
          title={t("Transport launching soon", "交通情報、近日公開")}
          body={t(
            `We're verifying every bus, shuttle and rail option serving ${town?.name ?? region.name} so the listing is correct on day one.`,
            `${town ? t(town.name, town.nameJa) : region.name}を発着するバス・送迎・電車を一つずつ確認中です。公開時には正確な情報をお届けします。`,
          )}
          eta={t("ETA: This sprint", "公開予定：このスプリント")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((p, idx) => (
            <ProviderCard key={p.id} provider={p} index={idx} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function typeIcon(type: TransportProvider["type"]) {
  switch (type) {
    case "train":
      return Train;
    case "shuttle":
      return Footprints;
    case "taxi":
    case "rental_car":
      return Car;
    case "bus":
    default:
      return Bus;
  }
}

function ProviderCard({
  provider,
  index,
  t,
}: {
  provider: TransportProvider;
  index: number;
  t: (en: string, ja?: string) => string;
}) {
  const Icon = typeIcon(provider.type);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border bg-white p-5 flex flex-col"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-base text-foreground leading-tight">
            {provider.name_local
              ? t(provider.name, provider.name_local)
              : provider.name}
          </h3>
          <p className="byline text-muted-foreground/70 mt-0.5">
            {provider.operator}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground/90 mt-3 leading-relaxed">
        {provider.route_summary_local
          ? t(provider.route_summary, provider.route_summary_local)
          : provider.route_summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {provider.phone && (
          <a
            href={`tel:${provider.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4 text-primary" />
            {provider.phone}
          </a>
        )}
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
          >
            <Globe className="w-4 h-4 text-primary" />
            {t("Website", "ウェブサイト")}
          </a>
        )}
        {provider.schedule_url && (
          <a
            href={provider.schedule_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-primary" />
            {t("Timetable", "時刻表")}
          </a>
        )}
      </div>
    </motion.article>
  );
}
