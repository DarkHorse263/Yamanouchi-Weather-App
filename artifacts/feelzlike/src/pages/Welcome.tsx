import { motion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { markLandingVisited, readLastTown, type LastTown } from "@/lib/favouriteRegion";
import logoFullColour from "/branding/logo-full-colour.png?url";
import { NearYou } from "@/components/home/NearYou";
import { Favourites } from "@/components/home/Favourites";
import { MountainNews } from "@/components/home/MountainNews";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { websiteSchema, organizationSchema } from "@/lib/seo/jsonLd";
import { track } from "@/lib/analytics";

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

// Tiny drifting snowflakes positioned around the CTA logo-mark. Positions
// are jittered so it never looks like a grid. Pure presentational.
const FLAKES: Array<{ x: number; y: number; size: number; delay: number; duration: number }> = [
  { x: -54, y: -28, size: 8,  delay: 0,    duration: 5.5 },
  { x:  46, y: -36, size: 6,  delay: 0.8,  duration: 6.2 },
  { x: -60, y:  18, size: 5,  delay: 1.6,  duration: 5.0 },
  { x:  58, y:  22, size: 7,  delay: 2.2,  duration: 6.8 },
  { x: -22, y: -52, size: 4,  delay: 1.0,  duration: 5.4 },
  { x:  26, y:  48, size: 5,  delay: 2.6,  duration: 5.9 },
];

export default function Welcome() {
  const markRef = useRef<HTMLImageElement | null>(null);
  const [lastTown, setLastTown] = useState<LastTown | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    markLandingVisited();
    setLastTown(readLastTown());
  }, []);

  // If the mark-only asset isn't present yet, fall back to the full colour
  // logo so the CTA still renders. Drop /branding/logo-mark.png in when
  // ready and this swaps automatically on next load.
  const handleMarkError = () => {
    if (markRef.current && !markRef.current.dataset.fallback) {
      markRef.current.dataset.fallback = "1";
      markRef.current.src = logoFullColour;
    }
  };

  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike \u00b7 real conditions for mountain travel"
        description="In town and wondering what it's like in the mountains? feelzlike shows real conditions for mountain travel \u00b7 snow, wind, roads, live cams \u00b7 plus places to stay, eat and relax. Regions across Australia and Japan."
        path="/"
        jsonLd={[websiteSchema(), organizationSchema()]}
      />

      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* HEADER ─────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-3 px-6 pt-6 pb-5 text-center md:pt-9 md:pb-6">
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
            real conditions for mountain travel
          </p>
        </header>

        {/* NEAR YOU ─ location-first: local conditions + nearest region ─ */}
        <NearYou />

        {/* FAVOURITES ─ saved towns for one-tap access (hidden if none) ─ */}
        <Favourites />

        {/* MOUNTAIN NEWS ─ curated feed + live resort updates, scoped to the
            user's saved/visited regions when known ─ */}
        <MountainNews />

        {/* CTA ────────────────────────────────────────── */}
        <section className="px-6 pt-6 pb-9 text-center md:pt-9 md:pb-16">
          {/* Return shortcut · skips the country/region pickers for users
              who've already settled on a base town. Only renders when a
              valid lastTown exists in localStorage (set on TownLayout mount). */}
          {lastTown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5 md:mb-7"
            >
              <Link
                href={`/${lastTown.regionId}/${lastTown.townId}`}
                onClick={() => track("welcome_last_town_click", { category: "navigation" })}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/70 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100"
              >
                <span aria-hidden="true">&larr;</span>
                <span className="normal-case tracking-normal text-sm font-medium text-sky-800">
                  back to {lastTown.townName.toLowerCase()}
                </span>
              </Link>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-medium leading-snug text-slate-900 md:text-[28px]"
            style={balance}
          >
            i wonder what it feelzlike&nbsp;in&hellip;
          </motion.h1>

          <div className="relative mx-auto mt-4 flex h-32 w-32 items-center justify-center md:mt-5 md:h-40 md:w-40">
            {/* drifting snowflakes around the mark */}
            {FLAKES.map((f, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="pointer-events-none absolute select-none text-sky-400"
                style={{
                  left: "50%",
                  top: "50%",
                  fontSize: f.size + 6,
                  lineHeight: 1,
                }}
                initial={{ x: f.x, y: f.y - 6, opacity: 0 }}
                animate={{
                  x: [f.x - 4, f.x + 4, f.x - 4],
                  y: [f.y - 6, f.y + 10, f.y - 6],
                  opacity: [0, 0.85, 0],
                }}
                transition={{
                  duration: f.duration,
                  delay: f.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                &#10052;
              </motion.span>
            ))}

            <Link
              href="/countries"
              aria-label="pick a country"
              onClick={() => track("welcome_cta_click", { category: "navigation" })}
              className="group relative inline-flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_10px_40px_rgb(56,128,210,0.25)] ring-2 ring-sky-300/70 transition-all hover:ring-sky-400 hover:shadow-[0_14px_48px_rgb(56,128,210,0.32)] md:h-36 md:w-36"
            >
              <picture>
                {/* Modern browsers get the tiny 11KB webp; png is the safety
                    net + onError fallback to the full logo if the mark file
                    is ever missing. */}
                <source srcSet="/branding/logo-mark.webp" type="image/webp" />
                <motion.img
                  ref={markRef}
                  src="/branding/logo-mark.png"
                  alt="feelzlike"
                  onError={handleMarkError}
                  draggable={false}
                  width={256}
                  height={256}
                  fetchPriority="high"
                  decoding="async"
                  className="h-24 w-24 select-none object-contain md:h-32 md:w-32"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </picture>
              <span className="sr-only">pick a country</span>
            </Link>
          </div>

          <p className="mx-auto mt-5 max-w-sm text-[12px] leading-relaxed text-slate-500" style={balance}>
            tap to pick a country
          </p>
        </section>

        <HomeFooter />
      </div>
    </div>
  );
}
