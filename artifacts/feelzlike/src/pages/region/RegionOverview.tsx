import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Mountain as MountainIcon, Sparkles, Car } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Approximate "from this base town" coordinates for each mountain so we can
 * show a journey time on the region overview without firing the weather query.
 * Keep in sync with the backend resort coordinates.
 */
const MOUNTAIN_COORDS: Record<string, { lat: number; lng: number }> = {
  // Snowy Mountains, NSW
  thredbo:           { lat: -36.5046, lng: 148.3017 },
  perisher:          { lat: -36.4055, lng: 148.4133 },
  "charlottes-pass": { lat: -36.4347, lng: 148.3308 },
  selwyn:            { lat: -35.8761, lng: 148.5306 },
  // Yamanouchi, JP
  "shiga-kogen":     { lat: 36.7178, lng: 138.5028 },
  ryuoo:             { lat: 36.7758, lng: 138.4397 },
  "kita-shiga":      { lat: 36.7858, lng: 138.4361 },
  // Iiyama, JP
  madarao:           { lat: 36.8389, lng: 138.3361 },
  tangram:           { lat: 36.8333, lng: 138.3197 },
  togari:            { lat: 36.8597, lng: 138.4333 },
  "nozawa-onsen":    { lat: 36.9239, lng: 138.4486 },
};

export function RegionOverview() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { towns, town } = useBaseTown();
  const mountains = region.mountains ?? [];

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">{region.subtitle}</p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {region.name}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                "Region overview · pick the town you're staying in, or jump to a specific mountain.",
                "地域概要 · 滞在中の町を選ぶか、各スキー場へ進んでください。",
              )}
            </p>
          </div>
          <LiveBadge label={t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* Today's call — the region's killer CTA */}
      {mountains.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mt-8"
        >
          <Link
            href="/today"
            className="group relative block rounded-2xl border border-border bg-white p-5 md:p-6 transition-all hover:border-primary/50 hover:shadow-md overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="byline text-primary">{t("Decide your day", "今日の判断")}</p>
                <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-1">
                  {t(
                    `Today's call · best mountain ${town?.name ? `from ${town.name}` : "right now"}`,
                    `今日のおすすめスキー場${town?.name ? `（${t(town.name, town.nameJa)}発）` : ""}`,
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    `${mountains.length} mountains scored on live snow, wind, temperature & visibility.`,
                    `${mountains.length}スキー場をライブ気象でスコア化（積雪・風・気温・視界）。`,
                  )}
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {towns.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="byline text-muted-foreground/70">01 · {t("Where you're staying", "滞在地")}</p>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                {t("Base towns", "拠点の町")}
              </h2>
            </div>
            <p className="byline text-muted-foreground/60">
              {towns.length} {t("towns", "町")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {towns.map((town) => (
              <Link
                key={town.id}
                href={`/${town.id}`}
                className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 byline text-primary">
                    <MapPin className="w-3 h-3" /> {t("Town", "町")}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-3">
                  {t(town.name, town.nameJa)}
                </p>
                {town.blurb && (
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">
                    {t(town.blurb, town.blurbJa)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {mountains.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="byline text-muted-foreground/70">02 · {t("Where you're skiing", "スキー場")}</p>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                {t("Mountains", "スキー場")}
              </h2>
            </div>
            <Link
              href="/mountains"
              className="byline text-primary hover:underline"
            >
              {t("All mountains", "すべて見る")} →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mountains.map((m) => (
              <Link
                key={m.id}
                href={`/mountain/${m.id}`}
                className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 byline text-foreground">
                    <MountainIcon className="w-3 h-3" /> {t("Mountain", "スキー場")}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-3">
                  {t(m.name, m.nameJa)}
                </p>
                {m.elevationM !== undefined && (
                  <p className="byline text-muted-foreground/70 mt-1">
                    ELEV {m.elevationM}M
                  </p>
                )}
                {m.blurb && (
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">
                    {t(m.blurb, m.blurbJa)}
                  </p>
                )}
                {town && MOUNTAIN_COORDS[m.id] && (() => {
                  const km = haversineKm(
                    { lat: town.lat, lng: town.lng },
                    MOUNTAIN_COORDS[m.id]!,
                  );
                  const min = Math.round((km / 50) * 60);
                  return (
                    <div className="mt-3 inline-flex items-center gap-1.5 byline text-muted-foreground">
                      <Car className="w-3 h-3" />
                      <span className="font-semibold text-foreground/80">
                        {min} min
                      </span>
                      <span>· {km.toFixed(0)} km {t(`from ${town.name}`, `${t(town.name, town.nameJa)}から`)}</span>
                    </div>
                  );
                })()}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
