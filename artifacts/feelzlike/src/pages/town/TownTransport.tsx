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
  Mountain,
  MapPin,
  Route,
  ArrowUpRight,
  Star,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  useOptionalSeason,
  LiveBadge,
  PageHeader,
} from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";
import type { RegionId } from "@workspace/api-client-react";
import { CarHireCard } from "@/components/CarHireCard";
import {
  getProvidersForRegion,
  type TransportProvider,
} from "@/data/transport";
import type { TransportLeg } from "@/types/transport";
import { assertProvidersForRegion } from "@/lib/regionGuard";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  RideshareUnavailableNotice,
  townHasRideshare,
} from "@/components/RideshareUnavailableNotice";

type Translate = (en: string, ja?: string) => string;

type LegSection = {
  leg: TransportLeg;
  icon: typeof Mountain;
  title_en: string;
  title_ja: string;
  blurb_en: string;
  blurb_ja: string;
};

/**
 * Ordered exactly as the owner asked:
 *   1. up from the towns to the mountains,
 *   2. getting around the towns,
 *   3. getting into the region - which is where driving / car hire belongs,
 *      so the Europcar card sits here instead of pinned to the top.
 */
const LEG_SECTIONS: LegSection[] = [
  {
    leg: "to_mountain",
    icon: Mountain,
    title_en: "To the mountains",
    title_ja: "山・ゲレンデへ",
    blurb_en: "Shuttles and buses from the towns up to the resorts.",
    blurb_ja: "町からゲレンデへ向かうシャトル・バス。",
  },
  {
    leg: "around_town",
    icon: MapPin,
    title_en: "Around the towns",
    title_ja: "町なかの移動",
    blurb_en: "Local taxis and links for getting around town.",
    blurb_ja: "タクシーや地域の足など、町なかの移動。",
  },
  {
    leg: "to_town",
    icon: Route,
    title_en: "Getting to the towns",
    title_ja: "町へのアクセス",
    blurb_en: "Trains, coaches, transfers and car hire into the region.",
    blurb_ja: "電車・高速バス・送迎・レンタカーで地域へ。",
  },
];

/**
 * Generic, region-isolated Transport page.
 *
 * - Reads providers from the per-region static data layer (no shared API
 *   that could leak NSW data into a JP region - the original v0.3 bug).
 * - Runs `assertProvidersForRegion` before render so any future drift is
 *   caught loudly in dev and surfaced via Sentry in prod.
 * - Groups providers into three ordered journey legs (see LEG_SECTIONS):
 *   to the mountains, around the towns, then getting to the towns. Car
 *   hire lives in that last section, not pinned above everything.
 * - A provider flagged `featured` is lifted into a spotlight above the
 *   sections (owner-curated highlight, e.g. Cooma Coaches).
 * - Used as the default Transport route for any region that does not
 *   provide a custom override via `RegionRouter.Transport` (Snowy
 *   Mountains, Victoria's High Country and Yamanouchi ship custom pages).
 */
