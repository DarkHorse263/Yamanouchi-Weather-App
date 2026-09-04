import { useEffect, useState, useId, useMemo } from "react";
import { useSubscribeToAlerts } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { BellRing, Mail, Snowflake, Loader2, CheckCircle2 } from "lucide-react";
import { RegionCountryPicker } from "@/components/RegionCountryPicker";
import { track } from "@/lib/analytics";
import { extractErrorMessage } from "@/lib/gateErrors";
import { pingAlertFunnel } from "@/lib/engagement";
import { CatalogueMountainPicker } from "@/components/CatalogueMountainPicker";
import { isAlertCatalogueMountain } from "@/lib/alertCatalogueMountains";
import { ALERT_REGIONS } from "@/lib/alertRegions";

/**
 * Powder-alert subscription form. Mounts inside any region's Alerts page.
 * Region defaults to the host page's region; user can opt into others.
 *
 * Honest privacy posture per playbook: explicit consent checkbox, threshold
 * defaults to "useful but not noisy" (15cm / 48hr), unsubscribe in one click.
 */


const HORIZONS: Array<{ value: 24 | 48 | 72; label: string; labelJa: string }> = [
  { value: 24, label: "Next 24 hr", labelJa: "24時間以内" },
  { value: 48, label: "Next 48 hr", labelJa: "48時間以内" },
  { value: 72, label: "Next 72 hr", labelJa: "72時間以内" },
];

interface Props {
  defaultRegion?: string;
  defaultMountain?: string;
}

export function AlertSubscribeForm({ defaultRegion, defaultMountain }: Props) {
  const { t } = useLanguage();
  const formId = useId();
  const browserTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
  }, []);

  const [email, setEmail] = useState("");
  const [regions, setRegions] = useState<string[]>(
    defaultRegion && ALERT_REGIONS.some((region) => region.id === defaultRegion) ? [defaultRegion] : [],
  );
  const [mountains, setMountains] = useState<string[]>(
    defaultMountain && isAlertCatalogueMountain(defaultMountain)
      ? [defaultMountain]
      : [],
  );
  const [threshold, setThreshold] = useState(15);
  const [horizon, setHorizon] = useState<24 | 48 | 72>(48);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<{ message: string; devVerifyUrl?: string | null } | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const mutation = useSubscribeToAlerts();

  useEffect(() => {
    pingAlertFunnel("form_viewed", "alert_form");
  }, []);

  const toggleRegion = (id: string) => {
    setRegions((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };
  const toggleMountain = (id: string) => {
    setMountains((prev) => prev.includes(id) ? prev.filter((mountain) => mountain !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    pingAlertFunnel("submit_attempted", "alert_form");
    if (!email || (regions.length === 0 && mountains.length === 0) || !consent) {
      setValidationMessage(
        t(
          "Add your email, choose at least one region or mountain, and tick the consent box.",
          "メールアドレスを入力し、地域または山を1つ以上選び、同意欄にチェックしてください。",
        ),
      );
      pingAlertFunnel("validation_failed", "alert_form");
      return;
    }
    setValidationMessage(null);
    try {
      const result = await mutation.mutateAsync({
        data: {
          email,
          regions,
          mountains,
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
      const status = (result as { status?: string }).status;
      pingAlertFunnel(
        status === "already_verified" ? "already_verified" : "verification_pending",
        "alert_form",
      );
      // Conversion event · snow/powder alert subscribed. No email or other PII
      // is sent · only the non-identifying shape of the subscription.
      track("alert_subscribe", {
        category: "alert",
        data: {
          region_count: regions.length,
          regions: regions.join(","),
          mountain_count: mountains.length,
          threshold_cm: threshold,
          horizon_hours: horizon,
        },
      });
    } catch {
      // mutation.error will surface the error below
      pingAlertFunnel("api_failed", "alert_form");
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
        <p className="text-xs text-muted-foreground">
          {t(
            "Your alert stays inactive until you verify your email. You still don't need an account.",
            "メールアドレスを確認するまでアラートは有効になりません。アカウントは引き続き不要です。",
          )}
        </p>
        {submitted.devVerifyUrl && (
          <div className="text-xs bg-black/30 rounded p-3 border border-white/10">
            <div className="text-muted-foreground mb-1 font-bold uppercase tracking-wider">Dev mode - no email sent</div>
            <a href={submitted.devVerifyUrl} className="text-sky-700 break-all hover:underline">{submitted.devVerifyUrl}</a>
          </div>
        )}
      </div>
    );
  }

  const errMessage = mutation.error ? extractErrorMessage(mutation.error) : null;

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="rounded-2xl glass border border-border p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BellRing className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{t("Subscribe to powder alerts", "パウダーアラートを購読")}</h3>
        <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {t("standard feature", "標準機能")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        {t(
          "No account needed. We'll send a verification email first, then only email when forecast snowfall meets your threshold.",
          "アカウントは不要です。最初に確認メールを送信し、その後は予報降雪量がしきい値に達したときのみメールを送信します。",
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {t(
          "Create an account only if you want to manage alerts alongside your other feelzlike preferences. Every alert email includes a one-click unsubscribe link.",
          "他のfeelzlike設定と一緒にアラートを管理したい場合のみ、アカウントを作成してください。すべてのアラートメールにワンクリックの購読解除リンクがあります。",
        )}
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
        <div className="mt-1.5">
          <RegionCountryPicker selected={regions} onToggle={toggleRegion} variant="glass" />
        </div>
        <div className="mt-2">
          <CatalogueMountainPicker selected={mountains} onToggle={toggleMountain} variant="glass" />
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

      {validationMessage && (
        <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {validationMessage}
        </div>
      )}

      {errMessage && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {errMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-primary text-primary-foreground font-bold text-sm py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("Subscribe", "登録する")}
      </button>
    </form>
  );
}
