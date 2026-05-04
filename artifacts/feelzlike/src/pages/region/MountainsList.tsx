import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Mountain as MountainIcon, Activity, ExternalLink } from "lucide-react";
import { useRegion, useLanguage } from "@workspace/feelzlike-shell";

export function MountainsList() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const mountains = region.mountains ?? [];

  return (
    <div className="relative">
      {/* Aurora hero backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(210,90%,55%,0.22), transparent 55%), radial-gradient(ellipse at 30% 60%, hsla(265,85%,60%,0.18), transparent 60%), radial-gradient(ellipse at 75% 40%, hsla(180,90%,55%,0.18), transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 60%, hsl(var(--background)) 100%), repeating-linear-gradient(0deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px)",
          }}
        />
      </div>

      <div className="relative px-6 md:px-10 py-10 md:py-14 max-w-6xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-3">
            <span className="byline text-foreground/80">
              {region.name} · {region.subtitle}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {t("Live", "ライブ")}
            </span>
          </div>

          <h1 className="font-display font-semibold text-5xl md:text-6xl tracking-tight text-foreground mt-3"
            style={{ letterSpacing: "-0.035em" }}>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, hsl(220,30%,12%) 0%, hsl(210,90%,46%) 60%, hsl(265,85%,55%) 100%)",
              }}
            >
              {t("Mountains", "スキー場")}
            </span>
          </h1>

          <div className="flex items-end justify-between gap-6 mt-4 max-w-3xl">
            <p className="text-muted-foreground max-w-xl">
              {t(
                "Real-time conditions, lift status and live cams for every mountain in the region.",
                "地域内すべてのスキー場のリアルタイム状況・リフト稼働・ライブカメラ。",
              )}
            </p>
            <div className="text-right shrink-0">
              <p className="display-number text-4xl md:text-5xl text-foreground tnum">
                {String(mountains.length).padStart(2, "0")}
              </p>
              <p className="byline text-muted-foreground/70 mt-1">
                {t("Mountains tracked", "対象スキー場")}
              </p>
            </div>
          </div>

          <div className="rule mt-8 mb-10" />
        </motion.header>

        {mountains.length === 0 ? (
          <p className="text-muted-foreground">
            {t("No mountains configured for this region yet.", "スキー場は未設定です。")}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mountains.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link
                  href={`/mountain/${m.id}`}
                  className="group relative block rounded-2xl overflow-hidden h-full"
                  style={{
                    background:
                      "linear-gradient(135deg, hsla(210,90%,55%,0.45), hsla(265,85%,60%,0.35) 50%, hsla(180,90%,55%,0.4) 100%)",
                    padding: "1px",
                  }}
                >
                  <div className="relative h-full rounded-[15px] bg-card p-5 overflow-hidden">
                    {/* hover halo */}
                    <div
                      className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, hsla(210,90%,55%,0.25), transparent 70%)",
                        filter: "blur(20px)",
                      }}
                    />

                    {/* top row */}
                    <div className="relative flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="byline text-muted-foreground/80 tnum">
                          M{String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="byline text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1 byline text-foreground/80">
                          <MountainIcon className="w-3 h-3" /> {t("Mountain", "スキー場")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <Activity className="w-2 h-2" />
                          {t("Live", "ライブ")}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <p className="font-display font-semibold text-2xl tracking-tight text-foreground mt-4 leading-tight">
                      {t(m.name, m.nameJa)}
                    </p>

                    {m.blurb && (
                      <p className="text-sm text-muted-foreground mt-2 leading-snug line-clamp-2">
                        {t(m.blurb, m.blurbJa)}
                      </p>
                    )}

                    {m.elevationM !== undefined && (
                      <>
                        <div className="rule mt-5 mb-4" />
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="byline text-muted-foreground/70">
                              {t("Summit elevation", "標高")}
                            </p>
                            <p className="display-number text-3xl text-foreground tnum mt-0.5">
                              {m.elevationM.toLocaleString()}
                              <span className="text-base text-muted-foreground/70 font-normal ml-1">m</span>
                            </p>
                          </div>
                          <span
                            className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md"
                            style={{
                              background:
                                "linear-gradient(135deg, hsla(210,90%,46%,0.08), hsla(265,85%,55%,0.08))",
                              color: "hsl(210,90%,40%)",
                            }}
                          >
                            {t("View live", "ライブ表示")}
                          </span>
                        </div>
                      </>
                    )}

                    {m.websiteUrl && (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          window.open(m.websiteUrl, "_blank", "noopener,noreferrer");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(m.websiteUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t("Official site", "公式サイト")}
                        <span className="text-muted-foreground/50">
                          {new URL(m.websiteUrl).hostname.replace(/^www\./, "")}
                        </span>
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
