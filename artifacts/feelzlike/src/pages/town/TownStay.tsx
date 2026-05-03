import { motion } from "framer-motion";
import { ExternalLink, MapPin, Star, BedDouble } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";
import { useNearbyPlaces, bookingDeepLink, type NearbyPlace } from "@/lib/places";

export function TownStay() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const query = useNearbyPlaces(
    town
      ? { lat: town.lat, lng: town.lng, radius: town.radiusM ?? 5000, kind: "stay" }
      : null,
  );

  const places = query.data ?? [];

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {town ? t(town.name, town.nameJa) : t("Town", "町")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Stay", "宿泊")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Hotels, ryokan and lodges around ${town?.name ?? "town"} — search live availability on Booking.com.`,
                `${town ? t(town.name, town.nameJa) : "町"}周辺のホテル・旅館・ロッジ。Booking.comで空室を検索できます。`,
              )}
            </p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {/* Booking.com banner — search the whole town */}
      {town && (
        <a
          href={bookingDeepLink({ query: `${town.name}, ${region.name}`, lat: town.lat, lng: town.lng })}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-white p-5 transition-all hover:border-primary/40 hover:shadow-md mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[#003580] text-white px-3 py-2 font-bold text-sm tracking-tight">Booking.com</div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {t(`Search all stays in ${town.name}`, `${t(town.name, town.nameJa)}の宿泊施設をすべて検索`)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("Filter by dates, price and free cancellation", "日付・価格・無料キャンセルで絞込み")}
              </p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-foreground">
            {t("Couldn't load nearby stays.", "周辺の宿泊施設を読み込めませんでした。")}{" "}
            <span className="text-muted-foreground">{(query.error as Error)?.message}</span>
          </p>
        </div>
      )}

      {query.isLoading && <PlacesSkeleton />}

      {!query.isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((p) => (
            <StayCard key={p.id} place={p} town={town!} regionName={region.name} t={t} />
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError && places.length === 0 && (
        <p className="text-muted-foreground">
          {t("No stays found near this town.", "近隣の宿泊施設は見つかりませんでした。")}
        </p>
      )}
    </div>
  );
}

function StayCard({
  place,
  town,
  regionName,
  t,
}: {
  place: NearbyPlace;
  town: { name: string; lat: number; lng: number };
  regionName: string;
  t: (en: string, ja?: string) => string;
}) {
  const bookingHref = bookingDeepLink({
    query: `${place.name} ${town.name}`,
    lat: place.lat ?? town.lat,
    lng: place.lng ?? town.lng,
  });

  return (
    <article className="rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
      {place.photoUrl ? (
        <div className="aspect-[16/9] bg-secondary overflow-hidden">
          <img
            src={place.photoUrl}
            alt={place.name}
            loading="lazy"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-secondary flex items-center justify-center">
          <BedDouble className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base text-foreground leading-tight">
            {place.name}
          </h3>
          {place.priceLevel !== undefined && (
            <span className="byline text-muted-foreground shrink-0">
              {"$".repeat(Math.max(1, place.priceLevel))}
            </span>
          )}
        </div>

        {(place.rating !== undefined || place.address) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {place.rating !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {place.rating.toFixed(1)}
                {place.ratingCount !== undefined && (
                  <span className="text-muted-foreground/60">({place.ratingCount})</span>
                )}
              </span>
            )}
            {place.address && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{place.address.split(",")[0]}</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2">
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#003580] text-white text-xs font-semibold px-3 py-2 hover:bg-[#002a66] transition-colors"
          >
            {t("Book on Booking.com", "Booking.comで予約")}
            <ExternalLink className="w-3 h-3" />
          </a>
          {place.googleMapsUri && (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Open in Google Maps", "Googleマップで開く")}
              className="inline-flex items-center justify-center rounded-lg border border-border text-xs font-semibold w-9 h-9 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function PlacesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="aspect-[16/9] bg-secondary animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
            <div className="h-8 w-full rounded bg-secondary animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
