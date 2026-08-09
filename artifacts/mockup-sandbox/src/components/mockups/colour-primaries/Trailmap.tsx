import type { ComponentType, CSSProperties } from "react";
import {
  Snowflake, Wind, Mountain, Eye, MapPin, CloudSnow,
  Bus, BedDouble, UtensilsCrossed, Compass
} from "lucide-react";

const INK = "#14181F";
const PAPER = "#F4F1EA";
const PINK = "#EC008C";
const MUTED = "#5A606A";

const TRAIL_GREEN = "#0A8546";
const TRAIL_BLUE = "#004CB2";
const TRAIL_RED = "#E32B14";
const TRAIL_YELLOW = "#F2A900";

type Ic = ComponentType<{ className?: string; style?: CSSProperties; strokeWidth?: number }>;

const SECTIONS: { label: string; sub: string; bg: string; fg: string; icon: Ic }[] = [
  { label: "weather", sub: "live now", bg: TRAIL_BLUE, fg: "#FFFFFF", icon: CloudSnow },
  { label: "getting there", sub: "3 operators", bg: TRAIL_YELLOW, fg: INK, icon: Bus },
  { label: "where to stay", sub: "42 stays", bg: TRAIL_GREEN, fg: "#FFFFFF", icon: BedDouble },
  { label: "where to eat", sub: "18 spots", bg: TRAIL_RED, fg: "#FFFFFF", icon: UtensilsCrossed },
  { label: "explore", sub: "trails · lifts", bg: "#FFFFFF", fg: INK, icon: Compass },
];

const HOURS = [
  { t: "3pm", icon: CloudSnow, temp: "-3", isSnow: false },
  { t: "4pm", icon: CloudSnow, temp: "-4", isSnow: false },
  { t: "5pm", icon: Snowflake, temp: "-5", isSnow: true },
  { t: "6pm", icon: Snowflake, temp: "-6", isSnow: true },
];

const FORECAST = [
  { d: "mon", icon: Snowflake, hi: -2, lo: -8, snow: 12 },
  { d: "tue", icon: CloudSnow, hi: -1, lo: -6, snow: 6 },
  { d: "wed", icon: CloudSnow, hi: 0, lo: -5, snow: 3 },
  { d: "thu", icon: Snowflake, hi: -3, lo: -9, snow: 18 },
  { d: "fri", icon: Snowflake, hi: -4, lo: -10, snow: 22 },
];

function MetricBox({ icon: Icon, value, unit, label, sub, isSnow }: any) {
  return (
    <div className="flex flex-col bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold lowercase text-[#14181F]">{label}</span>
        <Icon className="h-6 w-6" style={{ color: isSnow ? PINK : INK }} strokeWidth={2.5} />
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: isSnow ? PINK : INK }}>
            {value}
          </span>
          <span className="text-sm font-bold lowercase text-[#14181F]">{unit}</span>
        </div>
        <div className="mt-1 text-xs font-bold lowercase text-[#5A606A]">{sub}</div>
      </div>
    </div>
  );
}

