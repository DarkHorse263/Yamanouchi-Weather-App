import { motion } from "framer-motion";
import { Smartphone, ArrowDown } from "lucide-react";

/**
 * Universal "no rideshare here" notice for the Transport tab.
 *
 * Mountain base towns are too small for Uber / DiDi / Ola driver density,
 * and most of regional Japan has no Western rideshare presence either.
 * Visitors reflexively open Uber and find nothing - this banner tells
 * them up-front and points at the curated taxi providers below.
 *
 * Universal across regions: the wording stays neutral ("apps like Uber,
 * DiDi or Ola") so it works in AU and JP. The Transport page chooses
 * whether to render this using the country-aware policy below.
 */
export function RideshareUnavailableNotice({
  townName,
  t,
}: {
  townName: string;
  t: (en: string, ja?: string) => string;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="note"
      aria-label={t("Rideshare not available", "ライドシェアはご利用いただけません")}
      className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
        <Smartphone className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-semibold text-sm sm:text-base text-amber-900 leading-tight">
          {t(
            `No rideshare in ${townName}`,
            `${townName}ではライドシェアは使えません`,
          )}
        </h3>
        <p className="mt-1 text-sm text-amber-900/85 leading-relaxed">
          {t(
            "Apps like Uber, DiDi and Ola don't operate here. Use the local taxis and transfer operators below.",
            "Uber、DiDi、Olaなどのアプリはこの地域では運行していません。下記の地元タクシー・送迎事業者をご利用ください。",
          )}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-amber-700/90">
          <ArrowDown className="w-3 h-3" aria-hidden="true" />
          {t("See operators", "事業者を見る")}
        </p>
      </div>
    </motion.aside>
  );
}

/**
 * Town ids with confirmed useful rideshare coverage. This remains a fallback
 * for callers that do not have region country context.
 */
export const RIDESHARE_AVAILABLE_TOWNS: ReadonlySet<string> = new Set<string>([
  "breckenridge",
  "vail",
  "aspen",
  "park-city-town",
  "truckee",
  "south-lake-tahoe-town",
  "stowe",
]);

/**
 * US and Canadian towns default to not showing a categorical "no rideshare"
 * claim. Both countries have broad Uber/Lyft coverage and the town catalogue
 * grows faster than a hand-maintained allowlist can be audited.
 *
 * AU, JP and NZ retain the previous allowlist behaviour.
 */
export function townHasRideshare(
  townId: string | undefined,
  countryCode?: string,
): boolean {
  if (!townId) return false;
  if (countryCode === "US" || countryCode === "CA") return true;
  return RIDESHARE_AVAILABLE_TOWNS.has(townId);
}
