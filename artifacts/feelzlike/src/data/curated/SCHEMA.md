# FeelZlike Stay + Eat Data Schema

## Common fields (both regions, both stays + eats)
- id (slug)
- name
- name_local (kanji/katakana for Japan, null for NSW)
- type (stay: ryokan/hotel/lodge/apartment/airbnb/hostel | eat: izakaya/ramen/cafe/restaurant/bar/bakery/pub)
- town
- region
- short_description (1 line)
- long_description (2-3 sentences)
- address
- lat
- lng
- phone
- website
- price_band ($ / $$ / $$$ / $$$$)
- photos (array of source URLs)
- source_urls (array - where data came from)

## Stay-specific fields
- room_count (approximate)
- amenities (array)
- english_spoken (yes/limited/no)
- check_in / check_out times
- booking_links (object: booking_com, agoda, airbnb, expedia, jalan, rakuten, official)

### Japan stay extras
- onsen (none / private / public / both)
- tattoo_policy (allowed / private_only / not_allowed / unknown)
- meal_plan (none / breakfast / dinner / kaiseki / half_board / full_board)
- yukata_provided (yes/no)

### NSW stay extras
- drying_room (yes/no)
- ski_storage (yes/no)
- pet_friendly (yes/no)
- distance_to_skitube_km
- distance_to_thredbo_km
- distance_to_perisher_km
- self_contained (yes/no - kitchen)

## Eat-specific fields
- cuisine (array)
- hours (object by day)
- last_order_time
- reservation (required / recommended / not_needed / not_accepted)
- reservation_link (tabelog/hotpepper/opentable/null)
- payment (cash_only / cards_accepted / both)
- english_menu (yes/picture_menu/no)
- signature_dishes (array)

### Japan eat extras
- vegetarian_friendly (yes/limited/no)
- kid_friendly (yes/no)

### NSW eat extras
- apres_ski (yes/no - open after lift close, has beer/comfort food)
- takeaway (yes/no)
- groceries (yes/no - for the IGA/bottle-o type entries)

## Distance-to-mountains (for stays, computed)
- nearest_mountain
- drive_min_to_nearest_mountain
- drive_min_to_each_mountain (object)
