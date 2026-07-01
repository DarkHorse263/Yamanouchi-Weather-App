/**
 * Trip planner · travel-day layer.
 *
 * Once the best window is chosen the question becomes "can i actually get up
 * there on those days". This panel answers it honestly for the recommended
 * mountain · live road status where a feed is wired, published seasonal chain
 * rules otherwise, and the curated operators that run the route. Every block
 * labels its own data level so nothing reads as live when it isn't.
 */
import {
  useGetRoadConditions,
  type ChainStatus,
} from "@workspace/api-client-react";
import { getProvidersForRegion } from "@/data/transport";
import {
  Car,
  Route,
  Bus,
  Phone,
  ExternalLink,
  Snowflake,
  ShieldAlert,
} from "lucide-react";

// ─── data-level badges ──────────────────────────────────────────────────────

function LevelBadge({ level }: { level: "live" | "seasonal-rule" | "pending" | "curated" }) {
  const map = {
    live: { label: "live", cls: "bg-emerald-100 text-emerald-700" },
    "seasonal-rule": { label: "seasonal rule", cls: "bg-amber-100 text-amber-800" },
    pending: { label: "not wired", cls: "bg-slate-100 text-slate-600" },
    curated: { label: "curated", cls: "bg-sky-100 text-sky-700" },
  } as const;
  const s = map[level];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function roadStatusClasses(c: string): string {
  switch (c) {
    case "open":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "closed":
      return "bg-red-50 text-red-700 border-red-200";
    case "chains-required":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "caution":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "reduced-speed":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function chainReq(v: string): string {
  switch (v) {
    case "must-fit":
      return "fit chains";
    case "must-carry":
      return "carry chains";
    case "not-required":
      return "not required";
    default:
      return v;
  }
}

// ─── sub-blocks ─────────────────────────────────────────────────────────────

function ChainRow({ c }: { c: ChainStatus }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{c.approach.toLowerCase()}</p>
        <LevelBadge level={c.dataSource === "live" ? "live" : c.dataSource === "pending" ? "pending" : "seasonal-rule"} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-muted-foreground">
        <span>2wd · <span className="text-foreground font-semibold">{chainReq(c.chains2wd)}</span></span>
        <span>awd · <span className="text-foreground font-semibold">{chainReq(c.chainsAwd)}</span></span>
      </div>
      {c.note && <p className="text-[11px] text-muted-foreground/80 mt-1">{c.note}</p>}
    </div>
  );
}

// ─── panel ──────────────────────────────────────────────────────────────────

export function TravelDayPanel({
  regionId,
  mountainId,
  mountainName,
}: {
  regionId: string;
  mountainId: string;
  mountainName: string;
}) {
  const query = useGetRoadConditions(
    { region: regionId as never },
    { query: { enabled: true } as never },
  );

  const roads = (query.data?.roads ?? []).filter((r) =>
    (r.affectedResorts ?? []).includes(mountainId),
  );
  const chains = (query.data?.chainStatuses ?? []).filter(
    (c) => !c.mountainId || c.mountainId === mountainId,
  );
  const providers = getProvidersForRegion(regionId as never).filter(
    (p) => !p.mountains_served || p.mountains_served.includes(mountainId),
  );
  const liveTrafficUrl = query.data?.liveTrafficUrl;
  const hasRoads = roads.length > 0;
  const hasChains = chains.length > 0;
  const hasProviders = providers.length > 0;

  return (
    <div className="rounded-3xl border border-border bg-white p-5 md:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Route className="w-4 h-4 text-primary" />
        <h3 className="text-base font-black text-foreground">
          travel day · {mountainName.toLowerCase()}
        </h3>
      </div>
      <p className="text-[12px] text-muted-foreground -mt-3">
        getting up there on those days. always confirm with the official source before you leave.
      </p>

      {/* ── roads ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-muted-foreground" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">roads</h4>
        </div>
        {hasRoads ? (
          <div className="space-y-2">
            {roads.map((r) => (
              <div key={r.id} className={`rounded-xl border p-3 ${roadStatusClasses(r.condition)}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{r.roadName}</p>
                  <span className="text-xs font-semibold capitalize">{r.condition.replace(/-/g, " ")}</span>
                </div>
                <p className="text-[12px] opacity-90 mt-0.5">{r.description}</p>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground/80">source · {roads[0].source}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-3">
            <p className="text-[12px] text-muted-foreground">
              no live road feed wired for this region yet · check the official traffic source for closures and restrictions.
            </p>
            {liveTrafficUrl && (
              <a
                href={liveTrafficUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary mt-1.5 hover:underline"
              >
                official traffic <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </section>

      {/* ── chains ────────────────────────────────────────── */}
      {hasChains && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">chains</h4>
          </div>
          <div className="space-y-2">
            {chains.map((c) => (
              <ChainRow key={c.id} c={c} />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/80 inline-flex items-center gap-1">
            <Snowflake className="w-3 h-3" />
            {chains.some((c) => c.dataSource === "live")
              ? "chain status updates live from the road authority."
              : "chain rules reflect each road authority's published seasonal requirements, not a live reading."}
          </p>
        </section>
      )}

      {/* ── getting there ─────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">getting there</h4>
          </div>
          {hasProviders && <LevelBadge level="curated" />}
        </div>
        {hasProviders ? (
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-white p-3">
                <p className="text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{p.route_summary}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </a>
                  )}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                      website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {p.schedule_url && (
                    <a href={p.schedule_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                      timetable <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            no curated transport for this mountain yet · most visitors self-drive.
          </p>
        )}
      </section>
    </div>
  );
}
