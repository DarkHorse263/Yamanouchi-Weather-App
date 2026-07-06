import type { ComponentType, CSSProperties } from "react";
import {
  Snowflake, Wind, Mountain, Eye, MapPin, CloudSnow,
  Bus, BedDouble, UtensilsCrossed, Compass,
} from "lucide-react";

const INK = "#161A22";
const MUTED = "#5F6672";
const SURFACE = "#F6F8FA";
const HAIR = "rgba(20,30,45,0.08)";
const PINK = "#EC008C";
const SKY = "#1276D8";
const mix = (hue: string, pct: number) => `color-mix(in srgb, ${hue} ${pct}%, white)`;
type Ic = ComponentType<{ className?: string; style?: CSSProperties }>;

const SECTIONS: { label: string; sub: string; hue: string; icon: Ic }[] = [
  { label: "weather", sub: "live now", hue: "#1276D8", icon: CloudSnow },
  { label: "getting there", sub: "3 operators", hue: "#4F5BD5", icon: Bus },
  { label: "where to stay", sub: "42 stays", hue: "#D98A17", icon: BedDouble },
  { label: "where to eat", sub: "18 spots", hue: "#E5533D", icon: UtensilsCrossed },
  { label: "explore", sub: "trails · lifts", hue: "#2FA36B", icon: Compass },
];

const HOURS: { t: string; icon: Ic; temp: string }[] = [
  { t: "3pm", icon: CloudSnow, temp: "-3" },
  { t: "4pm", icon: CloudSnow, temp: "-4" },
  { t: "5pm", icon: Snowflake, temp: "-5" },
  { t: "6pm", icon: Snowflake, temp: "-6" },
];

const FORECAST: { d: string; icon: Ic; hi: number; lo: number; snow: number }[] = [
  { d: "mon", icon: Snowflake, hi: -2, lo: -8, snow: 12 },
  { d: "tue", icon: CloudSnow, hi: -1, lo: -6, snow: 6 },
  { d: "wed", icon: CloudSnow, hi: 0, lo: -5, snow: 3 },
  { d: "thu", icon: Snowflake, hi: -3, lo: -9, snow: 18 },
  { d: "fri", icon: Snowflake, hi: -4, lo: -10, snow: 22 },
];

function Metric({ icon: Icon, value, unit, label, sub, valueColor }:
  { icon: Ic; value: string; unit: string; label: string; sub: string; valueColor?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${HAIR}`, borderTop: `3px solid ${SKY}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium lowercase" style={{ color: MUTED }}>{label}</span>
        <Icon className="h-4 w-4" style={{ color: SKY }} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[40px] font-semibold leading-none tracking-tight tabular-nums"
          style={{ color: valueColor ?? INK }}>{value}</span>
        <span className="text-[15px] font-medium" style={{ color: MUTED }}>{unit}</span>
      </div>
      <div className="mt-1.5 text-[12px]" style={{ color: MUTED }}>{sub}</div>
    </div>
  );
}

