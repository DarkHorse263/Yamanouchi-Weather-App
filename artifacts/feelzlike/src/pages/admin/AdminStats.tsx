import { AdminLayout, AdminForbidden } from "./AdminLayout";
import { useAdminQuery, AdminApiError } from "./useAdminFetch";

interface SubsBucket {
  total: number;
  verified: number;
  pending: number;
  unsubscribed: number;
  new7d: number;
}
interface NewsBucket {
  windowDays: number;
  totalClicks: number;
  sponsoredClicks: number;
  editorialClicks: number;
  top: Array<{
    newsId: string;
    source: string | null;
    category: string | null;
    sponsored: boolean;
    clicks: number;
  }>;
}
interface StatsPayload {
  newsletter: SubsBucket;
  alerts: SubsBucket;
  news: NewsBucket;
}

interface RecentSignup {
  id: string;
  email: string;
  regions: string[];
  verifiedAt: string | null;
  createdAt: string;
}
interface SignupsPayload {
  newsletter: RecentSignup[];
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
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="newsletter (verified)" value={stats.data.newsletter.verified} sub={`+${stats.data.newsletter.new7d} last 7d`} />
            <Kpi label="alerts (verified)" value={stats.data.alerts.verified} sub={`+${stats.data.alerts.new7d} last 7d`} />
            <Kpi label="news clicks · 30d" value={stats.data.news.totalClicks} sub={`${stats.data.news.sponsoredClicks} sponsored · ${stats.data.news.editorialClicks} editorial`} />
            <Kpi label="sponsored CTR share" value={
              stats.data.news.totalClicks > 0
                ? `${Math.round((stats.data.news.sponsoredClicks / stats.data.news.totalClicks) * 100)}%`
                : "—"
            } sub="of all news clicks" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SubsCard title="newsletter subscribers" b={stats.data.newsletter} />
            <SubsCard title="powder-alert subscribers" b={stats.data.alerts} />
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h3 className="text-sm font-semibold mb-3 lowercase">top news clicks · last 30 days</h3>
            {stats.data.news.top.length === 0 ? (
              <p className="text-sm text-muted-foreground">no clicks recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2">id</th>
                    <th>source</th>
                    <th>category</th>
                    <th>type</th>
                    <th className="text-right">clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.data.news.top.map((r) => (
                    <tr key={r.newsId} className="border-t">
                      <td className="py-2 font-mono text-[11px]">{r.newsId}</td>
                      <td>{r.source ?? "—"}</td>
                      <td className="text-muted-foreground">{r.category ?? "—"}</td>
                      <td>
                        {r.sponsored ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] uppercase font-bold">sponsored</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">editorial</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums font-semibold">{r.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {signups.data ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <RecentSignupsTable title="newsletter · recent signups" rows={signups.data.newsletter} />
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
