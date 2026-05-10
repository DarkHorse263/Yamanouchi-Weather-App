import { useEffect, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface UpdateStampProps {
  /** ISO string or Date when the data was last fetched. */
  lastUpdated: string | Date | null | undefined;
  /** How often the upstream source refreshes, in minutes. */
  intervalMin: number;
  /** Optional source label (e.g. "BOM · Open-Meteo"). */
  source?: string;
  className?: string;
  /**
   * Visual tone. `light` (default) is muted text on a white surface.
   * `onDark` is white-ish text suitable for placement on a coloured/gradient
   * panel (e.g. inside `<PageHeader>`).
   */
  tone?: "light" | "onDark";
}

function toMs(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function formatAgo(ms: number, now: number, t: (en: string, ja?: string) => string): string {
  const diff = Math.max(0, Math.round((now - ms) / 1000));
  if (diff < 60) return t("just now", "たった今");
  const m = Math.round(diff / 60);
  if (m < 60) return t(`${m} min ago`, `${m}分前`);
  const h = Math.round(m / 60);
  if (h < 24) return t(`${h}h ago`, `${h}時間前`);
  return t(`${Math.round(h / 24)}d ago`, `${Math.round(h / 24)}日前`);
}

function formatUntil(ms: number, t: (en: string, ja?: string) => string): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return t("any moment", "まもなく");
  if (m < 60) return t(`in ${m} min`, `${m}分後`);
  const h = Math.round(m / 60);
  return t(`in ${h}h`, `${h}時間後`);
}

/**
 * Small "Updated 4 min ago · Next in 6 min" pill. Helps users trust the
 * data is live and tells them when to come back.
 */
export function UpdateStamp({
  lastUpdated,
  intervalMin,
  source,
  className = "",
  tone = "light",
}: UpdateStampProps) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // On a dark gradient, body copy needs full white to clear WCAG AA on the
  // lightest gradient stop (sky-600 / emerald-700). Reserve translucency
  // for non-text glyphs only (separator dot).
  const baseColor = tone === "onDark" ? "text-white" : "text-muted-foreground/80";
  const strongColor = tone === "onDark" ? "text-white" : "text-foreground";
  const dimColor = tone === "onDark" ? "text-white/60" : "text-muted-foreground/40";
  const noTimestampColor = tone === "onDark" ? "text-white" : "text-muted-foreground/70";

  const ms = toMs(lastUpdated);
  if (ms === null) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] ${noTimestampColor} ${className}`}
      >
        <Clock className="w-3 h-3" />
        {t("No timestamp", "更新時刻なし")}
      </span>
    );
  }

  const intervalMs = intervalMin * 60_000;
  const nextAt = ms + intervalMs;
  const untilMs = nextAt - now;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] ${baseColor} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {t("Updated", "更新")}{" "}
        <span className={`${strongColor} tabular-nums`}>
          {formatAgo(ms, now, t)}
        </span>
      </span>
      <span className={dimColor}>·</span>
      <span className="inline-flex items-center gap-1">
        <RefreshCw className="w-3 h-3" />
        {t("Next", "次回")}{" "}
        <span className={`${strongColor} tabular-nums`}>
          {formatUntil(untilMs, t)}
        </span>
      </span>
      {source ? (
        <>
          <span className={dimColor}>·</span>
          <span className="truncate">{source}</span>
        </>
      ) : null}
    </span>
  );
}
