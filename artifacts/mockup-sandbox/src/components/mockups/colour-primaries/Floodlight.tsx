import { type ComponentType, type CSSProperties } from "react";
import {
  Snowflake, Wind, Mountain, Eye, MapPin, CloudSnow,
  Bus, BedDouble, UtensilsCrossed, Compass,
} from "lucide-react";

const INK = "#050608";
const SURFACE = "#0E1015";
const BORDER = "#1E222E";
const MUTED = "#647187";
const PINK = "#EC008C";
const CYAN = "#00E5FF";

type Ic = ComponentType<{ className?: string; style?: CSSProperties }>;

const SECTIONS: { label: string; sub: string; hue: string; icon: Ic }[] = [
  { label: "weather", sub: "live now", hue: "#00E5FF", icon: CloudSnow },
  { label: "getting there", sub: "3 operators", hue: "#B026FF", icon: Bus },
  { label: "where to stay", sub: "42 stays", hue: "#FFEA00", icon: BedDouble },
  { label: "where to eat", sub: "18 spots", hue: "#FF5E00", icon: UtensilsCrossed },
  { label: "explore", sub: "trails · lifts", hue: "#39FF14", icon: Compass },
];

const HOURS: { t: string; icon: Ic; temp: string; isSnow: boolean }[] = [
  { t: "3pm", icon: CloudSnow, temp: "-3", isSnow: true },
  { t: "4pm", icon: CloudSnow, temp: "-4", isSnow: true },
  { t: "5pm", icon: Snowflake, temp: "-5", isSnow: true },
  { t: "6pm", icon: Snowflake, temp: "-6", isSnow: true },
];

const FORECAST: { d: string; icon: Ic; hi: number; lo: number; snow: number }[] = [
  { d: "mon", icon: Snowflake, hi: -2, lo: -8, snow: 12 },
  { d: "tue", icon: CloudSnow, hi: -1, lo: -6, snow: 6 },
  { d: "wed", icon: CloudSnow, hi: 0, lo: -5, snow: 3 },
  { d: "thu", icon: Snowflake, hi: -3, lo: -9, snow: 18 },
  { d: "fri", icon: Snowflake, hi: -4, lo: -10, snow: 22 },
];

function GlowCard({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: CSSProperties }) {
  return (
    <div
      className={`relative rounded-3xl p-6 ${className}`}
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)`,
        ...style
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, value, unit, label, sub, isSnow }: { icon: Ic, value: string, unit: string, label: string, sub: string, isSnow?: boolean }) {
  const accent = isSnow ? PINK : CYAN;
  return (
    <GlowCard className="group relative transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#151821] cursor-default">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity rounded-3xl" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mb-5">
        <span className="text-[14px] font-medium lowercase text-[#647187] group-hover:text-white transition-colors">{label}</span>
        <div className="rounded-xl p-2.5 transition-transform group-hover:scale-110" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
          <Icon className="h-4 w-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}80)` }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[42px] font-bold leading-none tracking-tight tabular-nums text-white"
          style={{ textShadow: isSnow ? `0 0 25px ${PINK}50` : `0 0 25px ${CYAN}30` }}>
          {value}
        </span>
        <span className="text-[16px] font-medium text-[#647187]">{unit}</span>
      </div>
      <div className="mt-2.5 text-[13px] lowercase text-[#647187]">{sub}</div>
    </GlowCard>
  );
}

