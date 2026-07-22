import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Map, MapPin, Mountain, Search, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { REGIONS } from "@/regions";

// ── server payloads ────────────────────────────────────────────────
// GET /api/places/search returns locality predictions (no coordinates -
// Autocomplete does not carry them). Coordinates are fetched on selection.
interface PlaceResult {
  id: string;
  name: string;
  address: string;
}
interface PlaceSearchResponse {
  results: PlaceResult[];
}
// GET /api/places/details resolves a picked prediction to coordinates.
interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
}

// Flattened curated index across every region: towns, mountains and the
// regions themselves, each with its own search keys (en + ja). Curated
// matches are offered FIRST and navigate straight to the right page -
// this also covers names Google Autocomplete can't return at all: its
// locality-type filter excludes resort areas like Madarao Kogen, so relying
// on Google alone made our own towns unfindable. Built once at module load.
interface CuratedEntry {
  kind: "town" | "mountain" | "region";
  regionId: string;
  id: string;
  name: string;
  /** In-app path the pick navigates to. */
  href: string;
  /** Context line rendered beneath the name (already lowercase-friendly). */
  subtitle: string;
  /** Town centroid - only towns carry coordinates (used by matchCuratedTown). */
  lat?: number;
  lng?: number;
  /** Normalized english search keys beyond the name itself. */
  extraKeys: string[];
  /** Raw japanese search keys (normalizeName strips non-latin chars). */
  jaKeys: string[];
}

const CURATED_ENTRIES: CuratedEntry[] = REGIONS.flatMap((r) => {
  const entries: CuratedEntry[] = [];
  const townNames = new Set(
    (r.baseTowns ?? []).map((t) => normalizeName(t.name)),
  );

  for (const t of r.baseTowns ?? []) {
    const nearby = (r.mountains ?? []).filter((m) =>
      t.nearbyMountainIds?.includes(m.id),
    );
    entries.push({
      kind: "town",
      regionId: r.id,
      id: t.id,
      name: t.name,
      href: `/${r.id}/${t.id}`,
      subtitle: `${r.subtitle} · live conditions`,
      lat: t.lat,
      lng: t.lng,
      extraKeys: [r.name, ...nearby.map((m) => m.name)].map(normalizeName),
      jaKeys: [t.nameJa, ...nearby.map((m) => m.nameJa)].filter(
        (s): s is string => Boolean(s),
      ),
    });
  }

  for (const m of r.mountains ?? []) {
    // A mountain sharing its name with a base town (e.g. Nozawa Onsen) would
    // render a confusing duplicate row - the town page already leads there.
    if (townNames.has(normalizeName(m.name))) continue;
    entries.push({
      kind: "mountain",
      regionId: r.id,
      id: m.id,
      name: m.name,
      href: `/${r.id}/mountain/${m.id}`,
      subtitle: `${r.subtitle} · mountain forecast`,
      extraKeys: [r.name].map(normalizeName),
      jaKeys: m.nameJa ? [m.nameJa] : [],
    });
  }

  // A single-town region sharing its town's name (e.g. Zao Onsen) would
  // render a confusing duplicate row - the town page is the useful stop.
  const singleTownDuplicate =
    (r.baseTowns ?? []).length === 1 && townNames.has(normalizeName(r.name));
  if (singleTownDuplicate) return entries;

  entries.push({
    kind: "region",
    regionId: r.id,
    id: r.id,
    name: r.name,
    href: `/${r.id}/`,
    subtitle: `${r.subtitle} · pick a town`,
    extraKeys: [],
    jaKeys: [],
  });

  return entries;
});

// Rows tie-break town > mountain > region so the richest page wins the top slot.
const KIND_RANK: Record<CuratedEntry["kind"], number> = {
  town: 0,
  mountain: 1,
  region: 2,
};

/**
 * Curated entries matching the typed term, best-first: name prefix beats
 * name substring beats region/mountain key matches; towns outrank mountains
 * outrank regions on ties. Capped at 4 so Google predictions stay visible
 * beneath them.
 */
