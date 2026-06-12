import { useState } from "react";
import { Star } from "lucide-react";
import { track } from "@/lib/analytics";
import {
  useFavourites,
  MAX_FAVOURITES,
  type FavouriteLocation,
} from "@/lib/favourites";

/**
 * Save-to-favourites toggle for a town hub. Pins the current town (up to
 * MAX_FAVOURITES) so it surfaces in the landing-page quick-access list. When
 * the user is already at capacity and tries to add a new one, shows a brief
 * inline hint rather than silently doing nothing.
 */
export function FavouriteStar({
  location,
  label = "save",
  savedLabel = "saved",
  fullHint,
}: {
  location: FavouriteLocation;
  label?: string;
  savedLabel?: string;
  /** Hint shown when at capacity. Defaults to an English brand-voice string. */
  fullHint?: string;
}) {
  const { isFavourite, toggle } = useFavourites();
  const saved = isFavourite(location.regionId, location.townId);
  const [blocked, setBlocked] = useState(false);

  const onClick = () => {
    const result = toggle(location);
    if (result.full) {
      setBlocked(true);
      window.setTimeout(() => setBlocked(false), 2600);
      return;
    }
    track(result.favourited ? "favourite_add" : "favourite_remove", {
      category: "ui",
      data: { region_id: location.regionId, town_id: location.townId },
    });
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={
          saved
            ? "inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3.5 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100"
            : "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700"
        }
      >
        <Star
          className={saved ? "h-4 w-4 fill-sky-500 text-sky-500" : "h-4 w-4"}
          strokeWidth={1.75}
        />
        {saved ? savedLabel : label}
      </button>
      {blocked ? (
        <span className="text-[11px] leading-snug text-slate-500">
          {fullHint ?? `${MAX_FAVOURITES} saved \u00b7 remove one first`}
        </span>
      ) : null}
    </div>
  );
}
