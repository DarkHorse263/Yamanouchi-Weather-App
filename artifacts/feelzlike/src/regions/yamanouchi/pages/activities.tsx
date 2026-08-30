import { useLanguage } from "@workspace/feelzlike-shell";
import { motion } from "framer-motion";
import {
  TreePine,
  Mountain,
  Bike,
  Waves,
  Camera,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface Activity {
  name: string;
  nameJa: string;
  desc: string;
  descJa: string;
  icon: any;
  region: string;
  regionJa: string;
  url?: string;
  season: string;
  seasonJa: string;
}

const ACTIVITIES: Activity[] = [
  {
    name: "Shiga Kogen Hiking Trails",
    nameJa: "志賀高原ハイキングコース",
    desc: "Alpine marshlands, lakes, and panoramic mountain views across 21 connected trail networks. Famous for its high-altitude wetlands and wildflowers in summer.",
    descJa: "高山湿原、湖、パノラマの山岳展望。21の連結トレイルネットワーク。夏の高山植物で有名。",
    icon: Mountain,
    region: "Shiga Kogen",
    regionJa: "志賀高原",
    url: "https://www.shigakogen.gr.jp/english/index.html",
    season: "May - Oct",
    seasonJa: "5月～10月",
  },
  {
    name: "Jigokudani Snow Monkey Park",
    nameJa: "地獄谷野猿公苑",
    desc: "World-famous wild Japanese macaques bathing in natural hot springs. Open year-round but equally magical in the lush green season.",
    descJa: "天然温泉に入る野生のニホンザル。通年営業。緑豊かな夏も魅力的。",
    icon: Camera,
    region: "Yamanouchi",
    regionJa: "山ノ内",
    url: "https://en.jigokudani-yaenkoen.co.jp/",
    season: "Year-round",
    seasonJa: "通年",
  },
  {
    name: "Ryuoo Mountain Park SORA Terrace",
    nameJa: "竜王マウンテンパーク SORAテラス",
    desc: "Ride Japan's longest aerial ropeway (166 persons) to 1,770m for spectacular cloud sea views. Cafe and observation deck at the summit.",
    descJa: "日本最長のロープウェイで標高1,770mへ。壮大な雲海ビュー。山頂にカフェと展望台。",
    icon: Waves,
    region: "Ryuoo",
    regionJa: "竜王",
    url: "https://www.ryuoo.com/en/",
    season: "Jun - Nov",
    seasonJa: "6月～11月",
  },
  {
    name: "Mountain Biking & Cycling",
    nameJa: "マウンテンバイク・サイクリング",
    desc: "Scenic cycling routes through the Yomase valley, apple orchards, and mountain roads. E-bike rentals available in Yudanaka.",
    descJa: "夜間瀬渓谷、りんご園、山岳道路のサイクリングコース。湯田中でE-bikeレンタル可能。",
    icon: Bike,
    region: "Yomase · Yudanaka",
    regionJa: "夜間瀬・湯田中",
    season: "Apr - Nov",
    seasonJa: "4月～11月",
  },
  {
    name: "Shibu Onsen Bath Tour",
    nameJa: "渋温泉外湯めぐり",
    desc: "Walk the stone streets of historic Shibu Onsen and visit all 9 public bathhouses for good fortune. Wear a yukata and wooden geta sandals.",
    descJa: "歴史ある渋温泉の石畳を歩き、9つの外湯を巡って福を招く。浴衣と下駄でお楽しみください。",
    icon: Waves,
    region: "Shibu Onsen",
    regionJa: "渋温泉",
    url: "https://www.shibuonsen.net/en/",
    season: "Year-round",
    seasonJa: "通年",
  },
  {
    name: "Shiga Kogen Nature Walks & Birdwatching",
    nameJa: "志賀高原自然散策・バードウォッチング",
    desc: "UNESCO Biosphere Reserve with over 50 species of birds. Guided nature walks through ancient beech forests and volcanic lakes.",
    descJa: "ユネスコ生物圏保存地域。50種以上の野鳥。ブナ原生林と火山湖のガイド付き散策。",
    icon: TreePine,
    region: "Shiga Kogen",
    regionJa: "志賀高原",
    season: "May - Oct",
    seasonJa: "5月～10月",
  },
  {
    name: "Yudanaka Onsen Town Walk",
    nameJa: "湯田中温泉街散歩",
    desc: "Explore the charming hot spring town at the terminus of the Nagano Dentetsu line. Foot baths, local sake, and temple visits.",
    descJa: "長野電鉄終点の温泉街を散策。足湯、地酒、寺院巡り。",
    icon: MapPin,
    region: "Yudanaka",
    regionJa: "湯田中",
    season: "Year-round",
    seasonJa: "通年",
  },
  {
    name: "Autumn Leaf Viewing",
    nameJa: "紅葉狩り",
    desc: "Spectacular koyo (autumn colours) across Shiga Kogen from late September. The gondola and ropeway offer panoramic views of the changing foliage.",
    descJa: "9月下旬からの志賀高原の壮大な紅葉。ゴンドラとロープウェイから紅葉のパノラマビュー。",
    icon: TreePine,
    region: "Shiga Kogen · Ryuoo",
    regionJa: "志賀高原・竜王",
    season: "Sep - Nov",
    seasonJa: "9月～11月",
  },
];

export default function Activities() {
  const { t } = useLanguage();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-5">
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          {t("Green Season Activities", "グリーンシーズンのアクティビティ")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            "Hiking, onsen, nature & culture in Yamanouchi",
            "山ノ内町のハイキング、温泉、自然、文化"
          )}
        </p>
      </div>

      <div className="space-y-4">
        {ACTIVITIES.map((a, idx) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.06, 0.35) }}
              className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground leading-tight">
                      {t(a.name, a.nameJa)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t(a.region, a.regionJa)} · {t(a.season, a.seasonJa)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t(a.desc, a.descJa)}
                </p>

                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t("Website", "ウェブサイト")}
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
