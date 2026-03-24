import { Router } from "express";

const router = Router();
const VALID_LAYERS = ["precipitation_new", "clouds_new", "temp_new", "wind_new", "snow"];

function getOwmKey(): string {
  return process.env.OWM_API_KEY || process.env.VITE_OWM_API_KEY || "";
}


router.get("/weather-tile/:layer/:z/:x/:y", async (req, res) => {
  const { layer, z, x, y } = req.params;
  const key = getOwmKey();
  if (!VALID_LAYERS.includes(layer) || !key) {
    return res.status(400).send("Invalid layer or missing key");
  }
  try {
    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${key}`;
    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).send("Upstream error");
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=300");
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch {
    res.status(502).send("Tile fetch failed");
  }
});

export default router;
