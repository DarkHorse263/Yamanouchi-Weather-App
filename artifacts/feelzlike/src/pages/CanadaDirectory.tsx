import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { type CSSProperties } from "react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";
import {
  CANADA_DIRECTORY,
  PROVINCE_NAMES,
  PROVINCE_ORDER,
  type CanadaDirectoryEntry,
  type CanadaProvince,
} from "@/data/canadaDirectory";

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty: CSSProperties = { textWrap: "pretty" as CSSProperties["textWrap"] };

const TOTAL = CANADA_DIRECTORY.length;
const NOTABLE = CANADA_DIRECTORY.filter((e) => e.notable);

// Group entries by province, preserving the alphabetical order the dataset
// is already sorted in.
const BY_PROVINCE: Record<CanadaProvince, CanadaDirectoryEntry[]> =
  PROVINCE_ORDER.reduce((acc, code) => {
    acc[code] = CANADA_DIRECTORY.filter((e) => e.province === code);
    return acc;
  }, {} as Record<CanadaProvince, CanadaDirectoryEntry[]>);

/** External link · official site when present, skiresort.info info page when null. */
function ResortLink({ entry }: { entry: CanadaDirectoryEntry }) {
  const href = entry.website ?? entry.infoUrl;
  const isOfficial = !!entry.website;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group inline-flex items-baseline gap-1.5 text-slate-700 hover:text-sky-700 transition-colors"
    >
      <span className="leading-snug">{entry.name}</span>
      {isOfficial ? (
        <ExternalLink className="h-3 w-3 shrink-0 translate-y-0.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
      ) : (
        <span className="inline-flex items-center gap-0.5 shrink-0 translate-y-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 group-hover:text-sky-600 transition-colors">
          <Info className="h-3 w-3" />
          info
        </span>
      )}
    </a>
  );
}

export default function CanadaDirectory() {
  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike · every ski hill in canada"
        description="a directory of every other ski area in canada beyond the regions feelzlike covers live · links out to each hill's own website, grouped by province."
        path="/ca/all-ski-areas"
        jsonLd={[
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: "Canada", url: "https://feelzlike.com/ca" },
            { name: "every ski hill in canada", url: "https://feelzlike.com/ca/all-ski-areas" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl px-4 md:px-6">
        {/* HEADER ─────────────────────────────────────── */}
        <header className="flex flex-col gap-3 pt-5 pb-4 md:pt-8">
          <a
            href="/ca"
            className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            canada
          </a>
          <h1
            className="mt-2 text-2xl md:text-4xl font-bold leading-tight text-blue-900"
            style={balance}
          >
            every ski hill in canada
          </h1>
          <p className="max-w-2xl text-sm md:text-base leading-relaxed text-slate-700" style={pretty}>
            the 10 regions above are where feelzlike runs live conditions ·
            everything below links out to the hill's own site.
          </p>
          <div className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[12px] font-semibold text-sky-800">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {TOTAL} more ski areas
          </div>
        </header>

        {/* NOTABLE STRIP ──────────────────────────────── */}
        {NOTABLE.length > 0 && (
          <section className="pt-2 pb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80">
              worth knowing
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {NOTABLE.map((entry, i) => {
                const href = entry.website ?? entry.infoUrl;
                return (
                  <motion.a
                    key={entry.infoUrl}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.02 * i }}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_12px_28px_-12px_rgba(56,128,210,0.25)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-blue-900 group-hover:text-sky-700 leading-snug transition-colors">
                        {entry.name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600" style={pretty}>
                      {entry.blurb}
                    </p>
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {PROVINCE_NAMES[entry.province]}
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </section>
        )}

        {/* PROVINCE LISTS ─────────────────────────────── */}
        <section className="pb-4">
          {PROVINCE_ORDER.map((code) => {
            const entries = BY_PROVINCE[code];
            if (entries.length === 0) return null;
            return (
              <div key={code} className="border-t border-slate-100 py-6 first:border-t-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-blue-900">
                    {PROVINCE_NAMES[code]}
                  </h2>
                  <span className="text-[12px] font-semibold text-sky-700/70">
                    {entries.length} {entries.length === 1 ? "area" : "areas"}
                  </span>
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => (
                    <li key={entry.infoUrl}>
                      <ResortLink entry={entry} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        {/* FOOTER NOTE ────────────────────────────────── */}
        <footer className="border-t border-slate-100 py-6 text-[12px] leading-relaxed text-slate-500" style={pretty}>
          <p>
            list drawn from skiresort.info · {TOTAL} areas beyond the 10 regions
            feelzlike covers live. links marked{" "}
            <span className="font-semibold text-slate-600">info</span> go to the
            resort's skiresort.info page where no official site could be
            confirmed. found a broken or wrong link? that's on us to fix.
          </p>
        </footer>
      </div>
    </div>
  );
}
