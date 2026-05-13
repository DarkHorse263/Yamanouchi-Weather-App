import { useState } from "react";
import { useLanguage, useBaseTown, useSeason } from "@workspace/feelzlike-shell";
import {
  RideshareUnavailableNotice,
  townHasRideshare,
} from "@/components/RideshareUnavailableNotice";
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
  Car,
  Phone,
  Plane,
  Mountain,
  Bike,
  AlertTriangle,
  Snowflake,
  ParkingCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// STANDARD JP TRANSPORT IA · canonical 6-section structure shared by
// every Japanese region. Section *headings* never change · only the
// content focus shifts when you toggle Winter ↔ Summer.
//
//   1. How to get here
//   2. How to get around the towns
//   3. How to get up the mountains
//   4. How to get around when on the mountain
//   5. Car park updates (winter only · live data still being sourced)
//   6. How to get to the main attractions
//
// Winter accent = blue. Summer accent = emerald.
// ─────────────────────────────────────────────────────────────────────

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

type T = (en: string, ja: string) => string;

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
  t: T;
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

// ── Reusable content blocks (season-agnostic JSX) ────────────────────
// Each block is a single conceptual unit (one mode of transport, one
// pricing card, one warning callout). Sections compose blocks; the
// season switch decides which blocks land where.

function ShinkansenBlock({ t, accent }: { t: T; accent: "blue" | "emerald" }) {
  const a = accent === "blue" ? "text-blue-600" : "text-emerald-600";
  const ap = accent === "blue" ? "text-blue-700" : "text-emerald-700";
  const ab = accent === "blue" ? "bg-blue-50" : "bg-emerald-50";
  return (
    <div>
      <p className={`text-[10px] font-bold ${ap} uppercase tracking-wider mb-2`}>
        {t("Recommended · via Nagano", "おすすめ · 長野経由")}
      </p>
      <div className="flex items-start gap-3">
        <Train className={`w-5 h-5 ${a} mt-0.5 shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Hokuriku Shinkansen · Tokyo → Nagano", "北陸新幹線・東京→長野")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Kagayaki (fastest) ~80 min · Hakutaka ~95 min · Asama (all stops) ~110 min", "かがやき(最速)約80分・はくたか約95分・あさま(各停)約110分")}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("Reserved ¥8,540", "指定席 ¥8,540")}</span>
            <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("Non-reserved ¥8,020", "自由席 ¥8,020")}</span>
            <span className={`${ab} border border-current/20 rounded px-2 py-0.5 text-[11px] font-bold ${ap}`}>JR Pass {t("OK", "利用可")}</span>
          </div>
          <a
            href="https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs ${ap} font-semibold mt-2`}
          >
            <ExternalLink className="w-3 h-3" />
            {t("JR East timetable", "JR東日本時刻表")}
          </a>
        </div>
      </div>
    </div>
  );
}

function NagadenTrainBlock({ t }: { t: T }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        {t("Nagano → Yudanaka · Nagaden Railway", "長野→湯田中 · 長野電鉄")}
      </p>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Train className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Limited Express \u201cSnow Monkey\u201d / \u201cYukemuri\u201d", "特急「スノーモンキー」「ゆけむり」")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Nagano → Yudanaka · ~45 min · all reserved · ~hourly", "長野→湯田中 · 約45分 · 全車指定席 · 約1時間に1本")}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">¥1,290</span>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Train className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Local train", "普通列車")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Nagano → Yudanaka · ~70 min · all stops, no reservation", "長野→湯田中 · 約70分 · 各駅停車・予約不要")}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">¥1,190</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 bg-amber-50/60 border border-amber-100 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Ticket className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-black text-amber-800">{t("Yukemuri Pass · saves money", "ゆけむり号フリーきっぷ")}</p>
        </div>
        <p className="text-[11px] text-amber-700">
          {t("¥2,500 adult · 1-day unlimited Nagaden travel Nagano ↔ Yudanaka including Limited Express seats. Worthwhile if you do a same-day return.", "大人¥2,500 · 長野⇔湯田中の長電1日乗り放題（特急含む）。日帰り往復ならお得。")}
        </p>
        <a
          href="https://www.nagaden-net.co.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          {t("Nagaden Railway website", "長野電鉄サイト")}
        </a>
      </div>
    </div>
  );
}

