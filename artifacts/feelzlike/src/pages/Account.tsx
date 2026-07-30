import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  UserRound,
  BellRing,
  MapPin,
  Ruler,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  useGetAccount,
  useUpdateAccountProfile,
  useUpdateAccountAlerts,
} from "@workspace/api-client-react";
import type { AccountResponse } from "@workspace/api-client-react";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { ALERT_REGIONS } from "@/components/AlertSubscribeForm";

/**
 * /account · the signed-in member's home base. Shows their email, lets them
 * edit profile basics (home region, units) on the users row, and edit the
 * powder-alert subscription tied to their email — all session-authorised,
 * no manage token needed.
 *
 * Signed-out visitors get the free sign-up sheet (soft gate), never an error.
 */

const HORIZONS: Array<{ value: 24 | 48 | 72; label: string }> = [
  { value: 24, label: "next 24 hr" },
  { value: 48, label: "next 48 hr" },
  { value: 72, label: "next 72 hr" },
];

export default function Account() {
  const { isAuthenticated, isLoading: authLoading, promptSignUp } = useAuthAccount();

  // Signed-out visitors get the sign-up sheet · once, after auth resolves.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      promptSignUp({ feature: "account-page" });
    }
  }, [authLoading, isAuthenticated, promptSignUp]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> back
        </Link>

        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <UserRound className="w-3.5 h-3.5" /> your account
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2 leading-tight">
            alerts & details · one place
          </h1>
        </div>

        {authLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          </div>
        ) : !isAuthenticated ? (
          <SignedOutCard onSignUp={() => promptSignUp({ feature: "account-page" })} />
        ) : (
          <SignedInAccount />
        )}
      </div>
    </div>
  );
}

function SignedOutCard({ onSignUp }: { onSignUp: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-700">
          <UserRound className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">this page is for members</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            create a free account (magic-link email · no password) to manage your
            powder alerts, home region and units here.
          </p>
          <button
            type="button"
            onClick={onSignUp}
            className="mt-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 hover:bg-primary/90 transition"
          >
            create free account
          </button>
        </div>
      </div>
    </div>
  );
}

