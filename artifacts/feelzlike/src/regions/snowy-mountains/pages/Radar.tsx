import { motion } from "framer-motion";
import { Radar as RadarIcon, ExternalLink, RefreshCw, Info, Snowflake } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

const BOM_RADAR_ID = "IDR403";
const BOM_RADAR_RANGE = "128km";
const BOM_RADAR_NAME = "Canberra (Captain's Flat)";

const API_BASE = `${import.meta.env.BASE_URL}api/bom-radar`;

/**
 * BOM migrated radar imagery in 2026: the per-frame PNGs at
 * `/radar/{IDR}.T.{ts}.png` now return 404. The animated loop GIF at
 * `/radar/{IDR}.gif` still works and is what bom.gov.au itself embeds.
 * It comes with all overlays (topography, locations, range rings)
 * already composited and animation built in — so we just render it as
 * a single image and let BOM handle playback.
 */
function loopUrl(cacheKey: number) {
  return `${API_BASE}?type=loop&file=${BOM_RADAR_ID}.gif&t=${cacheKey}`;
}

const LEGEND_ITEMS = [
  { color: "#00E500", label: "Light" },
  { color: "#00C800", label: "" },
  { color: "#FFFF00", label: "Moderate" },
  { color: "#FFC800", label: "" },
  { color: "#FF6400", label: "Heavy" },
  { color: "#FF0000", label: "" },
  { color: "#C80000", label: "Intense" },
];

export default function Radar() {
  const [cacheKey, setCacheKey] = useState(() => Date.now());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    setCacheKey(Date.now());
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    const autoRefresh = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(autoRefresh);
  }, [refresh]);

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
              Live BOM precipitation radar covering the Snowy Mountains. Track snowfall, storms, and weather systems heading for the ski fields.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm text-muted-foreground">
              {BOM_RADAR_NAME} Radar &middot; {BOM_RADAR_RANGE} range
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last refreshed: {lastRefresh.toLocaleTimeString()} &middot; Auto-refreshes every 5 min
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <a
              href={`https://www.bom.gov.au/products/${BOM_RADAR_ID}.loop.shtml`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors"
            >
              View on BOM <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="relative max-w-3xl mx-auto bg-[#000010]">
            <img
              key={cacheKey}
              src={loopUrl(cacheKey)}
              alt={`${BOM_RADAR_NAME} animated radar loop`}
              className="block w-full h-auto"
            />
          </div>

          <div className="p-4 sm:p-5 border-t border-border">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5" />
                Precipitation intensity:
              </span>
              <div className="flex items-center gap-0.5">
                {LEGEND_ITEMS.map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-8 h-4 first:rounded-l last:rounded-r"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label && (
                      <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-200 space-y-2">
              <p className="font-semibold">Reading the snow radar</p>
              <p>
                This BOM radar covers Thredbo, Perisher, Charlotte&apos;s Pass, Selwyn, and Jindabyne.
                At alpine elevations (above ~1400m), precipitation shown on radar is typically
                falling as snow when temperatures are at or below 0°C. Check the current
                temperature on each resort&apos;s page to gauge whether precipitation is snow or rain.
              </p>
              <p>
                Green returns indicate light snowfall, yellow is moderate, and orange-to-red signals
                heavy snow or storm activity — great for powder days. Watch for systems
                approaching from the west and southwest for the best snow events.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
