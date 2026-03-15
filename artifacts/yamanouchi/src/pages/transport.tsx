import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  ExternalLink,
  Train,
  Bus,
  Clock,
  MapPin,
  CreditCard,
  Info,
  ChevronDown,
  ChevronUp,
  Moon,
  Ticket,
} from "lucide-react";

interface BusRow {
  from: string;
  to: string;
}

const KANBAYASHI_TO_PARK: BusRow[] = [
  { from: "09:12", to: "09:22" },
  { from: "10:42", to: "10:52" },
  { from: "11:52", to: "12:02" },
  { from: "13:32", to: "13:42" },
  { from: "15:57", to: "16:07" },
  { from: "18:42", to: "18:52" },
];

const KANBAYASHI_TO_YUDANAKA: BusRow[] = [
  { from: "06:50", to: "07:04" },
  { from: "08:20", to: "08:34" },
  { from: "09:30", to: "09:44" },
  { from: "11:00", to: "11:14" },
  { from: "12:10", to: "12:24" },
  { from: "13:50", to: "14:04" },
  { from: "16:15", to: "16:29" },
  { from: "18:55", to: "19:09" },
];

const SHIGA_PARK_TO_YUDANAKA: BusRow[] = [
  { from: "09:21", to: "09:35" },
  { from: "09:30", to: "09:44" },
  { from: "11:00", to: "11:14" },
  { from: "11:36", to: "11:50" },
  { from: "12:10", to: "12:24" },
  { from: "12:26", to: "12:40" },
  { from: "12:38", to: "12:52" },
  { from: "12:40", to: "12:54" },
  { from: "13:25", to: "13:39" },
  { from: "13:50", to: "14:04" },
  { from: "14:26", to: "14:40" },
  { from: "15:06", to: "15:20" },
  { from: "16:15", to: "16:29" },
  { from: "16:51", to: "17:05" },
  { from: "17:56", to: "18:10" },
  { from: "18:55", to: "19:09" },
  { from: "19:01", to: "19:15" },
];

