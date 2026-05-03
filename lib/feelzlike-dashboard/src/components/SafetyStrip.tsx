import { motion } from "framer-motion";
import { ExternalLink, type LucideIcon } from "lucide-react";

export interface SafetyLink {
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}

export interface SafetyStripProps {
  links: SafetyLink[];
  /** Right-aligned subhead beside the main heading */
  subhead?: string;
  /** Footer disclaimer */
  disclaimer?: string;
  /** Section number prefix (defaults to "09") */
  sectionNumber?: string;
  /** Heading text (defaults to "Before you head out") */
  heading?: string;
}

export function SafetyStrip({
  links,
  subhead,
  disclaimer,
  sectionNumber = "09",
  heading = "Before you head out",
}: SafetyStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="byline text-muted-foreground">{sectionNumber} · Safety</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 text-foreground">
            {heading}
          </h2>
        </div>
        {subhead && (
          <p className="byline text-muted-foreground/70 hidden md:block max-w-[40%] text-right">
            {subhead}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {links.map((link) => {
          const isPhone = link.href.startsWith("tel:");
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.href}
              target={isPhone ? undefined : "_blank"}
              rel={isPhone ? undefined : "noreferrer"}
              className="group flex items-start gap-3 p-4 rounded-2xl border border-slate-200/70 hover:border-slate-400/60 hover:bg-slate-50/60 transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-none group-hover:bg-slate-200 transition-colors">
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5 leading-tight">
                  {link.label}
                  {!isPhone && <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />}
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 leading-snug">{link.detail}</p>
              </div>
            </a>
          );
        })}
      </div>

      {disclaimer && (
        <p className="mt-5 text-[11px] text-muted-foreground/70 leading-relaxed">{disclaimer}</p>
      )}
    </motion.div>
  );
}
