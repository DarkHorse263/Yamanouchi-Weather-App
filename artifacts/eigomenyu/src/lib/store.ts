export interface MenuItem {
  id: string;
  restaurantId: string;
  nameJa: string;
  titleEn: string;
  descriptionEn: string;
  romaji: string;
  phonetic: string;
  category: string;
  price: number | null;
  allergens: string[];
  approved: boolean;
  hint: string;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  nameJa: string;
  nameEn: string;
  slug: string;
  description: string;
}

const RESTAURANTS_KEY = "eigomenyu_restaurants";
const ITEMS_KEY = "eigomenyu_items";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    ownerId: "",
    nameJa: "雪見食堂",
    nameEn: "Yukimi Shokudo",
    slug: "yukimi-shokudo",
    description: "Traditional mountain dining in Yamanouchi",
  },
];

const SEED_ITEMS: MenuItem[] = [
  {
    id: "i1",
    restaurantId: "r1",
    nameJa: "味噌ラーメン",
    titleEn: "Miso Ramen",
    descriptionEn: "Rich fermented soybean broth with wheat noodles, chashu pork, corn, and butter",
    romaji: "miso raamen",
    phonetic: "mee-so rah-men",
    category: "Noodles",
    price: 950,
    allergens: ["wheat", "soy"],
    approved: true,
    hint: "",
  },
  {
    id: "i2",
    restaurantId: "r1",
    nameJa: "カツ丼",
    titleEn: "Katsudon",
    descriptionEn: "Deep-fried pork cutlet simmered with egg and onion over rice",
    romaji: "katsudon",
    phonetic: "kah-tsoo-don",
    category: "Rice Bowls",
    price: 1100,
    allergens: ["wheat", "egg"],
    approved: true,
    hint: "",
  },
  {
    id: "i3",
    restaurantId: "r1",
    nameJa: "天ぷらうどん",
    titleEn: "Tempura Udon",
    descriptionEn: "Thick wheat noodles in dashi broth topped with crispy shrimp tempura",
    romaji: "tenpura udon",
    phonetic: "tem-poo-rah oo-don",
    category: "Noodles",
    price: 1000,
    allergens: ["wheat", "shrimp"],
    approved: true,
    hint: "",
  },
  {
    id: "i4",
    restaurantId: "r1",
    nameJa: "親子丼",
    titleEn: "Oyakodon",
    descriptionEn: "Chicken and egg simmered in sweet soy broth, served over steamed rice",
    romaji: "oyakodon",
    phonetic: "oh-yah-ko-don",
    category: "Rice Bowls",
    price: 900,
    allergens: ["egg", "soy"],
    approved: true,
    hint: "",
  },
  {
    id: "i5",
    restaurantId: "r1",
    nameJa: "枝豆",
    titleEn: "Edamame",
    descriptionEn: "Boiled young soybeans lightly salted, a classic starter",
    romaji: "edamame",
    phonetic: "eh-dah-mah-meh",
    category: "Starters",
    price: 400,
    allergens: ["soy"],
    approved: true,
    hint: "",
  },
  {
    id: "i6",
    restaurantId: "r1",
    nameJa: "焼き餃子",
    titleEn: "Gyoza (Pan-fried Dumplings)",
    descriptionEn: "Crispy pan-fried pork and vegetable dumplings with dipping sauce",
    romaji: "yaki gyouza",
    phonetic: "yah-kee gyoh-zah",
    category: "Starters",
    price: 550,
    allergens: ["wheat", "soy"],
    approved: true,
    hint: "",
  },
  {
    id: "i7",
    restaurantId: "r1",
    nameJa: "抹茶アイス",
    titleEn: "Matcha Ice Cream",
    descriptionEn: "Creamy green tea ice cream made with Uji matcha",
    romaji: "matcha aisu",
    phonetic: "mah-cha ah-ee-soo",
    category: "Desserts",
    price: 450,
    allergens: ["dairy"],
    approved: true,
    hint: "",
  },
  {
    id: "i8",
    restaurantId: "r1",
    nameJa: "鉄板焼き",
    titleEn: "Teppanyaki",
    descriptionEn: "Grilled beef and vegetables cooked on a hot iron plate at your table",
    romaji: "teppanyaki",
    phonetic: "tep-pahn-yah-kee",
    category: "Mains",
    price: 1800,
    allergens: [],
    approved: false,
    hint: "Wagyu-style grilled meat",
  },
];

function ensureSeeded() {
  const rs = load<Restaurant[]>(RESTAURANTS_KEY, []);
  if (rs.length === 0) {
    save(RESTAURANTS_KEY, SEED_RESTAURANTS);
    save(ITEMS_KEY, SEED_ITEMS);
  }
}

ensureSeeded();

export function getRestaurants(): Restaurant[] {
  return load<Restaurant[]>(RESTAURANTS_KEY, SEED_RESTAURANTS);
}

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return getRestaurants().find((r) => r.slug === slug);
}

export function getRestaurantsByOwner(ownerId: string): Restaurant[] {
  const all = getRestaurants();
  return all.filter((r) => r.ownerId === ownerId || r.ownerId === "");
}

export function getMenuItems(restaurantId: string): MenuItem[] {
  return load<MenuItem[]>(ITEMS_KEY, SEED_ITEMS).filter(
    (i) => i.restaurantId === restaurantId
  );
}

export function getApprovedMenuItems(restaurantId: string): MenuItem[] {
  return getMenuItems(restaurantId).filter((i) => i.approved);
}

export function addMenuItem(item: Omit<MenuItem, "id">): MenuItem {
  const items = load<MenuItem[]>(ITEMS_KEY, []);
  const newItem: MenuItem = { ...item, id: uid() };
  items.push(newItem);
  save(ITEMS_KEY, items);
  return newItem;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = load<MenuItem[]>(ITEMS_KEY, []);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  save(ITEMS_KEY, items);
  return items[idx];
}

export function deleteMenuItem(id: string): boolean {
  const items = load<MenuItem[]>(ITEMS_KEY, []);
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  save(ITEMS_KEY, filtered);
  return true;
}

export function addRestaurant(restaurant: Omit<Restaurant, "id">): Restaurant {
  const restaurants = load<Restaurant[]>(RESTAURANTS_KEY, []);
  const newR: Restaurant = { ...restaurant, id: uid() };
  restaurants.push(newR);
  save(RESTAURANTS_KEY, restaurants);
  return newR;
}

export function generateAITranslation(nameJa: string, hint: string): Promise<{
  titleEn: string;
  descriptionEn: string;
  romaji: string;
  phonetic: string;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const simple = nameJa.length <= 6;
      resolve({
        titleEn: hint || `${nameJa} (translated)`,
        descriptionEn: simple
          ? "A traditional Japanese dish prepared with care and fresh ingredients"
          : "A hearty Japanese specialty featuring rich flavors and seasonal ingredients, served in the traditional style",
        romaji: nameJa
          .replace(/[ー]/g, "")
          .toLowerCase(),
        phonetic: hint ? hint.toLowerCase().replace(/\s+/g, "-") : "jah-pah-neez dish",
      });
    }, 1200);
  });
}
