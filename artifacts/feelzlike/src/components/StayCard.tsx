import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  MapPin,
  Mountain,
  Phone,
  Snowflake,
  Sparkles,
} from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Stay } from "@/types/stayEat";
import { cn } from "@/lib/utils";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_SHORT_LABELS,
  PROVIDER_BRAND_COLOURS,
  buildBookingLinks,
  type Provider,
} from "@/lib/affiliateLinks";

// Render order: keep the major OTAs first, then regional, then official last
// (rendered by the website branch below). `tripadvisor` and `official` are
// excluded here - Tripadvisor is a discovery surface (less booking intent),
// and `official` has its own neutral-styled button further down.
const PROVIDER_ORDER: readonly Provider[] = PROVIDERS.filter(
  (p) => p !== "tripadvisor" && p !== "official",
);

const TYPE_BADGE: Record<Stay["type"], { label: string; className: string }> = {
  ryokan:     { label: "RYOKAN",     className: "bg-rose-50    text-rose-900    ring-rose-200" },
  hotel:      { label: "HOTEL",      className: "bg-sky-50     text-sky-900     ring-sky-200" },
  lodge:      { label: "LODGE",      className: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  apartment:  { label: "APARTMENT",  className: "bg-amber-50   text-amber-900   ring-amber-200" },
  airbnb:     { label: "AIRBNB",     className: "bg-pink-50    text-pink-900    ring-pink-200" },
  hostel:     { label: "HOSTEL",     className: "bg-violet-50  text-violet-900  ring-violet-200" },
  minshuku:   { label: "MINSHUKU",   className: "bg-rose-50    text-rose-900    ring-rose-200" },
  guesthouse: { label: "GUESTHOUSE", className: "bg-violet-50  text-violet-900  ring-violet-200" },
  resort:     { label: "RESORT",     className: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  motel:      { label: "MOTEL",      className: "bg-slate-100  text-slate-900   ring-slate-200" },
  cabin:      { label: "CABIN",      className: "bg-amber-50   text-amber-900   ring-amber-200" },
  bnb:        { label: "B&B",        className: "bg-amber-50   text-amber-900   ring-amber-200" },
};

function titleCaseSlug(slug: string): string {
  return slug
    .split("_")
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function PriceBand({ band }: { band: Stay["price_band"] }) {
  if (!band) return null;
  const filled = band.length;
  return (
    <span
      role="img"
      aria-label={`Price band: ${band} (${filled} of 4)`}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= filled ? "bg-foreground" : "bg-foreground/15",
          )}
        />
      ))}
    </span>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={`No photos available for ${name}`}
      className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center"
    >
      <ImageIcon className="h-10 w-10 text-slate-300" aria-hidden />
    </div>
  );
}

