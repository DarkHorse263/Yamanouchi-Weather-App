import { useMemo } from "react";
import { Link } from "wouter";
import {
  Sparkles,
  Lock,
  UserRound,
  BellRing,
  ParkingCircle,
  Sunrise,
  CalendarRange,
  WifiOff,
  Check,
  Gift,
  ArrowLeft,
} from "lucide-react";
import { usePremium } from "@workspace/feelzlike-shell";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { PremiumSubscribe } from "@/components/PremiumSubscribe";

interface Feature {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  status: "live" | "soon";
  href?: string;
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
    blurb: "stack the next 7 days of conditions across your saved mountains.",
    status: "live",
    href: "/plan",
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
  const {
    isPremium,
    isPromoPeriod,
    isPromoUpcoming,
    promoStartsAt,
    promoEndsAt,
  } = usePremium();
  const { isAuthenticated, isLoading, email, promptSignUp } = useAuthAccount();

  // Failure landings from the magic-link flow redirect here with ?signin=…
  const signinNotice = useMemo(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("signin");
    if (v === "expired") return "that sign-in link has expired · request a fresh one below.";
    if (v === "invalid") return "that sign-in link isn't valid · request a fresh one below.";
    if (v === "error") return "sign-in hit a snag · try again in a moment.";
    return null;
  }, []);

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

        {/* Account · the soft member gate. Sign-up is free (magic-link email)
            and unlocks every premium feature during the launch promo. Also
            the landing spot for expired/invalid magic links (?signin=…). */}
        <div className="rounded-2xl border border-border bg-white p-5">
          {signinNotice && (
            <p className="text-sm text-rose-600 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 mb-3">
              {signinNotice}
            </p>
          )}
          {isLoading ? null : isAuthenticated ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                <UserRound className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">your account</p>
                <p className="text-sm font-bold text-foreground mt-0.5 break-all">{email ?? "signed in"}</p>
                <a href="/api/logout" className="text-sm text-muted-foreground underline hover:text-foreground mt-1 inline-block">
                  sign out
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-700">
                <UserRound className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">your account</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  create a free account to use every premium feature
                  {isPromoPeriod && promoEndsAt ? ` · free until ${formatDate(promoEndsAt)}, no card needed` : ""}.
                  already get powder alert emails? use the same email to claim your account.
                </p>
                <button
                  type="button"
                  onClick={() => promptSignUp({ feature: "premium-page" })}
                  className="mt-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 hover:bg-primary/90 transition"
                >
                  create free account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current status */}
        <div
          className={`rounded-2xl border p-5 ${
            isPremium
              ? "bg-emerald-50/60 border-emerald-200"
              : isPromoUpcoming
              ? "bg-sky-50/60 border-sky-200"
              : "bg-white border-border"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPremium
                  ? "bg-emerald-100 text-emerald-700"
                  : isPromoUpcoming
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isPremium ? (
                <Check className="w-5 h-5" />
              ) : isPromoUpcoming ? (
                <Gift className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                your tier
              </p>
              <p className="text-lg font-black text-foreground mt-0.5">
                {isPromoPeriod
                  ? "premium · free for subscribers"
                  : isPremium
                  ? "premium"
                  : "free"}
              </p>
              {isPromoPeriod && promoEndsAt && (
                <p className="text-sm text-emerald-800/90 mt-1 inline-flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  free until {formatDate(promoEndsAt)} · no card needed
                </p>
              )}
              {isPromoUpcoming && promoStartsAt && (
                <p className="text-sm text-sky-800/90 mt-1 inline-flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  launch promo opens {formatDate(promoStartsAt)} · free for subscribers until {promoEndsAt && formatDate(promoEndsAt)}.
                </p>
              )}
              {!isPremium && !isPromoUpcoming && (
                <p className="text-sm text-muted-foreground mt-1">
                  the launch promo has wrapped. subscribe to hear when monthly &
                  yearly plans open.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              powder alerts · the premium feature you can use today
            </p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {isPromoPeriod && promoEndsAt
                ? `pick your regions and we'll email you when powder's on the way. free for subscribers until ${formatDate(
                    promoEndsAt,
                  )} · no card needed.`
                : "pick your regions and we'll email you when powder's on the way."}
            </p>
            <PremiumSubscribe />
          </div>
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
          <h2 className="text-lg font-black text-foreground mb-3 inline-flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-primary" /> premium
            {isPromoPeriod && promoEndsAt && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                free until {formatDate(promoEndsAt)}
              </span>
            )}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PREMIUM_FEATURES.map((f) => {
              const inner = (
                <>
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
                        {f.href && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            open
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.blurb}
                  </p>
                </>
              );
              return f.href ? (
                <Link
                  key={f.title}
                  href={f.href}
                  className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-2 hover:border-foreground transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-2"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            pricing · after 31 december 2026
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                monthly
              </p>
              <p className="text-2xl font-black text-foreground mt-1">
                $5.99 <span className="text-sm font-bold text-muted-foreground">aud / month</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">cancel anytime.</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 relative">
              <span className="absolute top-2 right-2 text-[9px] font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                save 16%
              </span>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                yearly
              </p>
              <p className="text-2xl font-black text-foreground mt-1">
                $60 <span className="text-sm font-bold text-muted-foreground">aud / year</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">$5 / month, billed yearly.</p>
            </div>
          </div>
          {isPromoPeriod && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              free for subscribers until {promoEndsAt && formatDate(promoEndsAt)} · no card needed. monthly & yearly plans open after that, and we'll email subscribers first.
            </p>
          )}
        </section>

        <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
          © 2026 navigate work digital · feelzlike
        </p>
      </div>
    </div>
  );
}
