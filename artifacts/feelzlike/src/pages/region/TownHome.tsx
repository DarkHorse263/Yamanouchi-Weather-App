import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Car, Video, Bus, BedDouble, UtensilsCrossed, Compass } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

const TILES = [
  { path: "/roads",     icon: Car,             label: "Roads",     labelJa: "道路",   blurb: "Live road conditions to the mountain", blurbJa: "山への道路状況" },
  { path: "/cams",      icon: Video,           label: "Cams",      labelJa: "ライブ", blurb: "Town and roadside webcams",            blurbJa: "町と路傍のライブカメラ" },
  { path: "/transport", icon: Bus,             label: "Transport", labelJa: "交通",   blurb: "Buses & shuttles from town",          blurbJa: "町からのバス・送迎" },
  { path: "/stay",      icon: BedDouble,       label: "Stay",      labelJa: "宿泊",   blurb: "Hotels, ryokan and lodges nearby",     blurbJa: "近隣の宿泊施設" },
  { path: "/eat",       icon: UtensilsCrossed, label: "Eat",       labelJa: "食事",   blurb: "Restaurants, izakaya, cafés in town",  blurbJa: "町の飲食店" },
  { path: "/explore",   icon: Compass,         label: "Explore",   labelJa: "観光",   blurb: "Off-mountain things to do",           blurbJa: "山以外のアクティビティ" },
] as const;

export function TownHome() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <p className="text-muted-foreground">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {t("Base town", "拠点の町")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t(town.name, town.nameJa)}
            </h1>
            {town.blurb && (
              <p className="text-muted-foreground mt-3 max-w-xl">{t(town.blurb, town.blurbJa)}</p>
            )}
          </div>
          <LiveBadge label={t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* Snapshot strip — placeholder until weather wiring */}
      <section className="mt-8 grid sm:grid-cols-3 gap-3">
        <SnapshotCard
          label={t("In town now", "町の現在")}
          value="—"
          unit="°"
          hint={t("Weather coming soon", "天気は準備中")}
        />
        <SnapshotCard
          label={t("To the mountain", "山まで")}
          value="—"
          unit={t("min", "分")}
          hint={t("Drive time coming soon", "所要時間は準備中")}
        />
        <SnapshotCard
          label={t("Roads", "道路")}
          value="—"
          unit=""
          hint={t("Open / closed status", "開通・通行止情報")}
        />
      </section>

      {/* Town tiles */}
      <section className="mt-10">
        <p className="byline text-muted-foreground/70 mb-3">
          {t("In and around", "町と周辺")} {t(town.name, town.nameJa)}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.path}
                href={`/${town.id}${tile.path}`}
                className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 byline text-primary">
                    <Icon className="w-3 h-3" /> {t(tile.label, tile.labelJa)}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display font-semibold text-lg tracking-tight text-foreground mt-3">
                  {t(tile.label, tile.labelJa)}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                  {t(tile.blurb, tile.blurbJa)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="byline text-muted-foreground/70">{label}</p>
      <p className="mt-2 font-display font-semibold text-3xl text-foreground tracking-tight">
        {value}
        <span className="text-base text-muted-foreground/70 ml-1">{unit}</span>
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>
    </div>
  );
}
