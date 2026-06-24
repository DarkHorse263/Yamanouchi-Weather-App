import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { track } from "@/lib/analytics";

// ── server payload (GET /api/places/search) ────────────────────────
interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
interface PlaceSearchResponse {
  results: PlaceResult[];
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

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
  const rootRef = useRef<HTMLDivElement>(null);

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

  const results = enabled ? query.data?.results ?? [] : [];

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

  function choose(r: PlaceResult) {
    track("place_search_select", {
      category: "navigation",
      data: { source, name: r.name },
    });
    setOpen(false);
    setTerm("");
    setDebounced("");
    setActiveIndex(-1);
    const params = new URLSearchParams({
      lat: String(r.lat),
      lng: String(r.lng),
      name: r.name,
    });
    navigate(`/near-you?${params.toString()}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex] ?? results[0];
      if (r) choose(r);
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
          {query.isFetching && results.length === 0 ? (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">searching…</p>
          ) : results.length > 0 ? (
            <ul role="listbox">
              {results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(r)}
                    className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                      i === activeIndex ? "bg-sky-50" : "hover:bg-sky-50"
                    }`}
                  >
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500"
                      strokeWidth={2}
                    />
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
          ) : query.isError ? (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">
              search is unavailable right now
            </p>
          ) : (
            <p className="px-3.5 py-3 text-[12px] text-slate-400">
              no places found
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
