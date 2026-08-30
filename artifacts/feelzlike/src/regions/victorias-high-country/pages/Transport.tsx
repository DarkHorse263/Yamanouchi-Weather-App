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
  ExternalLink,
  Info,
  Handshake,
} from "lucide-react";

import {
  useLanguage,
  useBaseTown,
  useRegion,
  useOptionalSeason,
  LiveBadge,
  PageHeader,
} from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

import { VICTORIAS_HIGH_COUNTRY_TRANSPORT } from "@/data/transport/victorias-high-country";
import type { TransportProvider } from "@/types/transport";
import { assertProvidersForRegion } from "@/lib/regionGuard";
import {
  RideshareUnavailableNotice,
  townHasRideshare,
} from "@/components/RideshareUnavailableNotice";
import { CarHireCard } from "@/components/CarHireCard";

/**
 * Victoria's High Country custom Transport page.
 *
 * Structure (matches Snowy Mountains pattern):
 *   1. V/Line hero - the regional rail/coach spine, always shown.
 *   2. Per-town primary coach hero (when one applies in the active
 *      season). MMBL for Mansfield, FCC for Mt Beauty, Snowball Express
 *      for Bright / Harrietville / Dinner Plain (winter only). Marysville
 *      and Warburton have no specialised operator.
 *   3. "Other operators" grid filtered by the active town's
 *      `nearbyMountainIds` so visitors only see ops that actually serve
 *      the mountain(s) they care about.
 *   4. Taxi & last-mile section, also town-filtered.
 *
 * Season-aware: providers tagged `seasonality: "winter_only"` are hidden
 * in AU green season (Dec-May) so we never recommend a coach that isn't
 * running.
 */

const VLINE_ID = "au-vline-train-coach";
/**
 * Snow Bus Australia is the Melbourne → all-three-resorts ski-coach,
 * analogous to Cooma Coaches' Snowy Mountains Bus Service in NSW. It
 * gets a dedicated secondary hero card on every base town it runs
 * through (Mansfield, Bright, Mt Beauty, Harrietville, Dinner Plain),
 * sitting underneath the town's local mountain coach hero. Winter only.
 */
const MULTI_RESORT_HERO_ID = "au-snow-bus-australia";

/**
 * Per-town primary coach operator. The "winter" entry takes precedence
 * in winter; "year_round" applies in both seasons. A town with no entry
 * shows just V/Line + the filtered grid (Marysville, Warburton).
 */
const TOWN_HERO: Record<string, { winter?: string; year_round?: string }> = {
  mansfield: { year_round: "au-mansfield-mt-buller-bus-lines" },
  bright: { winter: "au-snowball-express" },
  "mount-beauty": { year_round: "au-falls-creek-coach-service" },
  harrietville: { winter: "au-snowball-express" },
  "dinner-plain": { winter: "au-snowball-express" },
};

