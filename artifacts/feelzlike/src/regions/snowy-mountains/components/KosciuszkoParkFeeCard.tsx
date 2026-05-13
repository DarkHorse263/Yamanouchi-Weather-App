import { Receipt, ExternalLink, Smartphone, Train } from "lucide-react";

/**
 * Kosciuszko National Park · vehicle entry fee callout.
 *
 * Off-mountain visitors are routinely surprised by this charge - it sits
 * outside the lift pass and most booking flows never mention it. The fee
 * applies to every vehicle entering the park (Thredbo, Perisher via car,
 * Charlotte Pass, Selwyn). Skitube riders from Bullocks Flat avoid it
 * because the train station sits before the park entry stations.
 *
 * Reference figures (AUD, per vehicle, per day):
 *   - Winter (Jun LWE → Oct LWE):  ~ $29
 *   - Green season:                 ~ $17
 * NPWS reviews fees periodically · we link out for the live number rather
 * than promising an exact figure.
 *
 * Variants:
 *   - "mountain": dark glass card matching LocationDetail visual language
 *   - "transport": light branded card matching the Transport page
 *
 * Bilingual EN/JP. Brand rules: lowercase brand, middot ·, terse copy.
 */
type Variant = "mountain" | "transport";

interface Props {
  variant: Variant;
  t: (en: string, ja: string) => string;
}

const NPWS_FEES_URL =
  "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kosciuszko-national-park/park-fees";
const PARKNPAY_URL = "https://www.parknpay.com.au/";

export function KosciuszkoParkFeeCard({ variant, t }: Props) {
  const isMountain = variant === "mountain";

  // Tone tokens kept local so this component is the single source of
  // truth for both light and dark contexts.
  const shell = isMountain
    ? "glass rounded-3xl p-5 md:p-8"
    : "rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 md:p-8 shadow-sm";
  const eyebrow = isMountain
    ? "byline text-muted-foreground"
    : "text-[11px] font-bold tracking-wider text-amber-700 uppercase";
  const headline = isMountain
    ? "font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2"
    : "font-display font-semibold text-2xl text-foreground mt-0.5";
  const body = isMountain ? "text-foreground/90" : "text-foreground/90";
  const linkBase = isMountain
    ? "inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
    : "inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-950";
  const tipBox = isMountain
    ? "mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 flex items-start gap-3"
    : "mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-start gap-3";
  const tipText = isMountain ? "text-sky-100" : "text-sky-900";
  const tipIcon = isMountain ? "text-sky-300" : "text-sky-700";

  return (
    <section className={shell}>
      <div className="flex items-start gap-3">
        {!isMountain && (
          <div className="shrink-0 self-start w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={eyebrow}>
            {t("Park entry fee", "国立公園入場料")}
          </p>
          <h2 className={headline}>
            {isMountain && <Receipt className="text-primary w-5 h-5" />}
            {t("Kosciuszko National Park · vehicle fee", "コジオスコ国立公園 · 車両入場料")}
          </h2>

          <p className={`${body} mt-3 leading-relaxed`}>
            {t(
              "Driving into the park costs a per-vehicle fee that's separate from your lift pass. Indicative rates: winter ~ AUD 29 per day, green season ~ AUD 17 · check NPWS for the current figure. Pay at entry stations, online, or via the Park'nPay app before you arrive · saves a queue at the gate.",
              "公園内に車で入るには、リフト券とは別の車両毎の入場料がかかります。参考料金：冬季1日あたり約29豪ドル、グリーンシーズン約17豪ドル · 最新料金はNPWSで確認。入場ゲート、オンライン、またはPark'nPayアプリで事前支払い可能 · ゲートでの待ち時間を回避できます。",
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={NPWS_FEES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkBase}
            >
              <Receipt className="w-4 h-4" />
              {t("NPWS official fees", "NPWS公式料金")}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <a
              href={PARKNPAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkBase}
            >
              <Smartphone className="w-4 h-4" />
              {t("Park'nPay app", "Park'nPayアプリ")}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          {/* Skitube exemption · the most useful tip for off-mountain
              visitors heading to Perisher. Bullocks Flat station sits
              before the entry stations, so taking the train avoids both
              the fee and chain requirements. Surfaced as a tip rather
              than buried in prose. */}
          <div className={tipBox}>
            <Train className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tipIcon}`} strokeWidth={2.25} />
            <div className={`text-xs leading-relaxed ${tipText}`}>
              <p className="font-semibold">
                {t(
                  "Skitube tip · skip the fee",
                  "スキーチューブの裏技 · 入場料を回避",
                )}
              </p>
              <p className="opacity-90 mt-0.5">
                {t(
                  "Bullocks Flat station sits before the park entry gates. Park there and ride Skitube into Perisher to typically avoid the vehicle entry fee · confirm with NPWS if you're unsure.",
                  "ブロックスフラット駅は公園ゲートの手前にあります。同駅に駐車してスキーチューブでペリッシャーへ向かえば車両入場料を通常回避できます · 不明な場合はNPWSでご確認を。",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
