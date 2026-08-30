import { motion } from "framer-motion";
import { Link } from "wouter";
import { useEffect, type CSSProperties } from "react";
import {
  ArrowLeft,
  Camera,
  CloudSnow,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { WHATS_NEW } from "@/data/whatsNew";
import logoWhite from "/branding/logo-white.png?url";
import { PageMeta } from "@/lib/seo/PageMeta";
import { LanguageProvider, useLanguage, type Language } from "@workspace/feelzlike-shell";

const pretty: CSSProperties = { textWrap: "pretty" as CSSProperties["textWrap"] };

const card =
  "rounded-[2rem] border-0 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]";
const eyebrow =
  "text-[11px] font-bold lowercase tracking-wider text-white/70";

const LOCALES: Language[] = ["en", "ja"];

interface HowToStep {
  icon: typeof MapPin;
  title: string;
  titleJa: string;
  text: string;
  textJa: string;
}

const HOW_TO: HowToStep[] = [
  {
    icon: MapPin,
    title: "start where you are",
    titleJa: "今いる場所から始める",
    text: "on the home page, tap 'show my local conditions' or search any town or city. if you're near a covered region we'll suggest it automatically.",
    textJa:
      "ホーム画面で「show my local conditions」をタップするか、町や都市を検索してください。対応エリアの近くにいる場合は自動でおすすめが表示されます。",
  },
  {
    icon: Search,
    title: "pick a country, then a region",
    titleJa: "国を選んで、エリアを選ぶ",
    text: "browse australia, new zealand, japan, canada or the united states, then choose a region like the snowy mountains or hakuba valley. every region lists its base towns and mountains.",
    textJa:
      "オーストラリア・ニュージーランド・日本・カナダ・アメリカから選び、白馬エリアやスノーウィーマウンテンズなどのエリアを選択します。各エリアにはベースタウンとスキー場の一覧があります。",
  },
  {
    icon: CloudSnow,
    title: "check the mountain, not just the town",
    titleJa: "町だけでなく山の上をチェック",
    text: "tap any resort for full conditions · today's forecast, snow by elevation, wind, lifted terrain, the 7-day and the extended outlook. temps in town and up the hill are very different things.",
    textJa:
      "スキー場をタップすると詳しいコンディションが見られます · 今日の予報、標高別の降雪、風、7日間予報と長期見通し。町の気温と山頂の気温はまったく別ものです。",
  },
  {
    icon: Camera,
    title: "look before you drive",
    titleJa: "出発前に実際の様子を確認",
    text: "live webcams (run by each resort) and road conditions show you what it actually looks like right now · chains, slush, sunshine or a whiteout.",
    textJa:
      "各スキー場が運営するライブカメラと道路情報で、今この瞬間の様子がわかります · チェーン規制、シャバ雪、快晴、ホワイトアウトまで。",
  },
  {
    icon: Map,
    title: "plan the rest of the trip",
    titleJa: "旅の残りも計画する",
    text: "each base town has stay, eat, transport and explore pages, and compare mountains puts the snow outlook for your shortlist side by side when you're deciding where to go.",
    textJa:
      "各ベースタウンには宿・食事・交通・観光のページがあります。行き先に迷ったら、「山を比べる」で山ごとの雪を比べられます。",
  },
];

function LangPill() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="inline-flex items-center rounded-full bg-white/15 p-1"
      data-testid="toggle-about-language"
    >
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLanguage(loc)}
          className={`rounded-full px-3 py-1 text-[12px] font-bold lowercase transition-colors ${
            language === loc
              ? "bg-white text-[#0055FF]"
              : "text-white/80 hover:text-white"
          }`}
          data-testid={`button-about-lang-${loc}`}
        >
          {loc === "en" ? "en" : "日本語"}
        </button>
      ))}
    </div>
  );
}