function SignedInAccount() {
  const { data, isLoading, isError, refetch } = useGetAccount({
    query: { queryKey: ["account"], retry: 1 },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
        couldn't load your account · try again in a moment.
      </div>
    );
  }

  return (
    <>
      {/* Email + sign out */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
            <UserRound className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">signed in as</p>
            <p className="text-sm font-bold text-foreground mt-0.5 break-all">{data.email ?? "member"}</p>
            <div className="mt-1 flex items-center gap-3">
              <a href="/api/logout" className="text-sm text-muted-foreground underline hover:text-foreground">
                sign out
              </a>
              <Link href="/premium" className="text-sm text-muted-foreground underline hover:text-foreground inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> premium hub
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ProfileCard
        initialHomeRegionId={data.profile.homeRegionId}
        initialUnits={data.profile.units === "imperial" ? "imperial" : "metric"}
      />

      <AlertsCard subscription={data.subscription} onChanged={() => void refetch()} />
    </>
  );
}

function ProfileCard({
  initialHomeRegionId,
  initialUnits,
}: {
  initialHomeRegionId: string | null;
  initialUnits: "metric" | "imperial";
}) {
  const [homeRegionId, setHomeRegionId] = useState<string>(initialHomeRegionId ?? "");
  const [units, setUnits] = useState<"metric" | "imperial">(initialUnits);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const update = useUpdateAccountProfile();

  const dirty = (homeRegionId || null) !== initialHomeRegionId || units !== initialUnits || savedAt !== null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({ data: { homeRegionId: homeRegionId || null, units } });
      setSavedAt(Date.now());
    } catch {
      /* surfaced below */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">your details</p>

      <div>
        <label htmlFor="home-region" className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" /> home region
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">the mountains you ride most · used to personalise what you see first.</p>
        <select
          id="home-region"
          value={homeRegionId}
          onChange={(e) => setHomeRegionId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">no home region</option>
          {ALERT_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nameEn.toLowerCase()} · {r.country.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
          <Ruler className="w-4 h-4 text-primary" /> units
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              aria-pressed={units === u}
              className={`rounded-lg px-2 py-2 text-xs font-bold border transition ${
                units === u
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {u === "metric" ? "metric · cm & °c" : "imperial · in & °f"}
            </button>
          ))}
        </div>
      </div>

      {update.isError && (
        <p className="text-sm text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          save failed · try again.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || update.isPending}
          className="rounded-lg bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          save details
        </button>
        {savedAt && Date.now() - savedAt < 60_000 && !update.isPending && !update.isError && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> saved
          </span>
        )}
      </div>
    </div>
  );
}

type Subscription = AccountResponse["subscription"];

function AlertsCard({ subscription, onChanged }: { subscription: Subscription; onChanged: () => void }) {
  const update = useUpdateAccountAlerts();
  const sub = subscription && typeof subscription === "object" ? subscription : null;

  const [regions, setRegions] = useState<string[]>(sub?.regions ?? []);
  const [threshold, setThreshold] = useState<number>(sub?.snowfallThresholdCm ?? 15);
  const [horizon, setHorizon] = useState<24 | 48 | 72>((sub?.horizonHours as 24 | 48 | 72) ?? 48);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, typeof ALERT_REGIONS> = {};
    for (const r of ALERT_REGIONS) {
      const key = r.country.split("·")[0]!.trim();
      (g[key] ??= []).push(r);
    }
    return g;
  }, []);

  if (!sub) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5" /> powder alerts
        </p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          no alert subscription on this email yet · set one up from the{" "}
          <Link href="/premium" className="underline hover:text-foreground">premium page</Link>{" "}
          and we'll email you when powder's on the way.
        </p>
      </div>
    );
  }

  if (sub.unsubscribed) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5" /> powder alerts
        </p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          you're unsubscribed from powder alerts · resubscribe anytime from the{" "}
          <Link href="/premium" className="underline hover:text-foreground">premium page</Link>.
        </p>
      </div>
    );
  }

  const toggleRegion = (id: string) => {
    setRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (regions.length === 0) return;
    try {
      await update.mutateAsync({
        data: {
          regions,
          mountains: sub.mountains,
          snowfallThresholdCm: threshold,
          horizonHours: horizon,
          delivery: sub.delivery,
          timezone: sub.timezone,
        },
      });
      setSavedAt(Date.now());
      onChanged();
    } catch {
      /* surfaced below */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5" /> powder alerts
        </p>
        {!sub.verified && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            your subscription isn't verified yet · check your inbox for the confirmation email.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-foreground mb-2">regions</p>
        <div className="space-y-3">
          {Object.entries(grouped).map(([country, rs]) => (
            <div key={country}>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {country.toLowerCase()}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rs.map((r) => {
                  const checked = regions.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRegion(r.id)}
                      aria-pressed={checked}
                      className={`text-left rounded-lg px-3 py-2 text-sm font-bold border transition ${
                        checked
                          ? "bg-primary/15 border-primary/40 text-foreground"
                          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r.nameEn.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-bold text-foreground">snowfall threshold</p>
          <span className="text-sm font-black text-primary tabular-nums">{threshold} cm</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
      </div>

      <div>
        <p className="text-sm font-bold text-foreground mb-1.5">look-ahead window</p>
        <div className="grid grid-cols-3 gap-2">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setHorizon(h.value)}
              aria-pressed={horizon === h.value}
              className={`rounded-lg px-2 py-2 text-xs font-bold border transition ${
                horizon === h.value
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {update.isError && (
        <p className="text-sm text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          save failed · try again.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={regions.length === 0 || update.isPending}
          className="rounded-lg bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          save alerts
        </button>
        {savedAt && Date.now() - savedAt < 60_000 && !update.isPending && !update.isError && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> saved
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        delivery method & unsubscribe stay in the manage link at the bottom of every alert email.
      </p>
    </div>
  );
}
