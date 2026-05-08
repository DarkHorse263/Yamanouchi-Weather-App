import { useState, type FormEvent } from "react";
import { useSubscribeToNewsletter } from "@workspace/api-client-react";
import { Mail, Check, AlertCircle, Loader2 } from "lucide-react";

/**
 * Newsletter signup, designed for the light HomeFooter (white card, slate
 * text). Distinct from `AlertSubscribeForm` which is the dark glass-styled
 * powder-alerts form. Same backend pattern (double opt-in), different list.
 *
 * Voice: terse, plain-English. No "01/02/03" copy, no em dashes.
 */
type Status = "idle" | "loading" | "sent" | "already" | "error";

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  // Default unchecked: explicit opt-in is the right posture for a marketing
  // list and matches the powder-alerts subscribe form.
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
      const msg =
        err instanceof Error
          ? err.message
          : "Could not sign you up. Try again shortly.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  // Success / already-verified states render a compact in-place message so
  // the footer layout doesn't jump.
  if (status === "sent" || status === "already") {
    return (
      <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-3 text-[13px] text-sky-900 flex items-start gap-2">
        <Check className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
        <p className="leading-snug">
          {status === "sent"
            ? "Check your inbox to confirm. We won't email until you do."
            : "You're already on the list."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="relative">
        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="w-full pl-9 pr-3 py-2 text-[13px] rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
          disabled={status === "loading"}
        />
      </div>
      <label className="flex items-start gap-2 text-[11.5px] text-slate-600 leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-sky-600"
        />
        <span>
          Send me the digest. Unsubscribe anytime, one click.
        </span>
      </label>
      <button
        type="submit"
        disabled={status === "loading" || !email || !consent}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[13px] font-medium px-3 py-2 transition-colors"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending
          </>
        ) : (
          "Subscribe"
        )}
      </button>
      {status === "error" && errorMsg && (
        <p className="flex items-start gap-1.5 text-[11.5px] text-rose-600 leading-snug">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {errorMsg}
        </p>
      )}
    </form>
  );
}
