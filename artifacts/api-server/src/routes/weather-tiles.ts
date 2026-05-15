import { Router } from "express";

const router = Router();
const VALID_LAYERS = ["precipitation_new", "clouds_new", "temp_new", "wind_new", "snow"];

function getOwmKey(): string {
  return process.env.OWM_API_KEY || process.env.VITE_OWM_API_KEY || "";
}

const JAPAN_CITIES = [
  { key: "sapporo", name: "Sapporo", nameJa: "札幌", lat: 43.062, lng: 141.354 },
  { key: "asahikawa", name: "Asahikawa", nameJa: "旭川", lat: 43.771, lng: 142.365 },
  { key: "hakodate", name: "Hakodate", nameJa: "函館", lat: 41.769, lng: 140.729 },
  { key: "aomori", name: "Aomori", nameJa: "青森", lat: 40.824, lng: 140.740 },
  { key: "akita", name: "Akita", nameJa: "秋田", lat: 39.720, lng: 140.103 },
  { key: "sendai", name: "Sendai", nameJa: "仙台", lat: 38.268, lng: 140.872 },
  { key: "niigata", name: "Niigata", nameJa: "新潟", lat: 37.902, lng: 139.023 },
  { key: "kanazawa", name: "Kanazawa", nameJa: "金沢", lat: 36.594, lng: 136.626 },
  { key: "nagano", name: "Nagano", nameJa: "長野", lat: 36.651, lng: 138.181 },
  { key: "yamanouchi", name: "Yamanouchi", nameJa: "山ノ内", lat: 36.745, lng: 138.415 },
  { key: "tokyo", name: "Tokyo", nameJa: "東京", lat: 35.682, lng: 139.692 },
  { key: "yokohama", name: "Yokohama", nameJa: "横浜", lat: 35.444, lng: 139.638 },
  { key: "nagoya", name: "Nagoya", nameJa: "名古屋", lat: 35.181, lng: 136.906 },
  { key: "osaka", name: "Osaka", nameJa: "大阪", lat: 34.694, lng: 135.502 },
  { key: "kyoto", name: "Kyoto", nameJa: "京都", lat: 35.012, lng: 135.768 },
  { key: "kobe", name: "Kobe", nameJa: "神戸", lat: 34.690, lng: 135.196 },
  { key: "hiroshima", name: "Hiroshima", nameJa: "広島", lat: 34.397, lng: 132.460 },
  { key: "matsuyama", name: "Matsuyama", nameJa: "松山", lat: 33.839, lng: 132.766 },
  { key: "fukuoka", name: "Fukuoka", nameJa: "福岡", lat: 33.590, lng: 130.402 },
  { key: "kumamoto", name: "Kumamoto", nameJa: "熊本", lat: 32.803, lng: 130.708 },
  { key: "kagoshima", name: "Kagoshima", nameJa: "鹿児島", lat: 31.596, lng: 130.557 },
  { key: "naha", name: "Naha", nameJa: "那覇", lat: 26.335, lng: 127.681 },
  { key: "saitama", name: "Saitama", nameJa: "さいたま", lat: 35.862, lng: 139.645 },
  { key: "shizuoka", name: "Shizuoka", nameJa: "静岡", lat: 34.976, lng: 138.383 },
  { key: "fukushima", name: "Fukushima", nameJa: "福島", lat: 37.750, lng: 140.468 },
  { key: "morioka", name: "Morioka", nameJa: "盛岡", lat: 39.704, lng: 141.153 },
  { key: "takayama", name: "Takayama", nameJa: "高山", lat: 36.140, lng: 137.252 },
  { key: "matsumoto", name: "Matsumoto", nameJa: "松本", lat: 36.238, lng: 137.972 },
  { key: "hakuba", name: "Hakuba", nameJa: "白馬", lat: 36.698, lng: 137.862 },
  // Nozawa Onsen village core · the previous lng 138.634 was ~16 km too
  // far east and put the pin on the wrong side of the river.
  { key: "nozawa", name: "Nozawa Onsen", nameJa: "野沢温泉", lat: 36.924, lng: 138.448 },
  { key: "iiyama", name: "Iiyama", nameJa: "飯山", lat: 36.851, lng: 138.368 },
  { key: "myoko", name: "Myoko", nameJa: "妙高", lat: 36.862, lng: 138.252 },
];

let cachedTemps: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL = 600_000;

router.get("/japan-temps", async (_req, res) => {
  if (cachedTemps && Date.now() - cachedTemps.fetchedAt < CACHE_TTL) {
    res.set("Cache-Control", "public, max-age=300");
    res.json(cachedTemps.data);
    return;
  }

  try {
    const lats = JAPAN_CITIES.map(c => c.lat).join(",");
    const lngs = JAPAN_CITIES.map(c => c.lng).join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia/Tokyo`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Open-Meteo ${resp.status}`);
    const raw = await resp.json();

    const results = (Array.isArray(raw) ? raw : [raw]).map((item: any, i: number) => ({
      key: JAPAN_CITIES[i].key,
      name: JAPAN_CITIES[i].name,
      nameJa: JAPAN_CITIES[i].nameJa,
      lat: JAPAN_CITIES[i].lat,
      lng: JAPAN_CITIES[i].lng,
      temp: item.current?.temperature_2m ?? null,
      weatherCode: item.current?.weather_code ?? 0,
      wind: item.current?.wind_speed_10m ?? 0,
    }));

    const payload = { cities: results, updatedAt: new Date().toISOString() };
    cachedTemps = { data: payload, fetchedAt: Date.now() };
    res.set("Cache-Control", "public, max-age=300");
    res.json(payload);
  } catch (err) {
    console.error("Japan temps error:", err);
    if (cachedTemps) {
      res.json(cachedTemps.data);
      return;
    }
    res.status(502).json({ error: "Failed to fetch temperatures" });
  }
});

router.get("/weather-tile/:layer/:z/:x/:y", async (req, res) => {
  const { layer, z, x, y } = req.params;
  const key = getOwmKey();
  if (!VALID_LAYERS.includes(layer) || !key) {
    res.status(400).send("Invalid layer or missing key");
    return;
  }
  try {
    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${key}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      res.status(resp.status).send("Upstream error");
      return;
    }
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=300");
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch {
    res.status(502).send("Tile fetch failed");
  }
});

export default router;
