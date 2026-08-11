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
  const baseColor = tone === "onDark" ? "text-white" : "text-slate-500/80";
  const strongColor = tone === "onDark" ? "text-white" : "text-[#0F172A]";
  const dimColor = tone === "onDark" ? "text-white/60" : "text-slate-500/40";
  const noTimestampColor = tone === "onDark" ? "text-white" : "text-slate-500/70";

  const ms = toMs(lastUpdated);
  if (ms === null) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] lowercase font-bold ${noTimestampColor} ${className}`}
      >
        <Clock className="w-3 h-3" />
        {t("Last update unknown", "最終更新は不明")}
      </span>
    );
  }

  // Data older than 24h gets a subtle amber dot so stale readings are
  // visually distinguishable from fresh ones at a glance.
  const isStale = now - ms > 24 * 60 * 60_000;

  const intervalMs = intervalMin * 60_000;
  const nextAt = ms + intervalMs;
  const untilMs = nextAt - now;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] lowercase font-bold ${baseColor} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {isStale && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
            title={t("More than 24 hours old", "24時間以上前のデータ")}
            aria-label={t("More than 24 hours old", "24時間以上前のデータ")}
          />
        )}
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