function ExpressBusBlock({ t }: { t: T }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
        {t("Fastest in winter · direct to Shiga Kogen", "冬の最速 · 志賀高原直行")}
      </p>
      <div className="flex items-start gap-3">
        <Bus className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Nagaden Express Bus", "長電急行バス")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Nagano Station East Exit, Stop 23 → Yamanoeki · ~70 min · no transfer needed", "長野駅東口23番→山ノ駅 · 約70分 · 乗り換えなし")}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">¥3,200-3,800</span>
            <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("child ¥1,600-1,900", "子供 ¥1,600-1,900")}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">{t("Seats not guaranteed - arrive at Stop 23 early, especially weekends.", "座席は保証なし。特に週末は早めに。")}</p>
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
  );
}

function NightBusBlock({ t }: { t: T }) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">
        {t("Overnight option", "夜行")}
      </p>
      <div className="flex items-start gap-3">
        <Moon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-800">{t('Night Bus "Snow Story"', 'ナイトバス「スノーストーリー」')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t("Tokyo Station → Shiga Kogen · departs midnight · direct", "東京駅→志賀高原 · 深夜0時発 · 直行")}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-indigo-400 font-bold">★</span>
            <p className="text-[11px] text-indigo-600 font-semibold">{t("Weekend Shiga: Fridays 21:00 · Jan 9-Mar 13, 2026 · book in advance", "ウィークエンド志賀: 毎金曜21:00発 · 要予約")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlightNoteBlock({ t }: { t: T }) {
  return (
    <div className="border-t border-slate-100 pt-3 flex items-start gap-2">
      <Plane className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <p className="text-[11px] text-slate-500">
        {t("No commercial airport in Yamanouchi area. Closest: Matsumoto (~2.5 h drive) or Tokyo (Haneda/Narita) + Shinkansen.", "山ノ内周辺に空港なし。最寄りは松本空港(約2.5時間)または東京から新幹線。")}
      </p>
    </div>
  );
}

function SelfDriveBlock({ t, accent }: { t: T; accent: "blue" | "emerald" }) {
  const a = accent === "blue" ? "text-blue-600" : "text-emerald-600";
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start gap-3">
          <Car className={`w-5 h-5 ${a} mt-0.5 shrink-0`} />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Driving to Yudanaka", "湯田中へのドライブ")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Joshin-etsu Expressway · exit at Shinshu-Nakano IC, ~15 min surface to Yudanaka", "上信越自動車道・信州中野ICから一般道で約15分")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">{t("From Tokyo", "東京から")}</p>
            <p className="text-sm font-black text-slate-800">~3.5 h</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">{t("From Nagano", "長野から")}</p>
            <p className="text-sm font-black text-slate-800">~50 min</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">{t("From Iiyama", "飯山から")}</p>
            <p className="text-sm font-black text-slate-800">~25 min</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t("Car rental at Nagano Station", "長野駅レンタカー")}
        </p>
        <div className="space-y-2">
          {[
            { name: "Toyota Rent a Car", url: "https://rent.toyota.co.jp/en/" },
            { name: "Nippon Rent-A-Car", url: "https://www.nipponrentacar.co.jp/english/" },
            { name: "Times Car Rental", url: "https://rental.timescar.com/en/" },
            { name: "Nissan Rent a Car", url: "https://nissan-rentacar.com/english/" },
            { name: "Orix Rent-A-Car",   url: "https://car.orix.co.jp/eng/" },
          ].map((c) => (
            <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-slate-700">{c.name}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {t("All require an International Driving Permit (IDP) issued under the 1949 Geneva Convention - your home licence alone is not accepted.", "国際運転免許証(1949年ジュネーブ条約)が必要。日本免許への切替も可。")}
        </p>
      </div>

      {accent === "blue" && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
          <Snowflake className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{t("Winter driving · book a 4WD with snow tyres", "冬期ドライブ · 4WD+スタッドレス必須")}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {t("Specify 4WD and winter tyres at booking. Carry chains for the climb up to Shiga Kogen · see the Roads page for live chain-fitting status.", "予約時に4WDとスタッドレスを指定。志賀高原への登りはチェーン携行を。ライブのチェーン要件は道路情報ページで。")}
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 flex items-start gap-2">
        <Info className={`w-4 h-4 ${a} shrink-0 mt-0.5`} />
        <p className="text-[11px] text-slate-600">
          {t("Most ryokans in Yudanaka, Shibu and Kanbayashi offer free parking - confirm at booking. Onsen-town streets are narrow; use the hotel lot rather than on-street.", "湯田中・渋・上林の旅館は無料駐車場ありが一般的(要確認)。温泉街は道幅狭く、路上駐車不可。")}
        </p>
      </div>
    </div>
  );
}

function WalkingTownsBlock({ t, accent }: { t: T; accent: "blue" | "emerald" }) {
  const a = accent === "blue" ? "text-blue-600" : "text-emerald-600";
  const tone = accent === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700";
  return (
    <div>
      <div className="flex items-start gap-3">
        <Footprints className={`w-5 h-5 ${a} mt-0.5 shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Walking is the way", "徒歩がいちばん")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Yudanaka Station → Shibu Onsen ~15 min on foot · Shibu → Kanbayashi ~10 min · cobbled streets, wooden ryokans, nine public baths.", "湯田中駅→渋温泉 徒歩約15分・渋→上林 約10分・石畳の温泉街と九つの外湯。")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className={`${tone} rounded-lg px-3 py-2`}>
          <p className="text-[10px] uppercase tracking-wide font-bold">{t("Yudanaka → Shibu", "湯田中→渋")}</p>
          <p className="text-base font-black">~15 min</p>
        </div>
        <div className={`${tone} rounded-lg px-3 py-2`}>
          <p className="text-[10px] uppercase tracking-wide font-bold">{t("Shibu → Kanbayashi", "渋→上林")}</p>
          <p className="text-base font-black">~10 min</p>
        </div>
      </div>
    </div>
  );
}

function LocalLoopBusBlock({ t, accent }: { t: T; accent: "blue" | "emerald" }) {
  const a = accent === "blue" ? "text-blue-600" : "text-emerald-600";
  return (
    <div className="border-t border-slate-100 pt-3">
      <div className="flex items-start gap-3">
        <Bus className={`w-5 h-5 ${a} mt-0.5 shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Around Yudanaka · Kanbayashi Line bus", "湯田中エリア · 神林線バス")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Local Nagaden bus loops Yudanaka Station → Shibu → Kanbayashi → Snow Monkey Park stop. The easiest way between the onsen towns when you don't feel like walking, especially with luggage.", "長電バスのローカル線が湯田中駅→渋→上林→野猿公苑バス停を巡回。徒歩がしんどい時や荷物がある時に便利。")}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("¥390 adult · ¥200 child", "大人¥390 · 子供¥200")}</span>
          </div>
        </div>
      </div>
      <a
        href="https://www.snowmonkeyresorts.com/access/nagaden-local-bus-timetable/"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${accent === "blue" ? "text-blue-600" : "text-emerald-700"}`}
      >
        <ExternalLink className="w-3 h-3" />
        {t("Kanbayashi Line timetable", "神林線時刻表")}
      </a>
    </div>
  );
}

function HotelShuttleBlock({ t }: { t: T }) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <div className="flex items-start gap-3">
        <Bus className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Hotel pickup shuttles", "宿の送迎")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Most ryokans run a free shuttle from Yudanaka Station for guests with a reservation - call on arrival or arrange in advance.", "ほとんどの旅館で湯田中駅から無料送迎あり(要予約・要連絡)。")}
          </p>
        </div>
      </div>
    </div>
  );
}

function NineBathsBlock({ t }: { t: T }) {
  return (
    <div className="border-t border-slate-100 pt-3 bg-rose-50/60 -mx-3.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Ticket className="w-4 h-4 text-rose-600" />
        <p className="text-xs font-black text-rose-800">{t("Shibu Onsen Nine Baths Key", "渋温泉九湯めぐり")}</p>
      </div>
      <p className="text-[11px] text-rose-700">
        {t("Stay overnight at any Shibu ryokan and you get a wooden key for free entry to all nine public bathhouses - a charming green-season ritual.", "渋温泉の旅館に宿泊すると九つの外湯を巡れる木札の鍵がもらえます。グリーンシーズンの定番。")}
      </p>
    </div>
  );
}

function BicycleBlock({ t }: { t: T }) {
  return (
    <div className="border-t border-slate-100 pt-3 flex items-start gap-2">
      <Bike className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      <p className="text-[11px] text-slate-600">
        {t("Some hotels lend bicycles for free or a small fee - handy for the flat ride to the Snow Monkey Park trailhead at Kanbayashi (~2 km).", "一部の宿で自転車レンタル可。上林の地獄谷遊歩道入口(約2km)まで便利。")}
      </p>
    </div>
  );
}

function TaxisBlock({ t, accent }: { t: T; accent: "blue" | "emerald" }) {
  const a = accent === "blue" ? "text-blue-600" : "text-emerald-600";
  const ap = accent === "blue" ? "text-blue-700" : "text-emerald-700";
  return (
    <div className="border-t border-slate-100 pt-3 space-y-3">
      <div className="flex items-start gap-3">
        <Phone className={`w-5 h-5 ${a} mt-0.5 shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("Taxis · no Uber here", "タクシー · ライドシェア無し")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("No Uber / ride-share in Yamanouchi. Phone or have your hotel reception book - most drivers don't speak English so a written destination helps.", "Uber等のライドシェア無し。電話または宿のフロント経由で予約。英語不可のため目的地を書いて渡すと安心。")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { name: t("Nakano Taxi", "中野タクシー"), phone: "0269-22-2840", area: t("Yudanaka / Shibu", "湯田中・渋") },
          { name: t("Yudanaka Taxi", "湯田中タクシー"), phone: "0269-33-1221", area: t("Yudanaka / Shibu / park", "湯田中・渋・公苑") },
          { name: t("Alpico Taxi (Nagano)", "アルピコタクシー(長野)"), phone: "026-228-1234", area: t("Nagano Station", "長野駅") },
        ].map((c) => (
          <div key={c.phone} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">{c.name}</p>
              <p className="text-[10px] text-slate-500">{c.area}</p>
            </div>
            <a href={`tel:${c.phone}`} className={`text-xs font-bold ${ap} tabular-nums`}>{c.phone}</a>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Nagano → Yudanaka", "長野→湯田中")}</p>
          <p className="text-sm font-black text-slate-800">~¥10,000-12,000</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t("Yudanaka → Park trailhead", "湯田中→遊歩道入口")}</p>
          <p className="text-sm font-black text-slate-800">~¥1,500-2,000</p>
        </div>
      </div>
    </div>
  );
}

