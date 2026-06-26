import { useState, type FormEvent } from "react";
import { useSubscribeToNewsletter } from "@workspace/api-client-react";
import { Mail, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";

/**
 * Premium subscribe CTA for the /premium hub.
 *
 * Brand voice: all lowercase, middot separators, no em/en dashes, no emojis.
 *
 * No billing is wired. This reuses the newsletter double-opt-in backend (no
 * login required) so "subscribing" just captures an email and builds the
 * audience while every premium feature is free through the launch promo.
 * Signups are tagged `source="premium"` so they're attributable in the admin
 * newsletter view. When monthly/yearly billing lands, this CTA is where a
 * checkout entry point would go.
 */
type Status = "idle" | "loading" | "sent" | "already" | "error";

export function PremiumSubscribe({ source = "premium" }: { source?: string }) {
  const [email, setEmail] = useState("");
  // Explicit opt-in · matches the powder-alerts + footer newsletter forms.
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useSubscribeToNewsletter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !consent) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await mutation.mutateAsync({
        data: {
          email: email.trim(),
          regions: [],
          cadence: "fortnightly",
          source,
          consent: true,
        },
      });
      setStatus(res.status === "already_verified" ? "already" : "sent");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "could not sign you up · try again shortly.",
      );
      setStatus("error");
    }
  }

  if (status === "sent" || status === "already") {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 flex items-start gap-2">
        <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
        <p className="leading-snug">
          {status === "sent"
            ? "check your inbox to confirm · we won't email until you do."
            : "you're already on the list · you're all set."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div className="relative">
        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="email address"
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
          disabled={status === "loading"}
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <span>
          yes · email me about feelzlike premium. unsubscribe anytime, one
          click.
        </span>
      </label>
      <button
        type="submit"
        disabled={status === "loading" || !email || !consent}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> sending
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" /> subscribe
          </>
        )}
      </button>
      {status === "error" && errorMsg && (
        <p className="flex items-start gap-1.5 text-xs text-rose-600 leading-snug">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {errorMsg}
        </p>
      )}
    </form>
  );
}
