import { useId, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Snowflake, Mountain, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useProfile } from "@/hooks/useProfile";
import {
  DISCIPLINE_LABELS,
  PRIORITY_LABELS,
  RISK_LABELS,
  SKILL_LEVEL_LABELS,
  type Discipline,
  type Priority,
  type RiskTolerance,
  type SkillLevel,
  type UserProfile,
} from "@/types/profile";
import { useLanguage } from "@workspace/feelzlike-shell";

/**
 * ProfileSheet — combined onboarding + edit experience for the UserProfile.
 *
 * Two modes via the `mode` prop:
 *  - `onboarding`: 4-step wizard (skill → discipline → priorities → risk)
 *    that ends with a "Save preferences" CTA. Auto-stamps `onboardedAt`.
 *  - `edit`: single-page form with all 4 sections visible at once + Save/Reset.
 *
 * Both modes share the same field UI (`SegmentedField`, `MultiSelectField`)
 * so visual consistency is enforced. Open/close is controlled by the parent
 * via Radix's `<Sheet open onOpenChange>` pattern.
 *
 * On mount the local form state is seeded from the persisted profile (so
 * the edit mode shows current values). The form state is committed to
 * localStorage only when the user clicks Save — escapes/cancels discard.
 */
export function ProfileSheet({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "onboarding" | "edit";
}) {
  const { profile, setProfile, resetProfile } = useProfile();
  const { t } = useLanguage();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [step, setStep] = useState(0);

  // Reseed the draft each time the sheet opens so we never edit stale state.
  useEffect(() => {
    if (open) {
      setDraft(profile);
      setStep(0);
    }
  }, [open, profile]);

  function commit(stampOnboarding: boolean) {
    const next: UserProfile = {
      ...draft,
      onboardedAt: stampOnboarding && !draft.onboardedAt
        ? new Date().toISOString()
        : draft.onboardedAt ?? (mode === "onboarding" ? new Date().toISOString() : null),
    };
    setProfile(next);
    onOpenChange(false);
  }

  function skip() {
    // Stamp onboardedAt so we don't nag again, but keep current preferences.
    setProfile({ ...profile, onboardedAt: new Date().toISOString() });
    onOpenChange(false);
  }

  // ----- shared field renderers -----
  // NOTE: Don't use explicit JSX generic syntax (<Component<T> ...>) — the
  // Replit cartographer plugin injects data-replit-metadata attributes
  // before the generic and breaks the babel parser. TS infers the generic
  // from the props (value/onChange), so we don't need it explicitly.
  const skillField = (
    <SegmentedField
      icon={<Mountain className="w-4 h-4" />}
      label={t("Your skill level", "あなたのレベル")}
      value={draft.skill_level}
      onChange={(v: SkillLevel) => setDraft((d) => ({ ...d, skill_level: v }))}
      options={(Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[]).map((k) => ({
        value: k,
        label: t(SKILL_LEVEL_LABELS[k].en, SKILL_LEVEL_LABELS[k].ja),
      }))}
    />
  );

  const disciplineField = (
    <SegmentedField
      icon={<Snowflake className="w-4 h-4" />}
      label={t("Ski or snowboard?", "スキー or スノーボード")}
      value={draft.discipline}
      onChange={(v: Discipline) => setDraft((d) => ({ ...d, discipline: v }))}
      options={(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((k) => ({
        value: k,
        label: t(DISCIPLINE_LABELS[k].en, DISCIPLINE_LABELS[k].ja),
      }))}
    />
  );

  const prioritiesField = (
    <MultiSelectField
      icon={<Sparkles className="w-4 h-4" />}
      label={t("What matters most? (pick up to 3)", "重視するポイント (最大3つ)")}
      value={draft.priorities}
      max={3}
      onChange={(v: Priority[]) => setDraft((d) => ({ ...d, priorities: v }))}
      options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((k) => ({
        value: k,
        label: t(PRIORITY_LABELS[k].en, PRIORITY_LABELS[k].ja),
        hint: PRIORITY_LABELS[k].hint,
      }))}
    />
  );

  const riskField = (
    <SegmentedField
      icon={<ShieldAlert className="w-4 h-4" />}
      label={t("Risk tolerance", "リスク許容度")}
      value={draft.risk_tolerance}
      onChange={(v: RiskTolerance) => setDraft((d) => ({ ...d, risk_tolerance: v }))}
      options={(Object.keys(RISK_LABELS) as RiskTolerance[]).map((k) => ({
        value: k,
        label: t(RISK_LABELS[k].en, RISK_LABELS[k].ja),
      }))}
    />
  );

  const STEPS = [
    { title: t("Skill level", "レベル"), field: skillField },
    { title: t("Discipline", "種目"), field: disciplineField },
    { title: t("Priorities", "重視点"), field: prioritiesField },
    { title: t("Risk tolerance", "リスク許容"), field: riskField },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <SheetTitle className="font-display text-xl tracking-tight">
                {mode === "onboarding"
                  ? t("Personalise Today's Call", "今日の判断をパーソナライズ")
                  : t("Your skiing profile", "あなたのスキープロフィール")}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {mode === "onboarding"
                  ? t(
                      "30 seconds, 4 questions. We'll use this to rank mountains for you.",
                      "30秒・4問。あなたに合うスキー場を順位付けします。"
                    )
                  : t(
                      "Tweak anytime — Today's Call will re-rank instantly.",
                      "いつでも変更可能 · 今日の判断は即時に再評価されます。"
                    )}
              </SheetDescription>
            </div>
          </div>

          {mode === "onboarding" && (
            <div className="flex items-center gap-1.5 mt-3">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-border"
                  )}
                />
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {mode === "onboarding" ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
            >
              <p className="byline text-muted-foreground mb-4">
                {t(`Step ${step + 1} of ${STEPS.length}`, `ステップ ${step + 1}/${STEPS.length}`)}
              </p>
              {STEPS[step].field}
            </motion.div>
          ) : (
            <div className="space-y-8">
              {STEPS.map((s) => (
                <div key={s.title}>{s.field}</div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-secondary/20">
          {mode === "onboarding" ? (
            <>
              <button
                type="button"
                onClick={skip}
                className="byline text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("Skip for now", "スキップ")}
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    {t("Back", "戻る")}
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setStep((s) => s + 1)}
                    className="gap-1"
                  >
                    {t("Next", "次へ")}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => commit(true)}>
                    {t("Save preferences", "保存")}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  resetProfile();
                  onOpenChange(false);
                }}
                className="byline text-muted-foreground hover:text-rose-700 transition-colors"
              >
                {t("Reset to defaults", "初期化")}
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  {t("Cancel", "キャンセル")}
                </Button>
                <Button size="sm" onClick={() => commit(false)}>
                  {t("Save", "保存")}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// SegmentedField — single-select pill row, used for skill / discipline / risk
// ---------------------------------------------------------------------------

function SegmentedField<T extends string>({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  // Use radiogroup semantics so screen readers announce the current
  // selection + that the user can move between siblings.
  // useId() generates a stable, whitespace-free ID — `label` may contain
  // spaces or non-ASCII characters (e.g. localised JP strings), which are
  // not valid IDREFs for aria-labelledby.
  const labelId = useId();
  return (
    <div>
      <div className="flex items-center gap-2 mb-3" id={labelId}>
        <span className="text-muted-foreground/70">{icon}</span>
        <p className="font-display font-semibold text-sm tracking-tight text-foreground">
          {label}
        </p>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "border-border bg-white text-foreground hover:border-foreground/30"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MultiSelectField — checkbox-pill grid with a max-N cap
// ---------------------------------------------------------------------------

function MultiSelectField<T extends string>({
  icon,
  label,
  value,
  onChange,
  options,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  value: T[];
  onChange: (v: T[]) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  max?: number;
}) {
  const labelId = useId();
  function toggle(v: T) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      // Cap: if at max, drop the oldest selection to make room.
      const next = max && value.length >= max ? [...value.slice(1), v] : [...value, v];
      onChange(next);
    }
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-3" id={labelId}>
        <span className="text-muted-foreground/70">{icon}</span>
        <p className="font-display font-semibold text-sm tracking-tight text-foreground">
          {label}
        </p>
      </div>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              aria-label={o.hint ? `${o.label}: ${o.hint}` : o.label}
              onClick={() => toggle(o.value)}
              title={o.hint}
              className={cn(
                "relative rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "border-border bg-white text-foreground hover:border-foreground/30"
              )}
            >
              {o.label}
              {active && (
                <span aria-hidden="true" className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white">
                  <X className="w-2.5 h-2.5 rotate-45" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
