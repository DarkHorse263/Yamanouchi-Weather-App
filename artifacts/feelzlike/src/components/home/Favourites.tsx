import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star, X } from "lucide-react";
import { getRegion } from "@/regions";
import { track } from "@/lib/analytics";
import { useFavourites, type FavouriteLocation } from "@/lib/favourites";

// Slice of GET /api/local-weather `current` we read for a favourite row. The
// cheap current endpoint (few vars, 1 day) is used deliberately · the expensive
// town-weather forecast is overkill for a one-line "feelzlike N°" readout.
interface LocalCurrentLite {
  feelsLikeC: number;
  tempC: number;
  description: string;
}

function FavouriteRow({
  fav,
  onRemove,
}: {
  fav: FavouriteLocation;
  onRemove: () => void;
}) {
  const region = getRegion(fav.regionId);
  const town = region?.baseTowns?.find((t) => t.id === fav.townId);
  const href = `/${fav.regionId}/${fav.townId}`;

  // Per-row cheap-current fetch. Degrades silently · if it fails or is in
  // flight the row still shows the name + region and links through.
  const weatherQ = useQuery<LocalCurrentLite | null>({
    queryKey: ["favourite-weather", fav.regionId, fav.townId],
    enabled: !!town,
    staleTime: 10 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(
        `/api/local-weather?latitude=${town!.lat}&longitude=${town!.lng}`,
      );
      if (!res.ok) throw new Error(`local-weather ${res.status}`);
      const body = await res.json();
      return (body?.current ?? null) as LocalCurrentLite | null;
    },
  });

  const current = weatherQ.data ?? null;
  const regionLabel = region ? region.name.toLowerCase() : fav.regionId.replace(/-/g, " ");

  return (
    <div className="group flex items-center border-t border-sky-100 first:border-t-0">
      <Link
        href={href}
        onClick={() =>
          track("favourite_open", {
            category: "navigation",
            data: { region_id: fav.regionId, town_id: fav.townId },
          })
        }
        className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pl-5 pr-2 transition-colors hover:bg-sky-50/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Star className="h-5 w-5 shrink-0 fill-sky-400 text-sky-400" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-900">
              {fav.townName.toLowerCase()}
            </p>
            <p className="truncate text-[12px] tabular-nums text-slate-500">
              {regionLabel}
              {current ? (
                <>
                  {" \u00b7 "}feelzlike {current.feelsLikeC}&deg;
                </>
              ) : null}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-sky-600 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`remove ${fav.townName} from favourites`}
        className="mr-2 shrink-0 rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Landing-page quick-access list of the user's saved towns (up to 3). Renders
 * nothing when the user has no favourites yet, so it stays invisible until they
 * pin their first town from a town hub.
 */
export function Favourites() {
  const { favourites, remove } = useFavourites();
  if (favourites.length === 0) return null;

  return (
    <section className="px-4 pt-4 md:px-6">
      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_24px_rgb(56,128,210,0.06)]">
        <div className="flex items-center gap-1.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">
          <Star className="h-3.5 w-3.5 fill-sky-400 text-sky-400" />
          your favourites
        </div>
        {favourites.map((fav) => (
          <FavouriteRow
            key={`${fav.regionId}/${fav.townId}`}
            fav={fav}
            onRemove={() => {
              remove(fav.regionId, fav.townId);
              track("favourite_remove", {
                category: "ui",
                data: { region_id: fav.regionId, town_id: fav.townId },
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}
