import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock4 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Branded empty / "launching soon" card. Replaces bare "No X found" plain text
 * across the app so unfinished sections build anticipation rather than read as
 * broken. Reusable: drop it into any page where the data isn't ready yet.
 *
 * Visual language: centered card on `bg-white`, hairline border, sky-blue
 * accented icon chip, deep-navy headline (`font-display`), generous breathing
 * room. Optional ETA badge and CTA button keep the affordance discoverable.
 */
export interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Short ETA, e.g. "Next 7 days". Renders a pill below the headline. */
  eta?: string;
  /** Label for the optional CTA button. Required if `ctaHref` is set. */
  ctaLabel?: string;
  /** URL or `mailto:` for the optional CTA. */
  ctaHref?: string;
  /** Override the default centred-card max width if needed. */
  className?: string;
  /**
   * ARIA role override. Defaults to undefined - the inner `<h2>` is sufficient
   * landmark for SR users in most cases. Pass `"status"` if the card appears
   * post-fetch and you want it announced as a live region; pass `"region"` +
   * `aria-label` if it's the primary content of a page section.
   */
  role?: "status" | "region" | "alert";
  "aria-label"?: string;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  body,
  eta,
  ctaLabel,
  ctaHref,
  className = "",
  role,
  "aria-label": ariaLabel,
}: EmptyStateCardProps) {
  const isMailto = ctaHref?.startsWith("mailto:") ?? false;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mx-auto max-w-xl rounded-2xl border border-border bg-white px-6 py-10 md:px-10 md:py-12 text-center ${className}`}
      role={role}
      aria-label={ariaLabel}
    >
      <div className="mx-auto inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="w-6 h-6" aria-hidden />
      </div>

      <h2 className="font-display font-semibold text-2xl md:text-[28px] tracking-tight text-foreground mt-5">
        {title}
      </h2>

      {eta && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Clock4 className="w-3 h-3" aria-hidden />
          {eta}
        </div>
      )}

      <p className="text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
        {body}
      </p>

      {ctaLabel && ctaHref && (
        <div className="mt-6">
          <Button
            asChild
            variant="default"
            size="default"
            className="rounded-full px-5"
          >
            <a
              href={ctaHref}
              target={isMailto ? undefined : "_blank"}
              rel={isMailto ? undefined : "noopener noreferrer"}
            >
              {ctaLabel}
              <ArrowUpRight className="w-4 h-4 ml-1.5" aria-hidden />
            </a>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