function PhotoFrame({ url, alt, name }: { url: string; alt: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <Placeholder name={name} />;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}

function PhotoCarousel({ photos, name }: { photos: readonly string[]; name: string }) {
  const validPhotos = useMemo(() => photos.filter(Boolean), [photos]);
  if (validPhotos.length === 0) return <Placeholder name={name} />;
  return (
    <Carousel opts={{ loop: validPhotos.length > 1 }} className="w-full group">
      <CarouselContent>
        {validPhotos.map((url, i) => (
          <CarouselItem key={`${url}-${i}`}>
            <PhotoFrame url={url} alt={`${name} - photo ${i + 1} of ${validPhotos.length}`} name={name} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {validPhotos.length > 1 && (
        <>
          <CarouselPrevious
            className="left-2 size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Previous photo"
          />
          <CarouselNext
            className="right-2 size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Next photo"
          />
        </>
      )}
    </Carousel>
  );
}

type ChipTone = "neutral" | "warm" | "cool" | "ok" | "warn";

function FeatureChip({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  tone?: ChipTone;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  const toneClass: Record<ChipTone, string> = {
    neutral: "bg-muted text-foreground/80 ring-border",
    warm:    "bg-amber-50  text-amber-900  ring-amber-200",
    cool:    "bg-sky-50    text-sky-900    ring-sky-200",
    ok:      "bg-emerald-50 text-emerald-900 ring-emerald-200",
    warn:    "bg-rose-50   text-rose-900   ring-rose-200",
  };
  const cls = toneClass[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1",
        cls,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}

function topMountainChips(stay: Stay, max = 2): { name: string; min: number }[] {
  const each = stay.drive_min_to_each_mountain;
  if (!each) {
    if (stay.nearest_mountain && stay.drive_min_to_nearest_mountain != null) {
      return [{ name: stay.nearest_mountain, min: stay.drive_min_to_nearest_mountain }];
    }
    return [];
  }
  const sorted = Object.entries(each)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .sort((a, b) => a[1] - b[1])
    .slice(0, max)
    .map(([k, v]) => ({ name: titleCaseSlug(k), min: v }));
  return sorted;
}

function FeatureBadges({ stay }: { stay: Stay }) {
  if (stay.country === "AU") {
    return (
      <div className="flex flex-wrap gap-1">
        {stay.drying_room === "yes" ? <FeatureChip label="Drying room" tone="warm" icon={Flame} /> : null}
        {stay.ski_storage === "yes" ? <FeatureChip label="Ski storage" tone="cool" icon={Snowflake} /> : null}
        {stay.self_contained === "yes" ? <FeatureChip label="Self-contained" tone="neutral" /> : null}
        {stay.pet_friendly === "yes" ? <FeatureChip label="Pet-friendly" tone="ok" /> : null}
      </div>
    );
  }
  // JP
  const onsenLabel: Record<NonNullable<typeof stay.onsen>, string> = {
    none: "No onsen",
    private: "Private onsen",
    public: "Public onsen",
    both: "Public + private onsen",
  };
  const tattooLabel: Record<
    NonNullable<typeof stay.tattoo_policy>,
    { label: string; tone: ChipTone }
  > = {
    allowed:      { label: "Tattoo: OK",            tone: "ok" },
    private_only: { label: "Tattoo: private only",  tone: "warm" },
    not_allowed:  { label: "Tattoo: not allowed",   tone: "warn" },
    unknown:      { label: "Tattoo: ask",           tone: "neutral" },
  };
  const mealLabel: Record<NonNullable<typeof stay.meal_plan>, string> = {
    none: "No meals",
    breakfast: "Breakfast",
    dinner: "Dinner",
    kaiseki: "Kaiseki dinner",
    half_board: "Half board",
    full_board: "Full board",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {stay.onsen && stay.onsen !== "none" ? (
        <FeatureChip label={onsenLabel[stay.onsen]} tone="warm" icon={Flame} />
      ) : null}
      {stay.tattoo_policy ? (
        <FeatureChip
          label={tattooLabel[stay.tattoo_policy].label}
          tone={tattooLabel[stay.tattoo_policy].tone}
        />
      ) : null}
      {stay.meal_plan && stay.meal_plan !== "none" ? (
        <FeatureChip label={mealLabel[stay.meal_plan]} tone="neutral" icon={Sparkles} />
      ) : null}
      {stay.yukata_provided === "yes" ? <FeatureChip label="Yukata" tone="cool" /> : null}
    </div>
  );
}

function EnglishIndicator({ stay }: { stay: Stay }) {
  if (stay.country !== "JP" || !stay.english_spoken) return null;
  const labels = {
    yes:     { text: "EN: Fluent",  tone: "ok" as const },
    limited: { text: "EN: Limited", tone: "warn" as const },
    no:      { text: "EN: None",    tone: "warn" as const },
  };
  const { text, tone } = labels[stay.english_spoken];
  const toneClass = tone === "ok"
    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
    : "bg-rose-50 text-rose-900 ring-rose-200";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", toneClass)}>
      {text}
    </span>
  );
}

interface BookingButtonsProps {
  stay: Stay;
  variant?: "card" | "detail";
}

function BookingButtons({ stay, variant = "card" }: BookingButtonsProps) {
  // Single source of truth for booking URLs - `buildBookingLinks` returns
  // only providers the data team curated (default mode), with affiliate IDs
  // injected from env vars and JP-only providers filtered out of AU stays.
  // See `lib/affiliateLinks.ts`.
  const links = buildBookingLinks(stay);
  const provided = PROVIDER_ORDER.filter((id) => {
    const url = links[id];
    return typeof url === "string" && url.length > 0;
  });
  const officialHref = links.official;
  if (provided.length === 0 && !officialHref) return null;

  const sizeCls =
    variant === "detail"
      ? "px-3 py-1.5 text-xs"
      : "px-2.5 py-1 text-[11px]";

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {provided.map((id) => {
        const brand = PROVIDER_BRAND_COLOURS[id];
        const label = PROVIDER_LABELS[id];
        const short = PROVIDER_SHORT_LABELS[id];
        const href = links[id];
        if (!href) return null;
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Book ${stay.name} on ${label}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md font-bold transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
              sizeCls,
            )}
            style={{ backgroundColor: brand.bg, color: brand.fg }}
          >
            {variant === "detail" ? label : short}
            <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
          </a>
        );
      })}
      {officialHref ? (
        <a
          href={officialHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit official site for ${stay.name}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-md ring-1 ring-border bg-background text-foreground/80 font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            sizeCls,
          )}
        >
          <Globe className="h-3 w-3" aria-hidden />
          {variant === "detail" ? "Official site" : "Official"}
        </a>
      ) : null}
    </div>
  );
}

