import { AdminLayout, AdminForbidden } from "./AdminLayout";
import { adminFetch, useAdminQuery } from "./useAdminFetch";
import { ExternalLink, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SubsBucket {
  total: number;
  verified: number;
  pending: number;
  unsubscribed: number;
  new7d: number;
}
interface DailyPoint {
  day: string; // YYYY-MM-DD
  alerts: number;
  newsletter: number;
}
interface StatsPayload {
  alerts: SubsBucket;
  newsletter?: SubsBucket;
  newsletterSources?: Array<{ source: string; count: number }>;
  daily?: DailyPoint[];
}

interface RecentSignup {
  id: string;
  email: string;
  regions: string[];
  source?: string | null;
  verifiedAt: string | null;
  createdAt: string;
}
interface SignupsPayload {
  alerts: RecentSignup[];
  newsletter?: RecentSignup[];
}

function Kpi({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground mt-1">{sub}</div> : null}
    </div>
  );
}

function SubsCard({ title, b }: { title: string; b: SubsBucket }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-3 lowercase">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <div><div className="text-xs text-muted-foreground">total</div><div className="text-lg font-semibold tabular-nums">{b.total}</div></div>
        <div><div className="text-xs text-muted-foreground">verified</div><div className="text-lg font-semibold tabular-nums text-emerald-700">{b.verified}</div></div>
        <div><div className="text-xs text-muted-foreground">pending</div><div className="text-lg font-semibold tabular-nums text-amber-700">{b.pending}</div></div>
        <div><div className="text-xs text-muted-foreground">unsubbed</div><div className="text-lg font-semibold tabular-nums text-rose-700">{b.unsubscribed}</div></div>
        <div><div className="text-xs text-muted-foreground">7d new</div><div className="text-lg font-semibold tabular-nums text-sky-700">+{b.new7d}</div></div>
      </div>
    </div>
  );
}

