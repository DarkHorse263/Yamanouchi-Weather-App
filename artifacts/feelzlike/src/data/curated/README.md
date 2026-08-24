# FeelZlike - Stay + Eat Data Package v0.4

**227 curated entries across 6 base towns, ready to import into your app.**

---

## What's in this package

```
feelzlike_package/
├── feelzlike_data.json          ← single combined file (all towns, all data)
├── stays.csv                    ← flattened CSV for human review (Excel/Numbers)
├── eats.csv                     ← flattened CSV for human review
├── affiliate_links.js           ← deep-link builder (drop into Replit as-is)
├── by_region/                   ← mirrors the URL structure of your app
│   ├── snowy_mountains/
│   │   ├── jindabyne/{stays.json, eats.json}
│   │   ├── berridale/{stays.json, eats.json}
│   │   └── cooma/{stays.json, eats.json}
│   └── yamanouchi/
│       ├── yudanaka/{stays.json, eats.json}
│       ├── shibu_onsen/{stays.json, eats.json}
│       └── yomase/{stays.json, eats.json}
└── README.md                    ← this file
```

## Coverage

| Town | Region | Stays | Eats |
|---|---|---:|---:|
| Jindabyne | Snowy Mountains, NSW | 25 | 30 |
| Berridale | Snowy Mountains, NSW | 12 | 12 |
| Cooma | Snowy Mountains, NSW | 18 | 26 |
| Yudanaka | Yamanouchi, Nagano | 21 | 25 |
| Shibu Onsen | Yamanouchi, Nagano | 22 | 16 |
| Yomase | Yamanouchi, Nagano | 9 | 11 |
| **Total** | | **107** | **120** |

## Region-specific filters baked into the data

**Snowy Mountains stays** support filters for: drying_room, ski_storage, pet_friendly, self_contained, distance_to_thredbo_km, distance_to_perisher_km, distance_to_skitube_km

**Yamanouchi stays** support filters for: onsen (none/private/public/both), tattoo_policy (allowed/private_only/not_allowed/unknown), meal_plan (kaiseki/half_board/etc.), yukata_provided, walk_min_to_yudanaka_station

**Snowy Mountains eats** support: apres_ski, takeaway, groceries (for IGA/bottle-o entries)

**Yamanouchi eats** support: vegetarian_friendly (honest - mostly "limited" in rural Nagano), kid_friendly, english_menu (yes/picture_menu/no), payment (cash_only flag - critical in rural Japan)

## Affiliate booking links

Every stay has a `booking_links` object with deep-links to the relevant booking sites:
- AU stays → Booking, Agoda, Airbnb, Expedia, Hotels.com, Trip.com, official
- JP stays → Booking, Agoda, Airbnb, Expedia, Rakuten Travel, Jalan, Trip.com, official

Currently the links work as plain search URLs (no commission). To activate affiliate revenue, edit `affiliate_links.js`:

```js
const AFFILIATE_IDS = {
  booking_com:    'aid=YOUR_ID_HERE',
  agoda:          'cid=YOUR_ID_HERE',
  // ...
};
```

Apply at:
- [Booking.com Affiliate Partner Program](https://www.booking.com/affiliate-program/v2/) - fast approval, works for both regions
- [Agoda Partners](https://partners.agoda.com/) - fast approval, strong in Asia
- [Airbnb Associates](https://www.airbnb.com/associates) - invite-only in some markets
- [Expedia Group Affiliate](https://www.expediagroup.com/affiliate) - covers Expedia + Hotels.com
- [Rakuten Travel Affiliate](https://affiliate.rakuten.co.jp/) - Japan-focused, app form is in Japanese
- Jalan typically requires a Japanese business entity - skip for now

## Data quality notes

- **No fabricated data.** Where a phone number, exact opening hour, or photo URL couldn't be verified from a primary source, that field is `null` rather than guessed.
- **All Japanese venue names** include both kanji (`name_local`) and romanji (`name`).
- **Tattoo policy** for ryokan was researched per-property using tattoo-friendly.com and primary sources. Where unverified, marked `unknown` (not `allowed`) - better to be honest with travellers.
- **Cash-only flags** in Shibu Onsen reflect reality: 13 of 16 eats are cash-only.
- **Payment, last-order times, English-menu support** are populated for Japanese eats - these are the make-or-break filters for international travellers.

## Known gaps to be honest about

- Some Jindabyne phone numbers (Holly Go Lightly, Stacks Pizza, Beach Burrito Co) couldn't be verified - set to null
- Berridale Inn pub may have an electrical/operating issue worth verifying live
- "Snow Ski Apartments" as a distinct Jindabyne property is included via the local accommodation portal with notes
- Yomase deliberately has fewer entries - most travellers staying there eat at their lodge or drive to Yudanaka
- Photos are sparse where official sites don't provide reusable URLs - recommend supplementing with your own or Booking.com listing images once affiliate is set up

## Schema reference

See `/home/user/workspace/curation_schema_notes.md` for the full field-by-field schema definition.

## Next steps

Once you upload the Replit project zip, I'll:
1. Wire this data into your `/stay` and `/eat` route handlers
2. Build the listing card components with region-specific filters
3. Add a map view with all properties plotted
4. Drop in the `affiliate_links.js` helper so deep-links work immediately
5. Fix the Cooma Coaches → Yudanaka data leak in Transport
6. Fix the Explore API
