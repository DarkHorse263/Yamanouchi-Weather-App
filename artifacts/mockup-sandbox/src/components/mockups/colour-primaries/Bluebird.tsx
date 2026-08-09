import React from "react";
import {
  Snowflake, Wind, Mountain, Eye, CloudSnow,
  Bus, BedDouble, UtensilsCrossed, Compass, MapPin
} from "lucide-react";

const SKY = "#0055FF";
const PINK = "#EC008C";
const INK = "#0F172A";
const MUTED = "#64748B";

const SECTIONS = [
  { label: "weather", sub: "live now", icon: CloudSnow },
  { label: "getting there", sub: "3 operators", icon: Bus },
  { label: "where to stay", sub: "42 stays", icon: BedDouble },
  { label: "where to eat", sub: "18 spots", icon: UtensilsCrossed },
  { label: "explore", sub: "trails · lifts", icon: Compass },
];

const HOURS = [
  { t: "3pm", icon: CloudSnow, temp: "-3" },
  { t: "4pm", icon: CloudSnow, temp: "-4" },
  { t: "5pm", icon: Snowflake, temp: "-5" },
  { t: "6pm", icon: Snowflake, temp: "-6" },
];

const FORECAST = [
  { d: "mon", icon: Snowflake, hi: -2, lo: -8, snow: 12 },
  { d: "tue", icon: CloudSnow, hi: -1, lo: -6, snow: 6 },
  { d: "wed", icon: CloudSnow, hi: 0, lo: -5, snow: 3 },
  { d: "thu", icon: Snowflake, hi: -3, lo: -9, snow: 18 },
  { d: "fri", icon: Snowflake, hi: -4, lo: -10, snow: 22 },
];

const isSnowIcon = (Icon: any) => Icon === Snowflake || Icon === CloudSnow;

function Metric({ icon: Icon, value, unit, label, sub, valueColor }: { icon: any, value: string, unit: string, label: string, sub: string, valueColor?: string }) {
  const isSnow = isSnowIcon(Icon);
  return (
    <div className="bg-white rounded-[2rem] p-7 text-[#0F172A] shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#64748B] lowercase">{label}</span>
        <div className="bg-[#F0F5FF] p-2.5 rounded-xl">
          <Icon className="h-6 w-6" style={{ color: isSnow ? PINK : SKY }} />
        </div>
      </div>
      <div className="mt-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black tracking-tighter tabular-nums" style={{ color: valueColor || INK }}>
            {value}
          </span>
          <span className="text-lg font-bold text-[#64748B] lowercase">{unit}</span>
        </div>
        <div className="mt-2 text-sm font-bold text-[#64748B] lowercase">{sub}</div>
      </div>
    </div>
  );
}

