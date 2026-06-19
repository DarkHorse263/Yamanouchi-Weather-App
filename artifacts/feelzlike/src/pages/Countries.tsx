import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import logoFullColour from "/branding/logo-full-colour.png?url";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";

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
  countryCode: "AU" | "JP" | "NZ";
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

// ─── fallback (matches landing) ────────────────────
const FALLBACK_REGIONS: Region[] = [
  { id: "snowy-mountains",        name: "Snowy Mountains",                country: "Australia", countryCode: "AU", region: "New South Wales", status: "live", href: "/snowy-mountains/",        baseTowns: ["Jindabyne", "Berridale", "Cooma"],                            mountains: ["Perisher", "Thredbo", "Selwyn", "Charlotte's Pass"],          headlineLabel: "Jindabyne",     headline: null },
  { id: "victorias-high-country", name: "Victoria\u2019s High Country",   country: "Australia", countryCode: "AU", region: "Victoria",        status: "live", href: "/victorias-high-country/", baseTowns: ["Mount Beauty", "Bright", "Mansfield", "Harrietville", "Dinner Plain"], mountains: ["Mt Buller", "Mt Stirling", "Falls Creek", "Mt Hotham"], headlineLabel: "Mount Beauty", headline: null },
  { id: "yamanouchi",             name: "Yamanouchi",                     country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/yamanouchi/",             baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],                          mountains: ["Shiga Kogen", "Ryuoo", "X-Jam", "Yomase"],                   headlineLabel: "Yudanaka",     headline: null },
  { id: "queenstown",             name: "Queenstown",                     country: "New Zealand", countryCode: "NZ", region: "Otago",          status: "live", href: "/queenstown/",            baseTowns: ["Queenstown"],                                                mountains: ["Coronet Peak", "The Remarkables"],                          headlineLabel: "Queenstown",   headline: null },
  { id: "wanaka",                 name: "Wanaka",                         country: "New Zealand", countryCode: "NZ", region: "Otago",          status: "live", href: "/wanaka/",                baseTowns: ["Wanaka"],                                                    mountains: ["Cardrona", "Treble Cone"],                                  headlineLabel: "Wanaka",       headline: null },
  { id: "mt-hutt",                name: "Mt Hutt",                        country: "New Zealand", countryCode: "NZ", region: "Canterbury",     status: "live", href: "/mt-hutt/",               baseTowns: ["Methven"],                                                   mountains: ["Mt Hutt"],                                                  headlineLabel: "Methven",      headline: null },
  { id: "ruapehu",                name: "Ruapehu",                        country: "New Zealand", countryCode: "NZ", region: "Central Plateau", status: "live", href: "/ruapehu/",               baseTowns: ["Ohakune"],                                                   mountains: ["Whakapapa", "Turoa"],                                       headlineLabel: "Ohakune",      headline: null },
];

// Map a region to the base town we surface in the country card. This is
// the town a visitor most likely stays in for that region.
const PRIMARY_TOWN: Record<string, string> = {
  "snowy-mountains":         "Jindabyne",
  "victorias-high-country":  "Mount Beauty",
  "yamanouchi":              "Yudanaka",
  "nozawa-onsen":            "Nozawa Onsen",
  "iiyama":                  "Iiyama",
  "queenstown":              "Queenstown",
  "wanaka":                  "Wanaka",
  "mt-hutt":                 "Methven",
  "ruapehu":                 "Ohakune",
};

// AU + NZ = southern hemisphere (snow Jun-Sep), JP = northern (snow Dec-Mar).
function seasonForCountry(code: "AU" | "JP" | "NZ"): "winter" | "green" {
  const month = new Date().getMonth() + 1;
  if (code === "AU" || code === "NZ") return month >= 6 && month <= 9 ? "winter" : "green";
  return month >= 12 || month <= 3 ? "winter" : "green";
}

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

// ─── component ─────────────────────────────────────
export default function Countries() {
  const [now, setNow] = useState(() => Date.now());
  void now;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { data } = useQuery<RegionsResponse>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("Failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const regions = data?.regions ?? FALLBACK_REGIONS;
  const liveCount = regions.filter((r) => r.status === "live").length;

  type Country = { code: "AU" | "JP" | "NZ"; name: string; flag: string; regions: Region[] };
  const COUNTRIES: Country[] = ([
    { code: "AU" as const, name: "Australia",   flag: "\u{1F1E6}\u{1F1FA}", regions: regions.filter((r) => r.countryCode === "AU") },
    { code: "JP" as const, name: "Japan",       flag: "\u{1F1EF}\u{1F1F5}", regions: regions.filter((r) => r.countryCode === "JP") },
    { code: "NZ" as const, name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}", regions: regions.filter((r) => r.countryCode === "NZ") },
  ] satisfies Country[]).filter((c) => c.regions.length > 0);

  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike · pick a country"
        description="pick a country to see real conditions for resort towns across australia and japan."
        path="/countries"
        jsonLd={[
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: "countries", url: "https://feelzlike.com/countries" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* HEADER ─────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-3 px-6 pt-5 pb-4 text-center md:pt-8 md:pb-5">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            home
          </a>
          <motion.img
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src={logoFullColour}
            alt="feelzlike"
            loading="eager"
            className="mt-2 h-16 w-auto select-none md:h-20"
            draggable={false}
          />
          <h1 className="mt-2 text-xl font-medium leading-snug text-slate-900 md:text-2xl" style={balance}>
            i wonder what it feelzlike&nbsp;in&hellip;
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80">
            pick a country
          </p>
        </header>

        {/* COUNTRY CARDS ──────────────────────────────── */}
        <section className="px-4 pt-4 pb-6 md:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {COUNTRIES.map((country, idx) => {
              const season = seasonForCountry(country.code);
              const isWinter = season === "winter";
              const ring = isWinter ? "ring-sky-400/70" : "ring-emerald-400/70";
              const pillText = isWinter ? "text-sky-700" : "text-emerald-700";
              const dot = isWinter ? "bg-sky-500" : "bg-emerald-500";
              const seasonLabel = isWinter ? "snow season" : "green season";
              const liveInCountry = country.regions.filter((r) => r.status === "live").length;

              return (
                <motion.a
                  key={country.code}
                  href={`/${country.code.toLowerCase()}/`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                  className={`group block rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(15,23,42,0.08)] ring-2 ${ring} transition-transform hover:-translate-y-0.5`}
                >
                  <header className="flex items-center gap-3">
                    <span aria-hidden className="text-3xl leading-none">{country.flag}</span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold leading-tight tracking-tight text-sky-900">
                        {country.name}
                      </h3>
                      <p className={`mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${pillText}`}>
                        <span className="relative inline-flex h-1.5 w-1.5">
                          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`} />
                          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
                        </span>
                        {seasonLabel} &middot; {liveInCountry} {liveInCountry === 1 ? "region live" : "regions live"}
                      </p>
                    </div>
                  </header>

                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
                    {country.regions.map((r) => {
                      const town = PRIMARY_TOWN[r.id] ?? r.headlineLabel ?? r.baseTowns[0];
                      const temp = r.headline?.tempC;
                      // Drop the trailing town if it duplicates the region
                      // name (e.g. "Nozawa Onsen · Nozawa Onsen").
                      const showTown = town && town.toLowerCase() !== r.name.toLowerCase();
                      return (
                        <li key={r.id} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-slate-700">
                            <span className="font-semibold text-slate-900">{r.name}</span>
                            {showTown && (
                              <>
                                <span className="text-slate-400"> &middot; </span>
                                {town}
                              </>
                            )}
                          </span>
                          <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                            {typeof temp === "number" ? `${Math.round(temp)}\u00B0C` : "\u2013"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <span className="mt-4 inline-flex items-center text-xs font-semibold tracking-wide text-sky-700 group-hover:text-sky-900">
                    explore {country.name.toLowerCase()}
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </motion.a>
              );
            })}
          </div>

          {/* TRUST LINE */}
          <p
            className="mx-auto mt-6 max-w-md text-center text-[11px] leading-relaxed text-slate-400"
            style={balance}
          >
            {liveCount} {liveCount === 1 ? "region" : "regions"} live &middot;{" "}
            <span className="tabular-nums">{data?.sourceCount ?? 7}</span> official sources &middot;{" "}
            <span className="tabular-nums">{data?.refreshIntervalMin ?? 15}</span>&nbsp;min refresh
          </p>
        </section>

        <HomeFooter />
      </div>
    </div>
  );
}