function UpToShigaWinterBlock({ t }: { t: T }) {
  return (
    <div className="space-y-4">
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
          {t("This bus also stops at the Snow Monkey Park on the way up and back - useful for combining both in one day.", "このバスは行き帰りに野猿公苑に停車。志賀高原とお猿を1日で楽しめます。")}
        </p>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-700 mb-1">{t("Return - Shiga Kogen → Yudanaka (Winter 2025/26)", "帰り - 志賀高原→湯田中（2025/26シーズン）")}</p>
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

      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-start gap-3">
          <Mountain className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Driving up · Route 292", "国道292号で")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Yudanaka → Hasuike ~30 min in summer · longer in snow. 4WD + snow tyres essential. Carry chains.", "湯田中→蓮池 夏は約30分 · 積雪期はそれ以上。4WD+スタッドレス必須・チェーン携行。")}
            </p>
          </div>
        </div>
        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{t("Shiga-Kusatsu Highway above Shibu-tōge is closed all winter", "渋峠以上の志賀草津道路は冬期通行止め")}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {t("Closed mid-Nov to late-April. Lower Shiga Kogen access from Yudanaka stays open year-round, weather permitting.", "11月中旬〜4月下旬通行止め。下部志賀高原へのアクセスは通年通行可（気象条件次第）。")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpToShigaSummerBlock({ t }: { t: T }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start gap-3">
          <Bus className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Nagaden Shiga Kogen Line", "長電バス志賀高原線")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Yudanaka Station → Hasuike / Yamanoeki · ~50 min · runs year-round, reduced frequency outside winter", "湯田中駅→蓮池/山ノ駅 · 約50分 · 通年運行(冬以外は本数少なめ)")}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">¥1,400</span>
              <span className="bg-slate-100 rounded px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("child ¥700", "子供 ¥700")}</span>
            </div>
          </div>
        </div>
        <a
          href="https://www.nagadenbus.co.jp/local/regular/shiga.php"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          {t("Shiga Kogen Line timetable", "志賀高原線時刻表")}
        </a>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-start gap-3">
          <Mountain className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{t("Driving up · Route 292", "国道292号で")}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("Yudanaka → Hasuike ~30 min · continue on the Shiga-Kusatsu Highway over the Shibu-tōge pass for one of Japan's highest scenic drives.", "湯田中→蓮池 約30分・渋峠を越える志賀草津道路は日本屈指の絶景ドライブ。")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">{t("Seasonal road closures", "通行止めに注意")}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {t("The Shiga-Kusatsu Highway above Shibu-tōge typically closes mid-Nov to late-April (snow + volcanic gas). Lower Shiga Kogen access stays open year-round.", "志賀草津道路の渋峠以上は11月中旬〜4月下旬通行止め(積雪・火山ガス)。下部志賀高原は通年通行可。")}
          </p>
        </div>
      </div>
    </div>
  );
}

