import { useState, useMemo, type FormEvent } from "react";
import { useSubscribeToAlerts } from "@workspace/api-client-react";
import { Mail, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { ALERT_REGIONS } from "@/components/AlertSubscribeForm";
import { isPaymentRequired } from "@/lib/gateErrors";

/**
 * Powder-alert signup for the /premium hub · powder alerts are the premium
 * weather feature, so "subscribing" here opts you into the real thing (no
 * login, double opt-in). Light-themed quick-start: email + region tick-boxes
 * + explicit consent.
 *
 * Threshold + look-ahead default to 15cm / 48hr (the same server defaults);
 * subscribers can fine-tune both from the manage link in the confirm email.
 *
 * Brand voice: all lowercase, middot separators, no em/en dashes, no emojis.
 */
type Status = "idle" | "loading" | "sent" | "already" | "error";

export function PremiumSubscribe() {
  const [email, setEmail] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  // Explicit opt-in · matches the region powder-alerts form.
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const browserTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const mutation = useSubscribeToAlerts();

  const toggleRegion = (id: string) =>
    setRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || regions.length === 0 || !consent) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await mutation.mutateAsync({
        data: {
          email: email.trim(),
          regions,
          mountains: [],
          snowfallThresholdCm: 15,
          horizonHours: 48,
          delivery: "email",
          timezone: browserTz,
          consent: true,
        },
      });
      const st = (res as { status?: string }).status;
      setStatus(st === "already_verified" ? "already" : "sent");
    } catch (err) {
      setErrorMsg(
        isPaymentRequired(err)
          ? "the launch promo has ended · monthly and yearly plans open below."
          : err instanceof Error
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
            : "you're already on the list · your preferences are updated."}
        </p>
      </div>
    );
  }

  const canSubmit =
    !!email && regions.length > 0 && consent && status !== "loading";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          regions · tick the ones you want
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {ALERT_REGIONS.map((r) => {
            const checked = regions.includes(r.id);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggleRegion(r.id)}
                role="checkbox"
                aria-checked={checked}
                className={`flex items-center gap-2.5 text-left rounded-xl px-3 py-2 border transition-colors ${
                  checked
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <span
                  className={`flex-none inline-flex items-center justify-center w-4 h-4 rounded-md border ${
                    checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-white border-border"
                  }`}
                  aria-hidden="true"
                >
                  {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-tight">
                    {r.nameEn}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider opacity-70">
                    {r.country}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <span>
          yes · email me powder alerts when 15cm+ is forecast in the next 48hr.
          unsubscribe anytime, one click.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
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