export function SectionTinting() {
  return (
    <div className="min-h-screen w-full font-['Outfit']"
      style={{ background: SURFACE, color: INK,
        backgroundImage: `radial-gradient(ellipse 120% 50% at 50% 0%, ${mix(SKY, 8)}, transparent 70%)` }}>
      <div className="mx-auto max-w-[1180px] px-8 py-8">

        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: mix(SKY, 14) }}>
              <Snowflake className="h-4 w-4" style={{ color: SKY }} />
            </span>
            <span className="text-[20px] font-semibold lowercase tracking-tight">feelzlike</span>
            <span className="ml-3 flex items-center gap-1.5 text-[14px] lowercase" style={{ color: MUTED }}>
              <MapPin className="h-4 w-4" /> jindabyne · snowy mountains
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium lowercase"
            style={{ background: mix(SKY, 12), color: SKY, border: `1px solid ${SKY}` }}>
            <CloudSnow className="h-3.5 w-3.5" /> weather
          </span>
        </header>

        <section className="rounded-3xl bg-white p-7"
          style={{ border: `1px solid ${HAIR}`, borderTop: `3px solid ${SKY}`, boxShadow: "0 14px 44px -26px rgba(20,30,60,0.28)" }}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-medium lowercase" style={{ color: MUTED }}>
                <CloudSnow className="h-5 w-5" style={{ color: SKY }} />
                light snow · feels like <span style={{ color: INK }}>-6°</span>
              </div>
              <div className="mt-3 flex items-end gap-4">
                <span className="font-semibold tabular-nums"
                  style={{ fontSize: 92, lineHeight: 0.9, letterSpacing: "-0.04em", color: INK }}>-3°</span>
                <div className="mb-2 flex flex-col items-start gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium lowercase"
                    style={{ background: mix(SKY, 12), color: SKY }}>
                    <CloudSnow className="h-3.5 w-3.5" /> weather · live
                  </span>
                  <span className="text-[13px] lowercase" style={{ color: MUTED }}>mid mountain · 1780m</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
              <div className="mb-3 text-[12px] font-medium lowercase" style={{ color: MUTED }}>next hours</div>
              <div className="flex gap-5">
                {HOURS.map((h) => {
                  const HIcon = h.icon;
                  return (
                    <div key={h.t} className="flex flex-col items-center gap-1.5">
                      <span className="text-[12px] lowercase" style={{ color: MUTED }}>{h.t}</span>
                      <HIcon className="h-5 w-5" style={{ color: SKY }} />
                      <span className="text-[14px] font-semibold tabular-nums">{h.temp}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <p className="mb-6 mt-3 text-[13px] lowercase" style={{ color: MUTED }}>
          each section owns a colour · colour-coded navigation across the app
        </p>

        <section className="mb-5 grid grid-cols-4 gap-4">
          <Metric icon={Wind} value="24" unit="km/h" label="wind" sub="gusts 38" />
          <Metric icon={Snowflake} value="18" unit="cm" label="snow · 24h" sub="since 6am" valueColor={PINK} />
          <Metric icon={Mountain} value="142" unit="cm" label="base depth" sub="mid mountain" />
          <Metric icon={Eye} value="2.5" unit="km" label="visibility" sub="moderate" />
        </section>

        <section className="mb-5 grid grid-cols-5 gap-3">
          {SECTIONS.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl p-4"
                style={{ background: mix(s.hue, 6), border: `1px solid ${mix(s.hue, 30)}`, borderLeft: `3px solid ${s.hue}` }}>
                <span className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: mix(s.hue, 16), color: s.hue }}>
                  <SIcon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[14px] font-semibold lowercase" style={{ color: s.hue }}>{s.label}</div>
                  <div className="text-[12px]" style={{ color: MUTED }}>{s.sub}</div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${HAIR}` }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-semibold lowercase">5 day outlook</span>
            <span className="text-[12px] lowercase" style={{ color: MUTED }}>snow shown in cm</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {FORECAST.map((f, i) => {
              const FIcon = f.icon;
              const today = i === 3;
              return (
                <div key={f.d} className="rounded-xl p-3 text-center"
                  style={{ background: today ? mix(SKY, 10) : SURFACE,
                    border: `1px solid ${today ? SKY : HAIR}` }}>
                  <div className="text-[12px] font-medium lowercase" style={{ color: MUTED }}>{f.d}</div>
                  <FIcon className="mx-auto my-2 h-5 w-5" style={{ color: today ? SKY : "#8A93A3" }} />
                  <div className="text-[15px] font-semibold tabular-nums">{f.hi}°</div>
                  <div className="text-[12px] tabular-nums" style={{ color: MUTED }}>{f.lo}°</div>
                  <div className="mt-1 text-[12px] font-semibold tabular-nums"
                    style={{ color: f.snow > 0 ? PINK : MUTED }}>{f.snow > 0 ? f.snow + "cm" : "0cm"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-6 flex items-center justify-between text-[12px] lowercase" style={{ color: MUTED }}>
          <span>direction 03 · section tinting · each part of the app owns a colour</span>
          <span>source · bom · updated 6 jul · 3:40pm</span>
        </footer>
      </div>
    </div>
  );
}
