import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, ListTree } from "lucide-react";
import { COUNTRY_META, regionsForCountry, type CountryCode } from "@/regions";
import { PlaceSearch } from "@/components/home/PlaceSearch";
import { seasonForCountry } from "@/components/home/CountryPicker";
import { Leaf } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";

interface CountryHomeProps {
  code: CountryCode;
}

export default function CountryHome({ code }: CountryHomeProps) {
  const meta = COUNTRY_META[code];
  const regions = regionsForCountry(code);
  const isGreenSeason = seasonForCountry(code) === "green";
  const snowReturnsMonth = code === "AU" || code === "NZ" ? "june" : "december";

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
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
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
            <p className="mt-1.5 md:mt-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Choose a region
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
              placeholder="search a town · resort · region"
            />
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-5 pb-6 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4 max-w-3xl mx-auto">
          {regions.map((region, i) => {
            const towns = region.baseTowns ?? [];
            // Prefer the curated top-level rollup (e.g. Yamanouchi's 22
            // sub-resorts collapse to "Shiga Kogen · Ryuoo · Yomase").
            // Fall back to the raw mountains array for regions without one.
            const mountainLabels = region.summaryMountains
              ?? (region.mountains ?? []).map((m) => m.name);
            return (
              <motion.a
                key={region.id}
                href={`/${region.id}/`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(0.05 + i * 0.06, 0.35) }}
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
                        {towns.map((t) => t.name).join(" · ")}
                      </p>
                    </div>
                    <div>
                      <p className="byline text-slate-400">Mountains</p>
                      <p className="mt-1 font-semibold text-slate-700 leading-snug">
                        {mountainLabels.join(" · ")}
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
          })}
        </div>

        {/* Canada · low-key link out to the full directory of every other hill. */}
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
                every other ski hill in canada · the full list
              </span>
              <span className="mt-0.5 block text-[12px] text-white/70">
                264 more ski areas across every province · links to each hill's own site
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-white group-hover:translate-x-0.5 transition-transform" />
          </motion.a>
        )}
      </main>
    </div>
  );
}
