import { useState } from "react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { alertCatalogueMountains } from "@/lib/alertCatalogueMountains";

const MOUNTAINS_BY_STATE = [...alertCatalogueMountains.reduce(
  (groups, record) => {
    const records = groups.get(record.stateOrProvince) ?? [];
    records.push(record);
    groups.set(record.stateOrProvince, records);
    return groups;
  },
  new Map<string, typeof alertCatalogueMountains[number][]>(),
)].sort(([a], [b]) => a.localeCompare(b));

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  variant?: "glass" | "light";
}

export function CatalogueMountainPicker({ selected, onToggle, variant = "light" }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(selected.length > 0);
  const glass = variant === "glass";
  const shell = glass ? "border-white/10 bg-black/15" : "border-border bg-secondary/30";
  const divider = glass ? "border-white/10" : "border-border";
  const idle = glass
    ? "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
    : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-foreground/30";

  return (
    <div className={`rounded-lg border ${shell}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span>
          <span className="block text-sm font-bold text-foreground">
            {t("usa mountains", "アメリカのスキー場")}
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            {alertCatalogueMountains.length} {t("alert-ready mountains", "アラート対応スキー場")}
          </span>
        </span>
        <span className="text-xs font-bold text-primary">
          {selected.length > 0 ? t(`${selected.length} selected`, `${selected.length}件選択中`) : open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className={`border-t p-2 space-y-3 ${divider}`}>
          {MOUNTAINS_BY_STATE.map(([state, records]) => (
            <fieldset key={state}>
              <legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {state}
              </legend>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {records.map((record) => {
                  const checked = selected.includes(record.publicId);
                  return (
                    <button
                      type="button"
                      key={record.publicId}
                      onClick={() => onToggle(record.publicId)}
                      role="checkbox"
                      aria-checked={checked}
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                        checked ? "bg-primary/15 border-primary/40 text-foreground" : idle
                      }`}
                    >
                      {record.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}