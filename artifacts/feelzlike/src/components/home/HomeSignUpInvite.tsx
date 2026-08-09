import { motion } from "framer-motion";
import { BellRing, Gift, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePremium } from "@workspace/feelzlike-shell";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { track } from "@/lib/analytics";

function formatDate(d: Date): string {
  return d
    .toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })
    .toLowerCase();
}

/**
 * HomeSignUpInvite · the landing page's one sign-up ask. Anonymous visitors
 * see a single card pitching free snow alerts (the concrete, immediate value
 * of an account) with the launch-promo offer when it's running. Tapping opens
 * Clerk's sign-up/sign-in flow. Signed-in members never see it.
 *
 * Deliberately not dismissible and not repeated anywhere else on the landing
 * page: one honest ask, in one place, below the live-conditions block so the
 * value comes before the request.
 */
export function HomeSignUpInvite() {
  const { isAuthenticated, isLoading, promptSignUp } = useAuthAccount();
  const { isPromoPeriod, promoEndsAt } = usePremium();

  const visible = !isAuthenticated && !isLoading;

  // Impression counter (aggregate, non-identifying) so the admin stats can
  // show an honest shown → tapped funnel for this card.
  const shownRef = useRef(false);
  useEffect(() => {
    if (visible && !shownRef.current) {
      shownRef.current = true;
      track("home_signup_invite_shown", { category: "auth" });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <section className="px-4 pt-3 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mx-4 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-xl md:mx-6"
      >
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-snow-accent/10 text-snow-accent">
              <BellRing className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-slate-900">
                free snow alerts · emailed when a dump is coming
              </p>
              {isPromoPeriod && promoEndsAt ? (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Gift className="h-3 w-3" />
                  free until {formatDate(promoEndsAt)} · no card needed
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                track("home_signup_invite_click", { category: "auth" });
                promptSignUp({ feature: "home_invite" });
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0055FF] px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#0044CC]"
            >
              sign up
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
