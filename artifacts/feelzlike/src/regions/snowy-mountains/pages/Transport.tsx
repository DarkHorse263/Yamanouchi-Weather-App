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
} from "lucide-react";

import {
  useLanguage,
  useBaseTown,
  useRegion,
  LiveBadge,
  PageHeader,
} from "@workspace/feelzlike-shell";

import { SNOWY_MOUNTAINS_TRANSPORT } from "@/data/transport/snowy-mountains";
import type { TransportProvider } from "@/types/transport";
import coomaCoachesLogo from "@assets/CC_-_Colour_JM_Red_1778132452167.png";

const SNOWY_MTNS_BUS_URL = "https://coomacoaches.com.au/snowy-mountains-bus-service/";

/**
 * Snowy Mountains custom Transport page.
 *
 * Per the Apr 2026 brief: lead with Cooma Coaches (the daily Canberra →
 * Cooma → Berridale → Jindabyne service that 90% of visitors actually
 * use) as a hero card, then give Jindabyne / Cooma / Berridale their own
 * "what stops here" breakouts. The remaining operators (Snowliner,
 * Greyhound, Murrays, NSW TrainLink, airport shuttles) sit underneath as
 * a supporting list. Same provider data the generic TownTransport reads
 * - just a region-aware presentation.
 */

const COOMA_COACHES_ID = "au-cooma-coaches";

export function SnowyTransport() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const cooma = useMemo(
    () => SNOWY_MOUNTAINS_TRANSPORT.find((p) => p.id === COOMA_COACHES_ID),
    [],
  );
  const others = useMemo(
    () => SNOWY_MOUNTAINS_TRANSPORT.filter((p) => p.id !== COOMA_COACHES_ID),
    [],
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="px-4 md:px-10 pt-5 md:pt-10">
        <PageHeader
          byline={`${region.name}${town ? ` · ${t(town.name, town.nameJa)}` : ""}`}
          title={t("Transport", "交通")}
          description={t(
            "Buses, shuttles, trains and shared transport into the Snowy Mountains. Cooma Coaches is the daily Canberra ↔ Jindabyne lifeline.",
            "スノーマウンテンズへのバス・送迎・電車。Cooma Coachesがキャンベラ ↔ ジンダバインの毎日運行の主要路線です。",
          )}
          badge={<LiveBadge tone="onDark" label={t("Curated", "編集済")} />}
        />
      </div>

      {/* Cooma Coaches hero */}
      {cooma && (
        <section className="px-4 md:px-10 pt-5 md:pt-8">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="shrink-0 rounded-xl bg-white border border-blue-100 p-3 flex items-center justify-center">
                <img
                  src={coomaCoachesLogo}
                  alt="Cooma Coaches - Connecting the Snowy Mountains"
                  className="h-14 md:h-16 w-auto"
                  draggable={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
                  {t("Local operator · runs the Snowy Mtns Bus Service", "地元事業者 · スノーマウンテンズバスサービス運営")}
                </p>
                <h2 className="font-display font-semibold text-2xl text-foreground mt-1">
                  {cooma.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{cooma.operator}</p>
                <p className="text-foreground/90 mt-4 leading-relaxed">
                  {cooma.route_summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {cooma.phone && (
                    <a
                      href={`tel:${cooma.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4 text-blue-700" />
                      {cooma.phone}
                    </a>
                  )}
                  {cooma.website && (
                    <a
                      href={cooma.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <Globe className="w-4 h-4 text-blue-700" />
                      {t("Website", "ウェブサイト")}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Snowy Mountains Bus Service breakout - Cooma Coaches' named
                daily Canberra ↔ Jindabyne service. Called out separately
                so visitors know which Cooma Coaches product to actually
                book. */}
            <div className="mt-6 pt-6 border-t border-blue-200/60">
              <div className="rounded-xl border-2 border-blue-300 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                      {t("Daily scheduled service", "毎日定期便")}
                    </p>
                    <h3 className="font-display font-semibold text-lg text-foreground mt-0.5">
                      {t("Snowy Mountains Bus Service", "スノーマウンテンズバスサービス")}
                    </h3>
                    <p className="text-sm text-foreground/90 mt-2 leading-relaxed">
                      {t(
                        "Daily coach: Canberra → Cooma → Berridale → Jindabyne, with onward ski-season shuttles to Perisher and Thredbo. The route 90% of off-mountain visitors actually use.",
                        "毎日運行：キャンベラ → クーマ → ベリデール → ジンダバイン。冬季はペリッシャー・スレッドボーへのシャトル接続あり。",
                      )}
                    </p>
                    <a
                      href={SNOWY_MTNS_BUS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      {t("Timetable & fares", "時刻表・運賃")}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </article>
        </section>
      )}

      {/* Other operators */}
      <section className="px-4 md:px-10 pt-5 pb-10">
        <p className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-3">
          {t("Other operators", "その他の事業者")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((p, idx) => (
            <ProviderCard key={p.id} provider={p} index={idx} t={t} />
          ))}
        </div>
      </section>
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
