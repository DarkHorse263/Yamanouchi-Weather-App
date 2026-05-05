import { useEffect, useState } from "react";
import { useGetAlertPreferences, useUpdateAlertPreferences, useUnsubscribeFromAlerts } from "@workspace/api-client-react";
import { Loader2, AlertTriangle, Save, Trash2, CheckCircle2 } from "lucide-react";

/**
 * Subscription management page. Reached from the link in every alert email:
 * /alerts/manage?token=...
 *
 * Token grants no-login access to read + update + unsubscribe for one
 * subscriber. Token is HMAC-signed and 90-day-scoped.
 */

const REGIONS: Array<{ id: string; name: string }> = [
  { id: "snowy-mountains", name: "Snowy Mountains (AU)" },
  { id: "yamanouchi", name: "Yamanouchi (JP)" },
];

const HORIZONS: Array<{ value: 24 | 48 | 72; label: string }> = [
  { value: 24, label: "Next 24 hr" },
  { value: 48, label: "Next 48 hr" },
  { value: 72, label: "Next 72 hr" },
];

export default function Manage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const { data, isLoading, isError, error } = useGetAlertPreferences(
    { token },
    { query: { enabled: !!token, retry: false, queryKey: ["alerts", "manage", token] as const } },
  );

  const update = useUpdateAlertPreferences();
  const unsub = useUnsubscribeFromAlerts();

  const [regions, setRegions] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(15);
  const [horizon, setHorizon] = useState<24 | 48 | 72>(48);
  const [delivery, setDelivery] = useState<"email" | "push" | "both">("email");
  const [timezone, setTimezone] = useState("UTC");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmingUnsub, setConfirmingUnsub] = useState(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (data?.subscriber) {
      setRegions(data.subscriber.regions);
      setThreshold(data.subscriber.snowfallThresholdCm);
      setHorizon(data.subscriber.horizonHours as 24 | 48 | 72);
      setDelivery(data.subscriber.delivery as "email" | "push" | "both");
      setTimezone(data.subscriber.timezone || "UTC");
    }
  }, [data?.subscriber]);

  if (!token) {
    return <Shell><Banner kind="error" title="Missing token">The link in your email looks incomplete. Open it again from the email.</Banner></Shell>;
  }
  if (isLoading) {
    return <Shell><div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-400" /></div></Shell>;
  }
  if (isError || !data) {
    const reasonCode = (error as { data?: { reason?: string } } | null | undefined)?.data?.reason;
    const msg = reasonCode === "expired"
      ? "Your management link has expired. Click the link in your most recent alert email to refresh it."
      : "We couldn't load your preferences. Please try again.";
    return <Shell><Banner kind="error" title="Couldn't load">{msg}</Banner></Shell>;
  }

  const sub = data.subscriber;

  if (sub.unsubscribed) {
    return <Shell>
      <Banner kind="info" title={`You're unsubscribed (${sub.email})`}>
        You won't receive any more alerts. Resubscribe anytime from any region's Alerts page.
      </Banner>
    </Shell>;
  }

  const toggleRegion = (id: string) => {
    setRegions((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (regions.length === 0) return;
    try {
      await update.mutateAsync({
        params: { token },
        data: {
          regions,
          mountains: sub.mountains,
          snowfallThresholdCm: threshold,
          horizonHours: horizon,
          delivery,
          timezone,
        },
      });
      setSavedAt(Date.now());
    } catch { /* error surfaced below */ }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsub.mutateAsync({
        params: { token },
        data: { reason: reason || null },
      });
      window.location.href = "/alerts/unsubscribed";
    } catch { /* surfaced below */ }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Your alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">{sub.email}</p>
        </div>

        <Section title="Regions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REGIONS.map((r) => {
              const checked = regions.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRegion(r.id)}
                  className={`text-left rounded-lg px-3 py-2.5 text-sm font-bold border transition ${
                    checked ? "bg-primary/15 border-primary/40 text-foreground" : "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={checked}
                >{r.name}</button>
              );
            })}
          </div>
        </Section>

        <Section title="Snowfall threshold" trailing={<span className="text-sm font-black text-primary tabular-nums">{threshold} cm</span>}>
          <input
            type="range" min={5} max={50} step={5} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
        </Section>

        <Section title="Look-ahead window">
          <div className="grid grid-cols-3 gap-2">
            {HORIZONS.map((h) => (
              <button key={h.value} type="button" onClick={() => setHorizon(h.value)}
                className={`rounded-lg px-2 py-2 text-xs font-bold border transition ${
                  horizon === h.value ? "bg-primary/15 border-primary/40 text-foreground" : "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={horizon === h.value}
              >{h.label}</button>
            ))}
          </div>
        </Section>

        <Section title="Delivery">
          <div className="grid grid-cols-3 gap-2">
            {(["email", "push", "both"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDelivery(d)}
                className={`rounded-lg px-2 py-2 text-xs font-bold border transition capitalize ${
                  delivery === d ? "bg-primary/15 border-primary/40 text-foreground" : "bg-black/15 border-white/10 text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={delivery === d}
              >{d}</button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Push notifications need browser permission. Set this up from any region's Alerts page.</p>
        </Section>

        {update.isError && <Banner kind="error" title="Save failed">Please try again.</Banner>}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={regions.length === 0 || update.isPending}
            className="flex-1 rounded-lg bg-primary text-primary-foreground font-bold text-sm py-3 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>

        {savedAt && Date.now() - savedAt < 4000 && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Saved.
          </div>
        )}

        <details className="pt-6 border-t border-border" open={confirmingUnsub} onToggle={(e) => setConfirmingUnsub((e.target as HTMLDetailsElement).open)}>
          <summary className="cursor-pointer text-sm text-rose-400 hover:text-rose-300 font-bold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Unsubscribe from all alerts
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">Optional — let us know why so we can do better:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["too_many", "Too many alerts"],
                ["wrong_threshold", "Threshold isn't right"],
                ["not_relevant", "No longer relevant"],
                ["other", "Something else"],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="reason" value={val} checked={reason === val} onChange={(e) => setReason(e.target.value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={unsub.isPending}
              className="rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-sm px-4 py-2.5 hover:bg-rose-500/25 disabled:opacity-50"
            >
              {unsub.isPending ? "Unsubscribing…" : "Confirm unsubscribe"}
            </button>
          </div>
        </details>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto rounded-3xl glass border border-border p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}

function Section({ title, children, trailing }: { title: string; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function Banner({ kind, title, children }: { kind: "error" | "info"; title: string; children: React.ReactNode }) {
  const accent = kind === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return (
    <div className={`rounded-2xl border p-4 ${accent}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs mt-1 opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
