import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ConditionStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface LiveConditionsProps {
  stats: ConditionStat[];
  sectionNumber?: string;
  heading?: string;
}

export function LiveConditions({
  stats,
  sectionNumber = "",
  heading = "Right now",
}: LiveConditionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="byline text-muted-foreground">{sectionNumber ? `${sectionNumber} · ` : ""}Conditions</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 text-foreground">
            {heading}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
          {stats.length} measurements
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5 byline text-muted-foreground/80 mb-1.5">
              <s.icon className="w-3 h-3 text-muted-foreground/60" strokeWidth={1.75} />
              {s.label}
            </div>
            <p className="font-display text-2xl md:text-3xl text-foreground tracking-tight" data-numeric>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