export function Trailmap() {
  return (
    <div className="min-h-screen w-full font-sans selection:bg-[#EC008C] selection:text-white"
      style={{ backgroundColor: PAPER, color: INK }}>
      <div className="mx-auto max-w-[1080px] px-6 py-12">
        
        {/* Header */}
        <header className="mb-10 flex items-end justify-between border-b-[4px] border-[#14181F] pb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-[#14181F]">
                <Snowflake className="h-7 w-7 text-[#EC008C]" strokeWidth={3} />
              </div>
              <span className="text-4xl font-black lowercase tracking-tighter">feelzlike</span>
            </div>
            <div className="flex items-center gap-2 text-base font-bold lowercase">
              <MapPin className="h-5 w-5" /> jindabyne · snowy mountains
            </div>
          </div>
          <div className="flex items-center gap-2 border-[3px] border-[#14181F] bg-[#004CB2] px-4 py-2 text-sm font-black text-white shadow-[4px_4px_0_0_#14181F]">
            <CloudSnow className="h-4 w-4" strokeWidth={3} /> weather
          </div>
        </header>

        {/* Live Section */}
        <section className="mb-10 grid grid-cols-1 border-[4px] border-[#14181F] bg-white shadow-[8px_8px_0_0_#14181F] md:grid-cols-3">
          <div className="col-span-2 flex flex-col justify-between border-b-[4px] border-[#14181F] p-8 md:border-b-0 md:border-r-[4px]">
            <div className="flex items-center gap-3 text-xl font-bold lowercase">
              <CloudSnow className="h-8 w-8 text-[#004CB2]" strokeWidth={2.5} />
              light snow · feels like -6°
            </div>
            <div className="mt-12 flex flex-wrap items-baseline gap-6">
              <span className="text-8xl font-black tracking-tighter tabular-nums">-3°</span>
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-2 border-[3px] border-[#14181F] bg-[#14181F] px-3 py-1.5 text-sm font-bold text-white">
                  <CloudSnow className="h-4 w-4" /> weather · live
                </span>
                <span className="text-sm font-bold lowercase text-[#5A606A]">mid mountain · 1780m</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-[#F4F1EA] p-8">
            <div className="mb-6 text-sm font-bold lowercase text-[#14181F]">next hours</div>
            <div className="flex flex-1 justify-between gap-2">
              {HOURS.map((h) => (
                <div key={h.t} className="flex flex-col items-center justify-between">
                  <span className="text-sm font-bold lowercase text-[#5A606A]">{h.t}</span>
                  <h.icon className="my-3 h-8 w-8" style={{ color: h.isSnow ? PINK : TRAIL_BLUE }} strokeWidth={2.5} />
                  <span className="text-2xl font-black tabular-nums">{h.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="mb-10 grid grid-cols-2 gap-[4px] border-[4px] border-[#14181F] bg-[#14181F] shadow-[8px_8px_0_0_#14181F] md:grid-cols-4">
          <MetricBox icon={Wind} value="24" unit="km/h" label="wind" sub="gusts 38" />
          <MetricBox icon={Snowflake} value="18" unit="cm" label="snow · 24h" sub="since 6am" isSnow />
          <MetricBox icon={Mountain} value="142" unit="cm" label="base depth" sub="mid mountain" />
          <MetricBox icon={Eye} value="2.5" unit="km" label="visibility" sub="moderate" />
        </section>

        {/* Explore Tiles */}
        <section className="mb-10 grid grid-cols-2 gap-5 md:grid-cols-5">
          {SECTIONS.map((s) => (
            <div key={s.label} className="group flex cursor-pointer flex-col border-[4px] border-[#14181F] p-5 transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#14181F]" 
                 style={{ backgroundColor: s.bg, color: s.fg, boxShadow: `4px 4px 0 0 #14181F` }}>
              <s.icon className="mb-8 h-10 w-10" strokeWidth={2.5} />
              <div>
                <div className="text-xl font-black lowercase leading-tight">{s.label}</div>
                <div className="mt-1 text-sm font-bold opacity-90">{s.sub}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Forecast */}
        <section className="border-[4px] border-[#14181F] bg-white shadow-[8px_8px_0_0_#14181F]">
          <div className="flex items-center justify-between border-b-[4px] border-[#14181F] p-5">
            <span className="text-xl font-black lowercase">5 day outlook</span>
            <span className="text-sm font-bold lowercase text-[#5A606A]">snow shown in cm</span>
          </div>
          <div className="overflow-x-auto hide-scrollbar bg-[#14181F]">
            <div className="grid min-w-[700px] grid-cols-5 gap-[4px] md:min-w-0">
              {FORECAST.map((f, i) => {
                const today = i === 3;
                const isPink = f.snow > 0;
                return (
                  <div key={f.d} className="flex flex-col bg-white">
                    <div className="flex flex-1 flex-col items-center p-6">
                      <div className="text-base font-bold lowercase" style={{ color: today ? INK : MUTED }}>
                        {today ? `today` : f.d}
                      </div>
                      <f.icon className="my-6 h-10 w-10" style={{ color: isPink ? PINK : MUTED }} strokeWidth={2.5} />
                      <div className="text-3xl font-black tabular-nums">{f.hi}°</div>
                      <div className="text-base font-bold tabular-nums text-[#5A606A]">{f.lo}°</div>
                    </div>
                    <div className="border-t-[4px] border-[#14181F] p-4 text-center text-xl font-black tabular-nums" 
                         style={{ color: isPink ? PINK : INK, backgroundColor: isPink ? "#FFFFFF" : "#F4F1EA" }}>
                      {f.snow > 0 ? f.snow + "cm" : "0cm"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        
        <footer className="mt-12 flex flex-col gap-2 items-center justify-between text-sm font-bold lowercase text-[#5A606A] md:flex-row">
          <span>direction · vintage trailmap · bold, flat, honest hues</span>
          <span>source · bom · updated 6 jul · 3:40pm</span>
        </footer>

      </div>
    </div>
  );
}
