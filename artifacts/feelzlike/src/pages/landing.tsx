import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import mainLogo from "@assets/feelzlike_transparent/feelzlike_colour_150426_1777272466909_transparent.png";

type Region = {
  id: string;
  name: string;
  region: string;
  baseTowns: string[];
  mountains: string[];
  tags: string[];
  status: "live" | "soon";
  href: string;
  coords: string;
};

const REGIONS: Region[] = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    region: "New South Wales, Australia",
    baseTowns: ["Jindabyne", "Berridale", "Cooma"],
    mountains: ["Thredbo", "Perisher", "Charlotte Pass", "Selwyn"],
    tags: ["Snow", "Hiking", "Lakes"],
    status: "live",
    href: "/snowy-mountains/",
    coords: "36.5° S · 148.3° E",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    region: "Nagano, Japan",
    baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],
    mountains: ["Shiga Kogen", "Yomase", "X-Jam", "Ryuoo"],
    tags: ["Snow", "Onsen", "Culture"],
    status: "live",
    href: "/yamanouchi/",
    coords: "36.7° N · 138.4° E",
  },
  {
    id: "iiyama",
    name: "Iiyama",
    region: "Nagano, Japan",
    baseTowns: ["Iiyama", "Kijimadaira"],
    mountains: [
      "Madarao",
      "Tangram",
      "Nozawa Onsen",
      "Togari Onsen",
      "The Cupid of Romance",
      "Makinoiri Kogen Snow Park",
    ],
    tags: ["Snow", "Mountains", "Onsen"],
    status: "soon",
    href: "/iiyama/",
    coords: "36.9° N · 138.4° E",
  },
];

export default function Landing() {
  const [search, setSearch] = useState("");

  const filtered = REGIONS.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      r.baseTowns.some((t) => t.toLowerCase().includes(q)) ||
      r.mountains.some((m) => m.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="min-h-screen bg-[#f6f8fb] text-slate-900 antialiased"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      {/* ─── HERO ─────────────────────────────────────── */}
      <header className="relative bg-white">
        <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-12 md:pt-14 md:pb-16 text-center">
          {/* main brand logo with mountain - centred */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8 flex flex-col items-center"
          >
            <img
              src={mainLogo}
              alt="feelzlike - resort town mountain weather"
              className="h-24 md:h-32 lg:h-36 w-auto select-none"
              draggable={false}
            />
            <span className="mt-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
              Resort Town Mountain Weather
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed"
          >
            Stop guessing what it feelzlike
            <br />
            in the mountains today.
            <br />
            See real-time mountain weather you can trust.
            <br />
            <span className="md:hidden">
              Plus mountain cams, road cams,
              <br />
              road reports, lift status.
            </span>
            <span className="hidden md:inline">
              Plus mountain cams, road cams, road reports, lift status.
            </span>
            <br />
            Everything you need to decide where to go today.
          </motion.p>

          {/* editorial cue to the regions - sits directly above the search,
              with breathing room from the intro copy above. */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm md:text-base text-sky-700 max-w-xl mx-auto leading-relaxed mt-10 md:mt-14"
          >
            I wonder what it feelzlike in…
          </motion.p>

          {/* SEARCH */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-3 md:mt-4"
          >
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <label htmlFor="region-search" className="sr-only">
                Search mountain regions
              </label>
              <input
                id="region-search"
                type="text"
                aria-label="Search mountain regions"
                placeholder="Search a mountain region…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all text-left"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── REGIONS ──────────────────────────────────── */}
      <main className="relative max-w-6xl mx-auto px-5 pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="flex items-end justify-end mb-4 md:mb-5">
          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
            {filtered.length} {filtered.length === 1 ? "region" : "regions"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((region, i) => (
            <motion.a
              key={region.id}
              href={region.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_12px_28px_-12px_rgba(56,128,210,0.25)] transition-all duration-200"
            >
              {/* logo-blue accent strip */}
              <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700" />

              <div className="flex-1 p-4 md:p-5 text-center md:text-left">
                {/* status + location */}
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  {region.status === "live" ? (
                    <span className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Live
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                        Soon
                      </span>
                    </span>
                  )}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700/80">
                    <MapPin className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5 text-sky-600/70" />
                    {region.region}
                  </p>
                </div>

                {/* name */}
                <h3
                  className="mt-2 text-xl md:text-2xl text-blue-900 tracking-tight leading-tight group-hover:text-sky-700 transition-colors"
                  style={{
                    fontFamily: "'DIN Pro', system-ui, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {region.name}
                </h3>

                {/* divider */}
                <div className="mt-3 mb-3 mx-auto md:mx-0 h-px w-10 bg-gradient-to-r from-sky-400 to-blue-600" />

                {/* compact meta */}
                <dl className="space-y-1.5 text-[12px] leading-snug">
                  <div>
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-700 mb-0.5">
                      Towns
                    </dt>
                    <dd className="text-slate-700">
                      {region.baseTowns.join(" · ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-700 mb-0.5">
                      Mountains
                    </dt>
                    <dd className="text-slate-700">
                      {region.mountains.join(" · ")}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* footer cue */}
              <div className="border-t border-slate-100 bg-gradient-to-r from-sky-50/40 to-blue-50/40 px-4 py-2.5 md:px-5 flex items-center justify-center md:justify-end gap-1.5 text-[11px] font-semibold text-sky-700 group-hover:text-blue-700 transition-colors">
                Open
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* trust footer */}
        <div className="mt-14 md:mt-20 pt-10 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">
                02 · Where the data comes from
              </p>
              <p
                className="text-xl md:text-2xl text-slate-900 tracking-tight max-w-lg leading-tight"
                style={{
                  fontFamily: "'DIN Pro', system-ui, sans-serif",
                  fontWeight: 700,
                }}
              >
                Built by mountain people, for mountain people.
              </p>
              <p className="text-sm text-slate-600 mt-3 max-w-lg leading-relaxed">
                Real-time conditions sourced direct from official services -
                the Bureau of Meteorology and Japan Meteorological Agency for
                live observations, Transport for NSW for road conditions, and
                each resort&apos;s own network for lift status. Forecasts blend
                ECMWF, GFS, ICON, BOM ACCESS-G, JMA and MET Norway so you see
                the consensus, not a single guess.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end md:text-right text-[11px] text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-700">
                Sources
              </span>

              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">Live observations</span>
                <span>Bureau of Meteorology · Australia</span>
                <span>Japan Meteorological Agency · Japan</span>
                <span>Transport for NSW · Live Traffic</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">Forecast ensemble</span>
                <span>ECMWF IFS · Europe</span>
                <span>GFS · NOAA, USA</span>
                <span>ICON · DWD, Germany</span>
                <span>BOM ACCESS-G · Australia</span>
                <span>JMA Seamless · Japan</span>
                <span>MET Norway Locationforecast</span>
                <span className="text-slate-400">aggregated via Open-Meteo</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">Resort &amp; transport</span>
                <span>Thredbo · Perisher · Charlotte&apos;s Pass · Selwyn</span>
                <span>Shiga Kogen · Iiyama Kogen</span>
                <span>Cooma Coaches · Snowy Mountains</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">Mapping &amp; imagery</span>
                <span>OpenWeatherMap · weather tiles</span>
                <span>BOM radar · NSW alpine</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