export function VictoriasHighCountryTransport() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.isGreen === true;

  // Provider data, region-guarded so any future drift is surfaced loudly
  // rather than silently leaking NSW operators into the VIC page.
  const allProviders = useMemo<TransportProvider[]>(() => {
    return assertProvidersForRegion(
      VICTORIAS_HIGH_COUNTRY_TRANSPORT,
      "victorias-high-country",
      {
        source: "victoriasHighCountryTransport",
        page: `/victorias-high-country/${town?.id ?? ""}/transport`,
      },
    );
  }, [town?.id]);

  const vline = useMemo(
    () => allProviders.find((p) => p.id === VLINE_ID),
    [allProviders],
  );

  const heroId = useMemo(() => {
    if (!town) return undefined;
    const cfg = TOWN_HERO[town.id];
    if (!cfg) return undefined;
    if (isGreen) return cfg.year_round;
    return cfg.winter ?? cfg.year_round;
  }, [town, isGreen]);

  const hero = useMemo(
    () => (heroId ? allProviders.find((p) => p.id === heroId) : undefined),
    [allProviders, heroId],
  );

  /**
   * Snow Bus Australia secondary hero. Only renders when the town's
   * mountains overlap Snow Bus's served mountains AND it's winter (the
   * record is `winter_only` so it self-hides in green season).
   */
  const multiResortHero = useMemo(() => {
    if (isGreen) return undefined;
    if (!town) return undefined;
    const sb = allProviders.find((p) => p.id === MULTI_RESORT_HERO_ID);
    if (!sb || sb.id === heroId || !sb.mountains_served) return undefined;
    const townMtns = new Set(town.nearbyMountainIds ?? []);
    const overlaps = sb.mountains_served.some((m) => townMtns.has(m));
    return overlaps ? sb : undefined;
  }, [allProviders, heroId, isGreen, town]);

  /**
   * Apply town + season + role filters in one pass:
   *   - drop V/Line (it has its own hero)
   *   - drop the per-town hero (it has its own hero)
   *   - drop winter_only ops in green season
   *   - drop ops whose mountains_served doesn't overlap the town's nearby
   *     mountains (when both are defined)
   */
  const townMountainIds = useMemo(
    () => new Set(town?.nearbyMountainIds ?? []),
    [town?.nearbyMountainIds],
  );

  const visible = useMemo(() => {
    return allProviders.filter((p) => {
      if (p.id === VLINE_ID) return false;
      if (heroId && p.id === heroId) return false;
      if (multiResortHero && p.id === multiResortHero.id) return false;
      if (isGreen && p.seasonality === "winter_only") return false;
      if (p.mountains_served && townMountainIds.size > 0) {
        const overlaps = p.mountains_served.some((m) => townMountainIds.has(m));
        if (!overlaps) return false;
      }
      return true;
    });
  }, [allProviders, heroId, multiResortHero, isGreen, townMountainIds]);

  const buses = useMemo(
    () => visible.filter((p) => p.type === "bus" || p.type === "shuttle"),
    [visible],
  );
  const taxis = useMemo(
    () => visible.filter((p) => p.type === "taxi" || p.type === "rental_car"),
    [visible],
  );

  // Towns with no specialist operator coverage in our data (Lake Mountain,
  // Donna Buang). We show V/Line + an honest "drive yourself" notice
  // instead of pretending a coach exists.
  const noLocalCoach = !hero && buses.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <PageMeta
        title={town ? t(`${town.name} transport - Victoria's High Country`, `${town.name}の交通 - ビクトリア・ハイカントリー`) : "Victoria's High Country transport"}
        description={
          isGreen
            ? t(
                "Trains, regional coaches and local taxis serving Victoria's High Country. V/Line runs year-round; the alpine ski-coach network returns in winter.",
                "ビクトリア・ハイカントリーの電車・地方バス・タクシー。V/Lineは通年運行。冬季限定のスキーバス網は冬に再開します。",
              )
            : t(
                "Trains, alpine coaches, shuttles and taxis serving Victoria's High Country resorts. V/Line is the regional spine; local operators connect to the slopes.",
                "ビクトリア・ハイカントリーのスキーリゾートへの電車・スキーバス・送迎・タクシー。V/Lineが地域の幹線、地元事業者がスキー場へ接続。",
              )
        }
        path={town ? `/victorias-high-country/${town.id}/transport` : "/victorias-high-country/transport"}
      />
      <div className="px-4 md:px-10 pt-4 md:pt-8">
        <PageHeader
          byline={`${region.name}${town ? ` · ${t(town.name, town.nameJa)}` : ""}`}
          title={t("Transport", "交通")}
          description={
            isGreen
              ? t(
                  "Trains, regional coaches and local taxis serving Victoria's High Country. V/Line runs year-round; the alpine ski-coach network returns in winter.",
                  "ビクトリア・ハイカントリーの電車・地方バス・タクシー。V/Lineは通年運行。冬季限定のスキーバス網は冬に再開します。",
                )
              : t(
                  "Trains, alpine coaches, shuttles and taxis serving Victoria's High Country. V/Line is the regional spine; local operators connect to the resorts.",
                  "ビクトリア・ハイカントリーの電車・スキーバス・送迎・タクシー。V/Lineが地域の幹線、地元事業者がスキー場へ接続。",
                )
          }
          badge={<LiveBadge tone="onDark" label={t("Curated", "編集済")} />}
        />
      </div>

      {/* V/Line hero - regional spine, always shown */}
      {vline && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <article className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
              <div className="shrink-0 self-start w-14 h-14 md:w-16 md:h-16 rounded-xl bg-purple-700 text-white flex items-center justify-center">
                <Train className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-purple-700 uppercase">
                  {t("Regional spine · year-round", "地域幹線 · 通年運行")}
                </p>
                <h2 className="font-display font-semibold text-2xl text-foreground mt-0.5">
                  {vline.name}
                </h2>
                <p className="text-foreground/90 mt-3 leading-relaxed">
                  {vline.route_summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {vline.phone && (
                    <a
                      href={`tel:${vline.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-purple-700"
                    >
                      <Phone className="w-4 h-4 text-purple-700" />
                      {vline.phone}
                    </a>
                  )}
                  {vline.website && (
                    <a
                      href={vline.website}
                      target="_blank"
                      rel={vline.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-purple-700"
                    >
                      <Globe className="w-4 h-4 text-purple-700" />
                      {t("Website", "ウェブサイト")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {vline.schedule_url && (
                    <a
                      href={vline.schedule_url}
                      target="_blank"
                      rel={vline.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-purple-700"
                    >
                      <CalendarCheck className="w-4 h-4 text-purple-700" />
                      {t("Train & coach timetables", "時刻表")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Per-town primary coach hero */}
      {hero && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
              <div className="shrink-0 self-start w-14 h-14 md:w-16 md:h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Bus className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                  {town
                    ? t(
                        `Your local mountain coach · ${town.name}`,
                        `${town ? t(town.name, town.nameJa) : ""}の地元スキーバス`,
                      )
                    : t("Local mountain coach", "地元スキーバス")}
                </p>
                {hero.partner && (
                  <p className="text-[11px] font-bold tracking-wider text-blue-700 uppercase inline-flex items-center gap-1 mt-1">
                    <Handshake className="w-3 h-3" />
                    {t("Featured partner", "提携パートナー")}
                  </p>
                )}
                <h2 className="font-display font-semibold text-2xl text-foreground mt-0.5">
                  {hero.name}
                </h2>
                <p className="byline text-muted-foreground/70 mt-1">
                  {hero.operator}
                </p>
                <p className="text-foreground/90 mt-3 leading-relaxed">
                  {hero.route_summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {hero.phone && (
                    <a
                      href={`tel:${hero.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4 text-blue-700" />
                      {hero.phone}
                    </a>
                  )}
                  {hero.website && (
                    <a
                      href={hero.website}
                      target="_blank"
                      rel={hero.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <Globe className="w-4 h-4 text-blue-700" />
                      {t("Website", "ウェブサイト")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {hero.schedule_url && (
                    <a
                      href={hero.schedule_url}
                      target="_blank"
                      rel={hero.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <CalendarCheck className="w-4 h-4 text-blue-700" />
                      {t("Timetable & fares", "時刻表・運賃")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Snow Bus Australia · multi-resort Melbourne ski-coach.
          Renders on every town it actually runs through (Mansfield,
          Bright, Mt Beauty, Harrietville, Dinner Plain). Winter only. */}
      {multiResortHero && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <article className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-50/40 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
              <div className="shrink-0 self-start w-14 h-14 md:w-16 md:h-16 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                <Bus className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-sky-700 uppercase">
                  {t(
                    "Multi-resort Melbourne coach · winter",
                    "メルボルン発スキーバス · 冬季",
                  )}
                </p>
                {multiResortHero.partner && (
                  <p className="text-[11px] font-bold tracking-wider text-sky-700 uppercase inline-flex items-center gap-1 mt-1">
                    <Handshake className="w-3 h-3" />
                    {t("Featured partner", "提携パートナー")}
                  </p>
                )}
                <h2 className="font-display font-semibold text-2xl text-foreground mt-0.5">
                  {multiResortHero.name}
                </h2>
                <p className="text-foreground/90 mt-3 leading-relaxed">
                  {multiResortHero.route_summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {multiResortHero.phone && (
                    <a
                      href={`tel:${multiResortHero.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-sky-700"
                    >
                      <Phone className="w-4 h-4 text-sky-700" />
                      {multiResortHero.phone}
                    </a>
                  )}
                  {multiResortHero.website && (
                    <a
                      href={multiResortHero.website}
                      target="_blank"
                      rel={multiResortHero.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-sky-700"
                    >
                      <Globe className="w-4 h-4 text-sky-700" />
                      {t("Website & bookings", "ウェブサイト・予約")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* No-coach honesty notice (Marysville, Warburton) */}
      {noLocalCoach && town && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-base text-foreground">
                {t(
                  `No scheduled mountain coach to ${town.name}`,
                  `${t(town.name, town.nameJa)}への定期スキーバスはありません`,
                )}
              </h3>
              <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                {t(
                  "V/Line gets you to town · the last leg up the mountain is self-drive or a pre-booked private transfer. Day-trip drivers from Melbourne are the norm.",
                  "V/Lineで町まで移動可能。山頂までの最終区間は自家用車または事前予約の貸切送迎。メルボルンからの日帰りドライブが一般的です。",
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Universal car-hire option (Europcar, region-aware) */}
      <section className="px-4 md:px-10 pt-4 md:pt-6">
        <CarHireCard regionId={region.id} t={t} />
      </section>

      {/* Other coach / shuttle operators (town-filtered) */}
      {buses.length > 0 && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <p className="text-[11px] font-bold tracking-wider text-white/70 uppercase mb-3">
            {t("Other coach & shuttle operators", "その他のバス・送迎事業者")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {buses.map((p, idx) => (
              <ProviderCard key={p.id} provider={p} index={idx} t={t} />
            ))}
          </div>
        </section>
      )}

      {/* Taxis & last mile (town-filtered) */}
      {taxis.length > 0 && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <p className="text-[11px] font-bold tracking-wider text-white/70 uppercase mb-3">
            {t("Taxis & last mile", "タクシー・ラストマイル")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {taxis.map((p, idx) => (
              <ProviderCard key={p.id} provider={p} index={idx} t={t} />
            ))}
          </div>
        </section>
      )}

      {town && !townHasRideshare(town.id) && (
        <div className="px-4 md:px-10 pt-4 pb-8">
          <RideshareUnavailableNotice
            townName={t(town.name, town.nameJa)}
            t={t}
          />
        </div>
      )}
      {!town && <div className="pb-8" />}
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
      transition={{ delay: Math.min(index * 0.04, 0.35) }}
      className="rounded-2xl border border-border bg-white p-5 flex flex-col"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-base text-foreground leading-tight">
            {provider.name}
          </h3>
          <p className="byline text-muted-foreground/70 mt-0.5">
            {provider.operator}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground/90 mt-3 leading-relaxed">
        {provider.route_summary}
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
            rel={provider.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
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
            rel={provider.partner ? "noopener noreferrer sponsored" : "noopener noreferrer"}
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
