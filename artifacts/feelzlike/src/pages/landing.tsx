import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  readFavouriteRegion,
  writeFavouriteRegion,
  markLandingVisited,
  isKnownRegionId,
} from "@/lib/favouriteRegion";
import logoFullColour from "/branding/logo-full-colour.png?url";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { websiteSchema, organizationSchema } from "@/lib/seo/jsonLd";

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

// Used when /api/regions is loading/failing - keep this in sync with the
// live region set in `regions/index.ts` and `api-server/src/routes/regions.ts`.
const FALLBACK_REGIONS: Region[] = [
  { id: "snowy-mountains", name: "Snowy Mountains", country: "Australia", countryCode: "AU", region: "New South Wales", status: "live", href: "/snowy-mountains/", baseTowns: ["Jindabyne", "Berridale", "Cooma"], mountains: ["Perisher", "Thredbo", "Selwyn", "Charlotte's Pass"], headlineLabel: "Jindabyne", headline: null },
  { id: "victorias-high-country", name: "Victoria\u2019s High Country", country: "Australia", countryCode: "AU", region: "Victoria", status: "live", href: "/victorias-high-country/", baseTowns: ["Mount Beauty", "Bright", "Mansfield", "Harrietville", "Dinner Plain"], mountains: ["Mt Buller", "Mt Stirling", "Falls Creek", "Mt Hotham"], headlineLabel: "Mount Beauty", headline: null },
  { id: "yamanouchi", name: "Yamanouchi", country: "Japan", countryCode: "JP", region: "Nagano", status: "live", href: "/yamanouchi/", baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"], mountains: ["Shiga Kogen", "Ryuoo", "X-Jam", "Yomase"], headlineLabel: "Yudanaka", headline: null },
];

const TOWN_SLIDES = [
  { src: "/towns/jindabyne.jpg",  town: "Jindabyne", region: "Snowy Mountains",            country: "NSW, Australia",   credit: "Image courtesy Destination NSW \u00a9" },
  { src: "/towns/mount-beauty.jpg", town: "Mount Beauty", region: "Victoria\u2019s High Country", country: "VIC, Australia" },
  { src: "/towns/yudanaka-valley.jpg", town: "Yudanaka", region: "Yamanouchi",              country: "Nagano, Japan"   },
  { src: "/towns/nozawa-onsen-village.jpg", town: "Nozawa Onsen", region: "Nozawa Onsen",   country: "Nagano, Japan",    credit: "Image courtesy Go Nagano (Nagano Prefecture Tourism)" },
] as const;

function formatAgo(iso: string | undefined, now: number, fallback = "loading\u2026"): string {
  if (!iso) return fallback;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return fallback;
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

// AU = southern hemisphere (snow Jun-Sep), JP = northern (snow Dec-Mar).
function seasonForCountry(code: "AU" | "JP"): "winter" | "green" {
  const month = new Date().getMonth() + 1;
  if (code === "AU") return month >= 6 && month <= 9 ? "winter" : "green";
  return month >= 12 || month <= 3 ? "winter" : "green";
}

// Map a region to the base town we actually surface on the home page. This
// is the town a visitor most likely stays in for that region.
const PRIMARY_TOWN: Record<string, string> = {
  "snowy-mountains":         "Jindabyne",
  "victorias-high-country":  "Mount Beauty",
  "yamanouchi":              "Yudanaka",
};

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

// ─── component ─────────────────────────────────────

export default function Landing() {
  const [favourite, setFavourite] = useState<string | null>(() => readFavouriteRegion());
  const [activeSlide, setActiveSlide] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fav = readFavouriteRegion();
    if (fav && !isKnownRegionId(fav)) {
      writeFavouriteRegion(null);
      setFavourite(null);
    }
    markLandingVisited();
  }, []);
  void favourite;

  useEffect(() => {
    const id = window.setInterval(() => setActiveSlide((i) => (i + 1) % TOWN_SLIDES.length), 5000);
    return () => window.clearInterval(id);
  }, []);

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
  const generatedAt = data?.generatedAt;
  const liveCount = regions.filter((r) => r.status === "live").length;

  type Country = { code: "AU" | "JP"; name: string; flag: string; regions: Region[] };
  const COUNTRIES: Country[] = ([
    { code: "AU" as const, name: "Australia", flag: "\u{1F1E6}\u{1F1FA}", regions: regions.filter((r) => r.countryCode === "AU") },
    { code: "JP" as const, name: "Japan",     flag: "\u{1F1EF}\u{1F1F5}", regions: regions.filter((r) => r.countryCode === "JP") },
  ] satisfies Country[]).filter((c) => c.regions.length > 0);

  const current = TOWN_SLIDES[activeSlide];

  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike \u00b7 weather for resort towns"
        description="Staying in a resort town? See live conditions across the Snowy Mountains, Victoria's High Country and Yamanouchi so you know where to go each day. Towns first, mountains second."
        path="/"
        jsonLd={[websiteSchema(), organizationSchema()]}
      />

      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* HEADER ─────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center md:pt-12 md:pb-8">
          <motion.img
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src={logoFullColour}
            alt="feelzlike"
            loading="eager"
            className="h-24 w-auto select-none md:h-32"
            draggable={false}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Weather for resort towns
          </p>
        </header>

        {/* HERO SLIDESHOW ─────────────────────────────── */}
        <section className="relative mx-4 overflow-hidden rounded-2xl bg-slate-100 md:mx-6">
          <div className="relative aspect-[4/3] w-full md:aspect-[16/9]">
            {TOWN_SLIDES.map((s, i) => (
              <img
                key={s.src}
                src={s.src}
                alt={`${s.town}, ${s.country}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
                style={{ opacity: i === activeSlide ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  {current.region}
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-white drop-shadow-sm md:text-3xl">
                  {current.town}
                </h2>
                <p className="mt-0.5 text-xs text-white/70">{current.country}</p>
                {"credit" in current && current.credit && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    {current.credit}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pb-1">
                {TOWN_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className="h-1.5 rounded-full bg-white transition-all duration-500"
                    style={{ width: i === activeSlide ? 22 : 6, opacity: i === activeSlide ? 1 : 0.55 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CUE ────────────────────────────────────────── */}
        <div className="px-6 pt-7 pb-2 text-center md:pt-10">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-medium leading-snug text-slate-900 md:text-[28px]"
            style={balance}
          >
            I wonder what it feelzlike&nbsp;in&hellip;
          </motion.h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500" style={balance}>
            Pick a country, pick a town. Live conditions for every resort town we cover, so you can decide where to head each day.
          </p>
        </div>

        {/* COUNTRY CARDS ──────────────────────────────── */}
        <section className="px-4 pt-5 pb-8 md:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {COUNTRIES.map((country, idx) => {
              const season = seasonForCountry(country.code);
              const isWinter = season === "winter";
              const ring = isWinter ? "ring-sky-400/70" : "ring-emerald-400/70";
              const pillText = isWinter ? "text-sky-700" : "text-emerald-700";
              const dot = isWinter ? "bg-sky-500" : "bg-emerald-500";
              const seasonLabel = isWinter ? "Snow season" : "Green season";
              const liveInCountry = country.regions.filter((r) => r.status === "live").length;

              return (
                <motion.a
                  key={country.code}
                  href={`/${country.code.toLowerCase()}/`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + idx * 0.06 }}
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
                      return (
                        <li key={r.id} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-slate-700">
                            <span className="font-semibold text-slate-900">{r.name}</span>
                            <span className="text-slate-400"> &middot; </span>
                            {town}
                          </span>
                          <span className="shrink-0 text-base font-bold tabular-nums text-sky-900">
                            {typeof temp === "number" ? `${Math.round(temp)}\u00B0C` : "\u2013"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <span className="mt-4 inline-flex items-center text-xs font-semibold tracking-wide text-sky-700 group-hover:text-sky-900">
                    Explore {country.name}
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </motion.a>
              );
            })}
          </div>

          {/* TRUST LINE ─────────────────────────────── */}
          <p
            className="mx-auto mt-8 max-w-md text-center text-[11px] leading-relaxed text-slate-400"
            style={balance}
          >
            {liveCount} {liveCount === 1 ? "region" : "regions"} live &middot;{" "}
            <span className="tabular-nums">{data?.sourceCount ?? 7}</span> official sources &middot;{" "}
            <span className="tabular-nums">{data?.refreshIntervalMin ?? 15}</span>&nbsp;min refresh
            &middot; updated <span className="tabular-nums">{formatAgo(generatedAt, now)}</span>
          </p>
        </section>

        <HomeFooter />
      </div>
    </div>
  );
}
