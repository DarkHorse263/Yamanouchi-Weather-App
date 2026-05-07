import { motion } from "framer-motion";
import { useRegion, useLanguage, LiveBadge } from "@workspace/feelzlike-shell";

interface Props {
  title: string;
  titleJa?: string;
  params?: Record<string, string>;
}

export function RegionStub({ title, titleJa, params }: Props) {
  const { region } = useRegion();
  const { t } = useLanguage();

  const heading = t(title, titleJa);
  const resortId = params?.id;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="byline text-muted-foreground/70">
          {region.name} · {region.subtitle}
        </p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
          {heading}
          {resortId && (
            <span className="block text-muted-foreground text-2xl md:text-3xl mt-2 font-normal">
              {resortId.replace(/-/g, " ")}
            </span>
          )}
        </h1>
        <div className="rule mt-6 mb-8" />

        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="byline text-muted-foreground/70 mb-3">
                {t("Coming together", "準備中")}
              </p>
              <p className="font-display text-xl md:text-2xl text-foreground max-w-xl leading-snug">
                {t(
                  `The ${title.toLowerCase()} view for ${region.name} is moving here from the old regional app.`,
                  `${region.name}の${heading}ビューは旧アプリから移行中です。`,
                )}
              </p>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm">
                {t(
                  "Same data, same look - now under one roof. We'll wire this page up next.",
                  "同じデータ、同じデザイン。まもなくこのページを接続します。",
                )}
              </p>
            </div>
            <LiveBadge label={t("Shell ready", "準備完了")} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
