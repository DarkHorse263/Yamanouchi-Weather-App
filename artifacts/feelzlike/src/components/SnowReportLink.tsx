import { ExternalLink } from "lucide-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { cn } from "@/lib/utils";

/**
 * Link to a resort's own official SNOW REPORT page (region config
 * `snowReportUrl` - curl-verified per resort, see MountainLink). Rendered
 * next to the snow-depth UI so users can always cross-check our model or
 * feed figure against the resort's own published report.
 *
 * Mirrors OfficialSiteLink: opens in a new tab, self-hides on a malformed
 * URL so we never render a dead link.
 */
export function SnowReportLink({
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
      {t("Official snow report", "公式積雪レポート")}
      <span className="text-muted-foreground/50">{hostname}</span>
    </a>
  );
}
