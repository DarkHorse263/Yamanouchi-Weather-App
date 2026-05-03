import { useLanguage } from "@workspace/feelzlike-shell";
import { motion } from "framer-motion";
import { ArrowRight, Mountain, Snowflake } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric hero photo */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1610824352934-c10d87b700cc?w=2400&h=1600&fit=crop&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-background" />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 md:px-10 pt-20 md:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass"
        >
          <Snowflake className="w-3 h-3 text-primary" />
          <span className="byline text-foreground">{t("Coming soon", "近日公開")}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display font-semibold text-foreground text-[clamp(2.5rem,6vw,4.5rem)] tracking-tight mt-5 leading-[1.05]"
        >
          {t("Nagano Prefecture", "長野県")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed"
        >
          {t(
            "Prefecture-wide snow intelligence for the Japan Alps - Hakuba Valley, Shiga Kogen, Nozawa Onsen, Madarao and beyond - is in development.",
            "白馬バレー、志賀高原、野沢温泉、斑尾など、日本アルプス全域のスノーインテリジェンスを準備中です。"
          )}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mt-3 text-muted-foreground text-sm max-w-xl"
        >
          {t(
            "We're starting with Yamanouchi Town and rolling out the rest of the prefecture region by region.",
            "まずは山ノ内町から始め、その後、地域ごとに長野県全体へ拡大していきます。"
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-10 flex flex-col sm:flex-row gap-3"
        >
          <a
            href="/yamanouchi/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Mountain className="w-4 h-4" />
            {t("Open Yamanouchi Town", "山ノ内町を開く")}
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors"
          >
            {t("All regions", "全地域")}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-12 pt-6 border-t border-border"
        >
          <p className="byline text-muted-foreground mb-3">
            {t("Planned coverage", "対応予定エリア")}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Hakuba Valley",
              "Shiga Kogen",
              "Nozawa Onsen",
              "Madarao",
              "Myoko",
              "Togakushi",
              "Karuizawa",
            ].map((area) => (
              <span
                key={area}
                className="px-2.5 py-1 rounded-md bg-card border border-border text-xs text-foreground/80 font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
