import { motion } from "framer-motion";
import { MapPin, Star, BedDouble, ExternalLink } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";
import {
  useNearbyPlaces,
  platformDeepLink,
  type NearbyPlace,
  type CountryCode,
} from "@/lib/places";
import { StayPlatformBar } from "@/components/StayPlatformBar";

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
                `Hotels, ryokan and lodges around ${town?.name ?? "town"} — compare prices across the major booking sites.`,
                `${town ? t(town.name, town.nameJa) : "町"}周辺のホテル・旅館・ロッジ。主要予約サイトで価格を比較。`,
              )}
            </p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {/* Multi-platform booking banner — search the whole town across 6–8 sites */}
      {town && (
        <div className="mb-8">
          <StayPlatformBar
            variant="banner"
            country={(region.shortTag as CountryCode) ?? "JP"}
            query={`${town.name}, ${region.name}`}
            lat={town.lat}
            lng={town.lng}
          />
        </div>
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
            <StayCard
              key={p.id}
              place={p}
              town={town!}
              regionName={region.name}
              country={(region.shortTag as CountryCode) ?? "JP"}
              t={t}
            />
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
  country,
  t,
}: {
  place: NearbyPlace;
  town: { name: string; lat: number; lng: number };
  regionName: string;
  country: CountryCode;
  t: (en: string, ja?: string) => string;
}) {
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

        {/*
          Per-card we keep ONE primary CTA only ("Check availability"). The
          full multi-platform spread already lives in the page-level banner
          at the top of TownStay, so repeating 8 brand pills on every card
          would be visual noise. Booking.com gives us the highest converting
          property-name deep-link + best affiliate revenue.
        */}
        <div className="mt-auto pt-4 flex items-stretch gap-2">
          <a
            href={platformDeepLink("booking", {
              query: `${place.name} ${town.name}`,
              lat: place.lat ?? town.lat,
              lng: place.lng ?? town.lng,
            })}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            {t("Check availability", "空室を確認")}
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
          {place.googleMapsUri && (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Open in Google Maps", "Googleマップで開く")}
              className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground w-9 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <MapPin className="w-4 h-4" />
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