export function TownTransport() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const seasonCtx = useOptionalSeason();

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
    // Season filter: `seasonality: "winter_only"` ops self-hide when
    // the user is browsing the green season toggle, so we don't promise
    // a shuttle that isn't running.
    const townMountainIds = new Set(town?.nearbyMountainIds ?? []);
    const isGreen = seasonCtx?.isGreen ?? false;
    return guarded.filter((p) => {
      if (isGreen && p.seasonality === "winter_only") return false;
      if (townMountainIds.size > 0 && p.mountains_served) {
        return p.mountains_served.some((m) => townMountainIds.has(m));
      }
      return true;
    });
  }, [region.id, town?.id, town?.nearbyMountainIds, seasonCtx?.isGreen]);

  const featured = useMemo(
    () => providers.filter((p) => p.featured),
    [providers],
  );
  const regular = useMemo(
    () => providers.filter((p) => !p.featured),
    [providers],
  );
  const hasAny = providers.length > 0;
  const toTownSection = LEG_SECTIONS[2];

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      {town && (
        <PageMeta
          title={t(`${town.name} transport`, `${town.name}の交通`)}
          description={t(
            `Buses, shuttles, trains and shared transport serving ${town.name} in ${region.name}.`,
            `${region.name}・${t(town.name, town.nameJa)}を発着するバス・送迎・電車。`,
          )}
          path={`/${region.id}/${town.id}/transport`}
        />
      )}
      <PageHeader
        byline={`${region.name} · ${town ? t(town.name, town.nameJa) : t("Town", "町")}`}
        title={t("Transport", "交通")}
        description={t(
          `Buses, shuttles, trains and shared transport serving ${town?.name ?? "town"}.`,
          `${town ? t(town.name, town.nameJa) : "町"}を発着するバス・送迎・電車。`,
        )}
        badge={<LiveBadge tone="onDark" label={t("Curated", "編集済")} />}
      />
      <div className="mb-5" />

      {town && !townHasRideshare(town.id) && (
        <RideshareUnavailableNotice townName={t(town.name, town.nameJa)} t={t} />
      )}

      {featured.length > 0 && (
        <div className="mb-6 grid gap-4">
          {featured.map((p, i) => (
            <FeaturedProviderCard key={p.id} provider={p} index={i} t={t} />
          ))}
        </div>
      )}

      {!hasAny ? (
        <section>
          <SectionHeader section={toTownSection} t={t} />
          <div className="grid gap-4 sm:grid-cols-2">
            <CarHireCard regionId={region.id} t={t} />
          </div>
          <div className="mt-4">
            <EmptyStateCard
              icon={Bus}
              title={t("More transport coming", "公共交通機関の情報は準備中")}
              body={t(
                `Car hire is listed above. We're still verifying buses, shuttles and rail serving ${town?.name ?? region.name} before we list them.`,
                `レンタカーは上記に掲載しています。${town ? t(town.name, town.nameJa) : region.name}を発着するバス・送迎・電車は確認中です。`,
              )}
            />
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {LEG_SECTIONS.map((section) => {
            const items = regular.filter((p) => p.leg === section.leg);
            const isToTown = section.leg === "to_town";
            // The "getting to the towns" section always renders because car
            // hire lives there; the other two only appear when populated.
            if (items.length === 0 && !isToTown) return null;
            return (
              <section key={section.leg}>
                <SectionHeader section={section} t={t} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((p, idx) => (
                    <ProviderCard key={p.id} provider={p} index={idx} t={t} />
                  ))}
                  {isToTown && <CarHireCard regionId={region.id} t={t} />}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ section, t }: { section: LegSection; t: Translate }) {
  const Icon = section.icon;
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h2 className="font-display font-semibold text-lg text-foreground leading-tight">
          {t(section.title_en, section.title_ja)}
        </h2>
        <p className="byline text-muted-foreground/70">
          {t(section.blurb_en, section.blurb_ja)}
        </p>
      </div>
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

function ProviderLinks({ provider, t }: { provider: TransportProvider; t: Translate }) {
  return (
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
      {provider.extra_links?.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 text-primary" />
          {link.label_local ? t(link.label, link.label_local) : link.label}
        </a>
      ))}
    </div>
  );
}

function FeaturedProviderCard({
  provider,
  index,
  t,
}: {
  provider: TransportProvider;
  index: number;
  t: Translate;
}) {
  const Icon = typeIcon(provider.type);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-primary uppercase inline-flex items-center gap-1">
            <Star className="w-3 h-3" />
            {t("Featured", "おすすめ")}
          </p>
          <h3 className="font-display font-semibold text-xl text-foreground leading-tight mt-0.5">
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
      <ProviderLinks provider={provider} t={t} />
    </motion.article>
  );
}

function ProviderCard({
  provider,
  index,
  t,
}: {
  provider: TransportProvider;
  index: number;
  t: Translate;
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

      <ProviderLinks provider={provider} t={t} />
    </motion.article>
  );
}
