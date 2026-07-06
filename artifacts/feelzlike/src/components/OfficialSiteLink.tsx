import { ExternalLink } from "lucide-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { cn } from "@/lib/utils";

/**
 * Link to a resort's own official website. Rendered on mountain detail
 * pages so every mountain surfaces its operator site (trail maps, hours,
 * tickets). Mirrors the "Official site" link style used in the region
 * MountainsList. Opens in a new tab; self-hides on a malformed URL so we
 * never render a dead link.
 */
export function OfficialSiteLink({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const { t } = useLanguage();
  let hostname = "";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-700 transition-colors",
        className,
      )}
    >
      <ExternalLink className="w-3 h-3" />
      {t("Official site", "公式サイト")}
      <span className="text-muted-foreground/50">{hostname}</span>
    </a>
  );
}
