import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ArrowRight,
  Clock,
  Wind,
  Snowflake,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import mainLogo from "@assets/feelzlike_transparent/feelzlike_colour_150426_1777272466909_transparent.png";

// ─── types ─────────────────────────────────────────
type RegionStatus = "live" | "soon";

interface HeadlineReading {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  snowfallMmNext24h: number;
  observedAt: string;
  source: string;
  forecast: Array<{
    date: string;
    maxC: number;
    minC: number;
    weatherCode: number | null;
    description: string;
    precipMm: number;
    snowfallMm: number;
  }>;
}

interface Region {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP";
  region: string;
  status: RegionStatus;
  href: string;
  baseTowns: string[];
  mountains: string[];
  headlineLabel: string;
  elevation?: number;
  sourceLabel?: string;
  headline: HeadlineReading | null;
}

interface RegionsResponse {
  regions: Region[];
  generatedAt: string;
  sourceCount: number;
  refreshIntervalMin: number;
}

// ─── helpers ───────────────────────────────────────

const FALLBACK_REGIONS: Region[] = [
  { id: "snowy-mountains", name: "Snowy Mountains", country: "Australia", countryCode: "AU", region: "New South Wales", status: "live", href: "/snowy-mountains/", baseTowns: ["Jindabyne", "Berridale", "Cooma"], mountains: ["Thredbo", "Perisher", "Charlotte Pass", "Selwyn"], headlineLabel: "Thredbo Top", headline: null },
  { id: "yamanouchi", name: "Yamanouchi Town", country: "Japan", countryCode: "JP", region: "Nagano", status: "live", href: "/yamanouchi/", baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"], mountains: ["Shiga Kogen", "Yomase", "X-Jam", "Ryuoo"], headlineLabel: "Shiga Kogen", headline: null },
  { id: "iiyama", name: "Iiyama", country: "Japan", countryCode: "JP", region: "Nagano", status: "soon", href: "/iiyama/", baseTowns: ["Iiyama", "Kijimadaira"], mountains: ["Madarao", "Tangram", "Nozawa Onsen", "Togari Onsen", "The Cupid of Romance", "Makinoiri Kogen Snow Park"], headlineLabel: "Madarao", headline: null },
];

function WeatherIcon({ code, className = "w-4 h-4" }: { code: number | null; className?: string }) {
  if (code == null) return <Cloud className={className} />;
  if (code === 0) return <Sun className={className} />;
  if (code === 1) return <CloudSun className={className} />;
  if (code === 2) return <CloudSun className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} />;
  if (code >= 61 && code <= 67) return <CloudRain className={className} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={className} />;
  if (code >= 80 && code <= 82) return <CloudRain className={className} />;
  if (code >= 85 && code <= 86) return <CloudSnow className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function formatAgo(iso: string | undefined, now: number, fallback = "loading…"): string {
  if (!iso) return fallback;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return fallback;
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

function dayShort(iso: string, idx: number): string {
  if (idx === 0) return "Today";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// Snow-season detection per region. AU is southern-hemisphere (winter Jun–Sep);
// JP is northern-hemisphere (winter Dec–Mar). Anything else on the card flips
// to the green-season palette.
function seasonForRegion(region: Region): "winter" | "green" {
  const month = new Date().getMonth() + 1;
  if (region.countryCode === "AU") {
    return month >= 6 && month <= 9 ? "winter" : "green";
  }
  // JP and any other northern-hemisphere region we add later
  return month >= 12 || month <= 3 ? "winter" : "green";
}

// ─── component ─────────────────────────────────────

export default function Landing() {
  const [search, setSearch] = useState("");

  const { data, dataUpdatedAt } = useQuery<RegionsResponse>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("Failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const regions = data?.regions ?? FALLBACK_REGIONS;
  const generatedAt = data?.generatedAt;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  void dataUpdatedAt;

  const filtered = regions.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.baseTowns.some((t) => t.toLowerCase().includes(q)) ||
      r.mountains.some((m) => m.toLowerCase().includes(q))
    );
  });

  const liveCount = regions.filter((r) => r.status === "live").length;
  const totalMountains = regions.reduce((acc, r) => acc + r.mountains.length, 0);

  return (
    <div
      className="min-h-screen bg-[#f6f8fb] text-slate-900 antialiased"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      {/* ─── HERO ─────────────────────────────────────── */}
      <header className="relative bg-white">
        <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-12 md:pt-14 md:pb-16 text-center">
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

          {/* TRUST LINE */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-7 md:mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] text-slate-600"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="font-semibold uppercase tracking-[0.16em] text-[9px] text-emerald-700">
                {liveCount} live
              </span>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              <span className="font-semibold tabular-nums text-slate-700">{data?.sourceCount ?? 7}</span> official sources
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              refreshed every <span className="tabular-nums font-semibold text-slate-700">{data?.refreshIntervalMin ?? 15}</span> min
            </span>
            <span className="text-slate-300">·</span>
            <span className="tabular-nums">
              updated {formatAgo(generatedAt, now)}
            </span>
          </motion.div>

          {/* editorial cue */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm md:text-base text-sky-700 max-w-xl mx-auto leading-relaxed mt-8 md:mt-10"
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
        <div className="flex items-end justify-between mb-4 md:mb-5 gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            01 · Regions <span className="text-slate-300">·</span>{" "}
            <span className="text-slate-400 normal-case font-medium tracking-normal">
              {totalMountains} mountains tracked
            </span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium tabular-nums shrink-0">
            {filtered.length} {filtered.length === 1 ? "region" : "regions"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((region, i) => {
            const h = region.headline;
            const isLive = region.status === "live";
            const isGreen = seasonForRegion(region) === "green";

            // "Soon" regions (e.g. Iiyama) get a stripped-down placeholder
            // card — red border, single centered "MORE REGIONS COMING SOON"
            // line. No status pill, no name, no town/mountain meta, no link.
            if (!isLive) {
              return (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
                  className="relative flex items-center justify-center rounded-xl border-2 border-red-400 bg-white px-6 py-10 min-h-[220px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                >
                  <p
                    className="text-center text-sm md:text-base font-bold uppercase tracking-[0.22em] text-red-600"
                    style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
                  >
                    More regions
                    <br />
                    coming soon
                  </p>
                </motion.div>
              );
            }

            // Palette swap: when a region is in its green (off-snow) season,
            // border + accent + type all flip from logo-blue to emerald so the
            // viewer sees at a glance "this region isn't in snow ops right now".
            // Tailwind needs literal class strings for purging — keep both
            // branches as full literals.
            const cardBorder = isGreen
              ? "border-emerald-200 hover:border-emerald-500 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_12px_28px_-12px_rgba(16,160,90,0.28)]"
              : "border-slate-200 hover:border-sky-400 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_12px_28px_-12px_rgba(56,128,210,0.25)]";
            const accentStrip = isGreen
              ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-700"
              : "bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700";
            const locationLabel = isGreen ? "text-emerald-700/80" : "text-sky-700/80";
            const locationIcon = isGreen ? "text-emerald-600/70" : "text-sky-600/70";
            const nameClass = isGreen
              ? "text-emerald-900 group-hover:text-emerald-700"
              : "text-blue-900 group-hover:text-sky-700";
            const sectionLabel = isGreen ? "text-emerald-700" : "text-sky-700";
            const numberClass = isGreen ? "text-emerald-900" : "text-blue-900";
            const unitClass = isGreen ? "text-emerald-700" : "text-sky-700";
            const iconAccent = isGreen ? "text-emerald-600" : "text-sky-600";
            const dividerClass = isGreen
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-gradient-to-r from-sky-400 to-blue-600";
            const footerStrip = isGreen
              ? "bg-gradient-to-r from-emerald-50/60 to-emerald-50/40 text-emerald-700 group-hover:text-emerald-800"
              : "bg-gradient-to-r from-sky-50/50 to-blue-50/50 text-sky-700 group-hover:text-blue-700";

            return (
              <motion.a
                key={region.id}
                href={region.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 ${cardBorder}`}
              >
                {/* season-aware accent strip */}
                <div className={`h-1 w-full ${accentStrip}`} />

                <div className="flex-1 p-4 md:p-5 text-center md:text-left">
                  {/* status + location */}
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
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
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${locationLabel}`}>
                      <MapPin className={`w-2.5 h-2.5 inline-block mr-1 -mt-0.5 ${locationIcon}`} />
                      {region.region}, {region.country}
                    </p>
                  </div>

                  {/* name */}
                  <h3
                    className={`mt-2 text-xl md:text-2xl tracking-tight leading-tight transition-colors ${nameClass}`}
                    style={{
                      fontFamily: "'DIN Pro', system-ui, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {region.name}
                  </h3>

                  {/* HEADLINE LIVE READING */}
                  {isLive && h && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className={`text-[9px] font-semibold uppercase tracking-[0.18em] mb-2 ${sectionLabel}`}>
                        {region.headlineLabel} <span className="text-slate-300">·</span> live
                      </p>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl md:text-4xl font-bold tabular-nums leading-none ${numberClass}`}>
                            {Math.round(h.tempC)}
                          </span>
                          <span className={`text-base font-semibold ${unitClass}`}>°C</span>
                        </div>
                        <div className={iconAccent}>
                          <WeatherIcon code={h.weatherCode} className="w-7 h-7 md:w-8 md:h-8" />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-700 capitalize">
                        {h.description.toLowerCase()} <span className="text-slate-400">·</span> feels {Math.round(h.feelsLikeC)}°
                      </p>
                      <div className="mt-2 flex items-center justify-center md:justify-start gap-3 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Wind className="w-3 h-3" />
                          <span className="tabular-nums font-semibold text-slate-700">{h.windKph}</span>
                          <span>km/h{h.windDirection ? ` ${h.windDirection}` : ""}</span>
                        </span>
                        {h.snowfallMmNext24h > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Snowflake className={`w-3 h-3 ${isGreen ? "text-emerald-500" : "text-sky-500"}`} />
                              <span className="tabular-nums font-semibold text-slate-700">{h.snowfallMmNext24h.toFixed(1)}</span>
                              <span>mm/24h</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {!isLive && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 leading-snug">
                        More Regions coming soon
                      </p>
                    </div>
                  )}

                  {/* divider */}
                  <div className={`mt-4 mb-3 mx-auto md:mx-0 h-px w-10 ${dividerClass}`} />

                  {/* compact meta */}
                  <dl className="space-y-1.5 text-[12px] leading-snug">
                    <div>
                      <dt className={`text-[9px] font-semibold uppercase tracking-[0.18em] mb-0.5 ${sectionLabel}`}>
                        Towns
                      </dt>
                      <dd className="text-slate-700">
                        {region.baseTowns.join(" · ")}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-[9px] font-semibold uppercase tracking-[0.18em] mb-0.5 ${sectionLabel}`}>
                        Mountains
                      </dt>
                      <dd className="text-slate-700">
                        {region.mountains.join(" · ")}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* footer cue */}
                <div className={`border-t border-slate-100 px-4 py-2.5 md:px-5 flex items-center justify-between gap-2 text-[11px] font-semibold transition-colors ${footerStrip}`}>
                  <span className="text-[10px] font-medium normal-case tracking-normal text-slate-500 truncate">
                    {isLive && h ? (
                      <>Updated <span className="tabular-nums text-slate-700">{formatAgo(h.observedAt, now)}</span></>
                    ) : (
                      <>Coming soon</>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    Open
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              No regions match &ldquo;<span className="text-slate-700 font-semibold">{search}</span>&rdquo; yet.
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              We&apos;re expanding fast - try Snowy Mountains, Yamanouchi or Iiyama.
            </p>
          </div>
        )}

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