function FreeShuttleWinterBlock({ t }: { t: T }) {
  return (
    <div className="space-y-3">
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
          <p className="text-base font-black text-slate-800">08:30-17:30</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            {t("Central hub: Yamanoeki bus stop. All routes pass through here - it's where the express bus from Nagano also drops off.", "中心拠点は山ノ駅バス停。全路線がここを経由し、長野からの急行バスもここに到着します。")}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            {t("Runs daily during operating season. Frequency varies by route - allow extra time between far-apart areas.", "運行シーズン中は毎日運行。路線によって頻度が異なります。離れたエリア間は余裕を持って。")}
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
  );
}

function OnMountainSummerBlock({ t }: { t: T }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Footprints className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-800">{t("On foot · the highland trail network", "徒歩 · 高原トレイル網")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Shiga Kogen's UNESCO biosphere reserve has interconnected hiking trails between Hasuike, Maruike, Higashidate and Yokote. Most trailheads are right by the bus stops.", "志賀高原のユネスコ生物圏保存地域には蓮池・丸池・東館山・横手をつなぐハイキングコース網。多くの登山口がバス停すぐ。")}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600">
          {t("The free winter resort shuttle does not run in green season. Use the Nagaden Shiga Kogen Line bus or your own car to move between sub-areas.", "冬期の無料シャトルはグリーンシーズン運休。エリア間移動は長電バス志賀高原線または自家用車で。")}
        </p>
      </div>
    </div>
  );
}

