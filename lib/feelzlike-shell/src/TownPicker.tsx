import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { cn } from "./cn";
import { useBaseTown } from "./BaseTownProvider";
import { useLanguage } from "./LanguageProvider";

interface TownPickerProps {
  /** Visual variant — "sidebar" is full width; "compact" fits the mobile header */
  variant?: "sidebar" | "compact";
  className?: string;
}

export function TownPicker({ variant = "sidebar", className }: TownPickerProps) {
  const { towns, town, setTownId } = useBaseTown();
  const lang = useLanguage();
  const t = (en: string, ja?: string) => lang.t(en, ja);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (towns.length === 0 || !town) return null;

  const compact = variant === "compact";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("Staying in", "滞在地")} ${t(town.name, town.nameJa)}. ${t("Change base town", "拠点を変更")}`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-border bg-white transition-all",
          "hover:border-foreground/30 hover:shadow-sm",
          compact
            ? "px-2.5 py-1 text-[11px]"
            : "w-full px-3 py-2 text-xs",
        )}
      >
        <MapPin className={cn("text-primary", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
        <span className="byline text-muted-foreground/80 hidden md:inline">
          {t("Staying in", "滞在地")}
        </span>
        <span className="font-display font-semibold text-foreground tracking-tight">
          {t(town.name, town.nameJa)}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground transition-transform",
            compact ? "w-3 h-3" : "w-3.5 h-3.5",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("Base towns", "拠点の町")}
          className={cn(
            "absolute z-50 mt-2 rounded-xl border border-border bg-white shadow-lg overflow-hidden",
            compact ? "right-0 min-w-[180px]" : "left-0 right-0",
          )}
        >
          <div className="px-3 py-2 byline text-muted-foreground/70 border-b border-border">
            {t("Base towns", "拠点の町")}
          </div>
          {towns.map((opt) => {
            const active = opt.id === town.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTownId(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors",
                  active ? "bg-primary/8" : "hover:bg-secondary",
                )}
              >
                <Check
                  className={cn(
                    "w-3.5 h-3.5 mt-0.5 shrink-0",
                    active ? "text-primary opacity-100" : "opacity-0",
                  )}
                />
                <div className="min-w-0">
                  <div
                    className={cn(
                      "font-display font-semibold text-sm leading-tight",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {t(opt.name, opt.nameJa)}
                  </div>
                  {opt.blurb && (
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">
                      {t(opt.blurb, opt.blurbJa)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
