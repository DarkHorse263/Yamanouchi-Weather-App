import { motion } from "framer-motion";
import { AlertCircle, ExternalLink, MapPin, RefreshCw, Star, Utensils, UtensilsCrossed, Compass } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";
import { useNearbyPlaces, type NearbyPlace, type PlaceKind } from "@/lib/places";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/EmptyStateCard";

// TODO(feelzlike-launch): replace placeholder feedback address with the real
// inbox before public launch. Grep `FEEDBACK_EMAIL` to find every reference.
const FEEDBACK_EMAIL = "feedback@feelzlike.com";

interface Props {
  kind: Exclude<PlaceKind, "stay">;
  title: string;
  titleJa?: string;
  blurb: string;
  blurbJa?: string;
}

export function TownPlaces({ kind, title, titleJa, blurb, blurbJa }: Props) {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  // Stay/Eat use the town's tight `radiusM` (e.g. Yudanaka 700m, Shibu 400m) to keep
  // adjacent-town listings from duplicating. Explore is different: tourists pick a
  // base town to reach iconic regional destinations (Jigokudani Monkey Park is ~3km
  // from Yudanaka station - the whole reason people stay there). Use a wider floor
  // for explore so those headline POIs actually surface.
  const EXPLORE_MIN_RADIUS_M = 6000;
  const radius =
    kind === "explore"
      ? Math.max(town?.radiusM ?? 5000, EXPLORE_MIN_RADIUS_M)
      : (town?.radiusM ?? 5000);

  const query = useNearbyPlaces(
    town ? { lat: town.lat, lng: town.lng, radius, kind } : null,
  );

  const places = query.data ?? [];
  const Icon = kind === "eat" ? UtensilsCrossed : Compass;

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
              {t(title, titleJa)}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">{t(blurb, blurbJa)}</p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {query.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-white p-6 md:p-8 max-w-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-destructive/10 p-2.5 shrink-0">
              <AlertCircle className="w-5 h-5 text-destructive" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-semibold text-lg text-foreground">
                {t("Couldn't load nearby places", "周辺の場所を読み込めませんでした")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {t(
                  "We couldn't reach the places service just now. Please try again in a moment.",
                  "周辺情報サービスに接続できませんでした。しばらくしてから再度お試しください。",
                )}
              </p>
              {(query.error as Error | undefined)?.message && (
                <p className="byline text-muted-foreground/70 mt-3 break-all">
                  {(query.error as Error).message}
                </p>
              )}
              <div className="mt-5">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => query.refetch()}
                  disabled={query.isFetching}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1.5 ${query.isFetching ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  {query.isFetching ? t("Retrying…", "再試行中…") : t("Try again", "再試行")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {query.isLoading && <PlacesSkeleton />}

      {!query.isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((p) => (
            <PlaceCard key={p.id} place={p} Icon={Icon} t={t} />
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError && places.length === 0 && (
        kind === "eat" ? (
          <EmptyStateCard
            icon={Utensils}
            title={t("Eats launching shortly", "飲食リスト、まもなく公開")}
            body={t(
              `We're putting together a hand-picked guide to the best izakaya, ramen, cafés and bars in ${town?.name ?? "this town"}. Watch this space.`,
              `${town ? t(town.name, town.nameJa) : "この町"}のおすすめ居酒屋・ラーメン・カフェ・バーを厳選中。お楽しみに。`,
            )}
            eta={t("ETA: Next 14 days", "公開予定：14日以内")}
            ctaLabel={t("Suggest a spot", "おすすめを送る")}
            ctaHref={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Eat suggestion · ${region.name} · ${town?.name ?? ""}`)}`}
          />
        ) : (
          <EmptyStateCard
            icon={Compass}
            title={t("Nothing nearby just yet", "近隣にはまだ情報がありません")}
            body={t(
              `We couldn't find any attractions, parks or museums near ${town?.name ?? "this town"} on the map right now. Try a wider search or check back soon.`,
              `${town ? t(town.name, town.nameJa) : "この町"}周辺の観光地・公園・博物館は現在見つかりません。範囲を広げるか、後ほど再度ご確認ください。`,
            )}
          />
        )
      )}
    </div>
  );
}

function PlaceCard({
  place,
  Icon,
  t,
}: {
  place: NearbyPlace;
  Icon: React.ComponentType<{ className?: string }>;
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
          <Icon className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base text-foreground leading-tight">
            {place.name}
          </h3>
          {place.openNow !== undefined && (
            <span
              className={
                place.openNow
                  ? "byline text-emerald-700 shrink-0"
                  : "byline text-muted-foreground shrink-0"
              }
            >
              {place.openNow ? t("Open", "営業中") : t("Closed", "閉店")}
            </span>
          )}
        </div>

        {(place.rating !== undefined || place.address || place.priceLevel !== undefined) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {place.rating !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {place.rating.toFixed(1)}
                {place.ratingCount !== undefined && (
                  <span className="text-muted-foreground/60">({place.ratingCount})</span>
                )}
              </span>
            )}
            {place.priceLevel !== undefined && place.priceLevel > 0 && (
              <span>{"$".repeat(place.priceLevel)}</span>
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
          {place.googleMapsUri && (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-semibold px-3 py-2 hover:bg-foreground/90 transition-colors"
            >
              {t("Open in Maps", "マップで開く")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {place.websiteUri && (
            <a
              href={place.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Visit website", "ウェブサイト")}
              className="inline-flex items-center justify-center rounded-lg border border-border text-xs font-semibold w-9 h-9 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
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
