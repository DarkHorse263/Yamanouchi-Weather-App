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
  { id: "australian-capital-territory", nameEn: "Australian Capital Territory", nameJa: "オーストラリア首都特別地域", country: "AU · ACT" },
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
  { id: "okanagan", nameEn: "Okanagan", nameJa: "オカナガン", country: "CA · BC Interior" },
  { id: "vancouver", nameEn: "Vancouver & the Island", nameJa: "バンクーバー・アイランド", country: "CA · British Columbia" },
  { id: "banff-lake-louise", nameEn: "Banff & Lake Louise", nameJa: "バンフ・レイクルイーズ", country: "CA · Alberta" },
  { id: "canmore", nameEn: "Canmore", nameJa: "キャンモア", country: "CA · Alberta" },
  { id: "jasper", nameEn: "Jasper", nameJa: "ジャスパー", country: "CA · Alberta" },
  { id: "quebec-laurentians", nameEn: "Laurentians", nameJa: "ローレンシャン", country: "CA · Québec" },
  { id: "quebec-charlevoix", nameEn: "Charlevoix", nameJa: "シャルルヴォワ", country: "CA · Québec" },
  { id: "quebec-eastern-townships", nameEn: "Eastern Townships", nameJa: "イースタンタウンシップス", country: "CA · Québec" },
  // United States (Colorado)
  { id: "summit-county", nameEn: "Summit County", nameJa: "サミットカウンティー", country: "US · Colorado" },
  { id: "vail-valley", nameEn: "Vail Valley", nameJa: "ヴェイル・バレー", country: "US · Colorado" },
  { id: "aspen-snowmass", nameEn: "Aspen Snowmass", nameJa: "アスペン・スノーマス", country: "US · Colorado" },
  { id: "steamboat", nameEn: "Steamboat", nameJa: "スチームボート", country: "US · Colorado" },
  { id: "winter-park", nameEn: "Winter Park", nameJa: "ウィンターパーク", country: "US · Colorado" },
  { id: "crested-butte", nameEn: "Crested Butte", nameJa: "クレステッド・ビュート", country: "US · Colorado" },
  { id: "telluride", nameEn: "Telluride", nameJa: "テルライド", country: "US · Colorado" },
  { id: "durango", nameEn: "Durango", nameJa: "デュランゴ", country: "US · Colorado" },
  { id: "boulder-front-range", nameEn: "Boulder / Front Range", nameJa: "ボルダー・フロントレンジ", country: "US · Colorado" },

  // United States (Utah)
  { id: "cottonwood-canyons", nameEn: "Cottonwood Canyons", nameJa: "コトンウッド・キャニオンズ", country: "US · Utah" },
  { id: "park-city", nameEn: "Park City", nameJa: "パークシティ", country: "US · Utah" },
  { id: "ogden-valley", nameEn: "Ogden Valley", nameJa: "オグデンバレー", country: "US · Utah" },
  { id: "provo", nameEn: "Provo", nameJa: "プロボ", country: "US · Utah" },
  { id: "cache-valley", nameEn: "Cache Valley", nameJa: "キャッシュバレー", country: "US · Utah" },
  { id: "north-lake-tahoe", nameEn: "North Lake Tahoe", nameJa: "ノーザーンレイキ・タホー", country: "US · California" },
  { id: "south-lake-tahoe", nameEn: "South Lake Tahoe", nameJa: "サザーンレイキ・タホー", country: "US · California" },
  { id: "mammoth-lakes", nameEn: "Mammoth Lakes", nameJa: "マモスレイカズ", country: "US · California" },
  { id: "big-bear", nameEn: "Big Bear", nameJa: "ビグベアー", country: "US · California" },
  { id: "bear-valley", nameEn: "Bear Valley", nameJa: "ベアバリー", country: "US · California" },
  { id: "mt-shasta", nameEn: "Mt. Shasta", nameJa: "シャスタ山", country: "US · California" },

  // United States (Vermont)
  { id: "killington-pico", nameEn: "Killington/Pico", nameJa: "キリントン・ピコ", country: "US · Vermont" },
  { id: "stowe-smugglers-notch", nameEn: "Stowe/Smugglers' Notch", nameJa: "ストウ・スマグラーズノッチ", country: "US · Vermont" },
  { id: "mad-river-valley", nameEn: "Mad River Valley", nameJa: "マッドリバーバレー", country: "US · Vermont" },
  { id: "southern-vermont", nameEn: "Southern Vermont", nameJa: "サザンバーモント", country: "US · Vermont" },
  { id: "okemo", nameEn: "Okemo", nameJa: "オキーモ", country: "US · Vermont" },
  { id: "jay-peak-nek", nameEn: "Jay Peak/Northeast Kingdom", nameJa: "ジェイピーク", country: "US · Vermont" },
  { id: "jackson-hole", nameEn: "Jackson Hole", nameJa: "ジャクソンホール", country: "US · Wyoming" },
  { id: "grand-targhee", nameEn: "Grand Targhee", nameJa: "グランドターガビー", country: "US · Wyoming" },
  { id: "big-sky", nameEn: "Big Sky", nameJa: "ビッグスカイ", country: "US · Montana" },
  { id: "bozeman-bridger-bowl", nameEn: "Bozeman / Bridger Bowl", nameJa: "ボーズマン／ブリッジャーボウル", country: "US · Montana" },
  { id: "whitefish", nameEn: "Whitefish", nameJa: "ホワイトフィッシュ", country: "US · Montana" },
  { id: "red-lodge", nameEn: "Red Lodge", nameJa: "レッドロッジ", country: "US · Montana" },
  { id: "taos", nameEn: "Taos", nameJa: "タオス", country: "US · New Mexico" },
  { id: "angel-fire", nameEn: "Angel Fire", nameJa: "エンジェルファイア", country: "US · New Mexico" },
  { id: "santa-fe", nameEn: "Santa Fe", nameJa: "サンタフェ", country: "US · New Mexico" },
  { id: "albuquerque-sandia", nameEn: "Albuquerque", nameJa: "アルバカーキー", country: "US · New Mexico" },
  { id: "harbor-springs", nameEn: "Harbor Springs", nameJa: "ハーバースプリングス", country: "US · Michigan" },
  { id: "keweenaw-peninsula", nameEn: "Keweenaw Peninsula", nameJa: "キーウィノー半島", country: "US · Michigan" },
  { id:"poconos",nameEn:"Poconos",nameJa:"ポコノス",country:"US · Pennsylvania" },
  { id:"laurel-highlands",nameEn:"Laurel Highlands",nameJa:"ローレルハイランズ",country:"US · Pennsylvania" },
  {id:"berkshires",nameEn:"Berkshires",nameJa:"バークシャーズ",country:"US · Massachusetts"},
  {id:"central-massachusetts",nameEn:"Central Massachusetts",nameJa:"中央マサチューセッツ",country:"US · Massachusetts"},
  {id:"lutsen-north-shore",nameEn:"Lutsen / North Shore",nameJa:"ルーツェン／ノースショア",country:"US · Minnesota"},
  {id:"wausau",nameEn:"Wausau",nameJa:"ウォーソー",country:"US · Wisconsin"},
  {id:"wisconsin-dells",nameEn:"Wisconsin Dells",nameJa:"ウィスコンシンデルズ",country:"US · Wisconsin"},
  {id:"snowshoe",nameEn:"Snowshoe",nameJa:"スノーシュー",country:"US · West Virginia"},
  {id:"canaan-valley",nameEn:"Canaan Valley",nameJa:"カナーンバレー",country:"US · West Virginia"},
  {id:"high-country",nameEn:"High Country",nameJa:"ハイカントリー",country:"US · North Carolina"},
  {id:"maggie-valley",nameEn:"Maggie Valley",nameJa:"マギーバレー",country:"US · North Carolina"},
  {id:"blue-ridge",nameEn:"Blue Ridge",nameJa:"ブルーリッジ",country:"US · Virginia"},
  {id:"shenandoah-valley",nameEn:"Shenandoah Valley",nameJa:"シェナンドー・バレー",country:"US · Virginia"},
  {id:"lake-tahoe-nevada",nameEn:"Lake Tahoe Nevada",nameJa:"レイク・タホ（ネバダ）",country:"US · Nevada"},
  {id:"flagstaff",nameEn:"Flagstaff",nameJa:"フラッグスタッフ",country:"US · Arizona"},
  {id:"white-mountains-az",nameEn:"White Mountains",nameJa:"ホワイトマウンテンズ",country:"US · Arizona"},
  {id:"black-hills",nameEn:"Black Hills",nameJa:"ブラックヒルズ",country:"US · South Dakota"},
  {id:"girdwood",nameEn:"Girdwood",nameJa:"ガードウッド",country:"US · Alaska"},
  {id:"juneau",nameEn:"Juneau",nameJa:"ジュノー",country:"US · Alaska"},
  {id:"litchfield-hills",nameEn:"Litchfield Hills",nameJa:"リッチフィールドヒルズ",country:"US · Connecticut"},
  {id:"vernon",nameEn:"Vernon",nameJa:"バーノン",country:"US · New Jersey"},
  { id: "mt-hood", nameEn: "Mt. Hood", nameJa: "マウントフッド", country: "US · Oregon" },
  { id: "bend", nameEn: "Bend", nameJa: "ベンド", country: "US · Oregon" },
  { id: "crystal-mountain", nameEn: "Crystal Mountain", nameJa: "クリスタルマウンテン", country: "US · Washington" },
  { id: "snoqualmie-pass", nameEn: "Snoqualmie Pass", nameJa: "スノーカルミーパス", country: "US · Washington" },
  { id: "stevens-pass", nameEn: "Stevens Pass", nameJa: "スティーブンスパス", country: "US · Washington" },
  { id: "mt-baker", nameEn: "Mt. Baker", nameJa: "マウントベーカー", country: "US · Washington" },
  { id: "sun-valley", nameEn: "Sun Valley", nameJa: "サンバレー", country: "US · Idaho" },
  { id: "sandpoint", nameEn: "Sandpoint", nameJa: "サンドポイント", country: "US · Idaho" },
  { id: "boise", nameEn: "Boise", nameJa: "ボイシ", country: "US · Idaho" },
  { id: "donnelly-mccall", nameEn: "Donnelly / McCall", nameJa: "ドネリー／マッコール", country: "US · Idaho" },
  { id: "white-mountains", nameEn: "White Mountains", nameJa: "ホワイトマウンテンズ", country: "US · New Hampshire" },
  { id: "franconia-notch", nameEn: "Franconia Notch", nameJa: "フランコニアノッチ", country: "US · New Hampshire" },
  { id: "waterville-valley", nameEn: "Waterville Valley", nameJa: "ウォータービルバレー", country: "US · New Hampshire" },
  { id: "lakes-region", nameEn: "Lakes Region", nameJa: "レイクスリージョン", country: "US · New Hampshire" },
  { id: "carrabassett-valley", nameEn: "Carrabassett Valley", nameJa: "キャラバセットバレー", country: "US · Maine" },
  { id: "newry-bethel", nameEn: "Newry / Bethel", nameJa: "ニューリー／ベセル", country: "US · Maine" },
  { id: "rangeley", nameEn: "Rangeley", nameJa: "レンジリー", country: "US · Maine" },
  { id: "lake-placid", nameEn: "Lake Placid", nameJa: "レークプラシッド", country: "US · New York" },
  { id: "north-creek", nameEn: "North Creek", nameJa: "ノースクリーク", country: "US · New York" },
  { id: "hunter", nameEn: "Hunter", nameJa: "ハンター", country: "US · New York" },
  { id: "windham", nameEn: "Windham", nameJa: "ウィンダム", country: "US · New York" },
  { id: "highmount", nameEn: "Highmount", nameJa: "ハイマウント", country: "US · New York" },
];

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
      pingAlertFunnel("accepted", "alert_form");
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

  const errMessage = extractErrorMessage(mutation.error);

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
