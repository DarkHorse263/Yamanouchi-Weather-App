import { useMemo } from "react";
import { Link } from "wouter";
import { useClerk } from "@clerk/react";
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
  Mail,
  Zap,
} from "lucide-react";
import { usePremium, PremiumGate } from "@workspace/feelzlike-shell";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { PremiumSubscribe } from "@/components/PremiumSubscribe";

function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className={className}
    >
      sign out
    </button>
  );
}

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
    title: "compare mountains",
    blurb: "stack the next 7 days of conditions across your saved mountains.",
    status: "live",
    href: "/compare",
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
    <div className="min-h-[100dvh] bg-[#0055FF] flex flex-col transition-colors duration-500">
      {/* Bluebird Bold Header */}
      <div className="text-white pt-6 pb-12 md:pt-10 md:pb-16 relative overflow-hidden">
        {/* Subtle noise/texture overlay if desired, keeping it simple for now */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6 md:mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> back
          </Link>
          
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> feelzlike premium
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 leading-[1.1] tracking-tight">
              proactive intelligence for the days that matter.
            </h1>
            <p className="text-white/80 mt-4 text-base md:text-lg leading-relaxed font-medium">
              the daily dashboard is free, forever. premium adds the smart pushes
              and predictions that save you the trip you'd otherwise wasted.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-6 md:-mt-8 w-full relative z-20 pb-16 space-y-6">
        
        {/* The Soft Gate / Account Block */}
        <div className="rounded-2xl border border-border bg-white shadow-xl shadow-black/5 p-5 md:p-6">
          {signinNotice && (
            <p className="text-sm text-[#EC008C] bg-[#EC008C]/10 border border-[#EC008C]/30 rounded-lg px-3 py-2 mb-4 font-medium">
              {signinNotice}
            </p>
          )}
          {isLoading ? null : isAuthenticated ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                <UserRound className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">your account</p>
                <p className="text-base font-black text-slate-900 mt-0.5 break-all">{email ?? "signed in"}</p>
                <div className="mt-2 flex items-center gap-4">
                  <Link href="/account" className="text-sm font-bold text-[#0055FF] underline hover:text-[#0055FF]/80">
                    manage your account
                  </Link>
                  <SignOutButton className="text-sm text-slate-500 underline hover:text-slate-900 transition-colors" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#0055FF]/10 text-[#0055FF]">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0055FF] uppercase tracking-wider">create free account</p>
                <h2 className="text-lg font-black text-slate-900 mt-1">unlock every premium feature instantly.</h2>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {isPromoPeriod && promoEndsAt ? `free for subscribers until ${formatDate(promoEndsAt)}, no card needed.` : "create an account to access premium features."}
                  {" "}already get powder alerts? use the same email to sign in.
                </p>
                <button
                  type="button"
                  onClick={() => promptSignUp({ feature: "premium-page" })}
                  className="mt-4 w-full sm:w-auto rounded-xl bg-[#0055FF] text-white font-bold text-sm px-6 py-3 hover:bg-[#0055FF]/90 transition-colors shadow-sm active:scale-[0.98]"
                >
                  claim your free account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Status Block */}
        <div
          className={`rounded-2xl border p-5 md:p-6 ${
            isPremium
              ? "bg-emerald-50/60 border-emerald-200"
              : isPromoUpcoming
              ? "bg-sky-50/60 border-sky-200"
              : "bg-white border-border shadow-sm"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isPremium
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : isPromoUpcoming
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isPremium ? (
                <Zap className="w-6 h-6 fill-current" />
              ) : isPromoUpcoming ? (
                <Gift className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                your tier
              </p>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {isPromoPeriod
                  ? "premium · free for subscribers"
                  : isPremium
                  ? "premium"
                  : "free"}
              </p>
              {isPromoPeriod && promoEndsAt && (
                <p className="text-sm font-medium text-emerald-700 mt-1 inline-flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  free until {formatDate(promoEndsAt)} · no card needed
                </p>
              )}
              {isPromoUpcoming && promoStartsAt && (
                <p className="text-sm font-medium text-sky-700 mt-1 inline-flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  launch promo opens {formatDate(promoStartsAt)} · free for subscribers until {promoEndsAt && formatDate(promoEndsAt)}.
                </p>
              )}
              {!isPremium && !isPromoUpcoming && (
                <p className="text-sm text-slate-500 mt-1">
                  the launch promo has wrapped. subscribe to hear when monthly &
                  yearly plans open.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-black/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              powder alerts · the premium feature you can use today
            </p>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed max-w-lg">
              {isPromoPeriod && promoEndsAt
                ? `pick your regions and we'll email you when powder's on the way. free for subscribers until ${formatDate(
                    promoEndsAt,
                  )} · no card needed.`
                : "pick your regions and we'll email you when powder's on the way."}
            </p>
            <div className="max-w-md">
              {/* Same soft gate as every other premium surface (Aug 2026):
                  signed-out visitors see the form but any tap prompts the
                  free sign-up instead of submitting directly. */}
              <PremiumGate
                title="Powder alerts"
                titleJa="パウダーアラート"
                blurb="Email alerts when forecast snowfall meets your threshold."
                blurbJa="予測降雪がしきい値に達したらメールでお知らせ。"
              >
                <PremiumSubscribe />
              </PremiumGate>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 pt-4">
          
          {/* Free Tier */}
          <section className="bg-slate-50 rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-black text-slate-900 mb-4">free · forever</h2>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-sm text-slate-700 font-medium"
                >
                  <Check className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="pt-0.5">{f}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Premium Tier */}
          <section>
            <h2 className="text-lg font-black text-slate-900 mb-4 inline-flex items-center gap-2 flex-wrap">
              <Sparkles className="w-5 h-5 text-[#0055FF]" /> premium
              {isPromoPeriod && promoEndsAt && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full ml-1">
                  free until {formatDate(promoEndsAt)}
                </span>
              )}
            </h2>
            <div className="grid gap-3">
              {PREMIUM_FEATURES.map((f) => {
                const inner = (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0055FF]/10 text-[#0055FF] flex items-center justify-center shrink-0">
                        <f.Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 leading-snug">
                            {f.title}
                          </h3>
                          {f.status === "soon" && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              soon
                            </span>
                          )}
                          {f.href && (
                            <span className="text-[10px] font-bold text-[#0055FF] bg-[#0055FF]/10 border border-[#0055FF]/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              open
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                          {f.blurb}
                        </p>
                      </div>
                    </div>
                  </>
                );
                return f.href ? (
                  <Link
                    key={f.title}
                    href={f.href}
                    className="rounded-2xl border border-border bg-white p-4 hover:border-[#0055FF]/40 hover:shadow-md transition-all group"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border bg-white p-4"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Pricing */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4 mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                pricing
              </p>
              <h2 className="text-lg font-black text-slate-900 mt-1">after 31 december 2026</h2>
            </div>
            {isPromoPeriod && promoEndsAt && (
              <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> free until {formatDate(promoEndsAt)}
              </div>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-slate-50 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                monthly
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                $5.99 <span className="text-sm font-bold text-slate-500">aud / mo</span>
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium">cancel anytime.</p>
            </div>
            <div className="rounded-xl border-2 border-[#0055FF]/20 bg-[#0055FF]/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#0055FF] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                save 16%
              </div>
              <p className="text-xs font-bold text-[#0055FF] uppercase tracking-wider">
                yearly
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                $60 <span className="text-sm font-bold text-slate-500">aud / yr</span>
              </p>
              <p className="text-xs text-slate-600 mt-2 font-medium">$5 / month, billed yearly.</p>
            </div>
          </div>
          {isPromoPeriod && (
            <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
              monthly & yearly plans open after the launch promo wraps. we'll email subscribers first - no card needed until then.
            </p>
          )}
        </section>

        <footer className="pt-8 pb-4 border-t border-white/20 mt-8 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-white/60">
            © 2026 navigate work digital · feelzlike
          </p>
        </footer>
      </div>
    </div>
  );
}
