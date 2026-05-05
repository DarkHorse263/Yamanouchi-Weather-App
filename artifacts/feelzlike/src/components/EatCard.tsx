import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Beer,
  Calendar,
  Camera,
  Coffee,
  Copy,
  CreditCard,
  ExternalLink,
  Fuel,
  Image as ImageIcon,
  Languages,
  Leaf,
  MapPin,
  Phone,
  Quote,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Soup,
  UtensilsCrossed,
  Wine,
  Wheat,
  type LucideIcon,
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
import { isOpenNow, type OpenNowResult, type OpenNowStatus } from "@/lib/openNow";
import type { Eat } from "@/types/stayEat";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Type badge — every Eat.type from the schema covered (defensive: data may
// grow). Tone keeps the same warm/cool/neutral palette family as StayCard so
// the two cards feel like siblings.
// ---------------------------------------------------------------------------
const TYPE_BADGE: Record<Eat["type"], { label: string; className: string; icon: LucideIcon }> = {
  ramen:           { label: "RAMEN",       className: "bg-rose-50    text-rose-900    ring-rose-200",       icon: Soup },
  izakaya:         { label: "IZAKAYA",     className: "bg-amber-50   text-amber-900   ring-amber-200",      icon: Wine },
  cafe:            { label: "CAFE",        className: "bg-stone-100  text-stone-900   ring-stone-200",      icon: Coffee },
  restaurant:      { label: "RESTAURANT", className: "bg-slate-100  text-slate-900   ring-slate-200",      icon: UtensilsCrossed },
  bar:             { label: "BAR",         className: "bg-violet-50  text-violet-900  ring-violet-200",     icon: Wine },
  pub:             { label: "PUB",         className: "bg-amber-50   text-amber-900   ring-amber-200",      icon: Beer },
  bakery:          { label: "BAKERY",      className: "bg-orange-50  text-orange-900  ring-orange-200",     icon: Wheat },
  fast_food:       { label: "FAST FOOD",   className: "bg-yellow-50  text-yellow-900  ring-yellow-200",     icon: UtensilsCrossed },
  diner:           { label: "DINER",       className: "bg-sky-50     text-sky-900     ring-sky-200",        icon: UtensilsCrossed },
  food_truck:      { label: "FOOD TRUCK",  className: "bg-emerald-50 text-emerald-900 ring-emerald-200",    icon: UtensilsCrossed },
  grocery:         { label: "GROCERY",     className: "bg-emerald-50 text-emerald-900 ring-emerald-200",    icon: ShoppingBag },
  supermarket:     { label: "GROCERY",     className: "bg-emerald-50 text-emerald-900 ring-emerald-200",    icon: ShoppingCart },
  bottle_shop:     { label: "BOTTLE SHOP", className: "bg-violet-50  text-violet-900  ring-violet-200",     icon: Wine },
  "service-station": { label: "FUEL",      className: "bg-zinc-100   text-zinc-900    ring-zinc-200",       icon: Fuel },
};

// ---------------------------------------------------------------------------
// Price band — identical visual treatment to StayCard (4 dots, fill = level)
// so the two card families render comparable price signals at a glance.
// ---------------------------------------------------------------------------
function PriceBand({ band }: { band: Eat["price_band"] }) {
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

// ---------------------------------------------------------------------------
// Photo placeholder — type-iconographic so a missing photo still says
// "this is a ramen shop" rather than reading as a generic empty card.
// ---------------------------------------------------------------------------
function Placeholder({ name, type }: { name: string; type: Eat["type"] }) {
  const Icon = TYPE_BADGE[type]?.icon ?? ImageIcon;
  return (
    <div
      role="img"
      aria-label={`No photos available for ${name}`}
      className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center"
    >
      <Icon className="h-10 w-10 text-slate-300" aria-hidden />
    </div>
  );
}

function PhotoFrame({ url, alt, name, type }: { url: string; alt: string; name: string; type: Eat["type"] }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <Placeholder name={name} type={type} />;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

function HeroPhoto({
  photos,
  name,
  type,
  className,
}: {
  photos: readonly string[];
  name: string;
  type: Eat["type"];
  className?: string;
}) {
  const valid = useMemo(() => photos.filter(Boolean), [photos]);
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {valid.length === 0 ? (
        <Placeholder name={name} type={type} />
      ) : (
        <PhotoFrame url={valid[0]} alt={`${name} — photo`} name={name} type={type} />
      )}
    </div>
  );
}

function PhotoCarousel({ photos, name, type }: { photos: readonly string[]; name: string; type: Eat["type"] }) {
  const valid = useMemo(() => photos.filter(Boolean), [photos]);
  if (valid.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Placeholder name={name} type={type} />
      </div>
    );
  }
  return (
    <Carousel opts={{ loop: valid.length > 1 }} className="w-full group">
      <CarouselContent>
        {valid.map((url, i) => (
          <CarouselItem key={`${url}-${i}`}>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              <PhotoFrame
                url={url}
                alt={`${name} — photo ${i + 1} of ${valid.length}`}
                name={name}
                type={type}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {valid.length > 1 && (
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

// ---------------------------------------------------------------------------
// Open-now pill — colour-by-status. The actual `isOpenNow` body returns
// 'unknown' until Prompt 3.4 plugs in the timezone-aware logic; the badge
// already auto-reschedules off `result.nextChange` so it'll start ticking
// the moment 3.4 lands without any further wiring.
// ---------------------------------------------------------------------------
const OPEN_NOW_TONE: Record<OpenNowStatus, string> = {
  open:         "bg-emerald-50 text-emerald-900 ring-emerald-200",
  closing_soon: "bg-amber-50   text-amber-900   ring-amber-200",
  closed:       "bg-rose-50    text-rose-900    ring-rose-200",
  unknown:      "bg-muted      text-muted-foreground ring-border",
};

// Cap the longest a card may sleep before re-evaluating. `isOpenNow` returns
// a `nextChange` Date computed in TZ-minute space (now + deltaMinutes * 60000)
// which is correct under a stable UTC offset but drifts by ~1h around DST
// transitions (AEDT↔AEST in Australia). Re-running classification at most
// every 15 minutes bounds that drift to 15min in the worst case (the actual
// open/closed STATUS is always correct because it's derived via Intl on each
// evaluation — only the *scheduling* of the next re-render can drift).
const OPEN_NOW_MAX_TIMER_MS = 15 * 60 * 1000;

function OpenNowPill({ eat }: { eat: Eat }) {
  // Re-render at result.nextChange so a card naturally flips Open → Closed
  // without a page refresh. We hold the result in state and refresh it on a
  // timer derived from the function's own `nextChange`. Falls back to a
  // 15-min poll when nextChange is unknown, and caps the timer at 15min
  // even when nextChange is set (DST drift bound — see comment above).
  const [result, setResult] = useState<OpenNowResult>(() => isOpenNow(eat));
  useEffect(() => {
    setResult(isOpenNow(eat));
  }, [eat]);
  useEffect(() => {
    const next = result.nextChange;
    const desired = next ? next.getTime() - Date.now() : OPEN_NOW_MAX_TIMER_MS;
    const ms = Math.max(1000, Math.min(desired, OPEN_NOW_MAX_TIMER_MS));
    const handle = window.setTimeout(() => setResult(isOpenNow(eat)), ms);
    return () => window.clearTimeout(handle);
  }, [eat, result]);

  return (
    <span
      role="status"
      aria-label={`Status: ${result.message}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1",
        OPEN_NOW_TONE[result.status],
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          result.status === "open"         && "bg-emerald-500",
          result.status === "closing_soon" && "bg-amber-500",
          result.status === "closed"       && "bg-rose-500",
          result.status === "unknown"      && "bg-foreground/30",
        )}
      />
      {result.message}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Cuisine chips — capped at 3 to keep the row scannable; "+N" overflow chip
// signals there's more in the detail sheet.
// ---------------------------------------------------------------------------
function CuisineChips({ cuisine, max = 3 }: { cuisine: readonly string[]; max?: number }) {
  if (cuisine.length === 0) return null;
  const shown = cuisine.slice(0, max);
  const overflow = cuisine.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((c) => (
        <span
          key={c}
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80 ring-1 ring-border"
        >
          {c}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Critical badges row — compact icons signalling traveller-relevant facts:
// payment, English menu, vegetarian, après-ski, takeaway, groceries.
// Tone matches StayCard's FeatureChip system.
// ---------------------------------------------------------------------------
type ChipTone = "neutral" | "warm" | "cool" | "ok" | "warn";

function FeatureChip({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  tone?: ChipTone;
  icon?: LucideIcon;
}) {
  const toneClass: Record<ChipTone, string> = {
    neutral: "bg-muted text-foreground/80 ring-border",
    warm:    "bg-amber-50  text-amber-900  ring-amber-200",
    cool:    "bg-sky-50    text-sky-900    ring-sky-200",
    ok:      "bg-emerald-50 text-emerald-900 ring-emerald-200",
    warn:    "bg-rose-50   text-rose-900   ring-rose-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1",
        toneClass[tone],
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}

function CriticalBadges({ eat }: { eat: Eat }) {
  const chips: React.ReactNode[] = [];

  // Payment — only flag the noteworthy cases (cash-only is a real
  // friction-point in rural Nagano; cards-accepted in Japan is worth
  // signalling). Don't show "cards accepted" for AU since it's the default
  // assumption and clutters the row.
  if (eat.payment === "cash_only") {
    chips.push(<FeatureChip key="cash" label="Cash only" tone="warn" icon={Banknote} />);
  } else if (eat.country === "JP" && eat.payment === "cards_accepted") {
    chips.push(<FeatureChip key="cards" label="Cards OK" tone="ok" icon={CreditCard} />);
  }

  // English menu — Japan-only signal; AU defaults to English so the chip
  // would be noise.
  if (eat.country === "JP" && eat.english_menu) {
    if (eat.english_menu === "yes") {
      chips.push(<FeatureChip key="enmenu" label="EN menu" tone="ok" icon={Languages} />);
    } else if (eat.english_menu === "picture_menu") {
      chips.push(<FeatureChip key="picmenu" label="Picture menu" tone="cool" icon={Camera} />);
    } else if (eat.english_menu === "limited") {
      chips.push(<FeatureChip key="enltd" label="EN: limited" tone="warm" icon={Languages} />);
    }
    // 'no' → silent (absence of the chip is the signal — no false promises)
  }

  if (eat.country === "AU") {
    if (eat.apres_ski === "yes") {
      chips.push(<FeatureChip key="apres" label="Après-ski" tone="cool" icon={Snowflake} />);
    }
    if (eat.takeaway === "yes") {
      chips.push(<FeatureChip key="takeaway" label="Takeaway" tone="neutral" icon={ShoppingBag} />);
    }
    if (eat.groceries === "yes") {
      chips.push(<FeatureChip key="grocery" label="Groceries" tone="ok" icon={ShoppingCart} />);
    }
  } else {
    if (eat.vegetarian_friendly === "yes") {
      chips.push(<FeatureChip key="veg" label="Veg-friendly" tone="ok" icon={Leaf} />);
    } else if (eat.vegetarian_friendly === "limited") {
      chips.push(<FeatureChip key="vegltd" label="Veg: limited" tone="warm" icon={Leaf} />);
    }
    if (eat.kid_friendly === "yes") {
      chips.push(<FeatureChip key="kid" label="Kid-friendly" tone="cool" />);
    }
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1">{chips}</div>;
}

// ---------------------------------------------------------------------------
// Action helpers — phone link normaliser + maps deep-link (same shape as
// StayCard so behaviour matches across surfaces).
// ---------------------------------------------------------------------------
function telHref(phone: string | null): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function buildMapsHref(eat: Eat): string | null {
  if (typeof eat.lat !== "number" || typeof eat.lng !== "number") return null;
  const q = encodeURIComponent(`${eat.name} ${eat.address ?? ""}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}&center=${eat.lat},${eat.lng}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

// ---------------------------------------------------------------------------
// Action row — Reserve / Call / Directions. Reserve is conditional on
// `reservation_link`; Call on `phone`; Directions on lat/lng. Buttons
// stop-propagate so taps don't also trigger the parent sheet.
// ---------------------------------------------------------------------------
function ActionRow({ eat, variant = "card" }: { eat: Eat; variant?: "card" | "detail" }) {
  const reserve = eat.reservation_link;
  const call = telHref(eat.phone);
  const maps = buildMapsHref(eat);
  if (!reserve && !call && !maps) return null;

  const sizeCls =
    variant === "detail" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {reserve ? (
        <a
          href={reserve}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={`Reserve a table at ${eat.name}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-foreground text-background font-bold transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            sizeCls,
          )}
        >
          <Calendar className="h-3 w-3" aria-hidden />
          Reserve
          <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
        </a>
      ) : null}
      {call ? (
        <a
          href={call}
          aria-label={`Call ${eat.name}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-md ring-1 ring-border bg-background text-foreground/80 font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            sizeCls,
          )}
        >
          <Phone className="h-3 w-3" aria-hidden />
          Call
        </a>
      ) : null}
      {maps ? (
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Get directions to ${eat.name}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-md ring-1 ring-border bg-background text-foreground/80 font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            sizeCls,
          )}
        >
          <MapPin className="h-3 w-3" aria-hidden />
          Directions
        </a>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hours table — used in the detail sheet. Highlights the current weekday so
// the visitor immediately sees today's hours without parsing the table.
// ---------------------------------------------------------------------------
const DAY_ORDER: ReadonlyArray<{ key: keyof NonNullable<Eat["hours"]>; label: string }> = [
  { key: "monday",    label: "Mon" },
  { key: "tuesday",   label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday",  label: "Thu" },
  { key: "friday",    label: "Fri" },
  { key: "saturday",  label: "Sat" },
  { key: "sunday",    label: "Sun" },
];

function todayKey(): keyof NonNullable<Eat["hours"]> {
  // Best-effort local-day. Prompt 3.4 will switch this to the eat's town
  // timezone so a Sydney user looking at a Tokyo restaurant sees Tokyo's
  // current weekday highlighted.
  const idx = new Date().getDay(); // 0=Sun … 6=Sat
  const map: ReadonlyArray<keyof NonNullable<Eat["hours"]>> = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  ];
  return map[idx];
}

function HoursTable({ hours }: { hours: Eat["hours"] }) {
  if (!hours) return null;
  const today = todayKey();
  return (
    <ul className="divide-y divide-border rounded-md ring-1 ring-border overflow-hidden">
      {DAY_ORDER.map(({ key, label }) => {
        const value = hours[key];
        const isToday = key === today;
        return (
          <li
            key={key}
            className={cn(
              "flex items-center justify-between px-3 py-1.5 text-xs",
              isToday ? "bg-muted/60 font-semibold" : "bg-background",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-foreground/70 w-9">{label}</span>
              {isToday ? (
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">today</span>
              ) : null}
            </span>
            <span className="tabular-nums text-foreground/85">{value ? value : "—"}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Detail sheet — exported so callers (e.g. TownEat's `?eat={id}` deep-link
// pattern) can render it standalone without re-mounting the card list.
// Shape mirrors StayDetailSheet for visual consistency.
// ---------------------------------------------------------------------------
export function EatDetailSheet({ eat }: { eat: Eat }) {
  const [copied, setCopied] = useState(false);
  const typeBadge = TYPE_BADGE[eat.type];

  return (
    <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
      <div className="relative">
        <PhotoCarousel photos={eat.photos} name={eat.name} type={eat.type} />
      </div>
      <SheetHeader className="px-6 pt-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1",
                  typeBadge.className,
                )}
              >
                <typeBadge.icon className="h-3 w-3" aria-hidden />
                {typeBadge.label}
              </span>
              <PriceBand band={eat.price_band} />
              <OpenNowPill eat={eat} />
            </div>
            <SheetTitle className="font-display text-2xl mt-2 leading-tight">{eat.name}</SheetTitle>
            {eat.name_local ? (
              <p className="byline text-sm mt-1 text-muted-foreground">{eat.name_local}</p>
            ) : null}
          </div>
        </div>
        <SheetDescription className="sr-only">
          Full details for {eat.name} including hours, address, and reservation links.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 py-4 space-y-5">
        <p className="text-sm leading-relaxed text-foreground/90">{eat.long_description}</p>

        <CuisineChips cuisine={eat.cuisine} max={20} />
        <CriticalBadges eat={eat} />

        {eat.signature_dishes.length > 0 ? (
          <section aria-labelledby="dishes">
            <h3
              id="dishes"
              className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Signature dishes
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {eat.signature_dishes.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <Quote className="h-3 w-3 mt-0.5 shrink-0 text-foreground/50" aria-hidden />
                  <span className="italic">{d}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {eat.hours ? (
          <section aria-labelledby="hours">
            <h3
              id="hours"
              className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Hours
            </h3>
            <HoursTable hours={eat.hours} />
            {eat.last_order_time ? (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Last order: <span className="font-semibold tabular-nums">{eat.last_order_time}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {eat.address ? (
          <section aria-labelledby="address">
            <h3
              id="address"
              className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Address
            </h3>
            <div className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <p className="leading-snug text-foreground/85 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-foreground/60" aria-hidden />
                <span>{eat.address}</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] shrink-0"
                onClick={async () => {
                  const ok = await copyToClipboard(eat.address ?? "");
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
            <div className="mt-2">
              <ActionRow eat={eat} variant="detail" />
            </div>
          </section>
        ) : (
          <ActionRow eat={eat} variant="detail" />
        )}
      </div>
    </SheetContent>
  );
}

// ---------------------------------------------------------------------------
// Main card. Controlled-open hooks (`open`/`onOpenChange`) match StayCard
// exactly so TownEat can mount a single page-level <Sheet> wired to the
// `?eat={id}` URL param (same idiom that 2.6 architect-fix established for
// stays — avoids dead controlled state on every list card).
// ---------------------------------------------------------------------------
export interface EatCardProps {
  eat: Eat;
  className?: string;
  /** Controlled detail-sheet open state. Omit for uncontrolled (Radix manages it). */
  open?: boolean;
  /** Required when `open` is supplied; ignored otherwise. */
  onOpenChange?: (open: boolean) => void;
}

export function EatCard({ eat, className, open, onOpenChange }: EatCardProps) {
  const typeBadge = TYPE_BADGE[eat.type];
  return (
    <article
      className={cn(
        "group/card flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Photo: 4:3 on mobile (top), fixed-width on sm+ (left ~30%). */}
      <HeroPhoto
        photos={eat.photos}
        name={eat.name}
        type={eat.type}
        className="aspect-[4/3] w-full sm:aspect-auto sm:w-44 sm:shrink-0 sm:self-stretch"
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Single trigger covers the full text area — same focus-visible
            ring approach as StayCard so the two cards feel identical to
            keyboard users. */}
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex-1 text-left px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
            aria-label={`View full details for ${eat.name}`}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1",
                    typeBadge.className,
                  )}
                >
                  <typeBadge.icon className="h-3 w-3" aria-hidden />
                  {typeBadge.label}
                </span>
                <PriceBand band={eat.price_band} />
              </div>
              <OpenNowPill eat={eat} />
            </div>

            <h3 className="font-display text-lg leading-tight mt-2 text-foreground">{eat.name}</h3>
            {eat.name_local ? (
              <p className="byline text-xs text-muted-foreground mt-0.5">{eat.name_local}</p>
            ) : null}

            {eat.cuisine.length > 0 ? (
              <div className="mt-2">
                <CuisineChips cuisine={eat.cuisine} />
              </div>
            ) : null}

            {eat.signature_dishes.length > 0 ? (
              <p className="mt-2 text-xs italic text-foreground/70 line-clamp-1">
                <Quote className="inline h-3 w-3 mr-1 -mt-0.5 text-foreground/40" aria-hidden />
                Famous for: {eat.signature_dishes.slice(0, 3).join(", ")}
              </p>
            ) : null}

            <div className="mt-2">
              <CriticalBadges eat={eat} />
            </div>
          </button>
        </SheetTrigger>
        <EatDetailSheet eat={eat} />
      </Sheet>

      <div className="px-4 pb-3 pt-0 sm:self-end">
        <ActionRow eat={eat} variant="card" />
      </div>
    </article>
  );
}
