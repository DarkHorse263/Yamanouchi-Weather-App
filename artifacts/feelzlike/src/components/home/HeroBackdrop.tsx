import { useEffect, useState } from "react";

/**
 * Full-bleed hero backdrop for the homepage. Per playbook 6.1 we want a
 * curated set of 4-6 hero photos that rotate per visit — but with no
 * licensed photo library on hand yet, we ship a beautifully gradient-overlaid
 * placeholder per the playbook fallback ("a beautifully gradient-overlaid
 * stock photo with a TODO comment"). The variant rotation logic IS in place
 * so wiring real images later is a one-line edit (drop urls into HERO_PHOTOS).
 *
 * Variants are picked once per page load (not per render) using a session-
 * stable index in sessionStorage so refreshes are stable but a new tab is a
 * new vibe.
 *
 * TODO(launch): replace HERO_PHOTOS placeholder URLs with licensed Unsplash
 * or commissioned photographer set; each entry must include credit string.
 */

interface HeroVariant {
  /** CSS gradient string used as backdrop while photos are pending. */
  gradient: string;
  /** Future-photo url (null = use gradient only). */
  photoUrl: string | null;
  /** Photographer credit ("Name on Unsplash" / "Name, all rights reserved"). */
  credit: string;
  /** Mood label, picked up by the hero copy if ever needed. */
  mood: "japow" | "alpine" | "bluebird" | "storm";
}

const HERO_VARIANTS: HeroVariant[] = [
  {
    gradient:
      "radial-gradient(ellipse at 30% 20%, rgba(125,211,252,0.55) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(67,56,202,0.45) 0%, transparent 55%), linear-gradient(180deg, #0c1e3a 0%, #1a3b6e 45%, #0a1429 100%)",
    photoUrl: null,
    credit: "Snowy Mountains, NSW · placeholder",
    mood: "alpine",
  },
  {
    gradient:
      "radial-gradient(ellipse at 70% 25%, rgba(186,230,253,0.5) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(56,189,248,0.35) 0%, transparent 55%), linear-gradient(180deg, #07142b 0%, #0e2a4f 50%, #050d1c 100%)",
    photoUrl: null,
    credit: "Hakuba powder · placeholder",
    mood: "japow",
  },
  {
    gradient:
      "radial-gradient(ellipse at 50% 10%, rgba(254,240,138,0.35) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(56,189,248,0.4) 0%, transparent 55%), linear-gradient(180deg, #0b1d3d 0%, #1e3a72 50%, #0a1429 100%)",
    photoUrl: null,
    credit: "Bluebird · placeholder",
    mood: "bluebird",
  },
  {
    gradient:
      "radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.45) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(15,118,110,0.35) 0%, transparent 55%), linear-gradient(180deg, #0a1428 0%, #1c2541 50%, #050b18 100%)",
    photoUrl: null,
    credit: "Shiga Kogen storm · placeholder",
    mood: "storm",
  },
];

function pickVariantIndex(): number {
  if (typeof window === "undefined") return 0;
  try {
    const cached = window.sessionStorage.getItem("feelzlike:heroVariant");
    if (cached !== null) {
      const n = parseInt(cached, 10);
      if (Number.isFinite(n) && n >= 0 && n < HERO_VARIANTS.length) return n;
    }
    const next = Math.floor(Math.random() * HERO_VARIANTS.length);
    window.sessionStorage.setItem("feelzlike:heroVariant", String(next));
    return next;
  } catch {
    return 0;
  }
}

export function HeroBackdrop() {
  const [variantIdx, setVariantIdx] = useState(0);
  useEffect(() => setVariantIdx(pickVariantIndex()), []);
  const variant = HERO_VARIANTS[variantIdx]!;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
      style={{ height: "min(100vh, 920px)" }}
    >
      {/* Photo layer (when supplied) */}
      {variant.photoUrl && (
        <img
          src={variant.photoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      )}
      {/* Gradient layer — always rendered, sits over photo for legibility */}
      <div
        className="absolute inset-0"
        style={{ background: variant.gradient }}
      />
      {/* Snow-flake noise: very subtle radial dots, 2% opacity, evokes light snowfall */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 0.6px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Mountain-silhouette SVG arc anchored to the bottom of the hero —
          adds shape so the gradient doesn't read as a flat panel. */}
      <svg
        viewBox="0 0 1200 320"
        className="absolute inset-x-0 bottom-0 w-full h-[280px]"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ridgeFade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,23,42,0.0)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.85)" />
          </linearGradient>
        </defs>
        <path
          d="M0,260 L120,180 L220,210 L340,120 L470,180 L590,90 L720,170 L860,110 L990,180 L1120,140 L1200,200 L1200,320 L0,320 Z"
          fill="url(#ridgeFade)"
        />
        <path
          d="M0,300 L150,240 L300,270 L460,200 L640,260 L820,210 L980,260 L1200,230 L1200,320 L0,320 Z"
          fill="rgba(2,6,23,0.55)"
        />
      </svg>
      {/* Bottom fade: hero → page bg seamlessly */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#f6f8fb]" />
      {/* Photo credit (only shown when we have a real photo) */}
      {variant.photoUrl && (
        <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] text-white/60">
          Photo · {variant.credit}
        </span>
      )}
    </div>
  );
}
