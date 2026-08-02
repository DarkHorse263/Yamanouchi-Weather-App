import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type CSSProperties } from "react";
import logoFullColour from "/branding/logo-full-colour.png?url";
import { CountryPicker } from "@/components/home/CountryPicker";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PlaceSearch } from "@/components/home/PlaceSearch";
import { PageMeta } from "@/lib/seo/PageMeta";
import { breadcrumbSchema } from "@/lib/seo/jsonLd";

const balance: CSSProperties = { textWrap: "balance" as CSSProperties["textWrap"] };
const pretty:  CSSProperties = { textWrap: "pretty"  as CSSProperties["textWrap"] };

// ─── component ─────────────────────────────────────
export default function Countries() {
  return (
    <div
      className="relative isolate min-h-screen text-slate-900 antialiased bg-white"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="feelzlike · pick a country"
        description="pick a country to see real conditions for resort towns across australia, japan, new zealand and canada."
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

        {/* SEARCH ─────────────────────────────────────── */}
        {/* z-20 keeps the dropdown above the country cards below. */}
        <section className="relative z-20 px-4 pt-1 md:px-6">
          <div className="mx-auto w-full max-w-md">
            <PlaceSearch
              source="countries"
              placeholder="search a town · resort · region"
            />
          </div>
        </section>

        {/* COUNTRY CARDS ──────────────────────────────── */}
        <section className="px-4 pt-4 pb-6 md:px-6">
          <CountryPicker />
        </section>

        <HomeFooter />
      </div>
    </div>
  );
}
