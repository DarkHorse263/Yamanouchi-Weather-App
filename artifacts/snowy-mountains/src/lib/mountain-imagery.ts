/**
 * Mountain photography + sky-condition gradients for the atmospheric design.
 * Each location gets a real high-res alpine photograph, and the sky gradient
 * is derived from current weather + local time of day so the hero literally
 * matches conditions on the ground.
 */

const UNSPLASH = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

interface Imagery {
  hero: string;
  thumb: string;
  /** Short photographer credit shown beneath the hero. */
  credit: string;
}

export const REGION_IMAGERY: Imagery = {
  hero: UNSPLASH("photo-1551524559-8af4e6624178", 2000),
  thumb: UNSPLASH("photo-1551524559-8af4e6624178", 600),
  credit: "Snowy Mountains, NSW",
};

export const LOCATION_IMAGERY: Record<string, Imagery> = {
  thredbo: {
    hero: UNSPLASH("photo-1551524559-8af4e6624178", 2000),
    thumb: UNSPLASH("photo-1551524559-8af4e6624178", 800),
    credit: "Thredbo · Kosciuszko NP",
  },
  perisher: {
    hero: UNSPLASH("photo-1483728642387-6c3bdd6c93e5", 2000),
    thumb: UNSPLASH("photo-1483728642387-6c3bdd6c93e5", 800),
    credit: "Perisher Range",
  },
  "charlottes-pass": {
    hero: UNSPLASH("photo-1531366936337-7c912a4589a7", 2000),
    thumb: UNSPLASH("photo-1531366936337-7c912a4589a7", 800),
    credit: "Charlotte's Pass · Main Range",
  },
  jindabyne: {
    hero: UNSPLASH("photo-1502134249126-9f3755a50d78", 2000),
    thumb: UNSPLASH("photo-1502134249126-9f3755a50d78", 800),
    credit: "Lake Jindabyne",
  },
  selwyn: {
    hero: UNSPLASH("photo-1531366936337-7c912a4589a7", 2000),
    thumb: UNSPLASH("photo-1531366936337-7c912a4589a7", 800),
    credit: "Selwyn · Northern Kosciuszko NP",
  },
};

export function getImagery(locationId: string): Imagery {
  return LOCATION_IMAGERY[locationId] ?? REGION_IMAGERY;
}

/**
 * Sky gradient palette derived from temperature + sky description + local time.
 * Returns CSS gradient strings layered for a luminous atmospheric effect.
 */
export function skyGradient({
  tempC,
  description,
  date = new Date(),
  timezone = "Australia/Sydney",
}: {
  tempC: number;
  description?: string;
  date?: Date;
  timezone?: string;
}): { wash: string; glow: string; mood: "dawn" | "day" | "dusk" | "night" | "storm" } {
  const hourLocal = parseInt(
    new Intl.DateTimeFormat("en-AU", { timeZone: timezone, hour: "2-digit", hour12: false }).format(date),
    10,
  );
  const desc = (description ?? "").toLowerCase();
  const stormy = /storm|thunder|snow|rain|shower|sleet|blizzard/.test(desc);
  const cloudy = /cloud|overcast|fog|mist/.test(desc);

  let mood: "dawn" | "day" | "dusk" | "night" | "storm";
  if (stormy) mood = "storm";
  else if (hourLocal >= 5 && hourLocal < 8) mood = "dawn";
  else if (hourLocal >= 17 && hourLocal < 20) mood = "dusk";
  else if (hourLocal >= 20 || hourLocal < 5) mood = "night";
  else mood = "day";

  const palettes: Record<typeof mood, { wash: string; glow: string }> = {
    dawn: {
      wash: "linear-gradient(180deg, #1a1230 0%, #5b3a6e 30%, #d97a5a 70%, #f4c47a 100%)",
      glow: "radial-gradient(80% 60% at 70% 80%, rgba(255,160,90,0.35), transparent 70%)",
    },
    day: {
      wash: cloudy
        ? "linear-gradient(180deg, #1e2a3a 0%, #3d5470 50%, #6b88a8 100%)"
        : "linear-gradient(180deg, #0a1929 0%, #1d3a5f 50%, #4a78a8 100%)",
      glow: "radial-gradient(60% 50% at 50% 0%, rgba(120,180,255,0.25), transparent 70%)",
    },
    dusk: {
      wash: "linear-gradient(180deg, #0d1530 0%, #2a1f4a 35%, #8a3a5a 70%, #e8826a 100%)",
      glow: "radial-gradient(70% 60% at 30% 90%, rgba(255,130,90,0.4), transparent 70%)",
    },
    night: {
      wash: "linear-gradient(180deg, #050912 0%, #0d1629 50%, #1a2540 100%)",
      glow: "radial-gradient(50% 40% at 50% 0%, rgba(80,120,200,0.18), transparent 70%)",
    },
    storm: {
      wash: "linear-gradient(180deg, #0a0e18 0%, #1c2535 50%, #2a3548 100%)",
      glow: "radial-gradient(80% 70% at 50% 30%, rgba(80,100,140,0.25), transparent 70%)",
    },
  };

  // Cold bias: subzero temps shift toward icier blues regardless of time
  if (tempC <= 0 && mood === "day") {
    palettes.day.wash = "linear-gradient(180deg, #0a1828 0%, #1e3a5a 50%, #6ea0c8 100%)";
  }

  return { ...palettes[mood], mood };
}
