import { motion } from "framer-motion";
import { Radar, CableCar, Heart, Smartphone, ArrowRight } from "lucide-react";
import { COUNTRY_META, regionsForCountry, type CountryCode } from "@/regions";
import { track } from "@/lib/analytics";

/**
 * Desktop-only home content · hidden below the `lg` breakpoint so the phone
 * and the installed PWA keep their lean, location-first home (hero · near you
 * · favourites). On a big screen there's room to actually explain what
 * feelzlike is, so visitors landing on a laptop get the fuller story:
 *   1. what feelzlike is + how it works (with where the data comes from)
 *   2. the places we cover · au · jp · nz, each a jump-in link
 *   3. the key features
 *   4. an "add it to your phone" nudge
 *
 * Brand voice throughout: lowercase, middot separators, plain hyphens (no
 * em/en dashes), no emoji (the country flags mirror the existing /au /jp /nz
 * country pages).
 */

// Season-first ordering: southern-hemisphere countries (in season jun-oct)
// come before Japan (dec-mar).
const COUNTRIES: CountryCode[] = ["AU", "NZ", "JP", "CA"];

const eyebrow = "text-[11px] font-bold lowercase tracking-wider text-white/70";
const h2 =
  "mt-2 text-3xl md:text-4xl font-black tracking-tight text-white lowercase";

const STEPS: Array<{ n: string; text: string }> = [
  { n: "1", text: "pick a country and a region" },
  { n: "2", text: "see real conditions, not just a forecast" },
  { n: "3", text: "plan the stay, the food and the drive up" },
];

const FEATURES: Array<{
  icon: typeof Radar;
  title: string;
  body: string;
  href?: string;
  event?: string;
}> = [
  {
    icon: Radar,
    title: "live radar",
    body: "rain, snow and satellite layers you can scrub back and forward through",
  },
  {
    icon: CableCar,
    title: "lift status",
    body: "which lifts are likely running, read from the season, snow depth and live feeds",
  },
  {
    icon: Heart,
    title: "saved favourites",
    body: "pin the towns you watch for one-tap conditions next time",
  },
];

export function DesktopHome() {
  return (
    <div className="hidden lg:block">
      {/* WHAT IS FEELZLIKE + HOW IT WORKS ─────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="border-t border-white/20 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>
          <a href="/about" className="hover:text-white transition-colors">
            about feelzlike · how to use →
          </a>
        </p>
        <h2 className={h2}>real conditions for mountain travel</h2>
        <p className="mt-3 max-w-2xl text-[15px] font-bold leading-relaxed text-white/80 lowercase">
          you&rsquo;re in town, wondering what it&rsquo;s actually like up the
          mountain. feelzlike pulls together what&rsquo;s happening right now -
          snow, wind, temperature, roads and live cams - so you can make the
          call before you make the drive.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-[2rem] border-0 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F5FF] text-lg font-black text-[#0055FF]">
                {s.n}
              </span>
              <p className="mt-5 text-[15px] font-bold leading-relaxed text-slate-500 lowercase">
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-[12.5px] font-bold leading-relaxed text-white/60 lowercase">
          the numbers come straight from official weather services and live
          observation networks in each country - the bureau of meteorology in
          australia, the japan meteorological agency in japan, and more. every
          region lists its own sources, so you can always see where a reading
          came from.
        </p>
      </motion.section>

      {/* PLACES WE COVER ──────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="border-t border-white/20 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>where we cover</p>
        <h2 className={h2}>four countries, one app</h2>

        <div className="mt-7 grid grid-cols-2 gap-5 xl:grid-cols-4">
          {COUNTRIES.map((code) => {
            const meta = COUNTRY_META[code];
            const regionNames = regionsForCountry(code).map((r) =>
              r.name.toLowerCase(),
            );
            return (
              <a
                key={code}
                href={`/${code.toLowerCase()}`}
                onClick={() =>
                  track("welcome_desktop_country_click", {
                    category: "navigation",
                    data: { code },
                  })
                }
                className="group flex flex-col overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,30,120,0.5)]"
              >
                <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700" />
                <div className="flex flex-1 flex-col px-6 py-6">
                  <span
                    aria-hidden="true"
                    className="text-4xl leading-none"
                    style={{
                      fontFamily:
                        '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                    }}
                  >
                    {meta.flag}
                  </span>
                  <h3 className="mt-4 text-2xl font-black lowercase tracking-tight text-[#0F172A] group-hover:text-[#0055FF]">
                    {meta.name.toLowerCase()}
                  </h3>
                  <p className="mt-2 flex-1 text-[14px] font-bold leading-relaxed text-slate-500 lowercase">
                    {regionNames.join(" · ")}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-black lowercase text-[#0055FF]">
                    explore
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </motion.section>

      {/* KEY FEATURES ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="border-t border-slate-200 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>what&rsquo;s inside</p>
        <h2 className={h2}>everything for the trip up</h2>

        <div className="mt-7 grid grid-cols-2 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const inner = (
              <>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F5FF] text-[#0055FF]">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-black lowercase tracking-tight text-[#0F172A]">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] font-bold leading-relaxed text-slate-500 lowercase">
                    {f.body}
                  </p>
                </div>
              </>
            );
            const base =
              "flex items-start gap-5 rounded-[2rem] border-0 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]";
            return f.href ? (
              <a
                key={f.title}
                href={f.href}
                onClick={() =>
                  f.event &&
                  track(f.event, { category: "navigation" })
                }
                className={`${base} group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,30,120,0.5)]`}
              >
                {inner}
              </a>
            ) : (
              <div key={f.title} className={base}>
                {inner}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ADD TO YOUR PHONE ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-6 pb-12"
      >
        <div className="flex items-center gap-8 rounded-[2.5rem] bg-[#F0F5FF] border-0 p-8 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]">
          <span className="hidden shrink-0 items-center justify-center rounded-3xl bg-white p-5 shadow-sm sm:inline-flex">
            <Smartphone className="h-10 w-10 text-[#EC008C]" />
          </span>
          <div>
            <p className="text-[11px] font-bold lowercase tracking-wider text-[#0055FF]">
              take it with you
            </p>
            <h2 className="mt-2 text-3xl font-black lowercase tracking-tight text-[#0F172A]">
              feelzlike is built for your phone
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] font-bold leading-relaxed text-slate-500 lowercase">
              open feelzlike on your phone&rsquo;s browser and tap &lsquo;add to
              home screen&rsquo; - it opens like an app, loads instantly and
              keeps working even when the signal drops on the mountain.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
