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
interface PromoBucket {
  last30d: number;
  last7d: number;
}
interface StatsPayload {
  promoFunnel?: Record<string, PromoBucket>;
  alertSubscriptions30d?: number;
  alerts: SubsBucket;
  newsletter?: SubsBucket;
  newsletterSources?: Array<{ source: string; count: number }>;
  daily?: DailyPoint[];
}

interface EngagementPayload {
  visitors: { today: number; last7d: number; last30d: number; returning30d: number };
  pageViews: { last7d: number; last30d: number };
  topPages: Array<{ page: string; count: number }>;
  dailyVisitors: Array<{ day: string; visitors: number }>;
  events: Record<string, { total: number; last7d: number }>;
}

interface EmailIncident {
  id: string;
  email: string;
  type: "bounced" | "complained";
  reason: string | null;
  createdAt: string;
}
interface EmailIncidentsPayload {
  incidents: EmailIncident[];
}

interface RecentSignup {
  id: string;
  email: string;
  regions: string[];
  source?: string | null;
  verifiedAt: string | null;
  createdAt: string;
}
interface MemberRow {
  id: string;
  email: string | null;
  displayName: string | null;
  homeRegionId: string | null;
  createdAt: string;
}
interface SignupsPayload {
  alerts: RecentSignup[];
  newsletter?: RecentSignup[];
  members?: MemberRow[];
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

/**
 * EmailIncidentsCard · async Resend delivery failures.
 *
 * Resend can accept a send (HTTP 200) then hard-bounce or be marked as spam
 * minutes later — the synchronous send path never sees that, so a magic-link
 * visitor with a dead address just waits forever. POST /api/webhooks/resend
 * records those bounce/complaint events; this shows the latest 50 so the
 * owner can spot a bad sign-in address. We record only · we never auto-
 * unsubscribe a matching subscriber.
 */
function EmailIncidentsCard({ incidents }: { incidents: EmailIncident[] }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-1 lowercase">email delivery incidents</h3>
      <p className="text-xs text-muted-foreground mb-3">
        bounces & spam complaints reported by resend after a send was accepted · latest 50 ·
        recorded only, subscribers are never auto-removed
      </p>
      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">none · all mail is landing.</p>
      ) : (
        <ul className="divide-y text-sm">
          {incidents.map((i) => (
            <li key={i.id} className="py-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate">{i.email}</div>
                {i.reason ? (
                  <div className="text-xs text-muted-foreground truncate" title={i.reason}>
                    {i.reason}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    i.type === "complained"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {i.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(i.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * PromoFunnelCard · the snow-alert prompt funnel (shown → clicked → subscribed).
 *
 * "shown" / "clicked" / "dismissed" are first-party counters recorded by the
 * banner via POST /api/promo/event (anonymous aggregate tallies, no
 * identifiers, so they count EVERY visitor - not just analytics-consented
 * ones like the GA mirror does; expect these to read higher than GA).
 * "subscribed" is verified powder-alert subscribers from our own database.
 */
function PromoFunnelCard({
  promo,
  subscribed30d,
}: {
  promo?: Record<string, PromoBucket>;
  subscribed30d?: number;
}) {
  const fmt = (b?: PromoBucket) =>
    b ? `${b.last30d}` : "0";
  const sub7 = (b?: PromoBucket) => `+${b?.last7d ?? 0} last 7d`;
  const gaHref = "https://analytics.google.com/analytics/web/#/p544105028/reports/explorer?params=_u..nav%3Dmaui&r=all-events";
  if (!promo || subscribed30d === undefined) {
    return (
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-sm font-semibold mb-1 lowercase">snow-alert prompt · funnel</h3>
        <p className="text-sm text-muted-foreground">
          first-party shown and clicked counts are unavailable right now ·{" "}
          <a
            href={gaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-700 hover:underline"
          >
            check GA events <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    );
  }
  const steps = [
    { label: "shown", sub: `banner appeared · ${sub7(promo?.shown)}`, value: fmt(promo?.shown) },
    { label: "clicked", sub: `tapped set up alerts · ${sub7(promo?.clicked)}`, value: fmt(promo?.clicked) },
    { label: "subscribed", sub: "confirmed a powder-alert email", value: String(subscribed30d) },
    { label: "dismissed", sub: `closed the banner · ${sub7(promo?.dismissed)}`, value: fmt(promo?.dismissed) },
  ];
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold lowercase">snow-alert prompt · funnel</h3>
        <a
          href={gaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline whitespace-nowrap"
        >
          open GA events <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        last 30 days · real first-party counts from every visitor (not consent-gated, so they'll read higher
        than GA) · shown → clicked → subscribed tells you if the prompt converts.
      </p>
      <div className="flex items-stretch gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 rounded-md border bg-slate-50 px-3 py-2 min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="text-lg font-semibold tabular-nums">{s.value}</div>
              <div className="text-[11px] text-muted-foreground truncate" title={s.sub}>{s.sub}</div>
            </div>
            {i < 2 ? <span className="shrink-0 text-slate-300">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * EngagementCard · the partner-conversation numbers: real visitors, page
 * views, returning share, installed base. All first-party + cookieless
 * (counted server-side from POST /api/engagement/ping, bots filtered), so
 * unlike GA these count EVERY visitor. Counting starts from the first
 * publish that includes the ping - the dev preview has no real traffic.
 */
function EngagementCard({ e }: { e: EngagementPayload }) {
  const max = Math.max(1, ...e.dailyVisitors.map((d) => d.visitors));
  const maxPage = Math.max(1, ...e.topPages.map((p) => p.count));
  const returningPct = e.visitors.last30d > 0 ? Math.round((e.visitors.returning30d / e.visitors.last30d) * 100) : 0;
  const installs = e.events.pwa_install;
  const launches = e.events.pwa_launch;
  const empty = e.visitors.last30d === 0 && e.pageViews.last30d === 0;
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-1 lowercase">real engagement · every visitor counted</h3>
      <p className="text-xs text-muted-foreground mb-4">
        first-party, cookieless server counts (bots excluded) · not consent-gated, so these are the
        truthful totals for partner conversations · counting starts from the first publish
      </p>
      {empty ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4">
          no data yet · these counters only see real traffic on the published site - the dev preview
          has no real visitors. republish, then numbers appear here within minutes of the first visit.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="visitors today" value={e.visitors.today} />
            <Kpi label="visitors · 7d" value={e.visitors.last7d} sub={`${e.pageViews.last7d} page views`} />
            <Kpi label="visitors · 30d" value={e.visitors.last30d} sub={`${e.pageViews.last30d} page views`} />
            <Kpi label="returning · 30d" value={`${returningPct}%`} sub={`${e.visitors.returning30d} came back on another day`} />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-xs font-medium lowercase text-slate-700">daily visitors · last 30 days</div>
            </div>
            <div className="flex items-end gap-[3px] h-20" role="img" aria-label="daily unique visitors over the last 30 days">
              {e.dailyVisitors.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col justify-end h-full" title={`${new Date(d.day + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${d.visitors} visitors`}>
                  {d.visitors === 0 ? (
                    <div className="w-full h-[2px] rounded-sm bg-slate-200" />
                  ) : (
                    <div className="w-full rounded-t-sm bg-[#0055FF]" style={{ height: `${(d.visitors / max) * 100}%` }} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>30 days ago</span>
              <span>today</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <div className="text-xs font-medium lowercase text-slate-700 mb-2">most visited · last 30 days</div>
              {e.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">none yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {e.topPages.map((p) => (
                    <li key={p.page} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-slate-700">{p.page}</span>
                      <span className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                        <span className="block h-full rounded bg-[#0055FF]" style={{ width: `${(p.count / maxPage) * 100}%` }} />
                      </span>
                      <span className="tabular-nums text-slate-700 w-10 text-right">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs font-medium lowercase text-slate-700 mb-2">app installs</div>
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="installed" value={installs?.total ?? 0} sub={`+${installs?.last7d ?? 0} last 7d · android/desktop only`} />
                <Kpi label="home-screen opens" value={launches?.total ?? 0} sub={`+${launches?.last7d ?? 0} last 7d · includes iphone`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * PartnerLinksCard · first-party shown→clicked counters for partner booking
 * links (StayCard providers + Europcar car hire). Event keys arrive as
 * "partner_shown:<partner>" / "partner_clicked:<partner>" from
 * /api/engagement/ping - cookieless, so unlike GA these count EVERY visitor.
 */
function PartnerLinksCard({ e }: { e: EngagementPayload }) {
  const partners = new Map<string, { shown: number; shown7d: number; clicked: number; clicked7d: number }>();
  for (const [key, v] of Object.entries(e.events)) {
    const m = key.match(/^partner_(shown|clicked):(.+)$/);
    if (!m) continue;
    const p = partners.get(m[2]) ?? { shown: 0, shown7d: 0, clicked: 0, clicked7d: 0 };
    if (m[1] === "shown") { p.shown += v.total; p.shown7d += v.last7d; }
    else { p.clicked += v.total; p.clicked7d += v.last7d; }
    partners.set(m[2], p);
  }
  const rows = [...partners.entries()].sort((a, b) => b[1].clicked - a[1].clicked || b[1].shown - a[1].shown);
  const totalShown = rows.reduce((s, [, p]) => s + p.shown, 0);
  const totalClicked = rows.reduce((s, [, p]) => s + p.clicked, 0);
  const ctr = (shown: number, clicked: number) => (shown > 0 ? `${((clicked / shown) * 100).toFixed(1)}%` : "-");
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-1 lowercase">partner links · shown → clicked</h3>
      <p className="text-xs text-muted-foreground mb-4">
        first-party, cookieless counts of partner booking buttons rendered and tapped · every
        visitor counted, no GA needed · counting starts from the first publish with this card
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4">
          no data yet · these counters only see real traffic on the published site. republish, then
          numbers appear as visitors open stay and transport pages.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="links shown" value={totalShown} />
            <Kpi label="links clicked" value={totalClicked} />
            <Kpi label="click-through" value={ctr(totalShown, totalClicked)} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-muted-foreground text-left">
                <th className="pb-1.5 font-medium">partner</th>
                <th className="pb-1.5 font-medium text-right">shown</th>
                <th className="pb-1.5 font-medium text-right">clicked</th>
                <th className="pb-1.5 font-medium text-right">ctr</th>
                <th className="pb-1.5 font-medium text-right">7d clicks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, p]) => (
                <tr key={name} className="border-t">
                  <td className="py-1.5 text-slate-700">{name.replace(/_/g, ".")}</td>
                  <td className="py-1.5 text-right tabular-nums">{p.shown}</td>
                  <td className="py-1.5 text-right tabular-nums">{p.clicked}</td>
                  <td className="py-1.5 text-right tabular-nums">{ctr(p.shown, p.clicked)}</td>
                  <td className="py-1.5 text-right tabular-nums">{p.clicked7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DASHBOARDS: Array<{ label: string; sub: string; href: string }> = [
  // Deep-linked to the feelzlike property (p544105028) so it never opens
  // another business's Analytics account.
  { label: "google analytics", sub: "visitors · look for facebook / paid", href: "https://analytics.google.com/analytics/web/#/p544105028/reports/intelligenthome" },
  // Deep-linked with the owner's ad account (act=..., "Navigate Work"
  // portfolio) and the feelzlike pixel dataset · bare URLs land on whichever
  // account Meta last used (owner has several businesses, e.g. DarkHorse).
  { label: "meta ads manager", sub: "spend · clicks · cost per click", href: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=783794032394591" },
  { label: "meta events manager", sub: "pixel · clicks that actually landed", href: "https://business.facebook.com/events_manager2/list/dataset/1385564256750667/overview?act=783794032394591" },
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
  const emailIncidents = useAdminQuery<EmailIncidentsPayload>("email-incidents", "/email-incidents");
  const engagement = useAdminQuery<EngagementPayload>("engagement", "/engagement");

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
          {engagement.data ? <EngagementCard e={engagement.data} /> : null}
          {engagement.data ? <PartnerLinksCard e={engagement.data} /> : null}

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

          <PromoFunnelCard
            promo={stats.data.promoFunnel}
            subscribed30d={stats.data.alertSubscriptions30d}
          />

          <div className="grid lg:grid-cols-2 gap-4">
            <SubsCard title="powder-alert subscribers" b={stats.data.alerts} />
            {stats.data.newsletter ? <SubsCard title="newsletter subscribers" b={stats.data.newsletter} /> : null}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {stats.data.newsletterSources ? <SourcesCard sources={stats.data.newsletterSources} /> : null}
            <DashboardLinks />
          </div>

          {emailIncidents.data ? (
            <EmailIncidentsCard incidents={emailIncidents.data.incidents} />
          ) : null}

          {signups.data ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {signups.data.members ? <MembersTable rows={signups.data.members} /> : null}
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

function MembersTable({ rows }: { rows: MemberRow[] }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold mb-3 lowercase">member accounts · recent</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">none yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate">{r.email ?? "no email"}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.displayName ?? "-"}
                  {r.homeRegionId ? ` · ${r.homeRegionId}` : ""}
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                joined {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
