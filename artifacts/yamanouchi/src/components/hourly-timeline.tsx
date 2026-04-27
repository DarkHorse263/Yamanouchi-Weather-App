import { Clock, CheckCircle2, Circle, Radio } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

interface HourlyTimelineProps {
  lastUpdatedAt?: string | null;
  className?: string;
}

const UPDATE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function getNowJST(): Date {
  const now = new Date();
  const jstOffset = 9 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + jstOffset * 60000);
}

function formatHour(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

export function HourlyTimeline({ lastUpdatedAt, className }: HourlyTimelineProps) {
  const { t } = useLanguage();
  const nowJST = getNowJST();
  const currentHour = nowJST.getHours();

  const lastUpdatedDate = lastUpdatedAt ? new Date(lastUpdatedAt) : null;
  const lastUpdatedHour = lastUpdatedDate && !isNaN(lastUpdatedDate.getTime())
    ? lastUpdatedDate.getHours()
    : null;

  const isDuringUpdates = currentHour >= 5 && currentHour <= 18;
  const nextUpdateHour = UPDATE_HOURS.find(h => h > currentHour) ?? null;
  const minutesToNext = nextUpdateHour !== null
    ? (nextUpdateHour - currentHour) * 60 - nowJST.getMinutes()
    : null;

  return (
    <div className={cn("rounded-2xl glass p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {t("Today's Updates", "本日の更新スケジュール")}
          </span>
        </div>
        {isDuringUpdates ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold">{t("Active", "更新中")}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {t("5AM – 6PM JST", "5時〜18時 JST")}
          </span>
        )}
      </div>

      {/* Hourly Slot Strip */}
      <div className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar">
        {UPDATE_HOURS.map((hour) => {
          const isPast = hour < currentHour;
          const isCurrent = hour === currentHour;
          const isFuture = hour > currentHour;
          const wasUpdated = lastUpdatedHour === hour;

          return (
            <div
              key={hour}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[38px] rounded-lg px-1 py-1.5 transition-all",
                isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                isPast && "opacity-50",
                isFuture && "opacity-40"
              )}
            >
              <div className="relative">
                {isCurrent ? (
                  <Radio className="w-3.5 h-3.5 text-primary" />
                ) : isPast ? (
                  <CheckCircle2 className={cn("w-3.5 h-3.5", wasUpdated ? "text-emerald-500" : "text-slate-300")} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-200" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-tight",
                isCurrent ? "text-primary" : isPast ? "text-slate-400" : "text-slate-300"
              )}>
                {formatHour(hour)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        {lastUpdatedDate && !isNaN(lastUpdatedDate.getTime()) ? (
          <span>
            {t("Last updated", "最終更新")}:{" "}
            <span className="font-bold text-foreground">
              {lastUpdatedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </span>
        ) : (
          <span>{t("Checking for updates…", "更新確認中…")}</span>
        )}
        {minutesToNext !== null && minutesToNext > 0 && (
          <span>
            {t("Next", "次回")}:{" "}
            <span className="font-bold text-primary">
              {minutesToNext < 60
                ? t(`${minutesToNext}m`, `${minutesToNext}分`)
                : t(formatHour(nextUpdateHour!), `${nextUpdateHour}時`)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
