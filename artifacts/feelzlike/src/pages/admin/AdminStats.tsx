import { AdminLayout, AdminForbidden } from "./AdminLayout";
import { useAdminQuery, AdminApiError } from "./useAdminFetch";

interface SubsBucket {
  total: number;
  verified: number;
  pending: number;
  unsubscribed: number;
  new7d: number;
}
interface StatsPayload {
  alerts: SubsBucket;
}

interface RecentSignup {
  id: string;
  email: string;
  regions: string[];
  verifiedAt: string | null;
  createdAt: string;
}
interface SignupsPayload {
  alerts: RecentSignup[];
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
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SubsCard title="powder-alert subscribers" b={stats.data.alerts} />
          </div>

          {signups.data ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <RecentSignupsTable title="alerts · recent signups" rows={signups.data.alerts} />
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminLayout>
  );
}

function RecentSignupsTable({ title, rows }: { title: string; rows: RecentSignup[] }) {
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
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {r.verifiedAt ? "✓ verified" : "pending"} · {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
