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
  MapPin,
  ExternalLink,
} from "lucide-react";

import {
  useLanguage,
  useBaseTown,
  useRegion,
  LiveBadge,
} from "@workspace/feelzlike-shell";

import { SNOWY_MOUNTAINS_TRANSPORT } from "@/data/transport/snowy-mountains";
import type { TransportProvider } from "@/types/transport";

/**
 * Snowy Mountains custom Transport page.
 *
 * Per the Apr 2026 brief: lead with Cooma Coaches (the daily Canberra →
 * Cooma → Berridale → Jindabyne service that 90% of visitors actually
 * use) as a hero card, then give Jindabyne / Cooma / Berridale their own
 * "what stops here" breakouts. The remaining operators (Snowliner,
 * Greyhound, Murrays, NSW TrainLink, airport shuttles) sit underneath as
 * a supporting list. Same provider data the generic TownTransport reads
 * — just a region-aware presentation.
 */

const COOMA_COACHES_ID = "au-cooma-coaches";

interface TownStopMeta {
  id: "jindabyne" | "cooma" | "berridale";
  labelEn: string;
  labelJa: string;
  blurbEn: string;
  blurbJa: string;
}

const TOWN_STOPS: TownStopMeta[] = [
  {
    id: "jindabyne",
    labelEn: "Jindabyne",
    labelJa: "ジンダバイン",
    blurbEn: "Final coach stop · the off-mountain hub for Perisher and Thredbo.",
    blurbJa: "コーチ最終停留所 · ペリッシャー＆スレッドボーの拠点。",
  },
  {
    id: "cooma",
    labelEn: "Cooma",
    labelJa: "クーマ",
    blurbEn: "Regional gateway with Snowy Mountains Airport (OOM) and rail-coach interchange.",
    blurbJa: "地域の玄関口 · スノーマウンテンズ空港 (OOM) と鉄道接続あり。",
  },
  {
    id: "berridale",
    labelEn: "Berridale",
    labelJa: "ベリデール",
    blurbEn: "Mid-route stop between Cooma and Jindabyne — useful if you're staying nearby.",
    blurbJa: "クーマとジンダバインの中間停留所 · 周辺宿泊者向け。",
  },
];

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
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 md:px-10 pt-8 md:pt-12"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name}
              {town ? ` · ${t(town.name, town.nameJa)}` : ""}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Transport", "交通")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
              {t(
                "Buses, shuttles, trains and shared transport into the Snowy Mountains. Cooma Coaches is the daily Canberra ↔ Jindabyne lifeline.",
                "スノーマウンテンズへのバス・送迎・電車。Cooma Coachesがキャンベラ ↔ ジンダバインの毎日運行の主要路線です。",
              )}
            </p>
          </div>
          <LiveBadge label={t("Curated", "編集済")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* Cooma Coaches hero */}
      {cooma && (
        <section className="px-6 md:px-10 pt-8">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
                  {t("Daily service · primary route", "毎日運行 · 主要路線")}
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
                  {cooma.schedule_url && (
                    <a
                      href={cooma.schedule_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-blue-700"
                    >
                      <CalendarCheck className="w-4 h-4 text-blue-700" />
                      {t("Timetable", "時刻表")}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Town stops breakout */}
            <div className="mt-6 pt-6 border-t border-blue-200/60">
              <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase mb-3">
                {t("Stops in this region", "この地域の停留所")}
              </p>
              <ul className="grid sm:grid-cols-3 gap-3">
                {TOWN_STOPS.map((stop) => {
                  const isCurrent = town?.id === stop.id;
                  return (
                    <li
                      key={stop.id}
                      className={`rounded-xl border p-4 ${
                        isCurrent
                          ? "border-blue-400 bg-white ring-1 ring-blue-300"
                          : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`w-4 h-4 ${isCurrent ? "text-blue-700" : "text-muted-foreground/70"}`}
                          aria-hidden
                        />
                        <p className="font-display font-semibold text-foreground text-sm">
                          {t(stop.labelEn, stop.labelJa)}
                        </p>
                        {isCurrent && (
                          <span className="ml-auto text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                            {t("You", "現在地")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-snug">
                        {t(stop.blurbEn, stop.blurbJa)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        </section>
      )}

      {/* Other operators */}
      <section className="px-6 md:px-10 pt-8 pb-16">
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
