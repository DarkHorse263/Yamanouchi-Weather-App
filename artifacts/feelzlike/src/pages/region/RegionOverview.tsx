import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Mountain as MountainIcon } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

export function RegionOverview() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { towns } = useBaseTown();
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
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
