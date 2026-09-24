import { useState } from "react";
import { useUser } from "@clerk/react";
import { useGetBillingStatus, createBillingCheckout, createBillingPortal } from "@workspace/api-client-react";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { BillingCountryPicker, useBillingCountry } from "@/components/BillingCountryPicker";
import { formatBillingPrice } from "@/lib/billingPricing";

/** Return URLs are informational only. Access is always re-read from the API. */
export function BillingControls({ showCountryPicker = true }: { showCountryPicker?: boolean }) {
  const { user } = useUser();
  const { isAuthenticated, promptSignUp } = useAuthAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { country, pricing } = useBillingCountry();
  const status = useGetBillingStatus({ query: {
    queryKey: ["/api/billing/status", user?.id],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    retry: false,
  } });
  async function open(plan?: "monthly" | "annual") {
    setBusy(true); setError("");
    try {
       const result = plan ? await createBillingCheckout({ plan, billingCountry: country }) : await createBillingPortal();
      const url = new URL(result.url);
      if (url.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname))
        throw new Error("Invalid billing destination");
      window.location.assign(result.url);
    } catch { setError("Billing is unavailable. No payment or access change has been confirmed. Please try again later."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-xl border border-border bg-white p-5 space-y-3 mt-4" aria-label="Subscription billing">
    <h3 className="font-bold text-slate-900">your premium subscription</h3>
    {!isAuthenticated ? <>
      <p className="text-sm text-slate-600">Purchases are not open yet. Sign in to check your access. Free powder email alerts still need no account.</p>
      <button className="text-sm underline" onClick={() => promptSignUp({ feature: "billing" })}>sign in to check access</button>
    </> : <>
      <p className="text-sm text-slate-600" role="status">
        {status.isPending ? "Checking your subscription…" : status.isError ? "Your subscription could not be verified. Please try again." :
          status.data?.paid ? "Active paid premium subscription." :
          status.data?.promo ? "Your free member premium access continues through December 2026. No payment is required." :
          "No active paid subscription has been verified."}
      </p>
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("checkout") &&
        <p className="text-sm text-slate-600">Returned from checkout. This is not payment confirmation; access updates only after Stripe verification.</p>}
      {!status.data?.purchasesEnabled && <p className="text-sm text-slate-600">New purchases are disabled while billing is verified.</p>}
      {showCountryPicker && <BillingCountryPicker />}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || !status.data?.purchasesEnabled || status.data?.paid}
          onClick={() => void open("monthly")} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
          monthly · {formatBillingPrice(pricing.currency, pricing.monthly)} · {pricing.taxText}
        </button>
        <button disabled={busy || !status.data?.purchasesEnabled || status.data?.paid}
          onClick={() => void open("annual")} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
          yearly · {formatBillingPrice(pricing.currency, pricing.annual)} · {pricing.taxText}
        </button>
        <button disabled={busy} onClick={() => void open()} className="text-sm underline disabled:opacity-50">
          manage billing / cancel subscription
        </button>
      </div>
      <p className="text-xs text-slate-600">This selection sets your subscription currency before Checkout. Stripe uses the billing address entered at Checkout to calculate tax. Existing subscriptions keep their original currency.</p>
    </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}