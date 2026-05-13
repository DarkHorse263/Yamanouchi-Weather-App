import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { COUNTRY_META, regionsForCountry, type CountryCode } from "@/regions";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";

interface CountryHomeProps {
  code: CountryCode;
}

export default function CountryHome({ code }: CountryHomeProps) {
  const meta = COUNTRY_META[code];
  const regions = regionsForCountry(code);

  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
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

      <header className="relative z-10">
        <div className="max-w-3xl mx-auto px-5 pt-5 pb-5 md:pt-12 md:pb-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All countries
          </a>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 md:mt-6 flex flex-col items-center"
          >
            <span
              aria-hidden="true"
              className="text-4xl md:text-6xl leading-none select-none"
              style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
            >
              {meta.flag}
            </span>
            <h1
              className="mt-2.5 md:mt-4 text-2xl md:text-4xl tracking-tight leading-tight text-blue-900"
              style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", fontWeight: 700 }}
            >
              {meta.name}
            </h1>
            <p className="mt-1.5 md:mt-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700/80">
              Choose a region
            </p>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-5 pb-8 md:pb-14">
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
                transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_12px_28px_-12px_rgba(56,128,210,0.25)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200"
              >
                <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700" />
                <div className="flex-1 px-4 py-4 md:px-6 md:py-7 flex flex-col">
                  <p className="byline text-sky-700/80 inline-flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {region.subtitle}
                  </p>
                  <h3
                    className="mt-2 md:mt-3 text-xl md:text-3xl tracking-tight leading-tight text-blue-900 group-hover:text-sky-700 transition-colors"
                    style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", fontWeight: 700 }}
                  >
                    {region.name}
                  </h3>
                  <div className="mt-3 md:mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <p className="byline text-muted-foreground/70">Base towns</p>
                      <p className="mt-1 font-semibold text-slate-700 leading-snug">
                        {towns.slice(0, 4).map((t) => t.name).join(" · ")}
                        {towns.length > 4 ? ` +${towns.length - 4}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="byline text-muted-foreground/70">Mountains</p>
                      <p className="mt-1 font-semibold text-slate-700 leading-snug">
                        {mountainLabels.slice(0, 4).join(" · ")}
                        {mountainLabels.length > 4 ? ` +${mountainLabels.length - 4}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-1.5 text-[12px] font-semibold text-sky-700 group-hover:text-blue-700 bg-gradient-to-r from-sky-50/50 to-blue-50/50 transition-colors">
                  Pick a town
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
