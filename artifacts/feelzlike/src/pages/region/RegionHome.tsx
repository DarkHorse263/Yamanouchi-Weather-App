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
// News & updates hidden until the feed is populated · restore the import +
// the <NewsStrip /> render below when real content lands.
// import { NewsStrip } from "@/components/news/NewsStrip";

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
  // Daily Pick is winter-only · in summer the "best resort to ride today"
  // doesn't make sense (most are closed). Limit to regions that ship a
  // mountains list with stable ids so the API has something to score.
  const showDailyPick = seasonCtx?.season === "winter" && (region.mountains ?? []).length > 0;

  const towns = region.baseTowns ?? [];
  const mountainsById = new Map((region.mountains ?? []).map((m) => [m.id, m]));
  const country = REGION_COUNTRY[region.id];
  const countryMeta = country ? COUNTRY_META[country] : null;

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title={`${region.name} - pick a base town`}
        description={`Choose your base town in ${region.name}. Real-time weather, road conditions and live cams scoped to where you stay.`}
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
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
        >
          <span aria-hidden>‹</span>
          {countryMeta?.name}
        </a>
      ) : null}

      <PageHeader
        byline={countryMeta ? `${countryMeta.flag} ${region.subtitle}` : region.subtitle}
        title={region.name}
        description={t("Pick a base town to see weather, roads and cams scoped to where you stay.", "拠点の町を選んでください。天気・道路・カメラが滞在エリアに合わせて表示されます。")}
      />

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
        <p className="mt-6 text-sm text-muted-foreground">
          {t("No base towns configured yet.", "拠点の町は未設定です。")}
        </p>
      ) : (
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md h-full"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/8 text-primary inline-flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {t(town.name, town.nameJa ?? town.name)}
                    </p>
                    {town.blurb ? (
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {t(town.blurb, town.blurbJa ?? town.blurb)}
                      </p>
                    ) : null}
                    {nearby.length > 0 ? (
                      <p className="mt-2 text-[12px] text-muted-foreground/80 inline-flex items-center gap-1.5">
                        <Mountain className="w-3 h-3" />
                        {nearby.slice(0, 4).join(" · ")}
                        {nearby.length > 4 ? ` +${nearby.length - 4}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </Link>
              </motion.div>
            );
          })}
        </section>
      )}

      {/* <NewsStrip regionId={region.id} /> · hidden until populated */}
    </div>
  );
}
