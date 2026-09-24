import { pool } from "@workspace/db";
import { OpenWeatherGuard, postgresQuotaStore, validOwmTile } from "./owm-guard.js";
export { validOwmTile } from "./owm-guard.js";

const guard = new OpenWeatherGuard(postgresQuotaStore(async () => {
  const client = await pool.connect();
  return {
    query: (text, values) => {
      // node-postgres supports a per-query client-side timeout; its published
      // QueryConfig type currently omits this runtime option.
      const config = { text, values, query_timeout: 2500 };
      return client.query(config);
    },
    release: (error) => client.release(error),
  };
}));
function url(path: string, params: Record<string, string | number>, tile = false): URL {
  const key = process.env.OWM_API_KEY || process.env.VITE_OWM_API_KEY;
  if (!key) throw new Error("OpenWeather unavailable");
  const target = new URL(path, tile ? "https://tile.openweathermap.org" : "https://api.openweathermap.org");
  for (const [name, value] of Object.entries(params)) target.searchParams.set(name, String(value));
  target.searchParams.set("appid", key);
  return target;
}
export async function owmJson(endpoint: "weather" | "forecast" | "reverse", lat: number, lon: number): Promise<any> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error("Invalid coordinates");
  const path = endpoint === "reverse" ? "/geo/1.0/reverse" : `/data/2.5/${endpoint}`;
  const params: Record<string, string | number> = { lat, lon };
  if (endpoint === "reverse") params.limit = 1;
  else params.units = "metric";
  return JSON.parse((await guard.request(url(path, params))).toString("utf8"));
}
export async function owmTile(layer: string, z: string, x: string, y: string): Promise<Buffer> {
  if (!validOwmTile(layer, z, x, y)) throw new Error("Invalid tile");
  return guard.request(url(`/map/${layer}/${z}/${x}/${y}.png`, {}, true), true);
}