function Globe({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) {
  // Keep the import surface tiny - inline a hairline globe rather than pulling
  // another lucide icon for one button. aria-hidden handled by caller.
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function buildMapsHref(stay: Stay): string | null {
  if (typeof stay.lat !== "number" || typeof stay.lng !== "number") return null;
  const q = encodeURIComponent(`${stay.name} ${stay.address ?? ""}`.trim());
  // Universal geo: link works on iOS Apple Maps, Android Google Maps, and
  // desktop browsers (which fall back to Google Maps web).
  return `https://www.google.com/maps/search/?api=1&query=${q}&center=${stay.lat},${stay.lng}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to execCommand fallback below
  }
  return false;
}

export function StayDetailSheet({ stay }: { stay: Stay }) {
  const [copied, setCopied] = useState(false);
  const mapsHref = buildMapsHref(stay);
  const allMountains = stay.drive_min_to_each_mountain ?? null;

  return (
    <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
      <div className="relative">
        <PhotoCarousel photos={stay.photos} name={stay.name} />
      </div>
      <SheetHeader className="px-6 pt-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1", TYPE_BADGE[stay.type].className)}>
                {TYPE_BADGE[stay.type].label}
              </span>
              <PriceBand band={stay.price_band} />
            </div>
            <SheetTitle className="font-display text-2xl mt-2 leading-tight">{stay.name}</SheetTitle>
            {stay.name_local ? (
              <p className="byline text-sm mt-1 text-muted-foreground">{stay.name_local}</p>
            ) : null}
          </div>
        </div>
        <SheetDescription className="sr-only">
          Full details for {stay.name} including amenities, address, and booking links.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 py-4 space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90">{stay.long_description}</p>

        <FeatureBadges stay={stay} />
        <EnglishIndicator stay={stay} />

        {allMountains ? (
          <section aria-labelledby="drive-times">
            <h3 id="drive-times" className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">
              Drive times to mountains
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(allMountains).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5 text-foreground/60" aria-hidden />
                    {titleCaseSlug(k)}
                  </span>
                  <span className="font-semibold tabular-nums">{v == null ? "-" : `${v} min`}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stay.amenities.length > 0 ? (
          <section aria-labelledby="amenities">
            <h3 id="amenities" className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">
              Amenities
            </h3>
            <ul className="flex flex-wrap gap-1">
              {stay.amenities.map((a) => (
                <li key={a} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stay.address ? (
          <section aria-labelledby="address">
            <h3 id="address" className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">
              Address
            </h3>
            <div className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <p className="leading-snug text-foreground/85 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-foreground/60" aria-hidden />
                <span>{stay.address}</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] shrink-0"
                onClick={async () => {
                  const ok = await copyToClipboard(stay.address ?? "");
                  if (ok) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }
                }}
                aria-label={copied ? "Address copied" : "Copy address"}
              >
                <Copy className="h-3 w-3 mr-1" aria-hidden />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mapsHref ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md ring-1 ring-border bg-background text-foreground/80 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                  aria-label={`Open ${stay.name} in Maps`}
                >
                  <MapPin className="h-3 w-3" aria-hidden />
                  Open in Maps
                </a>
              ) : null}
              {stay.phone ? (
                <a
                  href={`tel:${stay.phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1 rounded-md ring-1 ring-border bg-background text-foreground/80 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                  aria-label={`Call ${stay.name}`}
                >
                  <Phone className="h-3 w-3" aria-hidden />
                  {stay.phone}
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="book">
          <h3 id="book" className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">
            Book this stay
          </h3>
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">From $- · prices coming soon</p>
            <BookingButtons stay={stay} variant="detail" />
          </div>
        </section>
      </div>
    </SheetContent>
  );
}

export interface StayCardProps {
  stay: Stay;
  className?: string;
  /**
   * Controlled detail-sheet open state. When omitted, the card runs in
   * uncontrolled mode (Radix manages open/close internally - the original
   * behavior). When provided, the parent owns the state - this is how
   * `TownStay` URL-syncs the open sheet via `?stay={stayId}`.
   */
  open?: boolean;
  /**
   * Fired when the controlled sheet would change open state (Radix calls
   * this on trigger click and on outside/escape close). Required when `open`
   * is supplied; ignored otherwise.
   */
  onOpenChange?: (open: boolean) => void;
}

export function StayCard({
  stay,
  className,
  open,
  onOpenChange,
}: StayCardProps) {
  const drives = topMountainChips(stay, 2);
  return (
    <article
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Photo carousel sits OUTSIDE the Sheet trigger so its prev/next
          buttons don't violate the no-button-inside-button HTML rule. */}
      <PhotoCarousel photos={stay.photos} name={stay.name} />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="text-left px-4 pt-3 pb-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
            aria-label={`View full details for ${stay.name}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1", TYPE_BADGE[stay.type].className)}>
                {TYPE_BADGE[stay.type].label}
              </span>
              <PriceBand band={stay.price_band} />
              <EnglishIndicator stay={stay} />
            </div>

            <h3 className="font-display text-lg leading-tight mt-2 text-foreground">{stay.name}</h3>
            {stay.name_local ? (
              <p className="byline text-xs text-muted-foreground mt-0.5">{stay.name_local}</p>
            ) : null}

            <p className="text-sm text-foreground/75 mt-2 line-clamp-1">{stay.short_description}</p>

            {drives.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground/70">
                <Mountain className="h-3 w-3 text-foreground/50" aria-hidden />
                {drives.map((d, i) => (
                  <span key={d.name} className="tabular-nums">
                    {i > 0 ? <span className="mx-1 text-foreground/30">·</span> : null}
                    → {d.name} {d.min}min
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-2">
              <FeatureBadges stay={stay} />
            </div>
          </button>
        </SheetTrigger>
        <StayDetailSheet stay={stay} />
      </Sheet>

      <div className="px-4 pt-2 pb-3 mt-auto">
        <BookingButtons stay={stay} variant="card" />
      </div>
    </article>
  );
}