function CarParkSummerBlock({ t }: { t: T }) {
  return (
    <div className="flex items-start gap-3">
      <ParkingCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold text-slate-800">{t("Plenty of room in green season", "グリーンシーズンは余裕あり")}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("Outside ski season, Shiga Kogen and onsen-town lots aren't capacity-constrained. Hotel parking covers most stays. We surface live lot status here when winter rolls back around.", "スキーシーズン以外は志賀高原・温泉街の駐車場は混雑しません。宿の駐車場で十分。冬期にはリアルタイム情報をここに表示予定。")}
        </p>
      </div>
    </div>
  );
}

function CarParkPlaceholderBlock({ t }: { t: T }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <ParkingCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-800">{t("Live lot status · coming soon", "駐車場リアルタイム情報 · 準備中")}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Shiga Kogen lots fill fast on weekends and powder days. We're working on a live capacity feed; until then, the official Shiga Kogen page is the best place to check before you drive up.", "週末やパウダーの日は駐車場が早く埋まります。リアルタイム情報を準備中。それまでは志賀高原公式ページでご確認を。")}
          </p>
        </div>
      </div>
      <a
        href="https://www.shigakogen.gr.jp/english/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full bg-blue-50 rounded-lg px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">{t("Shiga Kogen official site", "志賀高原公式サイト")}</span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
      </a>
      <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500">
          {t("Tip · take the Shiga Kogen Line bus from Yudanaka on busy weekends and skip the parking problem entirely.", "コツ · 混雑する週末は湯田中から志賀高原線バスを使えば駐車場問題自体を回避できます。")}
        </p>
      </div>
    </div>
  );
}

