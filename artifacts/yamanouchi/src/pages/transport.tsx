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
  Footprints,
} from "lucide-react";

interface BusRow {
  from: string;
  to: string;
  note?: string;
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

function SectionHeader({
  num,
  color,
  title,
}: {
  num: string;
  color: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center shrink-0`}>
        <span className="text-[10px] font-black text-white">{num}</span>
      </div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

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
  const preview = rows.slice(0, 5);
  const rest = rows.slice(5);

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
              <><ChevronDown className="w-3.5 h-3.5" />{t(`+${rest.length} more times`, `さらに+${rest.length}本`)}</>
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
        <h1 className="text-2xl font-black text-slate-900">{t("Getting Around", "交通・アクセス")}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{t("Shiga Kogen · Yamanouchi · Snow Monkey Park", "志賀高原・山ノ内・地獄谷野猿公苑")}</p>
      </div>

      <div className="px-4 pb-6 space-y-5 mt-4">

        {/* ── SECTION 1: FREE SHUTTLE WITHIN SHIGA KOGEN ── */}
        <section>
          <SectionHeader num="1" color="bg-green-600" title={t("Free Shuttle — Within Shiga Kogen", "無料シャトル — 志賀高原内")} />
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <Bus className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">{t("Free Resort Shuttle", "無料シャトルバス")}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("Connects all areas across Shiga Kogen highlands", "志賀高原内全エリアを結ぶ")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-green-600 uppercase tracking-wide font-bold">{t("Cost", "料金")}</p>
                <p className="text-base font-black text-green-800">{t("FREE", "無料")}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Hours", "運行時間")}</p>
                <p className="text-base font-black text-slate-800">08:30–17:30</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {t("Central hub: Yamanoeki bus stop. All routes pass through here — it's where the express bus from Nagano also drops off.", "中心拠点は山ノ駅バス停。全路線がここを経由し、長野からの急行バスもここに到着します。")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {t("Runs daily during operating season. Frequency varies by route — allow extra time between far-apart areas.", "運行シーズン中は毎日運行。路線によって頻度が異なります。離れたエリア間は余裕を持って。")}
                </p>
              </div>
            </div>

            <a
              href="https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html#shuttlebus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-green-50 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-700" />
                <span className="text-xs font-bold text-green-800">{t("Shuttle Bus Map & Routes", "シャトルバス路線図")}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-green-600" />
            </a>
          </div>
        </section>

        {/* ── SECTION 2: YUDANAKA ↔ SHIGA KOGEN ── */}
        <section>
          <SectionHeader num="2" color="bg-blue-600" title={t("Yudanaka → Shiga Kogen", "湯田中→志賀高原")} />
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <Bus className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">{t("Shiga Kogen Line (Local Bus)", "志賀高原線（ローカルバス）")}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("Yudanaka Station → Snow Monkey Park → Yamanoeki (Shiga Kogen)", "湯田中駅 → 野猿公苑 → 山ノ駅（志賀高原）")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Adult (one-way)", "大人(片道)")}</p>
                <p className="text-base font-black text-slate-800">¥390</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Child (one-way)", "子供(片道)")}</p>
                <p className="text-base font-black text-slate-800">¥200</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {t("This bus also stops at the Snow Monkey Park on the way up and back — useful for combining both in one day.", "このバスは行き帰りに野猿公苑に停車。志賀高原とお猿を1日で楽しめます。")}
              </p>
            </div>

            {/* Return times (Park → Yudanaka via Shiga) — these are what we have for winter */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">{t("Return — Shiga Kogen → Yudanaka (Winter 2025/26)", "帰り — 志賀高原→湯田中（2025/26シーズン）")}</p>
              <p className="text-[10px] text-slate-400 mb-2">{t("Via Snow Monkey Park stop", "野猿公苑バス停経由")}</p>
              <TimetableBlock
                title="Shiga Kogen (via Park) → Yudanaka"
                titleJa="志賀高原（公苑経由）→ 湯田中"
                fromLabel={t("Park dep.", "公苑 発")}
                toLabel={t("Yudanaka arr.", "湯田中 着")}
                rows={SHIGA_PARK_TO_YUDANAKA}
                t={t}
              />
            </div>

            <a
              href="https://www.snowmonkeyresorts.com/access/nagaden-local-bus-timetable/#Shiga-Kogen-Line-Timetable"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-blue-50 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">{t("Full Shiga Kogen Line Timetable (both directions)", "志賀高原線 全時刻表（上り・下り）")}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        </section>

        {/* ── SECTION 3: GETTING TO YUDANAKA ── */}
        <section>
          <SectionHeader num="3" color="bg-blue-600" title={t("Getting to Yudanaka", "湯田中へのアクセス")} />
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-4">

            {/* Option A — Express Bus direct to Shiga Kogen */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("Fastest option — direct to Shiga Kogen", "最速 — 志賀高原直行")}</p>
              <div className="flex items-start gap-3">
                <Bus className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{t("Nagaden Express Bus", "長電急行バス")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("Nagano Station East Exit, Stop 23 → Yamanoeki · ~70 min · no transfer needed", "長野駅東口23番→山ノ駅 · 約70分 · 乗り換えなし")}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">¥3,200–3,800</span>
                    <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("child ¥1,600–1,900", "子供 ¥1,600–1,900")}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">{t("Seats not guaranteed — arrive at Stop 23 early, especially weekends.", "座席は保証なし。特に週末は早めに。")}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">{t("Accepts tap-to-pay, PayPay, cash (¥1,000 notes / coins only).", "タッチ決済・PayPay・現金(千円札/硬貨)可。")}</p>
                </div>
              </div>
              <a
                href="https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html#express"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                {t("Express bus timetable", "急行バス時刻表")}
              </a>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("Via Nagano Dentetsu Railway → Yudanaka", "長野電鉄で湯田中へ")}</p>
              <div className="flex items-start gap-3">
                <Train className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{t("Nagano Dentetsu (Nagaden)", "長野電鉄（長電）")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("Nagano Station → Yudanaka Station · ~50 min · then local bus up to Shiga", "長野駅→湯田中駅 · 約50分 · その後ローカルバスで志賀高原へ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("From Tokyo", "東京から")}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Train className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t("Hokuriku Shinkansen", "北陸新幹線")}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t("Tokyo Station → Nagano Station · ~90 min, then express bus or Nagaden", "東京駅→長野駅 · 約90分、その後急行バスまたは長電")}</p>
                    <a href="https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1">
                      <ExternalLink className="w-3 h-3" />{t("JR East timetable", "JR東日本時刻表")}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Moon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t('Night Bus "Snow Story"', 'ナイトバス「スノーストーリー」')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t("Tokyo Station → Shiga Kogen · departs midnight · direct", "東京駅→志賀高原 · 深夜0時発 · 直行")}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-indigo-400 font-bold">★</span>
                      <p className="text-[11px] text-indigo-600 font-semibold">{t("Weekend Shiga: Fridays 21:00 · Jan 9–Mar 13, 2026 · book in advance", "ウィークエンド志賀: 毎金曜21:00発 · 要予約")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: SNOW MONKEY PARK ── */}
        <section>
          <SectionHeader num="4" color="bg-orange-500" title={t("Snow Monkey Park (Side Trip)", "地獄谷野猿公苑（観光）")} />
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <Footprints className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">{t("Kanbayashi Line (Local Bus)", "神林線（ローカルバス）")}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("Yudanaka Station → Snow Monkey Park bus stop · ~10 min · then 2km walk to park", "湯田中駅→野猿公苑バス停 · 約10分 · その後2km歩き")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Bus fare (one-way)", "バス運賃(片道)")}</p>
                <p className="text-base font-black text-slate-800">¥390 / ¥200</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Park entry", "公苑入場料")}</p>
                <p className="text-base font-black text-slate-800">¥800 / ¥400</p>
              </div>
            </div>

            <div className="space-y-2">
              <TimetableBlock
                title="Yudanaka → Snow Monkey Park (~10 min)"
                titleJa="湯田中 → 野猿公苑バス停（約10分）"
                fromLabel={t("Yudanaka dep.", "湯田中 発")}
                toLabel={t("Park arr.", "野猿公苑 着")}
                rows={KANBAYASHI_TO_PARK}
                t={t}
              />
              <TimetableBlock
                title="Snow Monkey Park → Yudanaka (~15 min)"
                titleJa="野猿公苑 → 湯田中（約15分）"
                fromLabel={t("Park dep.", "野猿公苑 発")}
                toLabel={t("Yudanaka arr.", "湯田中 着")}
                rows={KANBAYASHI_TO_YUDANAKA}
                t={t}
              />
            </div>

            {/* Snow Monkey Pass */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-indigo-600" />
                <p className="text-xs font-black text-indigo-800">{t("Snow Monkey Pass (saves money)", "スノーモンキーパス（お得）")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">{t("Express Bus version", "急行バス版")}</p>
                  <p className="text-sm font-black text-indigo-900">¥6,800 / ¥3,400</p>
                  <p className="text-[10px] text-indigo-500">{t("Park entry + return express bus", "入場料+往復急行バス")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">{t("Train version", "電車版")}</p>
                  <p className="text-sm font-black text-indigo-900">¥5,100 / ¥2,550</p>
                  <p className="text-[10px] text-indigo-500">{t("Park entry + Nagaden rail + local bus", "入場料+長電+ローカルバス")}</p>
                </div>
              </div>
              <p className="text-[10px] text-indigo-500">
                {t("⚠ Does NOT cover buses to Shiga Kogen resorts/areas.", "⚠ 志賀高原リゾート行きバスには使用不可。")}
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
          </div>
        </section>

        <p className="text-[10px] text-slate-400 text-center pb-2">
          {t("Timetables shown for reference. Schedules may differ by season — always verify with operator before travel.", "時刻表は参考情報です。シーズンにより変更の場合があります。ご利用前に必ず運行会社にご確認ください。")}
        </p>
      </div>
    </div>
  );
}
