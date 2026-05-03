import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Mountain as MountainIcon } from "lucide-react";
import { useRegion, useLanguage } from "@workspace/feelzlike-shell";

export function MountainsList() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const mountains = region.mountains ?? [];

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="byline text-muted-foreground/70">{region.name} · {region.subtitle}</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
          {t("Mountains", "スキー場")}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          {t(
            "Detailed conditions, lifts and cams for every mountain in the region.",
            "地域内の各スキー場の詳細な状況・リフト・ライブカメラ。",
          )}
        </p>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {mountains.length === 0 ? (
        <p className="text-muted-foreground">{t("No mountains configured for this region yet.", "スキー場は未設定です。")}</p>
      ) : (
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
                <p className="byline text-muted-foreground/70 mt-1">ELEV {m.elevationM}M</p>
              )}
              {m.blurb && (
                <p className="text-sm text-muted-foreground mt-2 leading-snug">
                  {t(m.blurb, m.blurbJa)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
