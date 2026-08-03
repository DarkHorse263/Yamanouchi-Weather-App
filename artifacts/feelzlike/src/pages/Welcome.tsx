import { motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { markLandingVisited, readLastTown, type LastTown } from "@/lib/favouriteRegion";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { useUserPrefs } from "@/components/auth/UserPrefsProvider";
import { ALERT_REGIONS } from "@/components/AlertSubscribeForm";
import logoWhite from "/branding/logo-white.png?url";
import { NearYou } from "@/components/home/NearYou";
import { CountryPicker } from "@/components/home/CountryPicker";
import { Favourites } from "@/components/home/Favourites";
import { DesktopHome } from "@/components/home/DesktopHome";
import { HomeRegionCard } from "@/components/home/HomeRegionCard";
import { CoverageMap } from "@/components/home/CoverageMap";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { websiteSchema, organizationSchema } from "@/lib/seo/jsonLd";
import { track } from "@/lib/analytics";

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

export default function Welcome() {
  const [lastTown, setLastTown] = useState<LastTown | null>(null);
  const { isAuthenticated } = useAuthAccount();
  const { homeRegionId } = useUserPrefs();

  // Signed-in members with a saved home region (/account) get a one-tap
  // shortcut straight to it. Anonymous visitors never see this.
  const homeRegion =
    isAuthenticated && homeRegionId
      ? (ALERT_REGIONS.find((r) => r.id === homeRegionId) ?? null)
      : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    markLandingVisited();
    setLastTown(readLastTown());
  }, []);

  return (
    <div
      className="relative isolate min-h-[100dvh] text-white antialiased bg-[#0055FF] pb-safe"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike · real conditions for mountain travel"
        description="In town and wondering what it's like in the mountains? feelzlike shows real conditions for mountain travel · snow, wind, roads, live cams · plus places to stay, eat and relax. Regions across Australia, Japan and New Zealand."
        path="/"
        jsonLd={[websiteSchema(), organizationSchema()]}
      />

      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* HEADER ─ short branded welcome ──────────────── */}
        <header className="flex flex-col items-center gap-2.5 px-6 pt-6 pb-4 text-center md:pt-9 md:pb-5">
          <motion.img
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src={logoWhite}
            alt="feelzlike"
            loading="eager"
            className="h-20 w-auto select-none md:h-24"
            draggable={false}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            real conditions for mountain travel
          </p>
          <Link
            href="/about"
            className="rounded-full border border-white/30 px-3.5 py-1 text-[12px] font-bold lowercase text-white/85 transition-colors hover:border-white/60 hover:text-white"
            data-testid="link-home-about"
          >
            about · how to use
          </Link>

          {/* Return shortcut · skips the pickers for users who've already
              settled on a base town. Only renders when a valid lastTown exists
              in localStorage (set on TownLayout mount). Hidden when it would
              duplicate the home-region chip above. */}
          {lastTown && lastTown.regionId !== homeRegion?.id && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-2"
            >
              <Link
                href={`/${lastTown.regionId}/${lastTown.townId}`}
                onClick={() => track("welcome_last_town_click", { category: "navigation" })}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 transition-colors hover:border-white/30 hover:bg-white/20"
              >
                <span aria-hidden="true" className="text-white/70">&larr;</span>
                <span className="text-sm font-medium text-white">
                  back to {lastTown.townName.toLowerCase()}
                </span>
              </Link>
            </motion.div>
          )}
        </header>

        {/* HOME REGION ─ front and centre for signed-in members */}
        <HomeRegionCard />

        {/* NEAR YOU ─ location-first: local conditions + nearest region ─ */}
        <NearYou />

        {/* CHOOSE A REGION ─ the picker continues below ─── */}
        <section className="px-4 pt-6 pb-6 md:px-6">
          <div className="mb-4 text-center">
            <h2
              className="text-xl font-medium leading-snug text-white md:text-2xl"
              style={balance}
            >
              i wonder what it feelzlike&nbsp;in&hellip;
            </h2>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              choose a region
            </p>
          </div>

          <CountryPicker />

          <p className="mt-6 text-center text-[12px] text-white/60" style={balance}>
            planning a trip?{" "}
            <Link
              href="/plan"
              onClick={() => track("welcome_plan_link_click", { category: "navigation" })}
              className="text-white font-semibold underline underline-offset-2 hover:text-white/80"
            >
              open the trip planner
            </Link>
          </p>
        </section>

        {/* WORLD COVERAGE MAP ─ interactive pin explorer ─ */}
        <CoverageMap />

        {/* FAVOURITES ─ saved towns for one-tap access (hidden if none) ─ */}
        <Favourites />

        {/* DESKTOP-ONLY ─ richer "about the app" content (hidden below lg so the
            phone/installed-PWA home stays lean). */}
        <DesktopHome />

        <HomeFooter />
      </div>
    </div>
  );
}
