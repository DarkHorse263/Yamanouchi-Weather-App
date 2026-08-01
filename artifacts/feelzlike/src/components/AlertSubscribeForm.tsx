import { useState, useId, useMemo } from "react";
import { useSubscribeToAlerts } from "@workspace/api-client-react";
import { useLanguage, usePremium, usePremiumAccess } from "@workspace/feelzlike-shell";
import { BellRing, Mail, Snowflake, Loader2, CheckCircle2, Check, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { classifyGateError, extractErrorMessage } from "@/lib/gateErrors";

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
export const ALERT_REGIONS: Array<{ id: string; nameEn: string; nameJa: string; country: string }> = [
  // Australia
  { id: "snowy-mountains", nameEn: "Snowy Mountains", nameJa: "スノーウィーマウンテンズ", country: "AU · NSW" },
  { id: "victorias-high-country", nameEn: "Victoria's High Country", nameJa: "ビクトリア高原地方", country: "AU · VIC" },
  { id: "tasmania", nameEn: "Tasmania", nameJa: "タスマニア", country: "AU · TAS" },
  // Japan
  { id: "yamanouchi", nameEn: "Yamanouchi", nameJa: "山ノ内町", country: "JP · Nagano" },
  { id: "nozawa-onsen", nameEn: "Nozawa Onsen", nameJa: "野沢温泉村", country: "JP · Nagano" },
  { id: "iiyama", nameEn: "Iiyama", nameJa: "飯山市", country: "JP · Nagano" },
  { id: "hakuba-valley", nameEn: "Hakuba Valley", nameJa: "白馬バレー", country: "JP · Nagano" },
  { id: "myoko", nameEn: "Myoko", nameJa: "妙高", country: "JP · Niigata" },
  { id: "niseko", nameEn: "Niseko", nameJa: "ニセコ", country: "JP · Hokkaido" },
  { id: "furano", nameEn: "Furano", nameJa: "富良野", country: "JP · Hokkaido" },
  { id: "sapporo", nameEn: "Sapporo", nameJa: "札幌", country: "JP · Hokkaido" },
  { id: "tomamu-sahoro", nameEn: "Tomamu & Sahoro", nameJa: "トマム・サホロ", country: "JP · Hokkaido" },
  { id: "asahikawa", nameEn: "Asahikawa", nameJa: "旭川", country: "JP · Hokkaido" },
  { id: "rusutsu-kiroro", nameEn: "Rusutsu & Kiroro", nameJa: "ルスツ・キロロ", country: "JP · Hokkaido" },
  { id: "yuzawa", nameEn: "Yuzawa", nameJa: "湯沢", country: "JP · Niigata" },
  { id: "zao-onsen", nameEn: "Zao Onsen", nameJa: "蔵王温泉", country: "JP · Yamagata" },
  { id: "bandai", nameEn: "Bandai", nameJa: "磐梯", country: "JP · Fukushima" },
  { id: "daisen", nameEn: "Daisen", nameJa: "大山", country: "JP · Tottori" },
  { id: "hakkoda-aomori-spring", nameEn: "Hakkoda & Aomori Spring", nameJa: "八甲田・青森スプリング", country: "JP · Aomori" },
  { id: "appi-shizukuishi", nameEn: "Appi & Shizukuishi", nameJa: "安比高原・雫石", country: "JP · Iwate" },
  { id: "minakami", nameEn: "Minakami", nameJa: "みなかみ", country: "JP · Gunma" },
  { id: "kusatsu-manza", nameEn: "Kusatsu & Manza", nameJa: "草津・万座", country: "JP · Gunma" },
  { id: "hachimantai", nameEn: "Hachimantai", nameJa: "八幡平", country: "JP · Iwate" },
  // New Zealand
  { id: "queenstown", nameEn: "Queenstown", nameJa: "クイーンズタウン", country: "NZ · Otago" },
  { id: "wanaka", nameEn: "Wanaka", nameJa: "ワナカ", country: "NZ · Otago" },
  { id: "mt-hutt", nameEn: "Mt Hutt", nameJa: "マウントハット", country: "NZ · Canterbury" },
  { id: "ruapehu", nameEn: "Ruapehu", nameJa: "ルアペフ", country: "NZ · North Island" },
  // Canada
  { id: "whistler", nameEn: "Whistler", nameJa: "ウィスラー", country: "CA · British Columbia" },
  { id: "powder-highway", nameEn: "Powder Highway", nameJa: "パウダーハイウェイ", country: "CA · BC Interior" },
  { id: "banff-lake-louise", nameEn: "Banff & Lake Louise", nameJa: "バンフ・レイクルイーズ", country: "CA · Alberta" },
  { id: "canmore", nameEn: "Canmore", nameJa: "キャンモア", country: "CA · Alberta" },
  { id: "jasper", nameEn: "Jasper", nameJa: "ジャスパー", country: "CA · Alberta" },
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
  const { isPromoPeriod, promoEndsAt } = usePremium();
  const { promptSignUp } = usePremiumAccess();
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
      // Conversion event · snow/powder alert subscribed. No email or other PII
      // is sent · only the non-identifying shape of the subscription.
      track("alert_subscribe", {
        category: "alert",
        data: {
          region_count: regions.length,
          regions: regions.join(","),
          threshold_cm: threshold,
          horizon_hours: horizon,
        },
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
            <a href={submitted.devVerifyUrl} className="text-sky-700 break-all hover:underline">{submitted.devVerifyUrl}</a>
          </div>
        )}
      </div>
    );
  }

  const gateError = classifyGateError(mutation.error);
  const authRequired = gateError === "auth";
  const paymentRequired = gateError === "payment";
  const errMessage = gateError === "other" ? extractErrorMessage(mutation.error) : null;
  const canSubmit = !!email && regions.length > 0 && consent && !mutation.isPending;

  return (
    <form id={formId} onSubmit={handleSubmit} className="rounded-2xl glass border border-border p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BellRing className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{t("Subscribe to powder alerts", "パウダーアラートを購読")}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="w-3 h-3" /> {t("premium", "プレミアム")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        {t("We'll only email when forecast snowfall meets your threshold. Unsubscribe in one click.", "予報降雪量がしきい値に達したときのみメールを送信します。ワンクリックで購読解除できます。")}
      </p>
      {isPromoPeriod && promoEndsAt && (
        <p className="text-xs text-primary/90 -mt-1 font-medium">
          {t(
            `free for subscribers until ${formatDate(promoEndsAt)} · no card needed`,
            `${formatDate(promoEndsAt)}まで購読者は無料 · カード不要`,
          )}
        </p>
      )}

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
          {ALERT_REGIONS.map((r) => {
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

      {authRequired && (
        <div className="text-xs text-foreground bg-primary/10 border border-primary/30 rounded-lg px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" /> {t("powder alerts come with your free account", "パウダーアラートは無料アカウントで利用できます")}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t("create a free account with this email and your subscription is saved · free until the promo ends, no card needed.", "このメールで無料アカウントを作成すると購読が保存されます · プロモ期間中は無料、カード不要です。")}
          </p>
          <button
            type="button"
            onClick={() => promptSignUp({ email, feature: "alerts" })}
            className="inline-block text-primary font-bold underline hover:no-underline"
          >
            {t("create my free account", "無料アカウントを作成")}
          </button>
        </div>
      )}

      {paymentRequired && (
        <div className="text-xs text-foreground bg-primary/10 border border-primary/30 rounded-lg px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" /> {t("Powder alerts are a premium feature", "パウダーアラートはプレミアム機能です")}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t("The launch promo has ended. See plans on the premium page.", "ローンチプロモは終了しました。プレミアムページでプランをご覧ください。")}
          </p>
          <a href="/premium" className="inline-block text-primary font-bold underline hover:no-underline">
            {t("Go to premium", "プレミアムへ")}
          </a>
        </div>
      )}

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

function formatDate(d: Date): string {
  return d
    .toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })
    .toLowerCase();
}

// Gate-error detection (401 AUTH_REQUIRED vs 402 PAYMENT_REQUIRED) lives in
// @/lib/gateErrors so this form and PremiumSubscribe can't drift apart.