function curatedMatchesFor(q: string): CuratedEntry[] {
  const raw = q.trim();
  const nq = normalizeName(raw);
  const scored: Array<{ t: CuratedEntry; score: number }> = [];
  for (const t of CURATED_ENTRIES) {
    const nName = normalizeName(t.name);
    let score: number | null = null;
    if (nq && nName.startsWith(nq)) score = 0;
    else if (nq && nName.includes(nq)) score = 1;
    else if (nq && t.extraKeys.some((k) => k.includes(nq))) score = 2;
    else if (raw && t.jaKeys.some((k) => k.includes(raw))) score = 0;
    if (score != null) scored.push({ t, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score ||
      KIND_RANK[a.t.kind] - KIND_RANK[b.t.kind] ||
      a.t.name.localeCompare(b.t.name),
  );
  return scored.slice(0, 4).map((s) => s.t);
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Reconcile a picked place (resolved to a name + coordinates) against the
 * curated town registry. A name match (en or ja) accepts within 25km; proximity
 * alone accepts only within 6km, so we never grab a neighbouring town when there
 * is no name signal. Returns the matched town or null to fall back to /near-you.
 */
function matchCuratedTown(
  name: string,
  lat: number,
  lng: number,
): { regionId: string; id: string } | null {
  const towns = CURATED_ENTRIES.filter(
    (t): t is CuratedEntry & { lat: number; lng: number } =>
      t.kind === "town" && t.lat != null && t.lng != null,
  );
  const nName = normalizeName(name);
  const named = towns.filter(
    (t) =>
      normalizeName(t.name) === nName ||
      t.jaKeys.some((k) => k === name),
  );
  const pool = named.length > 0 ? named : towns;
  let best: (typeof towns)[number] | null = null;
  let bestKm = Infinity;
  for (const t of pool) {
    const km = distanceKm(lat, lng, t.lat, t.lng);
    if (km < bestKm) {
      bestKm = km;
      best = t;
    }
  }
  if (!best) return null;
  const limitKm = named.length > 0 ? 25 : 6;
  return bestKm <= limitKm ? { regionId: best.regionId, id: best.id } : null;
}

/**
 * Place lookup for the location-first landing. Lets a visitor type any town or
 * city and jump to its current conditions, alongside the GPS-detected card.
 *
 * Kept lightweight and friendly to Google's quota: queries only fire at 3+
 * characters, debounced ~350ms, capped at 5 results, with in-flight requests
 * cancelled via AbortSignal. Selecting a result navigates to /near-you with the
 * chosen coordinates so the full forecast + radar render there. We never log
 * precise coordinates - only the typed term and chosen place name.
 */
export function PlaceSearch({
  placeholder = "search any town or city",
  source = "home",
}: {
  placeholder?: string;
  source?: string;
}) {
  const [, navigate] = useLocation();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Id of the prediction currently being resolved to coordinates (blocks
  // double-picks and drives the row spinner); selectError shows if that lookup
  // fails so the pick never silently does nothing.
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Monotonic pick counter · lets an in-flight coord lookup notice the user has
  // since retyped or picked again, so a stale result never navigates.
  const pickSeq = useRef(0);

  // Debounce the typed term so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [term]);

  const enabled = debounced.length >= MIN_CHARS;
  const query = useQuery<PlaceSearchResponse>({
    queryKey: ["place-search", debounced],
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(debounced)}`,
        { signal },
      );
      if (!res.ok) throw new Error("search failed");
      return res.json();
    },
  });

  // Curated towns matched locally - shown first, above Google predictions.
  const curated = useMemo(
    () => (enabled ? curatedMatchesFor(debounced) : []),
    [enabled, debounced],
  );
  // Google predictions, minus any that duplicate a curated match by name.
  const results = (enabled ? query.data?.results ?? [] : []).filter(
    (r) => !curated.some((t) => normalizeName(t.name) === normalizeName(r.name)),
  );
  const rowCount = curated.length + results.length;

  // Close the dropdown on an outside click / tap.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // A curated pick needs no Google lookup - we already know the target page.
  function chooseCurated(t: CuratedEntry) {
    if (resolvingId) return;
    track("place_search_select", {
      category: "navigation",
      data: { source, name: t.name, curated: true, kind: t.kind },
    });
    pickSeq.current++;
    setResolvingId(null);
    setSelectError(false);
    setOpen(false);
    setTerm("");
    setDebounced("");
    setActiveIndex(-1);
    navigate(t.href);
  }

  async function choose(r: PlaceResult) {
    // Guard against a second pick while the first is still resolving coords.
    if (resolvingId) return;
    track("place_search_select", {
      category: "navigation",
      data: { source, name: r.name },
    });
    const myTurn = ++pickSeq.current;
    setResolvingId(r.id);
    setSelectError(false);

    // Autocomplete predictions carry no coordinates, so fetch them now. The
    // /near-you view and the curated-town match both need lat/lng.
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(r.id)}`,
      );
      if (!res.ok) throw new Error("details failed");
      const d = (await res.json()) as PlaceDetail;
      // The user retyped or picked again while this lookup was in flight - drop
      // the stale result so we never navigate somewhere they moved on from.
      if (pickSeq.current !== myTurn) return;
      if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) {
        throw new Error("no coordinates");
      }

      setResolvingId(null);
      setOpen(false);
      setTerm("");
      setDebounced("");
      setActiveIndex(-1);

      const name = d.name || r.name;
      // If the picked place is one of our curated towns, jump straight to its
      // rich town page; otherwise fall back to the location-first /near-you view.
      const town = matchCuratedTown(name, d.lat, d.lng);
      if (town) {
        navigate(`/${town.regionId}/${town.id}`);
        return;
      }

      const params = new URLSearchParams({
        lat: String(d.lat),
        lng: String(d.lng),
        name,
      });
      navigate(`/near-you?${params.toString()}`);
    } catch {
      if (pickSeq.current !== myTurn) return;
      setResolvingId(null);
      setSelectError(true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || rowCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rowCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIndex >= 0 ? activeIndex : 0;
      if (idx < curated.length) {
        const t = curated[idx];
        if (t) chooseCurated(t);
      } else {
        const r = results[idx - curated.length];
        if (r) void choose(r);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && enabled;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3.5 py-2 transition-colors focus-within:border-sky-300">
        <Search className="h-4 w-4 shrink-0 text-sky-500" strokeWidth={2} />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
            setSelectError(false);
            // Retyping mid-resolve invalidates the in-flight pick and clears its
            // spinner so a stale coord lookup can't navigate after the fact.
            if (resolvingId) {
              pickSeq.current++;
              setResolvingId(null);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="search for a place"
          autoComplete="off"
          className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        {term ? (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              setDebounced("");
              setOpen(false);
            }}
            aria-label="clear search"
            className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : query.isFetching ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.12)]">
          {query.isFetching && rowCount === 0 ? (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">searching…</p>
          ) : rowCount > 0 ? (
            <>
              <ul role="listbox">
                {curated.map((t, i) => (
                  <li
                    key={`curated-${t.kind}-${t.regionId}-${t.id}`}
                    role="option"
                    aria-selected={i === activeIndex}
                  >
                    <button
                      type="button"
                      disabled={resolvingId != null}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => chooseCurated(t)}
                      className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors disabled:cursor-default ${
                        i === activeIndex ? "bg-sky-50" : "hover:bg-sky-50"
                      }`}
                    >
                      {t.kind === "town" ? (
                        <MapPin
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                          strokeWidth={2}
                        />
                      ) : t.kind === "mountain" ? (
                        <Mountain
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                          strokeWidth={2}
                        />
                      ) : (
                        <Map
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                          strokeWidth={2}
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-slate-800">
                          {t.name.toLowerCase()}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">
                          {t.subtitle.toLowerCase()}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {results.map((r, i) => (
                  <li
                    key={r.id}
                    role="option"
                    aria-selected={curated.length + i === activeIndex}
                  >
                    <button
                      type="button"
                      disabled={resolvingId != null}
                      onMouseEnter={() => setActiveIndex(curated.length + i)}
                      onClick={() => void choose(r)}
                      className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors disabled:cursor-default ${
                        curated.length + i === activeIndex ? "bg-sky-50" : "hover:bg-sky-50"
                      }`}
                    >
                      {resolvingId === r.id ? (
                        <Loader2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-sky-500"
                          strokeWidth={2}
                        />
                      ) : (
                        <MapPin
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                          strokeWidth={2}
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-slate-800">
                          {r.name.toLowerCase()}
                        </span>
                        {r.address ? (
                          <span className="block truncate text-[11px] text-slate-400">
                            {r.address.toLowerCase()}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {selectError ? (
                <p className="border-t border-sky-50 px-3.5 py-2.5 text-[12px] text-slate-400">
                  couldn't load that place · try again
                </p>
              ) : null}
            </>
          ) : query.isError ? (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">
              search is unavailable right now
            </p>
          ) : (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">
              no places found · search works on names of towns · resorts ·
              regions, like niseko or jindabyne
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
