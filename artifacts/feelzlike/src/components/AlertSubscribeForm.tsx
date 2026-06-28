import { useState, useId, useMemo } from "react";
import { useSubscribeToAlerts } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { BellRing, Mail, Snowflake, Loader2, CheckCircle2, Check } from "lucide-react";

/**
 * Powder-alert subscription form. Mounts inside any region's Alerts page.
 * Region defaults to the host page's region; user can opt into others.
 *
 * Honest privacy posture per playbook: explicit consent checkbox, threshold
 * defaults to "useful but not noisy" (15cm / 48hr), unsubscribe in one click.
 */

// Region list mirrors the active region registry (src/regions/index.ts) and the
// server's REGION_IDS (api-server/src/lib/regions.ts). The alert evaluator
// monitors every one of these via REGION_ANCHORS, so keep all three in sync
// when a region goes live. Tickbox UI lets users select multiple.
const REGIONS: Array<{ id: string; nameEn: string; nameJa: string; country: string }> = [
  // Australia
  { id: "snowy-mountains", nameEn: "Snowy Mountains", nameJa: "スノーウィーマウンテンズ", country: "AU · NSW" },
  { id: "victorias-high-country", nameEn: "Victoria's High Country", nameJa: "ビクトリア高原地方", country: "AU · VIC" },
  { id: "tasmania", nameEn: "Tasmania", nameJa: "タスマニア", country: "AU · TAS" },
  // Japan
  { id: "yamanouchi", nameEn: "Yamanouchi", nameJa: "山ノ内町", country: "JP · Nagano" },
  { id: "nozawa-onsen", nameEn: "Nozawa Onsen", nameJa: "野沢温泉村", country: "JP · Nagano" },
  { id: "iiyama", nameEn: "Iiyama", nameJa: "飯山市", country: "JP · Nagano" },
  // New Zealand
  { id: "queenstown", nameEn: "Queenstown", nameJa: "クイーンズタウン", country: "NZ · Otago" },
  { id: "wanaka", nameEn: "Wanaka", nameJa: "ワナカ", country: "NZ · Otago" },
  { id: "mt-hutt", nameEn: "Mt Hutt", nameJa: "マウントハット", country: "NZ · Canterbury" },
  { id: "ruapehu", nameEn: "Ruapehu", nameJa: "ルアペフ", country: "NZ · North Island" },
];

const HORIZONS: Array<{ value: 24 | 48 | 72; label: string; labelJa: string }> = [
  { value: 24, label: "Next 24 hr", labelJa: "24時間以内" },
  { value: 48, label: "Next 48 hr", labelJa: "48時間以内" },
  { value: 72, label: "Next 72 hr", labelJa: "72時間以内" },
];

interface Props {
  defaultRegion?: string;
}

export function AlertSubscribeForm({ defaultRegion }: Props) {
  const { t } = useLanguage();
  const formId = useId();
  const browserTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
  }, []);

  const [email, setEmail] = useState("");
  const [regions, setRegions] = useState<string[]>(defaultRegion ? [defaultRegion] : []);
  const [threshold, setThreshold] = useState(15);
  const [horizon, setHorizon] = useState<24 | 48 | 72>(48);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<{ message: string; devVerifyUrl?: string | null } | null>(null);

  const mutation = useSubscribeToAlerts();

  const toggleRegion = (id: string) => {
    setRegions((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || regions.length === 0 || !consent) return;
    try {
      const result = await mutation.mutateAsync({
        data: {
          email,
          regions,
          mountains: [],
          snowfallThresholdCm: threshold,
          horizonHours: horizon,
          delivery: "email",
          timezone: browserTz,
          consent: true,
        },
      });
      setSubmitted({
        message: result.message,
        devVerifyUrl: (result as { devVerifyUrl?: string | null }).devVerifyUrl ?? null,
      });
    } catch {
      // mutation.error will surface the error below
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl glass border border-emerald-500/30 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <h3 className="text-lg font-bold text-foreground">{t("Almost there", "もう少しです")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{submitted.message}</p>
        {submitted.devVerifyUrl && (
          <div className="text-xs bg-black/30 rounded p-3 border border-white/10">
            <div className="text-muted-foreground mb-1 font-bold uppercase tracking-wider">Dev mode - no email sent</div>
            <a href={submitted.devVerifyUrl} className="text-sky-400 break-all hover:underline">{submitted.devVerifyUrl}</a>
          </div>
        )}
      </div>
    );
  }

  const errMessage = mutation.error ? extractErrorMessage(mutation.error) : null;
  const canSubmit = !!email && regions.length > 0 && consent && !mutation.isPending;

  return (
    <form id={formId} onSubmit={handleSubmit} className="rounded-2xl glass border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{t("Subscribe to powder alerts", "パウダーアラートを購読")}</h3>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        {t("We'll only email when forecast snowfall meets your threshold. Unsubscribe in one click.", "予報降雪量がしきい値に達したときのみメールを送信します。ワンクリックで購読解除できます。")}
      </p>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> {t("Email", "メール")}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("Regions · tick the ones you want", "地域 · 必要なものにチェック")}
        </span>
        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REGIONS.map((r) => {
            const checked = regions.includes(r.id);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggleRegion(r.id)}
                className={`flex items-center gap-3 text-left rounded-lg px-3 py-2.5 border transition ${
                  checked
                    ? "bg-primary/15 border-primary/40 text-foreground"
                    : "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
                }`}
                role="checkbox"
                aria-checked={checked}
              >
                <span
                  className={`flex-none inline-flex items-center justify-center w-5 h-5 rounded-md border transition ${
                    checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-black/30 border-white/20"
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
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Snowflake className="w-3.5 h-3.5" /> {t("Threshold", "しきい値")}
          </span>
          <span className="text-sm font-black text-primary tabular-nums">{threshold} cm</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-2 w-full accent-sky-500"
          aria-label={t("Snowfall threshold in centimetres", "降雪量のしきい値")}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
          <span>5cm</span><span>25cm</span><span>50cm</span>
        </div>
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("Look-ahead window", "予報期間")}
        </span>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setHorizon(h.value)}
              className={`rounded-lg px-2 py-2 text-xs font-bold border transition ${
                horizon === h.value
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
              aria-pressed={horizon === h.value}
            >
              {t(h.label, h.labelJa)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-sky-500"
          required
        />
        <span>
          {t(
            "I agree to receive powder alerts at this email address. I can unsubscribe at any time. See the ",
            "このメールアドレスでパウダーアラートを受け取ることに同意します。いつでも購読解除できます。"
          )}
          <a href="/legal/privacy" className="underline hover:text-foreground">{t("privacy policy", "プライバシーポリシー")}</a>.
        </span>
      </label>

      {errMessage && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {errMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-primary text-primary-foreground font-bold text-sm py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("Subscribe", "登録する")}
      </button>
    </form>
  );
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as { message?: string; data?: { message?: string }; response?: { data?: { message?: string } } };
    return anyErr.response?.data?.message
      ?? anyErr.data?.message
      ?? anyErr.message
      ?? "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}
