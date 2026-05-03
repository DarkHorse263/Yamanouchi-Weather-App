import { motion } from "framer-motion";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

interface Props {
  title: string;
  titleJa?: string;
  description?: string;
  descriptionJa?: string;
}

export function TownSubpageStub({ title, titleJa, description, descriptionJa }: Props) {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="byline text-muted-foreground/70">
          {region.name} · {town ? t(town.name, town.nameJa) : t("Town", "町")}
        </p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
          {t(title, titleJa)}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-3 max-w-xl">
            {t(description, descriptionJa)}
          </p>
        )}
        <div className="rule mt-6 mb-8" />

        <div className="glass rounded-2xl p-8 md:p-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="byline text-muted-foreground/70 mb-3">
                {t("Coming together", "準備中")}
              </p>
              <p className="font-display text-xl md:text-2xl text-foreground max-w-xl leading-snug">
                {t(
                  `${title} for ${town?.name ?? region.name} is being wired up.`,
                  `${town ? t(town.name, town.nameJa) : region.name}の${t(title, titleJa)}は準備中です。`,
                )}
              </p>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm">
                {t(
                  "We'll connect this to live data centred on the town once the data source is live.",
                  "データソースが準備でき次第、町を中心とした実データに接続します。",
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
