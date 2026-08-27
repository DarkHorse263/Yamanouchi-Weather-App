import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, ListTree } from "lucide-react";
import { COUNTRY_META, regionsForCountry, type CountryCode } from "@/regions";
import { primaryPrefectureForJapanRegion } from "@/regions/japan-prefectures";
import { PlaceSearch } from "@/components/home/PlaceSearch";
import { seasonForCountry } from "@/components/home/CountryPicker";
import { Leaf } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";
import { publishedCatalogueRecords as publishedCanadaCatalogueRecords } from "@workspace/canada-ski-catalogue/public-runtime";
import { usStateForRegion } from "@/regions/us-states";

interface CountryHomeProps {
  code: CountryCode;
}

export default function CountryHome({ code }: CountryHomeProps) {
  const meta = COUNTRY_META[code];
  const regions = regionsForCountry(code);
  const isGreenSeason = seasonForCountry(code) === "green";
  const snowReturnsMonth = code === "AU" || code === "NZ" ? "june" : "december";
  const [selectedPrefecture, setSelectedPrefecture] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const prefectureGroups = useMemo(() => {
    if (code !== "JP") return [];
    const grouped = new Map<string, {
      prefecture: ReturnType<typeof primaryPrefectureForJapanRegion>;
      regions: typeof regions;
    }>();
    for (const region of regions) {
      const prefecture = primaryPrefectureForJapanRegion(region.id);
      const group = grouped.get(prefecture.id) ?? { prefecture, regions: [] };
      group.regions.push(region);
      grouped.set(prefecture.id, group);
    }
    return [...grouped.values()].sort((a, b) =>
      a.prefecture.name.localeCompare(b.prefecture.name),
    );
  }, [code, regions]);
  const visibleGroups = selectedPrefecture === "all"
    ? prefectureGroups
    : prefectureGroups.filter(({ prefecture }) => prefecture.id === selectedPrefecture);
  const stateGroups = useMemo(() => {
    if (code !== "US") return [];
    const grouped = new Map<string, typeof regions>();
    for (const region of regions) {
      const state = usStateForRegion(region) ?? "Other United States";
      grouped.set(state, [...(grouped.get(state) ?? []), region]);
    }
    return [...grouped].map(([state, regions]) => ({ state, regions })).sort((a, b) => a.state.localeCompare(b.state));
  }, [code, regions]);
  const visibleStateGroups = selectedState === "all" ? stateGroups : stateGroups.filter((group) => group.state === selectedState);

  const compactLabels = (labels: string[]) => {
    const shown = labels.slice(0, 3);
    return labels.length > shown.length
      ? `${shown.join(" · ")} · +${labels.length - shown.length} more`
      : shown.join(" · ");
  };

  const renderRegionCard = (region: (typeof regions)[number], i: number) => {
    const towns = region.baseTowns ?? [];
    const mountainLabels = region.summaryMountains
      ?? (region.mountains ?? []).map((m) => m.name);
    return (
      <motion.a
        key={region.id}
        href={`/${region.id}/`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(0.05 + i * 0.04, 0.3) }}
        className="group relative flex flex-col overflow-hidden rounded-xl border-0 bg-white hover:-translate-y-0.5 hover:shadow-2xl shadow-xl transition-all duration-200"
      >
        <div className="flex-1 px-4 py-4 md:px-6 md:py-5 flex flex-col">
          <p className="byline text-slate-500 inline-flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {region.subtitle}
          </p>
          <h3
            className="mt-2 md:mt-3 text-xl md:text-3xl tracking-tight leading-tight text-[#0F172A] group-hover:text-[#0055FF] transition-colors"
            style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", fontWeight: 700 }}
          >
            {region.name}
          </h3>
          <div className="mt-3 md:mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="byline text-slate-400">Base towns</p>
              <p className="mt-1 font-semibold text-slate-700 leading-snug">
                {compactLabels(towns.map((t) => t.name))}
              </p>
            </div>
            <div>
              <p className="byline text-slate-400">Mountains</p>
              <p className="mt-1 font-semibold text-slate-700 leading-snug">
                {compactLabels(mountainLabels)}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-1.5 text-[12px] font-semibold text-[#0055FF] group-hover:text-[#0055FF]/80 bg-slate-50 transition-colors">
          Pick a town
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.a>
    );
  };

  return (
    <div
      className="relative isolate min-h-[100dvh] text-white antialiased bg-[#0055FF] pb-safe"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      <PageMeta
        title={`${meta.name} - mountain regions on feelzlike`}
        description={`Pick a region in ${meta.name} to see real-time mountain weather, lift status, road conditions and live cams.`}
        path={`/${code.toLowerCase()}`}
        jsonLd={[
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: meta.name, url: `https://feelzlike.com/${code.toLowerCase()}` },
          ]),
        ]}
      />

      {/* z-20: the search dropdown must paint above the region cards in
          <main> (also z-stacked), which otherwise cover it. */}
      <header className="relative z-20">
        <div className="max-w-3xl mx-auto px-5 pt-4 pb-4 md:pt-9 md:pb-6 text-center">
          <a
            href="/countries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:underline hover:underline-offset-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All countries
          </a>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 md:mt-5 flex flex-col items-center"
          >
            <span
              aria-hidden="true"
              className="text-4xl md:text-6xl leading-none select-none"
              style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
            >
              {meta.flag}
            </span>
            <h1
              className="mt-2.5 md:mt-4 text-2xl md:text-4xl tracking-tight leading-tight text-white"
              style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", fontWeight: 700 }}
            >
              {meta.name}
            </h1>
            <p className="mt-1.5 md:mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {code === "JP" ? "Choose a prefecture · then a travel region" : code === "US" ? "Choose a state · then a travel region" : "Choose a region"}
            </p>
            {isGreenSeason && (
              <p
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3.5 py-1.5 text-[11px] font-bold lowercase text-emerald-100 ring-1 ring-emerald-300/40"
                data-testid="badge-green-season"
              >
                <Leaf className="h-3 w-3" aria-hidden />
                green season · lifts resting for summer · snow returns around {snowReturnsMonth}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mx-auto mt-4 w-full max-w-md text-left"
          >
            <PlaceSearch
              source={`country_${code.toLowerCase()}`}
              placeholder={code === "JP"
                ? "search a prefecture · town · resort · region"
                : code === "US" ? "search a state · town · resort · region" : "search a town · resort · region"}
            />
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-5 pb-6 md:pb-10">
        {code === "JP" ? (
          <>
            <div className="mx-auto mb-5 flex max-w-3xl gap-2 overflow-x-auto pb-2" aria-label="filter by prefecture">
              <button
                type="button"
                onClick={() => setSelectedPrefecture("all")}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${
                  selectedPrefecture === "all" ? "bg-white text-[#0055FF]" : "bg-white/15 text-white"
                }`}
              >
                all prefectures
              </button>
              {prefectureGroups.map(({ prefecture }) => (
                <button
                  key={prefecture.id}
                  type="button"
                  onClick={() => setSelectedPrefecture(prefecture.id)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${
                    selectedPrefecture === prefecture.id ? "bg-white text-[#0055FF]" : "bg-white/15 text-white"
                  }`}
                >
                  {prefecture.name} · {prefecture.nameJa}
                </button>
              ))}
            </div>
            <div className="mx-auto max-w-3xl space-y-7">
              {visibleGroups.map(({ prefecture, regions: groupRegions }) => (
                <section key={prefecture.id} id={`prefecture-${prefecture.id}`} className="scroll-mt-4">
                  <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
                    <h2 className="text-xl font-bold text-white">
                      {prefecture.name} <span lang="ja" className="text-white">{prefecture.nameJa}</span>
                    </h2>
                    <span className="text-xs font-semibold text-white">
                      {groupRegions.length} {groupRegions.length === 1 ? "region" : "regions"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-4">
                    {groupRegions.map(renderRegionCard)}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : code === "US" ? (
          <>
            <div className="mx-auto mb-5 flex max-w-3xl gap-2 overflow-x-auto pb-2" aria-label="filter by state">
              <button type="button" onClick={() => setSelectedState("all")} className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${selectedState === "all" ? "bg-white text-[#0055FF]" : "bg-white/15 text-white"}`}>all states</button>
              {stateGroups.map(({ state }) => (
                <button key={state} type="button" onClick={() => setSelectedState(state)} className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${selectedState === state ? "bg-white text-[#0055FF]" : "bg-white/15 text-white"}`}>{state}</button>
              ))}
            </div>
            <div className="mx-auto max-w-3xl space-y-7">
              {visibleStateGroups.map(({ state, regions: groupRegions }) => (
                <section key={state}>
                  <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1"><h2 className="text-xl font-bold text-white">{state}</h2><span className="text-xs font-semibold text-white">{groupRegions.length} {groupRegions.length === 1 ? "region" : "regions"}</span></div>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-4">{groupRegions.map(renderRegionCard)}</div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4 max-w-3xl mx-auto">
            {regions.map(renderRegionCard)}
          </div>
        )}

        {/* Canada · independently checked additions plus a broader outbound directory. */}
        {code === "CA" && (
          <motion.a
            href="/ca/all-ski-areas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className="group mx-auto mt-3 md:mt-4 flex max-w-3xl items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 md:px-6 hover:border-white/40 hover:bg-white/20 transition-all duration-200"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <ListTree className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-white transition-colors">
                canada ski area directory
              </span>
              <span className="mt-0.5 block text-xs text-white">
                {publishedCanadaCatalogueRecords.length} independently checked public additions from the 25 august 2026 gap audit · broader outbound directory
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-white group-hover:translate-x-0.5 transition-transform" />
          </motion.a>
        )}
      </main>
    </div>
  );
}
