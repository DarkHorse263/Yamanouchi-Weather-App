import { motion } from "framer-motion";
import { useEffect, type CSSProperties } from "react";
import { markLandingVisited } from "@/lib/favouriteRegion";
import logoWhite from "/branding/logo-white.png?url";
import { HomeFourWay } from "@/components/home/HomeFourWay";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { websiteSchema, organizationSchema } from "@/lib/seo/jsonLd";

const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

export default function Welcome() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    markLandingVisited();
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
        <header className="flex flex-col items-center gap-2.5 px-6 pb-7 pt-7 text-center md:pb-9 md:pt-10">
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
        </header>

        <HomeFourWay />

        <HomeFooter />
      </div>
    </div>
  );
}