export function Bluebird() {
  return (
    <div className="min-h-screen w-full bg-[#0055FF] text-white selection:bg-[#EC008C] selection:text-white font-sans overflow-x-hidden pb-20">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-12 flex flex-col gap-10 lg:gap-16">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-xl">
                <Snowflake className="h-8 w-8" style={{ color: PINK }} />
              </span>
              <span className="text-4xl font-black lowercase tracking-tighter">feelzlike</span>
            </div>
            <div className="hidden sm:block w-2 h-2 rounded-full bg-white/30" />
            <span className="flex items-center gap-2 text-xl font-bold text-white/90 lowercase">
              <MapPin className="h-5 w-5" /> jindabyne · snowy mountains
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-bold lowercase border border-white/20 shadow-lg">
            <CloudSnow className="h-5 w-5" style={{ color: PINK }} /> weather
          </span>
        </header>

        {/* Hero / Now */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="flex flex-col">
            <div className="text-[100px] sm:text-[140px] leading-[0.85] font-black tracking-tighter tabular-nums drop-shadow-2xl">
              -3°
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-6 flex items-center gap-3 text-white lowercase">
              <CloudSnow className="h-8 w-8" style={{ color: PINK }} />
              light snow · feels like -6°
            </div>
            <div className="text-base font-bold mt-4 text-white/70 lowercase flex items-center gap-2">
              <MapPin className="h-4 w-4" /> mid mountain · 1780m
            </div>
          </div>

          <div className="flex w-full lg:w-auto overflow-x-auto hide-scrollbar bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 gap-8 border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,30,120,0.5)]">
            {HOURS.map(h => (
              <div key={h.t} className="flex flex-col items-center gap-5 min-w-[4rem]">
                <span className="text-base font-bold text-white/80 lowercase">{h.t}</span>
                <h.icon className="h-10 w-10 drop-shadow-md" style={{ color: isSnowIcon(h.icon) ? PINK : 'white' }} />
                <span className="text-3xl font-black tabular-nums">{h.temp}°</span>
              </div>
            ))}
          </div>
        </section>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Metric icon={Wind} value="24" unit="km/h" label="wind" sub="gusts 38" />
          <Metric icon={Snowflake} value="18" unit="cm" label="snow · 24h" sub="since 6am" valueColor={PINK} />
          <Metric icon={Mountain} value="142" unit="cm" label="base depth" sub="mid mountain" />
          <Metric icon={Eye} value="2.5" unit="km" label="visibility" sub="moderate" />
        </div>

        {/* 5-day Forecast */}
        <section className="bg-white rounded-[3rem] p-8 lg:p-12 text-[#0F172A] shadow-[0_20px_60px_-15px_rgba(0,30,120,0.5)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 sm:mb-12 border-b border-[#F1F5F9] pb-6 gap-4">
            <h2 className="text-4xl font-black lowercase tracking-tight">5 day outlook</h2>
            <span className="text-sm font-bold text-[#64748B] lowercase bg-[#F1F5F9] px-5 py-2.5 rounded-full">snow shown in cm</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-12 divide-x-0 sm:divide-x divide-[#F1F5F9]">
            {FORECAST.map((f, i) => {
              const today = i === 3;
              return (
                <div key={f.d} className={`flex flex-col items-center px-2 sm:px-4 py-8 rounded-3xl transition-colors ${today ? 'bg-[#F0F5FF] shadow-sm ring-1 ring-[#0055FF]/10' : 'bg-transparent'}`}>
                  <span className={`text-xl font-black lowercase ${today ? 'text-[#0055FF]' : 'text-[#64748B]'}`}>{f.d}</span>
                  <f.icon className="h-12 w-12 sm:h-14 sm:w-14 my-8" style={{ color: isSnowIcon(f.icon) ? PINK : (today ? SKY : '#94A3B8') }} />
                  <div className="text-5xl font-black tabular-nums">{f.hi}°</div>
                  <div className={`text-lg font-bold tabular-nums mt-3 ${today ? 'text-[#0055FF]/70' : 'text-[#94A3B8]'}`}>{f.lo}°</div>
                  <div className="mt-8 pt-8 border-t border-[#E2E8F0] w-full text-center">
                    <span className={`text-2xl sm:text-3xl font-black tabular-nums ${f.snow > 0 ? 'text-[#EC008C]' : 'text-[#CBD5E1]'}`}>
                      {f.snow > 0 ? `${f.snow}cm` : '0cm'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section Tiles */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {SECTIONS.map(s => (
            <div key={s.label} className="bg-white rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between aspect-[4/5] sm:aspect-square shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)] cursor-pointer hover:scale-[1.03] hover:-translate-y-2 transition-all duration-300 group">
              <div className="bg-[#F0F5FF] w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] flex items-center justify-center group-hover:bg-[#0055FF] transition-colors duration-300">
                <s.icon 
                  className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-300 ${!isSnowIcon(s.icon) ? 'text-[#0055FF] group-hover:text-white' : ''}`} 
                  style={isSnowIcon(s.icon) ? { color: PINK } : {}} 
                />
              </div>
              <div className="mt-6">
                <div className="text-2xl sm:text-3xl font-black text-[#0F172A] lowercase leading-none tracking-tight">{s.label}</div>
                <div className="text-base font-bold text-[#64748B] lowercase mt-3">{s.sub}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-white/60 lowercase">
          <span>direction 04 · bluebird · standing on a summit under a hard blue sky</span>
          <span>source · bom · updated 6 jul · 3:40pm</span>
        </footer>
      </div>
    </div>
  );
}
