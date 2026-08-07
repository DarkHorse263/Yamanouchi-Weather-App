import { useUnitsControl } from "@/components/auth/UserPrefsProvider";
import { useLanguage } from "@workspace/feelzlike-shell";

/**
 * Compact units control for the weather pages (town + mountain/resort
 * detail). Visitors landing directly on an SEO entry page - a town weather
 * page or a resort detail page - could previously only flip metric/imperial
 * from the home footer, which those pages never render. This small pill puts
 * the same control in reach right where the numbers are.
 *
 * - Reuses useUnitsControl() so the WHOLE app flips at once (shared with the
 *   footer toggle and the /account preference).
 * - Signed-in members do NOT see it: their saved account preference wins, so
 *   we gate on !fromAccount exactly like HomeFooter does.
 * - Metric stays canonical app-wide (see feelzlike-units-preference.md); this
 *   only switches the display-edge preference, never the underlying data.
 *
 * Palette (bluebird bold): the default tone sits on the LIGHT canvas / white
 * cards, so it uses ink/slate + a sky-blue active state. Pages that render
 * the toggle DIRECTLY on the blue hero surface (mountain/resort detail) must
 * pass tone="onBlue" - grey slate text on #0055FF is illegible (see
 * feelzlike-text-contrast.md).
 */
export function UnitsToggle({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "onBlue";
}) {
  const { units, fromAccount, setLocalUnits } = useUnitsControl();
  const { t } = useLanguage();

  // Account preference wins for signed-in members - hide the anonymous
  // toggle so it can never disagree with their saved choice.
  if (fromAccount) return null;

  const onBlue = tone === "onBlue";

  return (
    <div className={`inline-flex items-center gap-1 text-[11.5px] ${className}`}>
      <span className={`${onBlue ? "text-white/80" : "text-slate-400"} mr-1`}>{t("units", "単位")}</span>
      <div
        role="group"
        aria-label={t("units", "単位")}
        className={`inline-flex overflow-hidden rounded-full border ${onBlue ? "border-white/30" : "border-slate-200"}`}
      >
        {(["metric", "imperial"] as const).map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={units === u}
            onClick={() => setLocalUnits(u)}
            className={`px-2.5 py-1 transition-colors ${
              units === u
                ? onBlue
                  ? "bg-white text-sky-700 font-semibold"
                  : "bg-sky-600 text-white"
                : onBlue
                  ? "bg-white/10 text-white/90 hover:bg-white/20"
                  : "bg-white text-slate-600 hover:text-sky-700"
            }`}
          >
            {u === "metric" ? "°c · km/h" : "°f · mph"}
          </button>
        ))}
      </div>
    </div>
  );
}
