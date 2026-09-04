import { useMemo, useState } from "react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { Check, ChevronDown } from "lucide-react";
import { ALERT_REGIONS, COUNTRY_REGION_TOTALS } from "@/lib/alertRegions";

/**
 * Region multi-select grouped into collapsible country sections.
 * Shared by AlertSubscribeForm, PremiumSubscribe and the Account alerts card
 * so the (100+) region list never renders as one flat wall of checkboxes.
 *
 * Sections holding a selected region start expanded; the rest start closed.
 */

const COUNTRY_LABELS: Record<string, { en: string; ja: string }> = {
  AU: { en: "australia", ja: "オーストラリア" },
  JP: { en: "japan", ja: "日本" },
  NZ: { en: "new zealand", ja: "ニュージーランド" },
  CA: { en: "canada", ja: "カナダ" },
  US: { en: "usa", ja: "アメリカ" },
};

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  /** "glass" matches the alert form chrome, "light" the white cards. */
  variant?: "glass" | "light";
}

export function RegionCountryPicker({ selected, onToggle, variant = "light" }: Props) {
  const { t } = useLanguage();

  const groups = useMemo(() => {
    const order: string[] = [];
    const byCountry: Record<string, Array<(typeof ALERT_REGIONS)[number]>> = {};
    for (const r of ALERT_REGIONS) {
      const key = r.country.split("·")[0]!.trim();
      if (!byCountry[key]) order.push(key);
      (byCountry[key] ??= []).push(r);
    }
    return order.map((key) => ({ key, regions: byCountry[key]! }));
  }, []);

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    for (const g of groups) o[g.key] = g.regions.some((r) => selected.includes(r.id));
    return o;
  });

  const glass = variant === "glass";
  const rowIdle = glass
    ? "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
    : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-foreground/30";
  const boxIdle = glass ? "bg-black/30 border-white/20" : "bg-white border-border";
  const headIdle = glass
    ? "bg-black/15 border-white/10 hover:border-white/20"
    : "bg-secondary/40 border-border hover:border-foreground/30";

  return (
    <div className="space-y-2">
      {groups.map(({ key, regions: rs }) => {
        const label = COUNTRY_LABELS[key] ?? { en: key.toLowerCase(), ja: key };
        const count = rs.filter((r) => selected.includes(r.id)).length;
        const isOpen = !!open[key];
        const panelId = `region-picker-${key.toLowerCase()}`;
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [key]: !p[key] }))}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 border transition text-left ${headIdle}`}
            >
              <span className="flex-1 text-sm font-bold text-foreground">{t(label.en, label.ja)}</span>
              {count > 0 && (
                <span className="text-[11px] font-bold text-primary tabular-nums">
                  {t(`${count} selected`, `${count}件選択中`)}
                </span>
              )}
               <span className="text-[11px] text-muted-foreground tabular-nums">
                 {COUNTRY_REGION_TOTALS[key as keyof typeof COUNTRY_REGION_TOTALS] ?? rs.length}
               </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div id={panelId} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rs.map((r) => {
                  const checked = selected.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => onToggle(r.id)}
                      role="checkbox"
                      aria-checked={checked}
                      className={`flex items-center gap-3 text-left rounded-lg px-3 py-2.5 border transition ${
                        checked ? "bg-primary/15 border-primary/40 text-foreground" : rowIdle
                      }`}
                    >
                      <span
                        className={`flex-none inline-flex items-center justify-center w-5 h-5 rounded-md border transition ${
                          checked ? "bg-primary border-primary text-primary-foreground" : boxIdle
                        }`}
                        aria-hidden="true"
                      >
                        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-tight">{t(r.nameEn, r.nameJa)}</span>
                        <span className="block text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{r.country}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
