import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";
import mainLogo from "@assets/feelzlike_transparent/feelzlike_colour_150426_1777272466909_transparent.png";

// Wikipedia REST API page slugs for sourcing real, attributable photos.
// We fetch the canonical Wikipedia "originalimage" thumbnail at runtime; if
// the request fails, the hard-coded `image` below is used as a fallback.
const WIKI_SOURCES: Record<string, { title: string; credit: string }> = {
  "snowy-mountains": { title: "Jindabyne", credit: "Wikipedia · Jindabyne" },
  yamanouchi: { title: "Yamanouchi,_Nagano", credit: "Wikipedia · Yamanouchi" },
  nagano: { title: "Hakuba,_Nagano", credit: "Wikipedia · Hakuba" },
};

const REGIONS = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    region: "New South Wales, Australia",
    baseTown: "Jindabyne",
    description:
      "Australia's alpine country — Jindabyne base town, with Thredbo, Perisher and Charlotte Pass nearby.",
    tags: ["Snow", "Hiking", "Lakes"],
    status: "live" as const,
    href: "/snowy-mountains/",
    image:
      "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1400&h=900&fit=crop&q=80",
    coords: "36.5° S · 148.3° E",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    region: "Nagano, Japan",
    baseTown: "Yamanouchi",
    description:
      "Snow monkeys, 21 ski areas, hot springs and stone-paved onsen streets. Gateway to Shiga Kogen.",
    tags: ["Snow", "Onsen", "Culture"],
    status: "live" as const,
    href: "/yamanouchi/",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1400&h=900&fit=crop&q=80",
    coords: "36.7° N · 138.4° E",
  },
  {
    id: "nagano",
    name: "Nagano Prefecture",
    region: "Honshu, Japan",
    baseTown: null,
    description:
      "Prefecture-wide coverage of the Japan Alps — Hakuba, Shiga Kogen, Nozawa and beyond.",
    tags: ["Snow", "Mountains", "Alps"],
    status: "soon" as const,
    href: "/nagano/",
    image:
      "https://images.unsplash.com/photo-1610824352934-c10d87b700cc?w=1400&h=900&fit=crop&q=80",
    coords: "36.6° N · 138.2° E",
  },
];

export default function Landing() {
  const [search, setSearch] = useState("");
  const [wikiImages, setWikiImages] = useState<Record<string, string>>({});

  // Fetch real Wikimedia photos for live regions on mount.
  useEffect(() => {
    const controller = new AbortController();
    Object.entries(WIKI_SOURCES).forEach(([id, { title }]) => {
      fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${title}?redirect=true`,
        { signal: controller.signal, headers: { Accept: "application/json" } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const url: string | undefined =
            data?.originalimage?.source ?? data?.thumbnail?.source;
          if (url) setWikiImages((prev) => ({ ...prev, [id]: url }));
        })
        .catch(() => {
          /* graceful fallback to hard-coded image */
        });
    });
    return () => controller.abort();
  }, []);

  const filtered = REGIONS.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="min-h-screen bg-[#f6f8fb] text-slate-900 antialiased"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ─── HERO ─────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=2400&h=1400&fit=crop&q=85"
            alt=""
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(246,248,251,0.35) 0%, rgba(246,248,251,0.55) 45%, rgba(246,248,251,0.98) 100%)",
            }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-16 md:pt-14 md:pb-24">
          {/* main brand logo with mountain — centred */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8 flex flex-col items-center text-center"
          >
            <img
              src={mainLogo}
              alt="feelzlike — resort town mountain weather"
              className="h-24 md:h-32 lg:h-36 w-auto select-none"
              draggable={false}
            />
            <span className="mt-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
              Resort Town Mountain Weather
            </span>
          </motion.div>

          {/* editorial headline — wordmark sits inline as the brand */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl tracking-[-0.02em] leading-[1.05] text-slate-900"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            <span className="block font-light text-slate-500">I wonder what it</span>
            <span className="mt-1 md:mt-2 flex flex-wrap items-baseline gap-x-3 md:gap-x-4">
              <img
                src={wordmark}
                alt="feelzlike"
                className="inline-block h-10 md:h-14 lg:h-16 w-auto translate-y-[0.18em] select-none"
                draggable={false}
              />
              <span className="font-light text-slate-500">in…</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm md:text-base text-slate-600 max-w-xl mt-5 md:mt-7 leading-relaxed"
          >
            Stop guessing what it feelzlike up there. Town-first mountain
            weather you can actually trust—plus the cams, roads, and lift
            status you need to make the call.
          </motion.p>

          {/* SEARCH */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-7 md:mt-9"
          >
            <div className="relative max-w-xl">
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
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── REGIONS ──────────────────────────────────── */}
      <main className="relative max-w-5xl mx-auto px-5 pb-20 md:pb-28">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              01 · Regions
            </p>
            <h2
              className="text-2xl md:text-3xl mt-1 text-slate-900 tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Choose a mountain town
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
            {filtered.length} {filtered.length === 1 ? "region" : "regions"}
          </span>
        </div>

        <div className="grid gap-4 md:gap-5">
          {filtered.map((region, i) => (
            <motion.a
              key={region.id}
              href={region.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.07 }}
              className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.14)] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* image */}
                <div className="relative w-full md:w-2/5 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100">
                  <img
                    src={wikiImages[region.id] ?? region.image}
                    alt={region.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== region.image) img.src = region.image;
                    }}
                  />
                  {/* small top-left scrim only so the chip reads */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none md:bg-gradient-to-r md:from-black/30 md:to-transparent md:h-full md:w-24" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-white/40 shadow-sm">
                    {region.status === "live" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Live
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Soon
                        </span>
                      </>
                    )}
                  </div>
                  {wikiImages[region.id] && WIKI_SOURCES[region.id] && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                      <span className="text-[8px] font-medium uppercase tracking-wider text-white/85">
                        {WIKI_SOURCES[region.id].credit}
                      </span>
                    </div>
                  )}
                </div>

                {/* content */}
                <div className="flex-1 p-5 md:p-7 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-1.5">
                      <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5 text-slate-500" />
                      {region.region}
                    </p>
                    <h3
                      className="text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {region.name}
                    </h3>
                    {region.baseTown && (
                      <p className="text-[11px] font-medium text-sky-700 mt-1.5">
                        Base town · {region.baseTown}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                      {region.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {region.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 group-hover:text-sky-900 group-hover:gap-2.5 transition-all whitespace-nowrap">
                      Open
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
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
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Built by mountain people, for mountain people.
              </p>
              <p className="text-sm text-slate-600 mt-3 max-w-lg leading-relaxed">
                Real-time conditions sourced direct from official services —
                national weather agencies, resort networks and transport
                authorities. We surface the consensus, not a single guess.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end text-[11px] text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-700">
                Sources
              </span>
              <span>Bureau of Meteorology · Australia</span>
              <span>Japan Meteorological Agency · Japan</span>
              <span>+ leading international forecast models</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