function AboutContent() {
  const { t } = useLanguage();

  // Support deep links like /about#whats-new (footer + home-page note).
  // Runs after mount so the target section exists; rAF lets layout settle
  // before we scroll, and any scroll-reset on navigation has already fired.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    });
  }, []);

  return (
    <div
      className="relative isolate min-h-[100dvh] text-white antialiased bg-[#0055FF] pb-safe"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="about feelzlike · how it works"
        description="what feelzlike is, where the numbers come from, and how to use it to check real mountain conditions before you make the drive."
        path="/about"
      />

      <div className="mx-auto w-full max-w-md px-6 pt-6 pb-16 md:max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold lowercase text-white/80 hover:text-white"
            data-testid="link-about-back"
          >
            <ArrowLeft className="h-4 w-4" /> {t("back to home", "ホームに戻る")}
          </Link>
          <LangPill />
        </div>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-center"
        >
          <img
            src={logoWhite}
            alt="feelzlike"
            className="mx-auto h-16 w-auto select-none md:h-20"
            draggable={false}
          />
          <p className={`mt-3 ${eyebrow}`}>
            {t("about feelzlike", "feelzlike について")}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold lowercase md:text-4xl">
            {t(
              "real conditions for mountain travel",
              "山旅のためのリアルなコンディション",
            )}
          </h1>
        </motion.header>

        <p className="mt-5 text-[15px] font-bold lowercase leading-relaxed text-white/85">
          {t(
            "you\u2019re in town, wondering what it\u2019s actually like up the mountain. feelzlike pulls together what\u2019s happening right now - snow, wind, temperature, roads and live cams - so you can make the call before you make the drive.",
            "町にいて、山の上は実際どうなんだろうと気になっていませんか。feelzlike は今起きていること · 雪、風、気温、道路、ライブカメラをひとつにまとめます。出発する前に判断できるように。",
          )}
        </p>

        <h2 className="mt-10 font-display text-2xl font-semibold lowercase">
          {t("how to use it", "使い方")}
        </h2>
        <div className="mt-4 space-y-4">
          {HOW_TO.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              className={card}
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F5FF] text-[#0055FF]">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-semibold lowercase text-slate-900">
                    {t(s.title, s.titleJa)}
                  </h3>
                  <p className="mt-1 text-[14px] font-bold lowercase leading-relaxed text-slate-500">
                    {t(s.text, s.textJa)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl font-semibold lowercase">
          {t("where the numbers come from", "数字の出どころ")}
        </h2>
        <div className={`mt-4 ${card}`}>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F5FF] text-[#0055FF]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="text-[14px] font-bold lowercase leading-relaxed text-slate-500">
              {t(
                "readings come straight from official weather services and live observation networks in each country - the bureau of meteorology in australia, the japan meteorological agency in japan, and more. live webcams are run by the resorts themselves · we link you straight to their feeds. every region lists its own sources, so you can always see where a reading came from.",
                "データは各国の公式気象機関とライブ観測網から直接取得しています · オーストラリアの気象局、日本の気象庁など。ライブカメラは各スキー場が運営しており、公式フィードに直接リンクしています。各エリアには情報源の一覧があるので、どの数値がどこから来たかいつでも確認できます。",
              )}
            </p>
          </div>
        </div>

        <h2
          id="whats-new"
          className="mt-10 scroll-mt-6 font-display text-2xl font-semibold lowercase"
        >
          {t("what\u2019s new", "最新情報")}
        </h2>
        <p className={`mt-1 ${eyebrow}`}>
          {t(
            "the app updates itself · no downloads, no version numbers · here's what changed lately",
            "アプリは自動で最新になります · ダウンロードもバージョン番号も不要 · 最近の変更はこちら",
          )}
        </p>
        <div className={`mt-4 ${card}`}>
          <ul className="space-y-4">
            {WHATS_NEW.map((entry) => (
              <li key={entry.id} className="flex items-start gap-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F5FF] text-[#0055FF]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold lowercase tracking-wider text-slate-400">
                    {entry.date}
                  </p>
                  <p className="mt-0.5 text-[14px] font-bold lowercase leading-relaxed text-slate-600">
                    {t(entry.text, entry.textJa)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-bold lowercase text-[#0055FF] shadow-lg hover:bg-white/90"
            data-testid="link-about-start"
          >
            {t("start exploring →", "さっそく見てみる →")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <LanguageProvider locales={LOCALES}>
      <AboutContent />
    </LanguageProvider>
  );
}