/** Lightweight 30-day dual-series bar strip · no chart lib needed. */
function TrendStrip({ daily }: { daily: DailyPoint[] }) {
  const max = Math.max(1, ...daily.map((d) => d.alerts + d.newsletter));
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold lowercase">signups · last 30 days</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500 inline-block" /> alerts</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-400 inline-block" /> newsletter</span>
        </div>
      </div>
      <div className="flex items-end gap-[3px] h-24" role="img" aria-label="daily signups over the last 30 days">
        {daily.map((d) => {
          const total = d.alerts + d.newsletter;
          const label = `${new Date(d.day + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${d.alerts} alerts · ${d.newsletter} newsletter`;
          return (
            <div key={d.day} className="flex-1 flex flex-col justify-end h-full group relative" title={label}>
              {total === 0 ? (
                <div className="w-full h-[2px] rounded-sm bg-slate-200" />
              ) : (
                <>
                  <div className="w-full rounded-t-sm bg-indigo-400" style={{ height: `${(d.newsletter / max) * 100}%` }} />
                  <div className={`w-full bg-sky-500 ${d.newsletter === 0 ? "rounded-t-sm" : ""}`} style={{ height: `${(d.alerts / max) * 100}%` }} />
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
        <span>30 days ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

function SourcesCard({ sources }: { sources: Array<{ source: string; count: number }> }) {
  const max = Math.max(1, ...sources.map((s) => s.count));
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-1 lowercase">where newsletter signups came from</h3>
      <p className="text-xs text-muted-foreground mb-3">which parts of the site convert · "premium" = the premium hub</p>
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">none yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.source} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-slate-700">{s.source}</span>
              <span className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                <span className="block h-full rounded bg-sky-500" style={{ width: `${(s.count / max) * 100}%` }} />
              </span>
              <span className="tabular-nums text-slate-700 w-8 text-right">{s.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DASHBOARDS: Array<{ label: string; sub: string; href: string }> = [
  { label: "google analytics", sub: "visitors · look for facebook / paid", href: "https://analytics.google.com/" },
  // Both Meta links open an account picker first · a bare /manage/campaigns
  // URL lands on whichever ad account Meta last used (the owner has several
  // businesses), which sent the owner to the wrong account. Once the
  // feelzlike ad account id is known, deep-link with ?act=<id> instead.
  { label: "meta ads manager", sub: "spend · clicks · cost per click · pick the feelzlike account", href: "https://adsmanager.facebook.com/adsmanager/manage/accounts" },
  { label: "meta events manager", sub: "pixel · clicks that actually landed · pick the feelzlike account", href: "https://business.facebook.com/events_manager2/overview" },
  { label: "search console", sub: "google search · indexing progress", href: "https://search.google.com/search-console" },
];

function DashboardLinks() {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-3 lowercase">other scoreboards</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {DASHBOARDS.map((d) => (
          <a
            key={d.label}
            href={d.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium lowercase">{d.label}</div>
              <div className="text-xs text-muted-foreground truncate">{d.sub}</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AdminStats() {
  const stats = useAdminQuery<StatsPayload>("stats", "/stats");
  const signups = useAdminQuery<SignupsPayload>("signups", "/recent-signups");

  return (
    <AdminLayout active="stats">
      {stats.error?.status === 403 || signups.error?.status === 403 ? (
        <AdminForbidden />
      ) : stats.isLoading ? (
        <div className="text-sm text-muted-foreground">loading stats…</div>
      ) : stats.error ? (
        <div className="text-sm text-rose-700">failed to load stats · {stats.error.message}</div>
      ) : stats.data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="alerts (verified)" value={stats.data.alerts.verified} sub={`+${stats.data.alerts.new7d} last 7d`} />
            {stats.data.newsletter ? (
              <Kpi label="newsletter (verified)" value={stats.data.newsletter.verified} sub={`+${stats.data.newsletter.new7d} last 7d`} />
            ) : null}
            <Kpi
              label="all signups · 7d"
              value={stats.data.alerts.new7d + (stats.data.newsletter?.new7d ?? 0)}
              sub="alerts + newsletter"
            />
            <Kpi
              label="pending verify"
              value={stats.data.alerts.pending + (stats.data.newsletter?.pending ?? 0)}
              sub="clicked subscribe · not yet confirmed email"
            />
          </div>

          {stats.data.daily && stats.data.daily.length > 0 ? <TrendStrip daily={stats.data.daily} /> : null}

          <div className="grid lg:grid-cols-2 gap-4">
            <SubsCard title="powder-alert subscribers" b={stats.data.alerts} />
            {stats.data.newsletter ? <SubsCard title="newsletter subscribers" b={stats.data.newsletter} /> : null}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {stats.data.newsletterSources ? <SourcesCard sources={stats.data.newsletterSources} /> : null}
            <DashboardLinks />
          </div>

          {signups.data ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <RecentSignupsTable title="alerts · recent signups" list="alerts" rows={signups.data.alerts} />
              {signups.data.newsletter ? (
                <RecentSignupsTable title="newsletter · recent signups" list="newsletter" rows={signups.data.newsletter} showSource />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminLayout>
  );
}

function RecentSignupsTable({
  title,
  list,
  rows,
  showSource,
}: {
  title: string;
  list: "alerts" | "newsletter";
  rows: RecentSignup[];
  showSource?: boolean;
}) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => adminFetch<{ deleted: string }>(`/signups/${list}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "signups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-3 lowercase">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">none yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate">{r.email}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.regions.length ? r.regions.join(" · ") : "all regions"}
                  {showSource && r.source ? ` · via ${r.source}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                <span>
                  {r.verifiedAt ? "✓ verified" : "pending"} · {new Date(r.createdAt).toLocaleDateString()}
                </span>
                {!r.verifiedAt ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`remove pending signup ${r.email}?`)) {
                        remove.mutate(r.id);
                      }
                    }}
                    disabled={remove.isPending}
                    title="remove this pending signup"
                    aria-label={`remove pending signup ${r.email}`}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {remove.isError ? (
        <p className="mt-2 text-xs text-rose-700">couldn't remove · {(remove.error as Error).message}</p>
      ) : null}
    </div>
  );
}
