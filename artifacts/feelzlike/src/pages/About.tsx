import { motion } from "framer-motion";
import { Link } from "wouter";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  Camera,
  CloudSnow,
  Map,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import logoWhite from "/branding/logo-white.png?url";
import { PageMeta } from "@/lib/seo/PageMeta";

const pretty: CSSProperties = { textWrap: "pretty" as CSSProperties["textWrap"] };

const card =
  "rounded-[2rem] border-0 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]";
const eyebrow =
  "text-[11px] font-bold lowercase tracking-wider text-white/70";

const HOW_TO: Array<{ icon: typeof MapPin; title: string; text: string }> = [
  {
    icon: MapPin,
    title: "start where you are",
    text: "on the home page, tap 'show my local conditions' or search any town or city. if you're near a covered region we'll suggest it automatically.",
  },
  {
    icon: Search,
    title: "pick a country, then a region",
    text: "browse australia, new zealand, japan or canada, then choose a region like the snowy mountains or hakuba valley. every region lists its base towns and mountains.",
  },
  {
    icon: CloudSnow,
    title: "check the mountain, not just the town",
    text: "tap any resort for full conditions · today's forecast, snow by elevation, wind, lifted terrain, the 7-day and the extended outlook. temps in town and up the hill are very different things.",
  },
  {
    icon: Camera,
    title: "look before you drive",
    text: "live webcams (run by each resort) and road conditions show you what it actually looks like right now · chains, slush, sunshine or a whiteout.",
  },
  {
    icon: Map,
    title: "plan the rest of the trip",
    text: "each base town has stay, eat, transport and explore pages, and the trip planner compares snow across mountains when you're deciding where to go.",
  },
];

export default function About() {
  return (
    <div
      className="relative isolate min-h-[100dvh] text-white antialiased bg-[#0055FF] pb-safe"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif", ...pretty }}
    >
      <PageMeta
        title="about feelzlike · how it works"
        description="what feelzlike is, where the numbers come from, and how to use it to check real mountain conditions before you make the drive."
        path="/about"
      />

      <div className="mx-auto w-full max-w-md px-6 pt-6 pb-16 md:max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold lowercase text-white/80 hover:text-white"
          data-testid="link-about-back"
        >
          <ArrowLeft className="h-4 w-4" /> back to home
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-center"
        >
          <img
            src={logoWhite}
            alt="feelzlike"
            className="mx-auto h-16 w-auto select-none md:h-20"
            draggable={false}
          />
          <p className={`mt-3 ${eyebrow}`}>about feelzlike</p>
          <h1 className="mt-1 font-display text-3xl font-semibold lowercase md:text-4xl">
            real conditions for mountain travel
          </h1>
        </motion.header>

        <p className="mt-5 text-[15px] font-bold lowercase leading-relaxed text-white/85">
          you&rsquo;re in town, wondering what it&rsquo;s actually like up the
          mountain. feelzlike pulls together what&rsquo;s happening right now -
          snow, wind, temperature, roads and live cams - so you can make the
          call before you make the drive.
        </p>

        <h2 className="mt-10 font-display text-2xl font-semibold lowercase">
          how to use it
        </h2>
        <div className="mt-4 space-y-4">
          {HOW_TO.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              className={card}
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F5FF] text-[#0055FF]">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-semibold lowercase text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[14px] font-bold lowercase leading-relaxed text-slate-500">
                    {s.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl font-semibold lowercase">
          where the numbers come from
        </h2>
        <div className={`mt-4 ${card}`}>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F5FF] text-[#0055FF]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="text-[14px] font-bold lowercase leading-relaxed text-slate-500">
              readings come straight from official weather services and live
              observation networks in each country - the bureau of meteorology
              in australia, the japan meteorological agency in japan, and more.
              live webcams are run by the resorts themselves · we link you
              straight to their feeds. every region lists its own sources, so
              you can always see where a reading came from.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-bold lowercase text-[#0055FF] shadow-lg hover:bg-white/90"
            data-testid="link-about-start"
          >
            start exploring →
          </Link>
        </div>
      </div>
    </div>
  );
}
