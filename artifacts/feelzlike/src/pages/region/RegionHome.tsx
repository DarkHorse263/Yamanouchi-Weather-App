import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Mountain } from "lucide-react";
import {
  useRegion,
  useLanguage,
  useOptionalSeason,
  PageHeader,
} from "@workspace/feelzlike-shell";
import { REGION_COUNTRY, COUNTRY_META } from "@/regions";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";
import { DailyPick } from "@/components/DailyPick";
import { REGION_PARTNERS } from "@/data/townPartners";
import { TownPartnerAd } from "@/components/TownPartnerAd";
import { TownPartnerCard } from "@/components/TownPartnerCard";
import { isCatalogueMountainLinkTown } from "@/regions/japan-catalogue";

/**
 * Region landing - the second hop in the Country > Region > Town flow.
 * Renders the region's `baseTowns` as picker cards (towns-first IA hard
 * rule, see RegionConfig comment). Each card links to `/{regionId}/{townId}`
 * which mounts the existing TownLayout/TownHome.
 */
export function RegionHome() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const seasonCtx = useOptionalSeason();
  // Daily Pick HIDDEN globally (owner request, Aug 2026): visitors mistook
  // the single "pick of the day" callout for the region's ONLY weather and
  // missed the per-town/mountain pages below. Component + API kept intact;
  // flip DAILY_PICK_ENABLED to bring it back (winter-only, regions with a
  // mountains list — the original gates still apply).
  const DAILY_PICK_ENABLED = false;
  const showDailyPick =
    DAILY_PICK_ENABLED && seasonCtx?.season === "winter" && (region.mountains ?? []).length > 0;

  const towns = region.baseTowns ?? [];
  const hasGeneratedCatalogueTowns = towns.some(isCatalogueMountainLinkTown);
  const mountainsById = new Map((region.mountains ?? []).map((m) => [m.id, m]));
  const country = REGION_COUNTRY[region.id];
  const countryMeta = country ? COUNTRY_META[country] : null;

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title={`${region.name} - pick a base town`}
        description={
          hasGeneratedCatalogueTowns
            ? `Choose a base in ${region.name} to open nearby published mountain weather.`
            : `Choose your base town in ${region.name}. Real-time weather, road conditions and live cams scoped to where you stay.`
        }
        path={`/${region.id}`}
        jsonLd={[
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            ...(country
              ? [{
                  name: COUNTRY_META[country].name,
                  url: `https://feelzlike.com/${country.toLowerCase()}`,
                }]
              : []),
            { name: region.name, url: `https://feelzlike.com/${region.id}` },
          ]),
        ]}
      />

      {country ? (
        <a
          href={`/${country.toLowerCase()}/`}
          className="inline-flex items-center gap-1 text-[12px] font-bold lowercase tracking-wider text-white/70 hover:text-white transition-colors"
        >
          <span aria-hidden>‹</span>
          {countryMeta?.name}
        </a>
      ) : null}

      <PageHeader
        byline={countryMeta ? `${countryMeta.flag} ${region.subtitle}` : region.subtitle}
        title={region.name}
        description={
          hasGeneratedCatalogueTowns
            ? t(
                "Pick a base to open nearby published mountain weather.",
                "拠点を選んで、近隣の公開済み山岳天気をご覧ください。",
              )
            : t(
                "Pick a base town to see weather, roads and cams scoped to where you stay.",
                "拠点の町を選んでください。天気・道路・カメラが滞在エリアに合わせて表示されます。",
              )
        }
      />

      {/* FEATURED PARTNER · paid, disclosed region-level placement directly
          under the region header. Only renders when this region has an
          active signed deal in data/townPartners.ts (REGION_PARTNERS) ·
          same honesty rules as the town-page surface. */}
      {REGION_PARTNERS[region.id]?.display === "ad" ? (
        <TownPartnerAd partner={REGION_PARTNERS[region.id]} placeId={region.id} t={t} />
      ) : REGION_PARTNERS[region.id] ? (
        <TownPartnerCard partner={REGION_PARTNERS[region.id]} placeId={region.id} t={t} />
      ) : null}

      {showDailyPick && (
        <div className="mt-6">
          <DailyPick
            regionId={region.id}
            resorts={(region.mountains ?? []).map((m) => ({ id: m.id, name: m.name }))}
            resortHrefPattern="/mountain/:id"
          />
        </div>
      )}

      {towns.length === 0 ? (
        <p className="mt-6 text-[15px] font-bold text-white/70 lowercase">
          {t("No base towns configured yet.", "拠点の町は未設定です。")}
        </p>
      ) : (
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {towns.map((town, i) => {
            const nearby = (town.nearbyMountainIds ?? [])
              .map((id) => mountainsById.get(id)?.name)
              .filter((n): n is string => !!n);
            return (
              <motion.div
                key={town.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 + i * 0.05 }}
              >
                <Link
                  href={`/${town.id}`}
                  className="group flex items-start gap-5 rounded-[2rem] border-0 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,30,120,0.5)] shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)] h-full"
                >
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#F0F5FF] text-[#0055FF] inline-flex items-center justify-center transition-colors group-hover:bg-[#0055FF] group-hover:text-white">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-black lowercase tracking-tight text-[#0F172A]">
                      {t(town.name, town.nameJa ?? town.name)}
                    </p>
                    {town.blurb ? (
                      <p className="text-[14px] font-bold text-slate-500 mt-1 leading-snug lowercase">
                        {t(town.blurb, town.blurbJa ?? town.blurb)}
                      </p>
                    ) : null}
                    {nearby.length > 0 ? (
                      <p className="mt-3 text-[13px] font-bold text-slate-400 lowercase inline-flex items-center gap-1.5">
                        <Mountain className="w-4 h-4" />
                        {nearby.slice(0, 4).join(" · ")}
                        {nearby.length > 4 ? ` +${nearby.length - 4}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-[#0055FF] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 shrink-0 mt-1" />
                </Link>
              </motion.div>
            );
          })}
        </section>
      )}

    </div>
  );
}