function SnowMonkeyAttractionBlock({ t }: { t: T; }) {
  return (
    <div className="space-y-3">
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
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function Transport() {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const { town } = useBaseTown();
  const showRideshareNotice = !!town && !townHasRideshare(town.id);
  const rideshareTownName = town ? t(town.name, town.nameJa) : "";

  // Single source of truth for the 6 standard JP transport sections.
  // Both seasons render the same headings in the same order; the
  // content blocks (and accent colour) swap based on `isWinter`.
  const accent: "blue" | "emerald" = isWinter ? "blue" : "emerald";
  const dotColor = isWinter ? "bg-blue-600" : "bg-emerald-600";

  const sections: Array<{
    id: string;
    title: string;
    titleJa: string;
    content: React.ReactNode;
  }> = [
    {
      id: "sec-here",
      title: "How to get here",
      titleJa: "ここまでの行き方",
      content: (
        <div className="space-y-4">
          <ShinkansenBlock t={t} accent={accent} />
          <div className="border-t border-slate-100 pt-3">
            <NagadenTrainBlock t={t} />
          </div>
          {isWinter && (
            <div className="border-t border-slate-100 pt-3">
              <ExpressBusBlock t={t} />
            </div>
          )}
          {isWinter && <NightBusBlock t={t} />}
          {!isWinter && <FlightNoteBlock t={t} />}
        </div>
      ),
    },
    {
      id: "sec-towns",
      title: "How to get around the towns",
      titleJa: "町内の移動",
      content: (
        <div className="space-y-1">
          <WalkingTownsBlock t={t} accent={accent} />
          <LocalLoopBusBlock t={t} accent={accent} />
          <HotelShuttleBlock t={t} />
          {!isWinter && <NineBathsBlock t={t} />}
          {!isWinter && <BicycleBlock t={t} />}
          <TaxisBlock t={t} accent={accent} />
        </div>
      ),
    },
    {
      id: "sec-up",
      title: "How to get up the mountains",
      titleJa: "山への上り方",
      content: isWinter ? <UpToShigaWinterBlock t={t} /> : <UpToShigaSummerBlock t={t} />,
    },
    {
      id: "sec-on",
      title: "How to get around when on the mountain",
      titleJa: "山での移動",
      content: isWinter ? <FreeShuttleWinterBlock t={t} /> : <OnMountainSummerBlock t={t} />,
    },
    {
      id: "sec-parking",
      title: "Car park updates",
      titleJa: "駐車場情報",
      content: isWinter ? <CarParkPlaceholderBlock t={t} /> : <CarParkSummerBlock t={t} />,
    },
    {
      id: "sec-attractions",
      title: "How to get to the main attractions",
      titleJa: "観光スポットへ",
      content: (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500 -mt-1">
            {t("Snow Monkey Park (Jigokudani Yaen-Koen) is the headline draw from Yamanouchi.", "山ノ内エリアの目玉観光は地獄谷野猿公苑（スノーモンキー）。")}
          </p>
          <SnowMonkeyAttractionBlock t={t} />
        </div>
      ),
    },
    // Self-drive sits as an extra appendix because it overlaps multiple
    // sections (getting here + up the mountain + parking). We keep it
    // here so users browsing for car options have one canonical card.
    {
      id: "sec-drive",
      title: "Self-drive & car rental",
      titleJa: "レンタカー・自家用車",
      content: <SelfDriveBlock t={t} accent={accent} />,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-0 shrink-0">
        <h1 className="text-2xl font-black text-slate-900">{t("Getting Around", "交通・アクセス")}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {isWinter
            ? t("Winter · Yamanouchi · Yudanaka · Shibu · Shiga Kogen", "ウィンター・山ノ内・湯田中・渋・志賀高原")
            : t("Green season · Yamanouchi · Yudanaka · Shibu · Shiga Kogen", "グリーンシーズン・山ノ内・湯田中・渋・志賀高原")}
        </p>
      </div>

      {/* Quick-jump pill nav · always reflects the live section list */}
      <div className="px-4 mt-3">
        <div className="flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 border ${
                isWinter
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
              }`}
            >
              {t(s.title, s.titleJa)}
            </a>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 space-y-5 mt-4">
        {showRideshareNotice && (
          <RideshareUnavailableNotice townName={rideshareTownName} t={t} />
        )}

        {sections.map((s, idx) => (
          <section key={s.id} id={s.id} className="scroll-mt-4">
            <SectionHeader num={String(idx + 1)} color={dotColor} title={t(s.title, s.titleJa)} />
            <div className="bg-white rounded-xl border border-slate-100 p-3.5">
              {s.content}
            </div>
          </section>
        ))}

        <p className="text-[10px] text-slate-400 text-center pb-2">
          {t("Timetables and prices shown for reference. Schedules may differ by season - always verify with the operator before travel.", "時刻表・料金は参考情報です。シーズンにより変更の場合があります。ご利用前に必ず運行会社にご確認ください。")}
        </p>
      </div>
    </div>
  );
}