function TimetableBlock({
  title,
  titleJa,
  fromLabel,
  toLabel,
  rows,
  t,
}: {
  title: string;
  titleJa: string;
  fromLabel: string;
  toLabel: string;
  rows: BusRow[];
  t: (en: string, ja: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const preview = rows.slice(0, 4);
  const rest = rows.slice(4);

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 px-3 py-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
          {t(title, titleJa)}
        </span>
      </div>
      <div className="px-3 py-2">
        <div className="grid grid-cols-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pb-1 border-b border-slate-100">
          <span>{fromLabel}</span>
          <span>{toLabel}</span>
        </div>
        {preview.map((r, i) => (
          <div key={i} className="grid grid-cols-2 py-1 text-sm font-mono font-semibold text-slate-800 border-b border-slate-50 last:border-0">
            <span>{r.from}</span>
            <span>{r.to}</span>
          </div>
        ))}
        {rest.length > 0 && open && rest.map((r, i) => (
          <div key={i} className="grid grid-cols-2 py-1 text-sm font-mono font-semibold text-slate-800 border-b border-slate-50 last:border-0">
            <span>{r.from}</span>
            <span>{r.to}</span>
          </div>
        ))}
        {rest.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-center gap-1 mt-1 py-1.5 text-xs font-semibold text-blue-600"
          >
            {open ? (
              <><ChevronUp className="w-3.5 h-3.5" />{t("Show less", "閉じる")}</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" />{t(`+${rest.length} more`, `+${rest.length}本`)}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Transport() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-0 shrink-0">
        <h1 className="text-2xl font-black text-slate-900">{t("Getting Here", "アクセス")}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{t("Yamanouchi · Shiga Kogen · Snow Monkey Park", "山ノ内・志賀高原・地獄谷野猿公苑")}</p>
      </div>

      <div className="px-4 pb-6 space-y-5 mt-4">

        {/* Step 1 — Shinkansen */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-white">1</span>
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {t("Tokyo → Nagano", "東京→長野")}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <Train className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{t("Hokuriku Shinkansen", "北陸新幹線")}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Tokyo Station → Nagano Station · ~90 min", "東京駅→長野駅 · 約90分")}</p>
                <a
                  href="https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("JR East timetable", "JR東日本時刻表")}
                </a>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-start gap-3">
              <Moon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {t('Night Bus "Snow Story"', 'ナイトバス「スノーストーリー」')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("Tokyo Station → Shiga Kogen · departs midnight · direct", "東京駅→志賀高原 · 深夜0時発 · 直行")}
                </p>
                <a
                  href="http://www.nagadenbus.co.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("Nagaden Bus", "長電バス")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 — Express Bus */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-white">2</span>
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {t("Nagano → Shiga Kogen", "長野→志賀高原")}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <Bus className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{t("Nagaden Express Bus", "長電急行バス")}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Nagano Station East Exit, Bus Stop 23 → Yamanoeki (~70 min)", "長野駅東口23番乗場→山ノ駅(約70分)")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Adult", "大人")}</p>
                <p className="text-base font-black text-slate-800">¥3,200–3,800</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Child (6–12)", "子供(6–12歳)")}</p>
                <p className="text-base font-black text-slate-800">¥1,600–1,900</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {t("Seats NOT guaranteed — arrive at Stop 23 early, especially weekends.", "座席は保証されません。特に週末は早めに23番乗場へお越しください。")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {t("Payment: tap-to-pay credit card, PayPay, cash (¥1,000 notes / coins only).", "支払い: タッチ決済・PayPay・現金(千円札/硬貨のみ)")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Ticket className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {t("Round-trip tickets at ARUYO Info Center near Stop 23. Return is open-dated.", "往復券は23番乗場近くのARUYO案内所で購入可能。帰りは日付フリー。")}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-700 mb-1">{t('★ "Weekend Shiga" Late Bus', '★ウィークエンド志賀 深夜バス')}</p>
              <p className="text-xs text-slate-500">
                {t("Fridays 21:00 from Nagano Station · Jan 9 – Mar 13, 2026 · Reservation required.", "毎週金曜21:00 長野駅発 · 2026年1月9日〜3月13日 · 要予約")}
              </p>
            </div>

            <a
              href="https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-blue-50 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">{t("Full Express Bus Timetable", "急行バス時刻表(全便)")}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        </section>

        {/* Step 3 — Local Bus */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-white">3</span>
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {t("Local Bus from Yudanaka", "湯田中からのローカルバス")}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600">
                {t("Take the Nagano Dentetsu railway to Yudanaka Station, then local bus to the Snow Monkey Park or Shiga Kogen.", "長野電鉄で湯田中駅まで。そこからローカルバスで地獄谷または志賀高原へ。")}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Fare (one-way)", "運賃(片道)")}</p>
              <p className="text-sm font-black text-slate-800">¥390 {t("adult", "大人")} / ¥200 {t("child", "子供")}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">{t("Kanbayashi Line — Snow Monkey Park", "神林線 — 地獄谷野猿公苑")}</p>
              <div className="space-y-2">
                <TimetableBlock
                  title="Yudanaka → Snow Monkey Park (~10 min)"
                  titleJa="湯田中 → 野猿公苑バス停(約10分)"
                  fromLabel={t("Yudanaka dep.", "湯田中 発")}
                  toLabel={t("Park arr.", "野猿公苑 着")}
                  rows={KANBAYASHI_TO_PARK}
                  t={t}
                />
                <TimetableBlock
                  title="Snow Monkey Park → Yudanaka (~15 min)"
                  titleJa="野猿公苑 → 湯田中(約15分)"
                  fromLabel={t("Park dep.", "野猿公苑 発")}
                  toLabel={t("Yudanaka arr.", "湯田中 着")}
                  rows={KANBAYASHI_TO_YUDANAKA}
                  t={t}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-700 mb-2">{t("Shiga Kogen Line (Winter 2025/26)", "志賀高原線（2025/26シーズン）")}</p>
              <TimetableBlock
                title="Snow Monkey Park → Yudanaka (via Shiga)"
                titleJa="野猿公苑 → 湯田中(志賀経由)"
                fromLabel={t("Park dep.", "公苑 発")}
                toLabel={t("Yudanaka arr.", "湯田中 着")}
                rows={SHIGA_PARK_TO_YUDANAKA}
                t={t}
              />
              <a
                href="https://www.snowmonkeyresorts.com/access/nagaden-local-bus-timetable/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                {t("Full local bus timetable", "ローカルバス全時刻表")}
              </a>
            </div>
          </div>
        </section>

        {/* Within Shiga Kogen */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-white">✓</span>
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {t("Within Shiga Kogen", "志賀高原内の移動")}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <Bus className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">{t("Free Shuttle Bus", "無料シャトルバス")}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Connects all ski areas · 08:30–17:30 daily", "全スキーエリア間を運行 · 毎日8:30〜17:30")}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                {t("Board at Yamanoeki — the central hub for all Shiga Kogen shuttles.", "山ノ駅バス停が志賀高原シャトルの中心拠点です。")}
              </p>
            </div>
          </div>
        </section>

        {/* Snow Monkey Pass */}
        <section>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" />
              <p className="text-sm font-black text-indigo-800">{t("Snow Monkey Pass", "スノーモンキーパス")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">{t("Express Bus version", "急行バス版")}</p>
                <p className="text-sm font-black text-indigo-900">¥6,800 / ¥3,400</p>
                <p className="text-[10px] text-indigo-500">{t("Park entry + round-trip express bus", "公苑入場料+往復急行バス")}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">{t("Train / Local Bus", "電車/ローカルバス版")}</p>
                <p className="text-sm font-black text-indigo-900">¥5,100 / ¥2,550</p>
                <p className="text-[10px] text-indigo-500">{t("Nagaden rail + local bus + park entry", "長電+ローカルバス+入場料")}</p>
              </div>
            </div>
            <p className="text-[10px] text-indigo-500">
              {t("⚠ Does NOT cover Shiga Kogen buses. Buy in-person at Nagano Station.", "⚠ 志賀高原行きバスには使用不可。長野駅で購入。")}
            </p>
            <a
              href="https://www.snowmonkeyresorts.com/access/snow-monkey-1-day-pass/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"
            >
              <ExternalLink className="w-3 h-3" />
              {t("Snow Monkey Pass details", "スノーモンキーパス詳細")}
            </a>
          </div>
        </section>

        <p className="text-[10px] text-slate-400 text-center pb-2">
          {t("Timetables correct as of Winter 2025/26. Always verify with operator before travel.", "時刻表は2025/26シーズン現在のものです。ご利用前に必ず運行会社にご確認ください。")}
        </p>
      </div>
    </div>
  );
}
