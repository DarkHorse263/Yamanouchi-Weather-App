import { z } from "zod";

export const REGION_SLUGS = ["snowy_mountains", "yamanouchi"] as const;
export const RegionSlugSchema = z.enum(REGION_SLUGS);
export type RegionSlug = z.infer<typeof RegionSlugSchema>;

export const TOWN_SLUGS = [
  "jindabyne",
  "berridale",
  "cooma",
  "yudanaka",
  "shibu_onsen",
  "yomase",
] as const;
export const TownSlugSchema = z.enum(TOWN_SLUGS);
export type TownSlug = z.infer<typeof TownSlugSchema>;

export const COUNTRIES = ["AU", "JP"] as const;
export const CountrySchema = z.enum(COUNTRIES);
export type Country = z.infer<typeof CountrySchema>;

export const PriceBandSchema = z.enum(["$", "$$", "$$$", "$$$$"]);
export type PriceBand = z.infer<typeof PriceBandSchema>;

export const EnglishSpokenSchema = z.enum(["yes", "limited", "no"]);
export const YesNoSchema = z.enum(["yes", "no"]);
export const YesLimitedNoSchema = z.enum(["yes", "limited", "no"]);

export const BookingLinksSchema = z.object({
  booking_com: z.string().url().nullable().optional(),
  agoda: z.string().url().nullable().optional(),
  airbnb: z.string().url().nullable().optional(),
  expedia: z.string().url().nullable().optional(),
  hotels_com: z.string().url().nullable().optional(),
  trip_com: z.string().url().nullable().optional(),
  jalan: z.string().url().nullable().optional(),
  rakuten: z.string().url().nullable().optional(),
  official: z.string().url().nullable().optional(),
});
export type BookingLinks = z.infer<typeof BookingLinksSchema>;

export const HoursSchema = z
  .object({
    monday: z.string().nullable().optional(),
    tuesday: z.string().nullable().optional(),
    wednesday: z.string().nullable().optional(),
    thursday: z.string().nullable().optional(),
    friday: z.string().nullable().optional(),
    saturday: z.string().nullable().optional(),
    sunday: z.string().nullable().optional(),
    closed: z.string().nullable().optional(),
  })
  .partial();
export type Hours = z.infer<typeof HoursSchema>;

const DriveMinToEachMountainSchema = z
  .record(z.string(), z.number().nullable())
  .nullable()
  .optional();

const StayBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  name_local: z.string().nullable(),
  type: z.enum([
    "ryokan",
    "hotel",
    "lodge",
    "apartment",
    "airbnb",
    "hostel",
    "minshuku",
    "guesthouse",
    "resort",
    "motel",
    "cabin",
    "bnb",
  ]),
  town: TownSlugSchema,
  region: RegionSlugSchema,
  short_description: z.string(),
  long_description: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  price_band: PriceBandSchema.nullable(),
  photos: z.array(z.string()),
  source_urls: z.array(z.string()),
  room_count: z.number().nullable().optional(),
  amenities: z.array(z.string()),
  english_spoken: EnglishSpokenSchema.nullable().optional(),
  check_in: z.string().nullable().optional(),
  check_out: z.string().nullable().optional(),
  booking_links: BookingLinksSchema,
  nearest_mountain: z.string().nullable().optional(),
  drive_min_to_nearest_mountain: z.number().nullable().optional(),
  drive_min_to_each_mountain: DriveMinToEachMountainSchema,
  notes: z.string().nullable().optional(),
});

export const StayAUSchema = StayBaseSchema.extend({
  country: z.literal("AU"),
  drying_room: YesNoSchema.nullable().optional(),
  ski_storage: YesNoSchema.nullable().optional(),
  pet_friendly: YesNoSchema.nullable().optional(),
  self_contained: YesNoSchema.nullable().optional(),
  distance_to_skitube_km: z.number().nullable().optional(),
  distance_to_thredbo_km: z.number().nullable().optional(),
  distance_to_perisher_km: z.number().nullable().optional(),
});
export type StayAU = z.infer<typeof StayAUSchema>;

