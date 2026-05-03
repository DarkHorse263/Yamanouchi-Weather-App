import { motion } from "framer-motion";
import { BedDouble, MapPin, Star } from "lucide-react";
import { useRegion, useLanguage, LiveBadge } from "@workspace/feelzlike-shell";
import { useNearbyPlaces } from "@/lib/places";
import { StayPlatformBar } from "@/components/StayPlatformBar";

/**
 * Region-wide accommodation page used as a default for any region whose
 * router does not provide its own Stay component. Uses Google Places centered
 * on the region's reference point and offers multi-platform booking comparison.
 */
export function RegionStay() {
  const { region } = useRegion();
  const { t } = useLanguage();

  // Use the first base town as a reference centre for the region.
  const center = region.baseTowns?.[0];

  const query = useNearbyPlaces(
    center
      ? { lat: center.lat, lng: center.lng, radius: 12000, kind: "stay", max: 24 }
      : null,
  );

  const places = query.data ?? [];
  const country = region.shortTag ?? "";

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">{region.name}</p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Stay", "宿泊")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Hotels, lodges and apartments across ${region.name}. Compare prices across the major booking sites.`,
                `${region.name}のホテル・ロッジ・アパートメント。主要予約サイトで価格を比較。`,
              )}
            </p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      <div className="mb-8">
        <StayPlatformBar
          variant="banner"
          country={country}
          query={region.name}
          lat={center?.lat}
          lng={center?.lng}
        />
      </div>

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-foreground">
            {t("Couldn't load nearby stays.", "周辺の宿泊施設を読み込めませんでした。")}{" "}
            <span className="text-muted-foreground">{(query.error as Error)?.message}</span>
          </p>
        </div>
      )}

      {query.isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!query.isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
              {p.photoUrl ? (
                <div className="aspect-[16/9] bg-secondary overflow-hidden">
                  <img src={p.photoUrl} alt={p.name} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-secondary flex items-center justify-center">
                  <BedDouble className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-display font-semibold text-base text-foreground leading-tight">{p.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {p.rating !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {p.rating.toFixed(1)}
                      {p.ratingCount !== undefined && <span className="text-muted-foreground/60">({p.ratingCount})</span>}
                    </span>
                  )}
                  {p.address && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.address.split(",")[0]}</span>
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t("Compare prices", "価格を比較")}
                  </p>
                  <StayPlatformBar
                    variant="card"
                    country={country}
                    query={`${p.name} ${region.name}`}
                    lat={p.lat ?? center?.lat}
                    lng={p.lng ?? center?.lng}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError && places.length === 0 && (
        <p className="text-muted-foreground">{t("No stays found in this region.", "この地域に宿泊施設は見つかりませんでした。")}</p>
      )}
    </div>
  );
}
