import { ArrowRight, Mountain } from "lucide-react";
import { Link } from "wouter";
import { classifyRegionProximity } from "@/lib/regionProximity";

// A region to surface as the tap-through. distanceKm is only set when we know
// the visitor's location (the true "nearest" case); otherwise it's a softer
// "suggested region" fallback so the row still works when location is off.
export interface SuggestedRegion {
  id: string;
  name: string;
  href: string;
  feelsLikeC: number | null;
  distanceKm: number | null;
}

/**
 * The "near you" region suggestion row, extracted as a dependency-light
 * presentational component so its honest copy can be locked by a render test
 * (see NearYouRegionRow.test.tsx) without dragging in NearYou's geolocation /
 * react-query plumbing or the region PNG catalog.
 *
 * The framing decision (and therefore the visible label/copy) is driven purely
 * by `suggested.distanceKm` via classifyRegionProximity, so the wording can't
 * drift away from the proximity it represents:
 *   - distance null  -> "suggested region"        (location off / fallback)
 *   - distance far   -> "mountain region"         (+ "a long way from you")
 *   - distance near  -> "nearest mountain region"
 */
export function NearYouRegionRow({
  suggested,
  onSelect,
}: {
  suggested: SuggestedRegion;
  onSelect?: () => void;
}) {
  const isFar = classifyRegionProximity(suggested.distanceKm) === "far";
  return (
    <Link
      href={suggested.href}
      onClick={onSelect}
      className="group flex items-center justify-between gap-3 border-t border-sky-100 px-5 py-3.5 transition-colors hover:bg-sky-50/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Mountain className="h-5 w-5 shrink-0 text-sky-600" strokeWidth={1.75} />
        <div className="min-w-0">
          {isFar ? (
            <p className="mb-1 text-[12px] leading-snug text-slate-500">
              the mountains are a long way from you, but here's where we cover
            </p>
          ) : null}
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {suggested.distanceKm == null
              ? "suggested region"
              : isFar
                ? "mountain region"
                : "nearest mountain region"}
          </p>
          <p className="truncate text-[15px] font-semibold text-slate-900">
            {suggested.name.toLowerCase()}
          </p>
          <p className="text-[12px] tabular-nums text-slate-500">
            {suggested.distanceKm != null ? (
              <>{suggested.distanceKm.toLocaleString()} km away</>
            ) : null}
            {suggested.distanceKm != null && suggested.feelsLikeC != null ? " \u00b7 " : null}
            {suggested.feelsLikeC != null ? (
              <>feelzlike {suggested.feelsLikeC}&deg;</>
            ) : suggested.distanceKm == null ? (
              <>tap to explore the mountains</>
            ) : null}
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-sky-700 group-hover:text-sky-900">
        see
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
