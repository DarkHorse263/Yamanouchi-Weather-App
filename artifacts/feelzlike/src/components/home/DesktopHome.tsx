import { motion } from "framer-motion";
import { Radar, CableCar, Newspaper, Heart, Smartphone, ArrowRight } from "lucide-react";
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

const COUNTRIES: CountryCode[] = ["AU", "JP", "NZ"];

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80";
const h2 =
  "mt-2 text-2xl md:text-3xl font-bold tracking-tight text-blue-900";

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
    icon: Newspaper,
    title: "mountain news",
    body: "the latest from across the mountains, gathered into one feed",
    href: "/news",
    event: "welcome_desktop_news_click",
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
        className="border-t border-slate-100 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>about feelzlike</p>
        <h2 className={h2}>real conditions for mountain travel</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          you&rsquo;re in town, wondering what it&rsquo;s actually like up the
          mountain. feelzlike pulls together what&rsquo;s happening right now -
          snow, wind, temperature, roads and live cams - so you can make the
          call before you make the drive.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700 ring-1 ring-sky-200">
                {s.n}
              </span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
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
        className="border-t border-slate-100 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>where we cover</p>
        <h2 className={h2}>three countries, one app</h2>

        <div className="mt-7 grid grid-cols-3 gap-5">
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
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-[0_12px_28px_-12px_rgba(56,128,210,0.25)]"
              >
                <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700" />
                <div className="flex flex-1 flex-col px-5 py-5">
                  <span
                    aria-hidden="true"
                    className="text-3xl leading-none"
                    style={{
                      fontFamily:
                        '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                    }}
                  >
                    {meta.flag}
                  </span>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-blue-900 group-hover:text-sky-700">
                    {meta.name.toLowerCase()}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-600">
                    {regionNames.join(" · ")}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-sky-700 group-hover:text-blue-700">
                    explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
        className="border-t border-slate-100 px-6 pt-12 pb-10"
      >
        <p className={eyebrow}>what&rsquo;s inside</p>
        <h2 className={h2}>everything for the trip up</h2>

        <div className="mt-7 grid grid-cols-2 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const inner = (
              <>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-blue-900">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                    {f.body}
                  </p>
                </div>
              </>
            );
            const base =
              "flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]";
            return f.href ? (
              <a
                key={f.title}
                href={f.href}
                onClick={() =>
                  f.event &&
                  track(f.event, { category: "navigation" })
                }
                className={`${base} group transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-[0_12px_28px_-12px_rgba(56,128,210,0.25)]`}
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
        <div className="flex items-center gap-6 rounded-3xl bg-gradient-to-br from-sky-600 to-blue-700 p-8 text-white shadow-[0_24px_60px_-24px_rgba(2,6,23,0.5)]">
          <span className="hidden shrink-0 items-center justify-center rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 sm:inline-flex">
            <Smartphone className="h-8 w-8 text-sky-100" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              take it with you
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight">
              feelzlike is built for your phone
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-sky-50/90">
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