export function Floodlight() {
  return (
    <div className="min-h-screen w-full font-outfit selection:bg-[#00E5FF]/30 selection:text-white relative overflow-hidden lowercase"
      style={{
        backgroundColor: INK,
        backgroundImage: `
          radial-gradient(circle at 15% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 85% 30%, rgba(236, 0, 140, 0.05) 0%, transparent 40%)
        `
      }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}} />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />

      <div className="relative z-10 mx-auto max-w-[1180px] px-6 py-10 md:px-8">
        
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EC008C]/15 border border-[#EC008C]/30 shadow-[0_0_20px_rgba(236,0,140,0.25)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#EC008C] opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <Snowflake className="h-6 w-6 text-[#EC008C]" style={{ filter: `drop-shadow(0 0 8px ${PINK})` }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[24px] font-extrabold tracking-tight text-white leading-none mb-1" style={{ textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>
                feelzlike
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-[#647187]">
                <MapPin className="h-3.5 w-3.5" /> jindabyne · snowy mountains
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 shadow-[0_0_20px_rgba(0,229,255,0.15)] backdrop-blur-md self-start sm:self-auto">
            <CloudSnow className="h-4 w-4 text-[#00E5FF]" style={{ filter: `drop-shadow(0 0 5px ${CYAN})` }} />
            <span className="text-[13px] font-bold text-[#00E5FF]">weather</span>
          </div>
        </header>

        {/* Live Weather */}
        <GlowCard className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 overflow-hidden relative border-[#00E5FF]/20">
          {/* Intense ambient glows */}
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[#00E5FF] opacity-[0.08] blur-[80px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 h-40 w-40 rounded-full bg-[#EC008C] opacity-[0.05] blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 text-[16px] font-medium text-[#647187]">
              <CloudSnow className="h-5 w-5 text-[#EC008C]" style={{ filter: `drop-shadow(0 0 8px ${PINK})` }} />
              light snow · feels like <span className="text-white font-bold">-6°</span>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-6">
              <span className="font-extrabold tabular-nums text-white tracking-tighter"
                style={{ fontSize: "120px", lineHeight: "0.8", textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>
                -3°
              </span>
              <div className="mb-4 flex flex-col items-start gap-3">
                <span className="flex items-center gap-2 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/15 px-3 py-1.5 text-[13px] font-bold text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                  <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse"></span>
                  weather · live
                </span>
                <span className="text-[14px] font-medium text-[#647187]">mid mountain · 1780m</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex w-full lg:w-auto flex-col gap-4 rounded-3xl bg-[#050608]/60 p-6 border border-[#1E222E]/80 backdrop-blur-xl shadow-inner">
            <div className="text-[13px] font-bold text-[#647187]">next hours</div>
            <div className="flex justify-between lg:justify-start gap-6 sm:gap-8">
              {HOURS.map((h) => {
                const HIcon = h.icon;
                const hColor = h.isSnow ? PINK : CYAN;
                return (
                  <div key={h.t} className="flex flex-col items-center gap-2.5">
                    <span className="text-[13px] font-medium text-[#647187]">{h.t}</span>
                    <HIcon className="h-6 w-6" style={{ color: hColor, filter: `drop-shadow(0 0 10px ${hColor}90)` }} />
                    <span className="text-[18px] font-bold tabular-nums text-white">{h.temp}°</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlowCard>

        {/* Metrics Grid */}
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard icon={Wind} value="24" unit="km/h" label="wind" sub="gusts 38" />
          <MetricCard icon={Snowflake} value="18" unit="cm" label="snow · 24h" sub="since 6am" isSnow />
          <MetricCard icon={Mountain} value="142" unit="cm" label="base depth" sub="mid mountain" />
          <MetricCard icon={Eye} value="2.5" unit="km" label="visibility" sub="moderate" />
        </section>

        {/* Sections Grid */}
        <section className="mb-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {SECTIONS.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-[#0E1015] p-5 border border-[#1E222E] transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300" style={{ backgroundColor: s.hue }} />
                
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-300" 
                  style={{ backgroundColor: `${s.hue}15`, border: `1px solid ${s.hue}40`, boxShadow: `inset 0 0 15px ${s.hue}10` }}>
                  <SIcon className="h-5 w-5" style={{ color: s.hue, filter: `drop-shadow(0 0 8px ${s.hue}90)` }} />
                </div>
                
                <div className="relative z-10">
                  <div className="text-[16px] font-bold text-white mb-1 transition-colors group-hover:text-white" style={{ textShadow: `0 0 20px ${s.hue}40` }}>{s.label}</div>
                  <div className="text-[13px] font-medium text-[#647187]">{s.sub}</div>
                </div>
                
                {/* Neon bottom strip */}
                <div className="absolute bottom-0 left-0 h-1 w-full opacity-30 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ backgroundColor: s.hue, boxShadow: `0 -2px 15px ${s.hue}` }} />
              </div>
            );
          })}
        </section>

        {/* Forecast */}
        <GlowCard className="mb-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[18px] font-bold text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]"></span>
              5 day outlook
            </span>
            <span className="text-[13px] font-medium text-[#647187]">snow shown in cm</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {FORECAST.map((f, i) => {
              const FIcon = f.icon;
              const today = i === 3;
              const isSnow = f.snow > 0;
              const dayColor = isSnow ? PINK : (today ? CYAN : "#4A5265");
              
              return (
                <div key={f.d} className="relative rounded-2xl p-5 text-center transition-all duration-300 hover:bg-[#151821] group"
                  style={{
                    backgroundColor: today ? `${CYAN}0A` : "#050608",
                    border: `1px solid ${today ? `${CYAN}40` : BORDER}`,
                    boxShadow: today ? `inset 0 0 30px ${CYAN}08` : "none"
                  }}>
                  {today && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00E5FF] px-3 py-0.5 text-[11px] font-bold text-[#050608] shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                      today
                    </div>
                  )}
                  <div className="text-[14px] font-bold text-[#647187] mb-4 group-hover:text-white transition-colors">{f.d}</div>
                  <div className="mb-4 flex justify-center">
                    <FIcon className="h-8 w-8 transition-transform group-hover:scale-110" 
                      style={{ 
                        color: dayColor, 
                        filter: isSnow || today ? `drop-shadow(0 0 12px ${dayColor}80)` : "none" 
                      }} />
                  </div>
                  <div className="flex items-center justify-center gap-2.5 mb-3">
                    <span className="text-[20px] font-bold tabular-nums text-white">{f.hi}°</span>
                    <span className="text-[14px] font-semibold tabular-nums text-[#647187]">{f.lo}°</span>
                  </div>
                  <div className="inline-block rounded-xl px-2.5 py-1 text-[14px] font-bold tabular-nums transition-colors"
                    style={{
                      backgroundColor: isSnow ? `${PINK}15` : "transparent",
                      color: isSnow ? PINK : MUTED,
                      textShadow: isSnow ? `0 0 15px ${PINK}60` : "none",
                      border: isSnow ? `1px solid ${PINK}30` : "1px solid transparent"
                    }}>
                    {isSnow ? `${f.snow}cm` : "0cm"}
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Footer */}
        <footer className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] font-medium text-[#4A5265]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EC008C] shadow-[0_0_8px_#EC008C]"></span>
            direction 04 · floodlight · electric data on deep ink
          </div>
          <span>source · bom · updated 6 jul · 3:40pm</span>
        </footer>
      </div>
    </div>
  );
}
