import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Radar as RadarIcon, ExternalLink, RefreshCw, Info, Snowflake } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const BOM_RADAR_ID = "IDR403";
const BOM_RADAR_RANGE = "128km";
const BOM_RADAR_NAME = "Canberra (Captain's Flat)";

const API_BASE = `${import.meta.env.BASE_URL}api/bom-radar`;

function bomUrl(type: string, file: string) {
  return `${API_BASE}?type=${type}&file=${encodeURIComponent(file)}`;
}

const LAYER_URLS = {
  background: bomUrl("transparency", `${BOM_RADAR_ID}.background.png`),
  topography: bomUrl("transparency", `${BOM_RADAR_ID}.topography.png`),
  locations: bomUrl("transparency", `${BOM_RADAR_ID}.locations.png`),
  range: bomUrl("transparency", `${BOM_RADAR_ID}.range.png`),
};

function getRadarTimestamps(count: number = 6): string[] {
  // BOM IDR403 publishes a new radar frame every 10 minutes with ~5 min
  // publishing latency, so we anchor on the most recent fully-published slot.
  const timestamps: string[] = [];
  const now = new Date();
  // step back 5 min to skip the not-yet-published current slot, then floor to 10
  const anchor = new Date(now.getTime() - 5 * 60 * 1000);
  anchor.setUTCMinutes(Math.floor(anchor.getUTCMinutes() / 10) * 10, 0, 0);

  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(anchor.getTime() - i * 10 * 60 * 1000);
    const year = t.getUTCFullYear();
    const month = String(t.getUTCMonth() + 1).padStart(2, "0");
    const day = String(t.getUTCDate()).padStart(2, "0");
    const hours = String(t.getUTCHours()).padStart(2, "0");
    const mins = String(t.getUTCMinutes()).padStart(2, "0");
    timestamps.push(`${year}${month}${day}${hours}${mins}`);
  }
  return timestamps;
}

function getRadarImageUrl(timestamp: string): string {
  return bomUrl("image", `${BOM_RADAR_ID}.T.${timestamp}.png`);
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
  const [timestamps, setTimestamps] = useState<string[]>(() => getRadarTimestamps(6));
  const [currentFrame, setCurrentFrame] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    setTimestamps(getRadarTimestamps(6));
    setCurrentFrame(5);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % timestamps.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, timestamps.length]);

  useEffect(() => {
    const autoRefresh = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(autoRefresh);
  }, [refresh]);

  return (
    <AppLayout>
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
              href={`http://www.bom.gov.au/products/${BOM_RADAR_ID}.loop.shtml`}
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
          <div className="relative aspect-square max-w-3xl mx-auto bg-[#000010]">
            <img src={LAYER_URLS.background} alt="" className="absolute inset-0 w-full h-full" />
            <img src={LAYER_URLS.topography} alt="" className="absolute inset-0 w-full h-full" />

            {timestamps.map((ts, idx) => (
              <img
                key={ts}
                src={getRadarImageUrl(ts)}
                alt={`Radar frame ${idx + 1}`}
                className="absolute inset-0 w-full h-full transition-opacity duration-200"
                style={{ opacity: idx === currentFrame ? 1 : 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ))}

            <img src={LAYER_URLS.locations} alt="" className="absolute inset-0 w-full h-full" />
            <img src={LAYER_URLS.range} alt="" className="absolute inset-0 w-full h-full" />

            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-mono">
              {timestamps[currentFrame]
                ? `${timestamps[currentFrame].slice(6, 8)}/${timestamps[currentFrame].slice(4, 6)} ${timestamps[currentFrame].slice(8, 10)}:${timestamps[currentFrame].slice(10, 12)} UTC`
                : ""}
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-border space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors min-w-[80px]"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={timestamps.length - 1}
                  value={currentFrame}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentFrame(Number(e.target.value));
                  }}
                  className="flex-1 accent-primary"
                />
              </div>

              <span className="text-xs text-muted-foreground font-mono min-w-[60px] text-right">
                {currentFrame + 1}/{timestamps.length}
              </span>
            </div>

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
                This BOM radar covers Thredbo, Perisher, Charlotte's Pass, Selwyn, and Jindabyne.
                At alpine elevations (above ~1400m), precipitation shown on radar is typically
                falling as snow when temperatures are at or below 0°C. Check the current
                temperature on each resort's page to gauge whether precipitation is snow or rain.
              </p>
              <p>
                Green returns indicate light snowfall, yellow is moderate, and orange-to-red signals 
                heavy snow or storm activity - great for powder days. Watch for systems 
                approaching from the west and southwest for the best snow events.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
