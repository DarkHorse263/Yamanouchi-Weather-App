import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";

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
  { id: "tasmania",               name: "Tasmania",                       country: "Australia", countryCode: "AU", region: "Tasmania",        status: "live", href: "/tasmania/",              baseTowns: ["Ben Lomond Base", "Launceston", "Hobart"],                    mountains: ["Ben Lomond"],                                                headlineLabel: "Launceston",   headline: null },
  { id: "yamanouchi",             name: "Yamanouchi Town",                country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/yamanouchi/",             baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],                          mountains: ["Shiga Kogen", "Ryuoo", "X-Jam", "Yomase"],                   headlineLabel: "Yudanaka",     headline: null },
  { id: "nozawa-onsen",           name: "Nozawa Onsen",                   country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/nozawa-onsen/",           baseTowns: ["Nozawa Onsen"],                                              mountains: ["Nozawa Onsen"],                                              headlineLabel: "Nozawa Onsen", headline: null },
  { id: "iiyama",                 name: "Iiyama",                         country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/iiyama/",                 baseTowns: ["Iiyama", "Madarao Kogen", "Togari Onsen", "Kijimadaira"],     mountains: ["Madarao", "Tangram", "Togari Onsen", "Kijima Snow Park"],     headlineLabel: "Iiyama",       headline: null },
  { id: "hakuba-valley",          name: "Hakuba Valley",                  country: "Japan",     countryCode: "JP", region: "Nagano",          status: "live", href: "/hakuba-valley/",          baseTowns: ["Hakuba", "Otari", "Omachi"],                                 mountains: ["Happo-One", "Hakuba 47", "Goryu", "Tsugaike", "Cortina"],     headlineLabel: "Hakuba",       headline: null },
  { id: "myoko",                  name: "Myoko",                          country: "Japan",     countryCode: "JP", region: "Niigata",         status: "live", href: "/myoko/",                  baseTowns: ["Akakura Onsen", "Ikenotaira Onsen", "Suginosawa", "Arai"],   mountains: ["Akakura Onsen", "Akakura Kanko", "Suginohara", "Lotte Arai"], headlineLabel: "Akakura Onsen", headline: null },
  { id: "niseko",                 name: "Niseko",                         country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/niseko/",                 baseTowns: ["Hirafu", "Kutchan", "Niseko Town"],                          mountains: ["Grand Hirafu", "Hanazono", "Niseko Village", "Annupuri", "Moiwa"], headlineLabel: "Hirafu", headline: null },
  { id: "furano",                 name: "Furano",                         country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/furano/",                 baseTowns: ["Furano", "Kitanomine"],                                      mountains: ["Furano Ski Resort", "Kamui Ski Links", "Tomamu"],            headlineLabel: "Furano",       headline: null },
  { id: "sapporo",                name: "Sapporo",                        country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/sapporo/",                baseTowns: ["Sapporo", "Jozankei"],                                       mountains: ["Sapporo Teine", "Sapporo Kokusai", "Sapporo Bankei"],        headlineLabel: "Sapporo",      headline: null },
  { id: "tomamu-sahoro",          name: "Tomamu & Sahoro",                country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/tomamu-sahoro/",          baseTowns: ["Tomamu", "Shimukappu"],                                      mountains: ["Hoshino Resorts Tomamu", "Sahoro Resort"],                   headlineLabel: "Tomamu",       headline: null },
  { id: "asahikawa",              name: "Asahikawa",                      country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/asahikawa/",              baseTowns: ["Asahikawa", "Higashikawa"],                                  mountains: ["Kamui Ski Links", "Asahidake"],                              headlineLabel: "Asahikawa",    headline: null },
  { id: "rusutsu-kiroro",         name: "Rusutsu & Kiroro",               country: "Japan",     countryCode: "JP", region: "Hokkaido",        status: "live", href: "/rusutsu-kiroro/",         baseTowns: ["Rusutsu", "Kiroro"],                                         mountains: ["Rusutsu Resort", "Kiroro"],                                  headlineLabel: "Rusutsu",      headline: null },
  { id: "zao-onsen",              name: "Zao Onsen",                      country: "Japan",     countryCode: "JP", region: "Yamagata",        status: "live", href: "/zao-onsen/",              baseTowns: ["Zao Onsen"],                                                 mountains: ["Zao Onsen Ski Resort"],                                      headlineLabel: "Zao Onsen",    headline: null },
  { id: "bandai",                 name: "Bandai",                         country: "Japan",     countryCode: "JP", region: "Fukushima",       status: "live", href: "/bandai/",                 baseTowns: ["Inawashiro", "Urabandai"],                                   mountains: ["Nekoma Mountain", "Grandeco"],                               headlineLabel: "Urabandai",    headline: null },
  { id: "daisen",                 name: "Daisen",                         country: "Japan",     countryCode: "JP", region: "Tottori",         status: "live", href: "/daisen/",                 baseTowns: ["Daisenji", "Yonago"],                                        mountains: ["Daisen White Resort"],                                       headlineLabel: "Daisenji",     headline: null },
  { id: "hakkoda-aomori-spring",  name: "Hakkoda & Aomori Spring",        country: "Japan",     countryCode: "JP", region: "Aomori",          status: "live", href: "/hakkoda-aomori-spring/",  baseTowns: ["Aomori", "Sukayu Onsen", "Ajigasawa"],                       mountains: ["Hakkoda", "Aomori Spring"],                                  headlineLabel: "Sukayu Onsen", headline: null },
  { id: "appi-shizukuishi",       name: "Appi & Shizukuishi",             country: "Japan",     countryCode: "JP", region: "Iwate",           status: "live", href: "/appi-shizukuishi/",       baseTowns: ["Appi Kogen", "Shizukuishi", "Morioka"],                      mountains: ["Appi Kogen", "Shizukuishi"],                                 headlineLabel: "Appi Kogen",   headline: null },
  { id: "minakami",               name: "Minakami",                       country: "Japan",     countryCode: "JP", region: "Gunma",           status: "live", href: "/minakami/",               baseTowns: ["Minakami"],                                                  mountains: ["Tanigawadake Tenjindaira", "Minakami Kogen", "Norn Minakami"], headlineLabel: "Minakami",   headline: null },
  { id: "kusatsu-manza",          name: "Kusatsu & Manza",                country: "Japan",     countryCode: "JP", region: "Gunma",           status: "live", href: "/kusatsu-manza/",          baseTowns: ["Kusatsu Onsen", "Manza Onsen"],                              mountains: ["Kusatsu Onsen", "Manza Onsen"],                              headlineLabel: "Kusatsu Onsen", headline: null },
  { id: "hachimantai",            name: "Hachimantai",                    country: "Japan",     countryCode: "JP", region: "Iwate",           status: "live", href: "/hachimantai/",            baseTowns: ["Hachimantai"],                                               mountains: ["Hachimantai Panorama", "Hachimantai Shimokura"],             headlineLabel: "Hachimantai",  headline: null },
  { id: "yuzawa",                 name: "Yuzawa",                         country: "Japan",     countryCode: "JP", region: "Niigata",         status: "live", href: "/yuzawa/",                 baseTowns: ["Echigo-Yuzawa", "Ishiuchi", "Mitsumata"],                    mountains: ["GALA Yuzawa", "Yuzawa Kogen", "Iwappara", "Ishiuchi Maruyama", "Kagura", "Naeba"], headlineLabel: "Echigo-Yuzawa", headline: null },
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
  "hakuba-valley":           "Hakuba",
  "myoko":                   "Akakura Onsen",
  "niseko":                  "Hirafu",
  "furano":                  "Furano",
  "sapporo":                 "Sapporo",
  "bandai":                  "Urabandai",
  "daisen":                  "Daisenji",
  "tomamu-sahoro":           "Tomamu",
  "asahikawa":               "Asahikawa",
  "rusutsu-kiroro":          "Rusutsu",
  "yuzawa":                  "Echigo-Yuzawa",
  "zao-onsen":               "Zao Onsen",
  "hakkoda-aomori-spring":   "Sukayu Onsen",
  "appi-shizukuishi":        "Appi Kogen",
  "minakami":                "Minakami",
  "kusatsu-manza":           "Kusatsu Onsen",
  "hachimantai":             "Hachimantai",
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

/**
 * Country / region picker body · the AU + JP + NZ country cards (each listing
 * its live regions with current temps) plus the trust line. Shared between the
 * standalone /countries page and the location-first landing, so the "choose a
 * region" step reads identically whether it opens on its own or continues
 * directly below the visitor's local conditions. Reads the same ["regions"]
 * query cache the landing already warms, so it never costs an extra request.
 */
export function CountryPicker() {
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
    // Season-first ordering: Australia + New Zealand (jun-oct season) before
    // Japan (dec-mar).
    { code: "AU" as const, name: "Australia",   flag: "\u{1F1E6}\u{1F1FA}", regions: regions.filter((r) => r.countryCode === "AU") },
    { code: "NZ" as const, name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}", regions: regions.filter((r) => r.countryCode === "NZ") },
    { code: "JP" as const, name: "Japan",       flag: "\u{1F1EF}\u{1F1F5}", regions: regions.filter((r) => r.countryCode === "JP") },
  ] satisfies Country[]).filter((c) => c.regions.length > 0);

  return (
    <>
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
    </>
  );
}
