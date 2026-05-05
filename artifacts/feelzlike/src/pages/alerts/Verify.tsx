import { useEffect } from "react";
import { useVerifyAlertSubscription } from "@workspace/api-client-react";
import { Link } from "wouter";
import { CheckCircle2, AlertTriangle, Loader2, Snowflake } from "lucide-react";

/**
 * Top-level verification landing page. Reached from the link in the
 * verification email: /alerts/verify?token=...
 *
 * On success, surfaces a "manage your alerts" link the user can bookmark.
 */
export default function Verify() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const { data, error, isLoading, isError, refetch } = useVerifyAlertSubscription(
    { token },
    { query: { enabled: !!token, retry: false, queryKey: ["alerts", "verify", token] as const } },
  );

  useEffect(() => {
    if (data?.manageUrl) {
      try { window.history.replaceState({}, "", "/alerts/verify"); } catch { /* noop */ }
    }
  }, [data?.manageUrl]);

  if (!token) {
    return <PageShell tone="error" icon={<AlertTriangle className="w-10 h-10 text-rose-400" />} title="Missing token" subtitle="The link in your email looks incomplete. Try subscribing again." />;
  }

  if (isLoading) {
    return <PageShell tone="neutral" icon={<Loader2 className="w-10 h-10 text-sky-400 animate-spin" />} title="Confirming your subscription…" subtitle="One moment." />;
  }

  if (isError || !data) {
    const reason = (error as { data?: { reason?: string } } | null | undefined)?.data?.reason;
    const msg =
      reason === "expired" ? "Your verification link has expired. Subscribe again to receive a new one."
      : reason === "bad_signature" ? "This link doesn't look genuine. If you copied it from an email, try opening it directly instead."
      : "We couldn't confirm your subscription. Please try again or subscribe afresh.";
    return (
      <PageShell tone="error" icon={<AlertTriangle className="w-10 h-10 text-rose-400" />} title="Couldn't confirm" subtitle={msg}>
        <button onClick={() => refetch()} className="mt-4 rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-bold">
          Try again
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell tone="success" icon={<Snowflake className="w-10 h-10 text-sky-400" />} title="You're in. Powder incoming." subtitle={`We'll email ${data.email} when conditions match your alert.`}>
      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-center">
        <Link href="/" className="rounded-lg bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5">
          Back to FeelZlike
        </Link>
        <a href={data.manageUrl} className="text-sm text-muted-foreground hover:text-foreground underline">
          Manage your alert preferences
        </a>
      </div>
    </PageShell>
  );
}

function PageShell({ tone, icon, title, subtitle, children }: {
  tone: "success" | "error" | "neutral";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const accent = tone === "success" ? "border-emerald-500/30" : tone === "error" ? "border-rose-500/30" : "border-white/10";
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className={`max-w-md w-full text-center rounded-3xl glass border ${accent} p-8`}>
        <div className="flex justify-center mb-4"><CheckCircle2 className="hidden" />{icon}</div>
        <h1 className="text-2xl font-black text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