export const StayJPSchema = StayBaseSchema.extend({
  country: z.literal("JP"),
  onsen: z.enum(["none", "private", "public", "both"]).nullable().optional(),
  tattoo_policy: z
    .enum(["allowed", "private_only", "not_allowed", "unknown"])
    .nullable()
    .optional(),
  meal_plan: z
    .enum(["none", "breakfast", "dinner", "kaiseki", "half_board", "full_board"])
    .nullable()
    .optional(),
  yukata_provided: z.enum(["yes", "no", "unknown"]).nullable().optional(),
  walk_min_to_yudanaka_station: z.number().nullable().optional(),
});
export type StayJP = z.infer<typeof StayJPSchema>;

const COUNTRY_OF_REGION: Record<RegionSlug, Country> = {
  snowy_mountains: "AU",
  yamanouchi: "JP",
};

const _REGION_OF_TOWN_LITERAL: Record<TownSlug, RegionSlug> = {
  jindabyne: "snowy_mountains",
  berridale: "snowy_mountains",
  cooma: "snowy_mountains",
  yudanaka: "yamanouchi",
  shibu_onsen: "yamanouchi",
  yomase: "yamanouchi",
};

function refineRegionTownCountry(
  data: { id: string; town: TownSlug; region: RegionSlug; country: Country },
  ctx: z.RefinementCtx,
): void {
  const expectedRegion = _REGION_OF_TOWN_LITERAL[data.town];
  if (expectedRegion !== data.region) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["region"],
      message: `town '${data.town}' belongs to region '${expectedRegion}', not '${data.region}' (id=${data.id})`,
    });
  }
  const expectedCountry = COUNTRY_OF_REGION[data.region];
  if (expectedCountry !== data.country) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["country"],
      message: `region '${data.region}' is country '${expectedCountry}', not '${data.country}' (id=${data.id})`,
    });
  }
}

export const StaySchema = z
  .discriminatedUnion("country", [StayAUSchema, StayJPSchema])
  .superRefine(refineRegionTownCountry);
export type Stay = z.infer<typeof StaySchema>;

const EatBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  name_local: z.string().nullable(),
  type: z.enum([
    "izakaya",
    "ramen",
    "cafe",
    "restaurant",
    "bar",
    "bakery",
    "pub",
    "fast_food",
    "diner",
    "food_truck",
    "grocery",
    "bottle_shop",
    "service-station",
    "supermarket",
  ]),
  town: TownSlugSchema,
  region: RegionSlugSchema,
  short_description: z.string(),
  long_description: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  price_band: PriceBandSchema.nullable(),
  photos: z.array(z.string()),
  source_urls: z.array(z.string()),
  cuisine: z.array(z.string()),
  hours: HoursSchema,
  last_order_time: z.string().nullable().optional(),
  reservation: z
    .enum(["required", "recommended", "not_needed", "not_accepted"])
    .nullable()
    .optional(),
  reservation_link: z.string().nullable().optional(),
  payment: z.enum(["cash_only", "cards_accepted", "both"]).nullable().optional(),
  english_menu: z.enum(["yes", "picture_menu", "limited", "no"]).nullable().optional(),
  signature_dishes: z.array(z.string()),
  notes: z.string().nullable().optional(),
});

export const EatAUSchema = EatBaseSchema.extend({
  country: z.literal("AU"),
  apres_ski: YesNoSchema.nullable().optional(),
  takeaway: YesNoSchema.nullable().optional(),
  groceries: YesNoSchema.nullable().optional(),
});
export type EatAU = z.infer<typeof EatAUSchema>;

export const EatJPSchema = EatBaseSchema.extend({
  country: z.literal("JP"),
  vegetarian_friendly: YesLimitedNoSchema.nullable().optional(),
  kid_friendly: YesLimitedNoSchema.nullable().optional(),
});
export type EatJP = z.infer<typeof EatJPSchema>;

export const EatSchema = z
  .discriminatedUnion("country", [EatAUSchema, EatJPSchema])
  .superRefine(refineRegionTownCountry);
export type Eat = z.infer<typeof EatSchema>;

export const TOWNS_BY_REGION: Record<RegionSlug, readonly TownSlug[]> = {
  snowy_mountains: ["jindabyne", "berridale", "cooma"],
  yamanouchi: ["yudanaka", "shibu_onsen", "yomase"],
} as const;

export const REGION_OF_TOWN = _REGION_OF_TOWN_LITERAL;
