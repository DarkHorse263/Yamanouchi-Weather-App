import { motion } from "framer-motion";
import { Radar as RadarIcon, ExternalLink, Info } from "lucide-react";

import { RadarMap } from "../components/RadarMap";

export default function Radar() {
  return (
    <>
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
              <RadarIcon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-extrabold mb-2">
              Snow<br />
              <span className="text-primary">Radar</span>
            </h1>
            <p className="text-white/70 text-lg max-w-lg mt-4">
              Live animated precipitation radar over the Snowy Mountains. Watch storms approach Thredbo, Perisher and Charlotte&apos;s Pass in real time.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <RadarMap />

          <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Live BOM radar mosaic via Windy. Drag to pan, scroll to zoom, use the
              timeline at the bottom to scrub.
            </span>
            <a
              href="https://www.bom.gov.au/products/IDR403.loop.shtml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              BOM Wagga Wagga radar <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-foreground space-y-2 leading-relaxed">
              <p className="font-semibold text-foreground">Reading the snow radar</p>
              <p className="text-muted-foreground">
                The animation shows the past two hours of precipitation plus a short nowcast, sourced from
                the Bureau of Meteorology&apos;s national radar mosaic via Windy. Press play to loop through
                the frames or drag the timeline to study a specific moment.
              </p>
              <p className="text-muted-foreground">
                At alpine elevations (above ~1,400 m) precipitation typically falls as snow when the
                temperature is at or below 0&deg;C. Cool blues mean light returns, greens and yellows are
                moderate, and oranges through purple signal heavy storm activity. Watch for systems
                approaching from the west and southwest for the best snow events.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
