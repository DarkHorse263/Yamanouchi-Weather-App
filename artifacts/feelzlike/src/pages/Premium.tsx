import { Link } from "wouter";
import {
  Sparkles,
  Lock,
  BellRing,
  ParkingCircle,
  Sunrise,
  CalendarRange,
  WifiOff,
  Check,
  Gift,
  ArrowLeft,
} from "lucide-react";
import { usePremium, setPremiumPreview } from "@workspace/feelzlike-shell";

interface Feature {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  status: "live" | "soon";
}

const FREE_FEATURES = [
  "town weather · hourly + 7-day forecast",
  "live snow radar · region-aware",
  "mountain comparison · today's best pick",
  "roads, transport & parking basics",
  "stay & eat launchpads",
];

const PREMIUM_FEATURES: Feature[] = [
  {
    Icon: BellRing,
    title: "push alerts",
    blurb: "powder, wind hold, road closure · pushed the moment they trigger.",
    status: "live",
  },
  {
    Icon: ParkingCircle,
    title: "carpark fill predictions",
    blurb: "perisher will fill by 9:20 today. leave thredbo by 8:15.",
    status: "soon",
  },
  {
    Icon: Sunrise,
    title: "early-bird road bulletin",
    blurb: "4-6am push before you load the car · chains, closures, snowfall.",
    status: "soon",
  },
  {
    Icon: CalendarRange,
    title: "multi-day trip planner",
    blurb: "stack 3-7 days of conditions across your saved mountains.",
    status: "soon",
  },
  {
    Icon: WifiOff,
    title: "offline pack",
    blurb: "download the town + mountain bundle. works in the valley dead zones.",
    status: "soon",
  },
];

function formatDate(d: Date) {
  return d
    .toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })
    .toLowerCase();
}

export default function Premium() {
  const { isPremium, isPromoPeriod, daysLeftInPromo, promoEndsAt } = usePremium();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> back
        </Link>

        {/* Header */}
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> premium
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2 leading-tight">
            proactive intelligence for the days that matter
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            the daily dashboard is free, forever. premium adds the smart pushes
            and predictions that save you the trip you'd otherwise wasted.
          </p>
        </div>

        {/* Current status */}
        <div
          className={`rounded-2xl border p-5 ${
            isPremium
              ? "bg-emerald-50/60 border-emerald-200"
              : "bg-white border-border"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPremium ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isPremium ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                your tier
              </p>
              <p className="text-lg font-black text-foreground mt-0.5">
                {isPromoPeriod
                  ? "premium · launch promo"
                  : isPremium
                  ? "premium"
                  : "free"}
              </p>
              {isPromoPeriod && promoEndsAt && (
                <p className="text-sm text-emerald-800/90 mt-1 inline-flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  free until {formatDate(promoEndsAt)} · {daysLeftInPromo} days left
                </p>
              )}
              {!isPremium && (
                <p className="text-sm text-muted-foreground mt-1">
                  billing isn't live yet. tap the preview button below to try the
                  premium surfaces in this build.
                </p>
              )}
            </div>
          </div>

          {!isPremium && (
            <button
              onClick={() => setPremiumPreview(true)}
              className="mt-4 w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" /> preview premium
            </button>
          )}
          {isPremium && !isPromoPeriod && (
            <button
              onClick={() => setPremiumPreview(false)}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              exit preview
            </button>
          )}
        </div>

        {/* Free tier */}
        <section>
          <h2 className="text-lg font-black text-foreground mb-3">free · forever</h2>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-sm text-foreground"
              >
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Premium features */}
        <section>
          <h2 className="text-lg font-black text-foreground mb-3 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> premium
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PREMIUM_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <f.Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-foreground leading-snug">
                        {f.title}
                      </h3>
                      {f.status === "soon" && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing tease */}
        <section className="rounded-2xl border border-dashed border-border bg-secondary/30 p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            pricing
          </p>
          <p className="text-sm text-foreground mt-1.5 leading-relaxed">
            launch promo runs free for everyone. after that, premium is a small
            monthly fee · less than a chairlift coffee. billing details land
            before the promo window closes.
          </p>
        </section>

        <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
          navigate work digital pty ltd · feelzlike
        </p>
      </div>
    </div>
  );
}
