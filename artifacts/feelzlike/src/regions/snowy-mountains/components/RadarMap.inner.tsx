import { type RegionKey, type PinSpec, REGION_DEFAULTS } from "@/regions/region-pins";
export type { RegionKey };
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OfficialRadarSource, WindySource } from "@/lib/bom-radar";
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Marker,
  Tooltip,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CloudSnow,
  CloudRain,
  Pause,
  Play,
  Map as MapIcon,
  Radio,
  Globe2,
  Wind,
  Thermometer,
  Radar,
  Snowflake,
  Droplet,
  Loader2,
  Layers,
  X,
  Maximize2,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
  season?: "winter" | "green";
  region?: RegionKey;
  /**
   * Optional per-coordinate override for the Official + Expert sources. The
   * /near-you page hands us an arbitrary AU location's nearest BOM radar
   * (`official`, or null when none covers the point) and a Windy centre on the
   * user's own coords. When omitted, the curated per-region config is used and
   * region pages behave exactly as before.
   */
  location?: { official: OfficialRadarSource | null; windy: WindySource };
}


type ViewMode = "interactive" | "windy" | "official";

interface RegionConfig {
  windy: { lat: number; lon: number; zoom: number };
  official: {
    label: string;
    /**
     * Official source image (e.g. a BOM radar loop gif). BOM blocks direct
     * cross-site hotlinking, so OfficialView routes these through the
     * /api/bom-radar proxy. null = link-out only (JP/NZ).
     */
    imageUrl: string | null;
    /** Page URL for "open source" link. */
    href: string;
    attribution: string;
  };
}

const REGION_CONFIG: Record<RegionKey, RegionConfig> = {
  "snowy-mountains": {
    windy: { lat: -36.42, lon: 148.42, zoom: 9 },
    official: {
      label: "BOM Captain's Flat",
      imageUrl: "https://www.bom.gov.au/radar/IDR403.gif",
      href: "https://www.bom.gov.au/products/IDR403.loop.shtml",
      attribution: "Bureau of Meteorology · IDR403 · 128 km",
    },
  },
  "victorias-high-country": {
    windy: { lat: -36.86, lon: 147.27, zoom: 9 },
    official: {
      label: "BOM Yarrawonga",
      imageUrl: "https://www.bom.gov.au/radar/IDR493.gif",
      href: "https://www.bom.gov.au/products/IDR493.loop.shtml",
      attribution: "Bureau of Meteorology · IDR493 · 128 km",
    },
  },
  tasmania: {
    windy: { lat: -41.54, lon: 147.67, zoom: 9 },
    official: {
      // Mt Koonya (Hobart) is the only BOM radar serving Tasmania. Ben
      // Lomond (the region's default town, in the NE) sits beyond the 128 km
      // loop, so use the 256 km product (IDR762) to keep the ski field on
      // the radar · the trade-off is slightly coarser detail near Hobart.
      label: "BOM Mt Koonya (Hobart)",
      imageUrl: "https://www.bom.gov.au/radar/IDR762.gif",
      href: "https://www.bom.gov.au/products/IDR762.loop.shtml",
      attribution: "Bureau of Meteorology · IDR762 · 256 km",
    },
  },
  yamanouchi: {
    windy: { lat: 36.74, lon: 138.42, zoom: 9 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:36.74/lon:138.42/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  "nozawa-onsen": {
    windy: { lat: 36.928, lon: 138.449, zoom: 10 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.928/lon:138.449/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  iiyama: {
    windy: { lat: 36.873, lon: 138.366, zoom: 10 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.873/lon:138.366/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Hakuba Valley spans a long north-south valley (Jiigatake up to
  // Cortina), so use a slightly wider zoom to keep the whole valley on
  // the windy embed.
  "hakuba-valley": {
    windy: { lat: 36.68, lon: 137.85, zoom: 9 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:36.68/lon:137.85/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Myoko runs from Suginohara in the south up to Lotte Arai near the
  // coast plain (~0.14° of latitude), so centre between them.
  "myoko": {
    windy: { lat: 36.90, lon: 138.17, zoom: 10 },
    official: {
      label: "JMA Niigata",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.90/lon:138.17/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Niseko · all five bases sit within ~6 km of Mt Niseko Annupuri, with
  // Kutchan a few km north-east, so a tight zoom-10 centre on the
  // mountain covers the whole area.
  "niseko": {
    windy: { lat: 42.86, lon: 140.69, zoom: 10 },
    official: {
      label: "JMA Sapporo",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:42.86/lon:140.69/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Furano · the anchor resort sits right above Furano town, but Kamui
  // (an hour north) and Tomamu (50 min south-east) stretch the region
  // across ~0.65° of latitude, so use a wider zoom-9 centre on the town.
  "furano": {
    windy: { lat: 43.34, lon: 142.40, zoom: 9 },
    official: {
      label: "JMA Asahikawa",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:43.34/lon:142.40/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Sapporo · the three city hills ring the capital across ~0.10° of
  // latitude (Teine to the north-west, Kokusai above Jozankei to the
  // south-west, Bankei in the city), so centre between them at zoom 10.
  "sapporo": {
    windy: { lat: 43.03, lon: 141.25, zoom: 10 },
    official: {
      label: "JMA Sapporo",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:43.03/lon:141.25/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Tomamu & Sahoro · the two resorts sit ~0.13° of latitude and
  // ~0.18° of longitude apart along the Sekisho Line, so centre
  // between them at zoom 9.
  "tomamu-sahoro": {
    windy: { lat: 43.12, lon: 142.71, zoom: 9 },
    official: {
      label: "JMA Asahikawa",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:43.12/lon:142.71/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Asahikawa · Kamui sits ~40 min west of the city and Asahidake
  // ~50 min east, stretching the region across ~0.6° of longitude, so
  // use a wider zoom-9 centre between the city and the mountains.
  "asahikawa": {
    windy: { lat: 43.71, lon: 142.50, zoom: 9 },
    official: {
      label: "JMA Asahikawa",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:43.71/lon:142.50/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Rusutsu & Kiroro · the two bases sit ~0.34° of latitude apart on
  // either side of the Niseko range, so centre between them at zoom 9.
  "rusutsu-kiroro": {
    windy: { lat: 42.91, lon: 140.94, zoom: 9 },
    official: {
      label: "JMA Sapporo",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:42.91/lon:140.94/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Yuzawa runs from Naeba in the south up to Ishiuchi at the north foot
  // of the massif (~0.20° of latitude), so centre on the Mitsumata side
  // between them.
  "yuzawa": {
    windy: { lat: 36.89, lon: 138.79, zoom: 10 },
    official: {
      label: "JMA Niigata",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.89/lon:138.79/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Zao Onsen · single resort rising straight above the village, so a
  // tight zoom-10 centre between the village and Jizo Sancho.
  "zao-onsen": {
    windy: { lat: 38.16, lon: 140.41, zoom: 10 },
    official: {
      label: "JMA Yamagata",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:38.16/lon:140.41/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Hakkoda & Aomori Spring · the two bases sit ~0.56° of longitude
  // apart either side of Aomori city, so centre between them at zoom 9.
  "hakkoda-aomori-spring": {
    windy: { lat: 40.69, lon: 140.56, zoom: 9 },
    official: {
      label: "JMA Aomori",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:40.69/lon:140.56/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Appi & Shizukuishi · the two resorts sit either side of Morioka,
  // ~0.35° of latitude apart, so centre between them at zoom 9.
  "appi-shizukuishi": {
    windy: { lat: 39.85, lon: 140.98, zoom: 9 },
    official: {
      label: "JMA Iwate",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:39.85/lon:140.98/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Bandai · Nekoma Mountain's south base and Grandeco sit ~0.12° of
  // latitude apart either side of Mt Bandai, so centre between them.
  "bandai": {
    windy: { lat: 37.64, lon: 140.08, zoom: 10 },
    official: {
      label: "JMA Fukushima",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:37.64/lon:140.08/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Daisen · a single compact hill on Mt Daisen with Yonago on the
  // coast ~20 km north-west, so centre just off the mountain.
  "daisen": {
    windy: { lat: 35.41, lon: 133.48, zoom: 10 },
    official: {
      label: "JMA Tottori",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:35.41/lon:133.48/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Minakami · the valley runs from Norn in the south up to Minakami
  // Kogen at the head (~0.14° of latitude), so centre on the onsen town
  // between them at zoom 10.
  "minakami": {
    windy: { lat: 36.80, lon: 138.97, zoom: 10 },
    official: {
      label: "JMA Gunma",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.80/lon:138.97/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Kusatsu & Manza · the two hills sit ~0.08° of longitude apart on
  // the flanks of Kusatsu-Shirane, so a tight zoom-11 centre between.
  "kusatsu-manza": {
    windy: { lat: 36.63, lon: 138.55, zoom: 11 },
    official: {
      label: "JMA Gunma",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:11/lat:36.63/lon:138.55/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // Hachimantai · the two shared-ticket bases sit 2 km apart with the
  // city gateway down the hill to the east, so zoom 10 centred between.
  "hachimantai": {
    windy: { lat: 39.93, lon: 141.05, zoom: 10 },
    official: {
      label: "JMA Iwate",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:39.93/lon:141.05/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // NZ · MetService offers no simple hotlinkable radar gif (unlike BOM),
  // so imageUrl is null and the official view links out to MetService's
  // per-region rain radar page (nearest covering radar for each ski
  // area). MetService restructured in 2026: the old
  // /maps-radar/rain-radar path now 404s · the live scheme is
  // /maps-radar/rain/radar/<region>. Forecast data itself is Open-Meteo
  // (see weatherSource).
  queenstown: {
    windy: { lat: -44.99, lon: 168.74, zoom: 10 },
    official: {
      label: "MetService Invercargill",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain/radar/invercargill",
      attribution: "MetService · Invercargill rain radar",
    },
  },
  wanaka: {
    windy: { lat: -44.73, lon: 168.99, zoom: 10 },
    official: {
      label: "MetService Invercargill",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain/radar/invercargill",
      attribution: "MetService · Invercargill rain radar",
    },
  },
  "mt-hutt": {
    windy: { lat: -43.55, lon: 171.59, zoom: 10 },
    official: {
      label: "MetService Christchurch",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain/radar/christchurch",
      attribution: "MetService · Christchurch rain radar",
    },
  },
  ruapehu: {
    windy: { lat: -39.32, lon: 175.50, zoom: 10 },
    official: {
      label: "MetService New Plymouth",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain/radar/new-plymouth",
      attribution: "MetService · New Plymouth rain radar",
    },
  },
  // CA · Environment and Climate Change Canada publishes radar only through
  // its interactive map layer, not as a hotlinkable loop gif and not as a
  // stable per-site deep link, so imageUrl is null and every region links
  // out to the same national viewer with the radar layer enabled (same
  // link-out posture as JP/NZ). Forecast data itself is Open-Meteo.
  whistler: {
    windy: { lat: 50.09, lon: -122.92, zoom: 10 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  "powder-highway": {
    windy: { lat: 50.60, lon: -117.30, zoom: 7 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  okanagan: {
    windy: { lat: 49.85, lon: -119.45, zoom: 8 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  vancouver: {
    windy: { lat: 49.55, lon: -123.60, zoom: 7 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  "banff-lake-louise": {
    windy: { lat: 51.25, lon: -115.85, zoom: 9 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  canmore: {
    windy: { lat: 51.02, lon: -115.25, zoom: 10 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  jasper: {
    windy: { lat: 52.84, lon: -118.08, zoom: 10 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  "quebec-laurentians": {
    windy: { lat: 46.22, lon: -74.57, zoom: 10 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  "quebec-charlevoix": {
    windy: { lat: 47.18, lon: -70.78, zoom: 9 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  "quebec-eastern-townships": {
    windy: { lat: 45.20, lon: -72.60, zoom: 10 },
    official: {
      label: "ECCC weather radar",
      imageUrl: null,
      href: "https://weather.gc.ca/index_e.html?layers=,radar",
      attribution: "Environment and Climate Change Canada · weather radar",
    },
  },
  // US (Colorado) · NWS publishes radar only through its interactive
  // map layer, not as a hotlinkable loop gif and not as a stable
  // per-site deep link, so imageUrl is null and every region links out
  // to the national radar viewer (same link-out posture as JP/NZ/CA).
  // Forecast data itself is Open-Meteo.
  "summit-county": {
    windy: { lat: 39.62, lon: -105.95, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "vail-valley": {
    windy: { lat: 39.62, lon: -106.45, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "aspen-snowmass": {
    windy: { lat: 39.20, lon: -106.88, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  steamboat: {
    windy: { lat: 40.46, lon: -106.80, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "winter-park": {
    windy: { lat: 39.89, lon: -105.76, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "crested-butte": {
    windy: { lat: 38.90, lon: -106.97, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  telluride: {
    windy: { lat: 37.94, lon: -107.81, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  durango: {
    windy: { lat: 37.63, lon: -107.81, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "boulder-front-range": {
    windy: { lat: 39.94, lon: -105.58, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "cottonwood-canyons": {
    windy: { lat: 40.61, lon: -111.64, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "park-city": {
    windy: { lat: 40.65, lon: -111.50, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "ogden-valley": {
    windy: { lat: 41.27, lon: -111.87, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  provo: {
    windy: { lat: 40.40, lon: -111.58, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "cache-valley": {
    windy: { lat: 41.74, lon: -111.83, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "north-lake-tahoe": {
    windy: { lat: 39.33, lon: -120.18, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "south-lake-tahoe": {
    windy: { lat: 38.94, lon: -119.98, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "mammoth-lakes": {
    windy: { lat: 37.65, lon: -118.97, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "big-bear": {
    windy: { lat: 34.24, lon: -116.91, zoom: 11 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "bear-valley": {
    windy: { lat: 38.25, lon: -120.36, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "mt-shasta": {
    windy: { lat: 41.31, lon: -122.31, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "killington-pico": {
    windy: { lat: 43.60, lon: -72.82, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "stowe-smugglers-notch": {
    windy: { lat: 44.56, lon: -72.75, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "mad-river-valley": {
    windy: { lat: 44.17, lon: -72.92, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "southern-vermont": {
    windy: { lat: 43.15, lon: -72.90, zoom: 9 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "okemo": {
    windy: { lat: 43.40, lon: -72.72, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "jay-peak-nek": {
    windy: { lat: 44.76, lon: -72.22, zoom: 9 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "jackson-hole": {
    windy: { lat: 43.59, lon: -110.85, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "grand-targhee": {
    windy: { lat: 43.79, lon: -110.96, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "big-sky": {
    windy: { lat: 45.29, lon: -111.40, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "bozeman-bridger-bowl": {
    windy: { lat: 45.83, lon: -110.90, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "whitefish": {
    windy: { lat: 48.49, lon: -114.37, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "red-lodge": {
    windy: { lat: 45.17, lon: -109.41, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "taos": {
    windy: { lat: 36.60, lon: -105.45, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "angel-fire": {
    windy: { lat: 36.39, lon: -105.29, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "santa-fe": {
    windy: { lat: 35.80, lon: -105.80, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "albuquerque-sandia": {
    windy: { lat: 35.21, lon: -106.45, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "harbor-springs": { windy: { lat: 45.42, lon: -84.95, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "keweenaw-peninsula": { windy: { lat: 47.39, lon: -88.20, zoom: 9 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "poconos": { windy:{lat:41.04,lon:-75.30,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"} },
  "laurel-highlands": { windy:{lat:40.20,lon:-79.05,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"} },
  "berkshires":{windy:{lat:42.45,lon:-73.15,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "central-massachusetts":{windy:{lat:42.48,lon:-71.88,zoom:10},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "lutsen-north-shore":{windy:{lat:47.65,lon:-90.70,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "wausau":{windy:{lat:44.94,lon:-89.66,zoom:10},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "wisconsin-dells":{windy:{lat:43.54,lon:-89.43,zoom:10},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "snowshoe":{windy:{lat:38.41,lon:-79.995,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "canaan-valley":{windy:{lat:39.045,lon:-79.46,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "high-country":{windy:{lat:36.13,lon:-81.871,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "maggie-valley":{windy:{lat:35.562,lon:-83.094,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "blue-ridge":{windy:{lat:37.913,lon:-78.945,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "shenandoah-valley":{windy:{lat:38.407,lon:-78.738,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "lake-tahoe-nevada":{windy:{lat:39.315,lon:-119.886,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "flagstaff":{windy:{lat:35.33,lon:-111.709,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "white-mountains-az":{windy:{lat:33.973,lon:-109.563,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "black-hills":{windy:{lat:44.339,lon:-103.85,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "girdwood":{windy:{lat:60.97,lon:-149.09,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "juneau":{windy:{lat:58.276,lon:-134.528,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "litchfield-hills":{windy:{lat:41.835,lon:-73.286,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "vernon":{windy:{lat:41.19,lon:-74.503,zoom:9},official:{label:"NWS weather radar",imageUrl:null,href:"https://radar.weather.gov/",attribution:"National Weather Service · weather radar"}},
  "mt-hood": {
    windy: { lat: 45.32, lon: -121.72, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "bend": {
    windy: { lat: 44.00, lon: -121.50, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "crystal-mountain": {
    windy: { lat: 46.93, lon: -121.47, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "snoqualmie-pass": {
    windy: { lat: 47.42, lon: -121.42, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "stevens-pass": {
    windy: { lat: 47.74, lon: -121.09, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "mt-baker": {
    windy: { lat: 48.86, lon: -121.65, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "sun-valley": {
    windy: { lat: 43.66, lon: -114.41, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "sandpoint": {
    windy: { lat: 48.32, lon: -116.59, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "boise": {
    windy: { lat: 43.70, lon: -116.15, zoom: 10 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "donnelly-mccall": {
    windy: { lat: 44.80, lon: -116.10, zoom: 9 },
    official: {
      label: "NWS weather radar",
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    },
  },
  "white-mountains": { windy: { lat: 44.14, lon: -71.20, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "franconia-notch": { windy: { lat: 44.16, lon: -71.59, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "waterville-valley": { windy: { lat: 43.95, lon: -71.51, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "lakes-region": { windy: { lat: 43.54, lon: -71.39, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "carrabassett-valley": { windy: { lat: 45.03, lon: -70.31, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "newry-bethel": { windy: { lat: 44.47, lon: -70.86, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "rangeley": { windy: { lat: 44.94, lon: -70.51, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "lake-placid": { windy: { lat: 44.36, lon: -73.90, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "north-creek": { windy: { lat: 43.67, lon: -74.02, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "hunter": { windy: { lat: 42.20, lon: -74.23, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "windham": { windy: { lat: 42.29, lon: -74.26, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
  "highmount": { windy: { lat: 42.14, lon: -74.51, zoom: 10 }, official: { label: "NWS weather radar", imageUrl: null, href: "https://radar.weather.gov/", attribution: "National Weather Service · weather radar" } },
};

const DEFAULT_ZOOM = 9;

// How many radar frames either side of the current one stay mounted.
// Keeping every frame mounted (~16) makes each zoom refetch all of them
// at once and blanks the map on mobile after a big zoom-out/in (surfaced
// by the "all of <country>" control); a small window keeps playback
// flash-free while cutting tile churn well over 2x.
const RADAR_WINDOW = 3;





// Which country each region sits in. Drives the cross-region grouping on
// the interactive map: from any Australian region you can see every
// Australian town + resort, and likewise within Japan. Kept local so the
// map stays self-contained · keep in step with REGION_COUNTRY in
// src/regions/index.ts.
type MapCountry = "AU" | "JP" | "NZ" | "CA" | "US";
const REGION_COUNTRY: Record<RegionKey, MapCountry> = {
  "snowy-mountains": "AU",
  "victorias-high-country": "AU",
  tasmania: "AU",
  yamanouchi: "JP",
  "nozawa-onsen": "JP",
  iiyama: "JP",
  "hakuba-valley": "JP",
  myoko: "JP",
  niseko: "JP",
  furano: "JP",
  sapporo: "JP",
  "tomamu-sahoro": "JP",
  asahikawa: "JP",
  "rusutsu-kiroro": "JP",
  yuzawa: "JP",
  "zao-onsen": "JP",
  "hakkoda-aomori-spring": "JP",
  "appi-shizukuishi": "JP",
  bandai: "JP",
  daisen: "JP",
  minakami: "JP",
  "kusatsu-manza": "JP",
  hachimantai: "JP",
  queenstown: "NZ",
  wanaka: "NZ",
  "mt-hutt": "NZ",
  ruapehu: "NZ",
  whistler: "CA",
  "powder-highway": "CA",
  okanagan: "CA",
  vancouver: "CA",
  "banff-lake-louise": "CA",
  canmore: "CA",
  jasper: "CA",
  "quebec-laurentians": "CA",
  "quebec-charlevoix": "CA",
  "quebec-eastern-townships": "CA",
  "summit-county": "US",
  "vail-valley": "US",
  "aspen-snowmass": "US",
  steamboat: "US",
  "winter-park": "US",
  "crested-butte": "US",
  telluride: "US",
  durango: "US",
  "boulder-front-range": "US",
  "cottonwood-canyons": "US",
  "park-city": "US",
  "ogden-valley": "US",
  provo: "US",
  "cache-valley": "US",
  "north-lake-tahoe": "US",
  "south-lake-tahoe": "US",
  "mammoth-lakes": "US",
  "big-bear": "US",
  "bear-valley": "US",
  "mt-shasta": "US",
  "killington-pico": "US",
  "stowe-smugglers-notch": "US",
  "mad-river-valley": "US",
  "southern-vermont": "US",
  "okemo": "US",
  "jay-peak-nek": "US",
  "jackson-hole": "US",
  "grand-targhee": "US",
  "big-sky": "US",
  "bozeman-bridger-bowl": "US",
  "whitefish": "US",
  "red-lodge": "US",
  "taos": "US",
  "angel-fire": "US",
  "santa-fe": "US",
  "albuquerque-sandia": "US",
  "harbor-springs": "US",
  "keweenaw-peninsula": "US",
  "poconos": "US",
  "laurel-highlands": "US",
  "berkshires": "US",
  "central-massachusetts": "US",
  "lutsen-north-shore": "US",
  "wausau": "US",
  "wisconsin-dells": "US",
  "snowshoe": "US",
  "canaan-valley": "US",
  "high-country": "US",
  "maggie-valley": "US",
  "blue-ridge": "US",
  "shenandoah-valley": "US",
  "lake-tahoe-nevada": "US",
  "flagstaff": "US",
  "white-mountains-az": "US",
  "black-hills": "US",
  "girdwood": "US",
  "juneau": "US",
  "litchfield-hills": "US",
  "vernon": "US",
  "mt-hood": "US",
  "bend": "US",
  "crystal-mountain": "US",
  "snoqualmie-pass": "US",
  "stevens-pass": "US",
  "mt-baker": "US",
  "sun-valley": "US",
  "sandpoint": "US",
  "boise": "US",
  "donnelly-mccall": "US",
  "white-mountains": "US",
  "franconia-notch": "US",
  "waterville-valley": "US",
  "lakes-region": "US",
  "carrabassett-valley": "US",
  "newry-bethel": "US",
  "rangeley": "US",
  "lake-placid": "US",
  "north-creek": "US",
  "hunter": "US",
  "windham": "US",
  "highmount": "US",
};
const COUNTRY_LABEL: Record<MapCountry, string> = { AU: "australia", JP: "japan", NZ: "new zealand", CA: "canada", US: "united states" };
const REGION_LABEL: Record<RegionKey, string> = {
  "snowy-mountains": "snowy mountains",
  "victorias-high-country": "victoria's high country",
  tasmania: "tasmania",
  yamanouchi: "yamanouchi",
  "nozawa-onsen": "nozawa onsen",
  iiyama: "iiyama",
  "hakuba-valley": "hakuba valley",
  myoko: "myoko",
  niseko: "niseko",
  furano: "furano",
  sapporo: "sapporo",
  "tomamu-sahoro": "tomamu & sahoro",
  asahikawa: "asahikawa",
  "rusutsu-kiroro": "rusutsu & kiroro",
  yuzawa: "yuzawa",
  "zao-onsen": "zao onsen",
  "hakkoda-aomori-spring": "hakkoda & aomori spring",
  "appi-shizukuishi": "appi & shizukuishi",
  bandai: "bandai",
  daisen: "daisen",
  minakami: "minakami",
  "kusatsu-manza": "kusatsu & manza",
  hachimantai: "hachimantai",
  queenstown: "queenstown",
  wanaka: "wanaka",
  "mt-hutt": "mt hutt",
  ruapehu: "ruapehu",
  whistler: "whistler",
  "powder-highway": "powder highway",
  okanagan: "okanagan",
  vancouver: "vancouver & the island",
  "banff-lake-louise": "banff & lake louise",
  canmore: "canmore",
  jasper: "jasper",
  "quebec-laurentians": "laurentians",
  "quebec-charlevoix": "charlevoix",
  "quebec-eastern-townships": "eastern townships",
  "summit-county": "summit county",
  "vail-valley": "vail valley",
  "aspen-snowmass": "aspen snowmass",
  steamboat: "steamboat",
  "winter-park": "winter park",
  "crested-butte": "crested butte",
  telluride: "telluride",
  durango: "durango",
  "boulder-front-range": "boulder / front range",
  "cottonwood-canyons": "cottonwood canyons",
  "park-city": "park city",
  "ogden-valley": "ogden valley",
  provo: "provo",
  "cache-valley": "cache valley",
  "north-lake-tahoe": "north lake tahoe",
  "south-lake-tahoe": "south lake tahoe",
  "mammoth-lakes": "mammoth lakes",
  "big-bear": "big bear",
  "bear-valley": "bear valley",
  "mt-shasta": "mt. shasta",
  "killington-pico": "killington & pico",
  "stowe-smugglers-notch": "stowe & smugglers' notch",
  "mad-river-valley": "mad river valley",
  "southern-vermont": "southern vermont",
  "okemo": "okemo",
  "jay-peak-nek": "jay peak & northeast kingdom",
  "jackson-hole": "jackson hole",
  "grand-targhee": "grand targhee",
  "big-sky": "big sky",
  "bozeman-bridger-bowl": "bozeman",
  "whitefish": "whitefish",
  "red-lodge": "red lodge",
  "taos": "taos",
  "angel-fire": "angel fire",
  "santa-fe": "santa fe",
  "albuquerque-sandia": "albuquerque",
  "harbor-springs": "harbor springs",
  "keweenaw-peninsula": "keweenaw peninsula",
  "poconos": "poconos",
  "laurel-highlands": "laurel highlands",
  "berkshires": "berkshires",
  "central-massachusetts": "central massachusetts",
  "lutsen-north-shore": "lutsen & north shore",
  "wausau": "wausau",
  "wisconsin-dells": "wisconsin dells",
  "snowshoe": "snowshoe",
  "canaan-valley": "canaan valley",
  "high-country": "high country",
  "maggie-valley": "maggie valley",
  "blue-ridge": "blue ridge",
  "shenandoah-valley": "shenandoah valley",
  "lake-tahoe-nevada": "lake tahoe nevada",
  "flagstaff": "flagstaff",
  "white-mountains-az": "white mountains",
  "black-hills": "black hills",
  "girdwood": "girdwood",
  "juneau": "juneau",
  "litchfield-hills": "litchfield hills",
  "vernon": "vernon",
  "mt-hood": "mt. hood",
  "bend": "bend",
  "crystal-mountain": "crystal mountain",
  "snoqualmie-pass": "snoqualmie pass",
  "stevens-pass": "stevens pass",
  "mt-baker": "mt. baker",
  "sun-valley": "sun valley",
  "sandpoint": "sandpoint",
  "boise": "boise",
  "donnelly-mccall": "donnelly / mccall",
  "white-mountains": "white mountains",
  "franconia-notch": "franconia notch",
  "waterville-valley": "waterville valley",
  "lakes-region": "lakes region",
  "carrabassett-valley": "carrabassett valley",
  "newry-bethel": "newry / bethel",
  "rangeley": "rangeley",
  "lake-placid": "lake placid",
  "north-creek": "north creek",
  "hunter": "hunter",
  "windham": "windham",
  "highmount": "highmount",
};

interface CountryPin extends PinSpec {
  region: RegionKey;
  isCurrent: boolean;
}

// Every town + resort that shares a country with `region`, each tagged
// with its home region. Lets the map show neighbouring regions' pins (so
// you can browse Mt Buller while sitting on a Snowy Mountains page) and
// frame the whole country via the "show all" control.
// Some resorts appear in two regions on purpose (furano keeps Tomamu and
// Kamui as day trips while they also have dedicated areas). On the shared
// country-wide map the tiny display nudge isn't enough separation, so we
// suppress the day-trip duplicate and keep only the dedicated-area pin,
// which links through to the fuller region page.
const DUPLICATE_COUNTRY_PINS: Partial<Record<RegionKey, string[]>> = {
  furano: ["tomamu", "kamui-ski-links"],
};

function countryPinsFor(region: RegionKey): CountryPin[] {
  const country = REGION_COUNTRY[region];
  return (Object.keys(REGION_DEFAULTS) as RegionKey[])
    .filter((key) => REGION_COUNTRY[key] === country)
    .flatMap((key) => {
      const suppressed = DUPLICATE_COUNTRY_PINS[key] ?? [];
      return REGION_DEFAULTS[key].pins
        .filter((p) => !suppressed.includes(p.id))
        .map((p) => ({
          ...p,
          region: key,
          isCurrent: key === region,
        }));
    });
}

// RainViewer is a free public weather-tile API: global precipitation
// radar (past 2hr + 30min nowcast). No API key required, CORS-friendly,
// ~256 KB per frame. The /weather-maps.json manifest tells us which
// frames exist and where to fetch the tiles from.
const RAINVIEWER_MANIFEST = "https://api.rainviewer.com/public/weather-maps.json";

interface RvFrame {
  time: number; // unix seconds
  path: string; // "/v2/radar/{ts}"
}
interface RvManifest {
  host: string;
  radar: { past: RvFrame[]; nowcast: RvFrame[] };
}

// Re-run a loader when the tab / installed PWA returns to the foreground.
// Mobile browsers freeze setInterval timers while backgrounded (iOS keeps them
// throttled even after resume), so a visitor reopening the app after a while
// would otherwise sit on a stale radar until the next tick fires · this pulls
// the latest immediately. Throttled so rapid app-switching can't cause churn.
function useForegroundRefresh(onForeground: () => void, minGapMs = 90_000) {
  const cbRef = useRef(onForeground);
  cbRef.current = onForeground;
  const lastRef = useRef(Date.now());
  useEffect(() => {
    function trigger() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      const now = Date.now();
      if (now - lastRef.current < minGapMs) return;
      lastRef.current = now;
      cbRef.current();
    }
    document.addEventListener("visibilitychange", trigger);
    window.addEventListener("focus", trigger);
    return () => {
      document.removeEventListener("visibilitychange", trigger);
      window.removeEventListener("focus", trigger);
    };
  }, [minGapMs]);
}

function useRainviewerManifest() {
  const [manifest, setManifest] = useState<RvManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Exposes the effect's current loader so the foreground-refresh hook can pull
  // a fresh manifest the instant the app is reopened.
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(RAINVIEWER_MANIFEST, { cache: "no-store" });
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        const data = (await r.json()) as RvManifest;
        if (cancelled) return;
        setManifest(data);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRef.current = load;
    load();
    // RainViewer publishes a new radar frame every ~10 min. Refresh the
    // manifest at the same cadence so we always have the latest nowcast.
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Cross-origin (RainViewer), so the service worker never touches it · the
  // foreground refetch is the only thing that un-freezes it after a resume.
  useForegroundRefresh(() => loadRef.current());

  return { manifest, loading, error };
}

function makePinIcon(label: string, accent: string): L.DivIcon {
  return L.divIcon({
    className: "feelzlike-radar-pin",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="width:14px;height:14px;border-radius:9999px;background:${accent};box-shadow:0 0 0 3px rgba(15,23,42,0.85),0 1px 4px rgba(0,0,0,0.6);"></div>
        <div style="margin-top:4px;padding:2px 8px;border-radius:9999px;background:rgba(15,23,42,0.92);color:#fff;font:600 11px/1.1 'DIN Pro','Inter',system-ui,sans-serif;white-space:nowrap;letter-spacing:0.01em;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${label}</div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 7],
  });
}

// Build the pin icon cache from the region defaults so adding a region
// only requires editing REGION_DEFAULTS above. Caller-supplied markers
// (from the `markers` prop) fall back to a generic blue pin via
// makePinIcon at render time.
const PIN_ICONS: Record<string, L.DivIcon> = Object.fromEntries(
  Object.values(REGION_DEFAULTS).flatMap((r) =>
    r.pins.map((p) => [p.id, makePinIcon(p.name, p.accent)] as const),
  ),
);

function RecenterOnChange({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  // Pass primitive lat/lng/zoom as deps. Previously this took a tuple
  // `center=[lat,lng]` whose array identity changed on every parent
  // render, which fired `setView` continuously and snapped the map back
  // mid-pan/zoom · effectively breaking interaction. Now it only runs
  // when the actual coordinates change (e.g. user picks a new town).
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [map, lat, lng, zoom]);
  return null;
}

// RainViewer tile path:
//   {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
// Color schemes documented at https://www.rainviewer.com/api.html.
//   color=6 = "NEXRAD Level-III" — full green→yellow→orange→red intensity
//            scale (more colours, closer to the BOM / Apple rain maps).
//   smooth=1 enables bilinear smoothing.
//   snow=1   tints sub-zero precip in cyan/white so snow vs rain is
//            visually distinguishable on the same layer.
// Retina-aware tile resolution. On high-DPI screens (most phones, where
// devicePixelRatio >= 2) the 256px radar tiles look noticeably blocky once
// Leaflet upscales them past the radar's native zoom. Pulling RainViewer's
// 512px source and letting the browser downsample it into the (default) 256
// CSS-px tile slot keeps the precip layer crisp on mobile without changing
// tile geometry · 1x desktops keep the lighter 256px tiles. (The dark basemap
// is already retina via Leaflet's {r} token; the RainViewer URL has no {r},
// so the size is picked here.)
const RADAR_TILE_PX =
  typeof window !== "undefined" && window.devicePixelRatio > 1 ? 512 : 256;

function radarTileUrl(host: string, path: string): string {
  return `${host}${path}/${RADAR_TILE_PX}/{z}/{x}/{y}/6/1_1.png`;
}

// --- click-to-load point readout (Open-Meteo) ---------------------------

interface ProbeData {
  tempVal: number;
  tempUnit: string;
  windVal: number;
  windDir: number;
  windUnit: string;
  snowVal: number;
  snowUnit: string;
  rainProb: number;
  rainUnit: string;
}

type PointLayer = "snowfall" | "wind" | "temp" | "rainRisk";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function compassDir(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// Smooths the precip field once it's CSS-upscaled past its native zoom.
// RainViewer's mosaic carries real data only through z7 (z8+ is an empty
// placeholder · verified AU + JP), so at town zooms Leaflet stretches the
// coarse z7 tiles into hard blocks. We can't fetch finer radar, so we soften
// the upscaled field with a blur that grows with how far past native we are.
// The amount is written to a CSS custom property straight on the map
// container · a DOM write, not React state, so the animation frames never
// remount (which would reintroduce the tile-refetch flash). At or below the
// native zoom the blur is 0, leaving the wide "all of <country>" view crisp.
function RadarBlur({ nativeZoom }: { nativeZoom: number }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const apply = () => {
      const over = Math.max(0, map.getZoom() - nativeZoom);
      // A radar cell spans ~2^over screen-px once upscaled · blurring by a
      // little over half a cell merges the steps into a gradient. Capped so
      // deep zoom softens the blocks without fogging the whole field.
      const px = over === 0 ? 0 : Math.min(5, Math.pow(2, over) * 0.4);
      el.style.setProperty("--radar-blur", px === 0 ? "0px" : `${px.toFixed(2)}px`);
    };
    apply();
    map.on("zoomend", apply);
    return () => {
      map.off("zoomend", apply);
      el.style.removeProperty("--radar-blur");
    };
  }, [map, nativeZoom]);
  return null;
}

// Registers a single map click handler. Only fires when at least one
// point layer (snowfall/wind/temp/rain risk) is enabled · clicking with
// only precip radar on does nothing, matching the layer-panel intent.
function ClickProbe({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// A dot at the clicked point with its readout popup. Auto-opens on mount;
// the parent remounts it (via key on coordinates) for each new click.
function ProbeMarker({
  lat,
  lng,
  children,
}: {
  lat: number;
  lng: number;
  children: React.ReactNode;
}) {
  const ref = useRef<L.CircleMarker>(null);
  useEffect(() => {
    ref.current?.openPopup();
  }, []);
  return (
    <CircleMarker
      ref={ref}
      center={[lat, lng]}
      radius={7}
      pathOptions={{ color: "#38bdf8", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.5 }}
    >
      <Popup className="feelzlike-probe-popup" minWidth={170}>
        {children}
      </Popup>
    </CircleMarker>
  );
}

function ReadoutRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-sky-300 shrink-0" />
      <span className="text-[11px] text-slate-300 flex-1">{label}</span>
      <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}

// Captures the Leaflet map instance so out-of-map controls (the
// "show all" / "this region" buttons) can drive fitBounds / setView.
function CaptureMap({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function RadarMapInner({
  center,
  zoom = DEFAULT_ZOOM,
  markers,
  season = "winter",
  region = "snowy-mountains",
  location,
}: RadarMapInnerProps) {
  const regionCfg = REGION_CONFIG[region];
  const regionDefaults = REGION_DEFAULTS[region];
  const effectiveCenter = center ?? regionDefaults.center;
  // When a `location` override is supplied (the /near-you page hands us an
  // arbitrary AU coordinate) its nearest-BOM-radar result and Windy centre win
  // over the curated per-region config. `official` may be null there · that
  // means "no BOM radar covers this point", so we hide the Official tab and
  // lead with the global Interactive radar. Region pages pass no `location`,
  // so effectiveOfficial/effectiveWindy collapse to the region config and
  // behaviour is unchanged.
  const effectiveOfficial: OfficialRadarSource | null = location
    ? location.official
    : regionCfg.official;
  const effectiveWindy: WindySource = location ? location.windy : regionCfg.windy;
  const showOfficialTab = effectiveOfficial != null;
  // Australian regions (and any covered /near-you point) lead with the Official
  // BOM radar · the locally trusted, sharper source · whenever an embeddable
  // image exists; every other case leads with the resilient Interactive view
  // (dark basemap + RainViewer radar, each rendering independently).
  const defaultView: ViewMode = effectiveOfficial?.imageUrl
    ? "official"
    : "interactive";
  // When an embeddable BOM image exists (any covered AU point, or an AU
  // region) lead the tab row with Official so the locally trusted radar
  // reads as the MAIN one · not a third option after Interactive/Expert.
  // JP/NZ have no embeddable image (Official is link-out only), so they keep
  // Interactive first and Official last.
  const officialIsPrimary = !!effectiveOfficial?.imageUrl;
  const [view, setView] = useState<ViewMode>(defaultView);
  // Re-apply the default tab whenever the official SOURCE changes · a real
  // region switch, or the /near-you user searching a new place / GPS update ·
  // not just on region change (client-side nav can reuse the same mounted
  // instance). Keying on region + the official image/href means manual tab
  // picks persist while the source is stable, but a new source never inherits
  // a stale tab (e.g. an uncovered point keeping a prior point's "official",
  // or an AU page inheriting "interactive" from JP/NZ). Adjusting state during
  // render is React's recommended pattern here and avoids a wrong-tab flash.
  const sourceKey = `${region}:${effectiveOfficial?.imageUrl ?? effectiveOfficial?.href ?? "none"}`;
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setView(defaultView);
  }
  // Active Windy overlay · drives the Windy iframe's `overlay=` param.
  const [windyOverlay, setWindyOverlay] = useState<"snow" | "wind" | "temp" | "rain">(
    season === "winter" ? "snow" : "rain",
  );

  // Keep the Windy overlay default in step with the user's season toggle
  // (snow in winter, rain in green) so the Expert tab opens on the right
  // layer if the user navigates to it.
  useEffect(() => {
    setWindyOverlay(season === "winter" ? "snow" : "rain");
  }, [season]);

  const { manifest, loading, error } = useRainviewerManifest();
  const [frameIndex, setFrameIndex] = useState(0);
  // Default to PAUSED. Autoplay swaps tile layers every 700ms which
  // visibly fights leaflet's zoom-level retiling. Users can hit play.
  const [playing, setPlaying] = useState(false);

  // Weather Layers panel state. Precip Radar is the one layer lit on
  // load (the animated RainViewer field); the others are point readouts
  // that surface only when the user clicks a spot on the map.
  const [showPrecip, setShowPrecip] = useState(true);
  const [pointLayers, setPointLayers] = useState<Record<PointLayer, boolean>>({
    snowfall: false,
    wind: false,
    temp: false,
    rainRisk: false,
  });
  // Metric on by default · the rest of feelzlike is metric-first. Off
  // switches the click readouts to °F / mph / inch.
  const [metric, setMetric] = useState(true);

  // Layers panel collapses on small screens so it doesn't smother the
  // map · open by default on >=md, a tap-to-open chip on phones.
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const [probe, setProbe] = useState<{ lat: number; lng: number } | null>(null);
  const [probeData, setProbeData] = useState<ProbeData | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);

  const tickRef = useRef<number | null>(null);

  const anyPointLayer =
    pointLayers.snowfall || pointLayers.wind || pointLayers.temp || pointLayers.rainRisk;

  function togglePoint(layer: PointLayer) {
    setPointLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }

  // Combined radar timeline: past frames followed by nowcast frames.
  const radarFrames = useMemo<RvFrame[]>(() => {
    if (!manifest) return [];
    return [...manifest.radar.past, ...manifest.radar.nowcast];
  }, [manifest]);

  const nowcastStart = manifest?.radar.past.length ?? 0;
  const isNowcast = frameIndex >= nowcastStart;

  // Animate radar at ~700ms per frame while precip is shown + playing.
  useEffect(() => {
    if (view !== "interactive") return;
    if (!playing || !showPrecip || radarFrames.length === 0) return;
    tickRef.current = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % radarFrames.length);
    }, 700);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [view, playing, showPrecip, radarFrames.length]);

  // Whenever the manifest refreshes, jump to the most recent observed
  // frame (end of past, just before nowcast) so the loop starts at "now".
  useEffect(() => {
    if (radarFrames.length > 0) {
      setFrameIndex(Math.max(0, nowcastStart - 1));
    }
  }, [radarFrames.length, nowcastStart]);

  // Drop the click readout when every point layer is switched off · there
  // is nothing left to show, so the dot + popup shouldn't linger.
  useEffect(() => {
    if (!anyPointLayer) {
      setProbe(null);
      setProbeData(null);
      setProbeError(null);
    }
  }, [anyPointLayer]);

  // Fetch point values from Open-Meteo for the clicked spot. Re-runs when
  // the user clicks a new point or flips the metric toggle (units change).
  useEffect(() => {
    if (!probe) return;
    let cancelled = false;
    setProbeLoading(true);
    setProbeError(null);
    const u = new URL("https://api.open-meteo.com/v1/forecast");
    u.searchParams.set("latitude", probe.lat.toFixed(4));
    u.searchParams.set("longitude", probe.lng.toFixed(4));
    u.searchParams.set("current", "temperature_2m,wind_speed_10m,wind_direction_10m");
    u.searchParams.set("daily", "snowfall_sum,precipitation_probability_max");
    u.searchParams.set("forecast_days", "1");
    u.searchParams.set("timezone", "auto");
    u.searchParams.set("temperature_unit", metric ? "celsius" : "fahrenheit");
    u.searchParams.set("wind_speed_unit", metric ? "kmh" : "mph");
    u.searchParams.set("precipitation_unit", metric ? "mm" : "inch");
    fetch(u.toString())
      .then((r) => {
        if (!r.ok) throw new Error(`open-meteo ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const cu = d.current_units ?? {};
        const du = d.daily_units ?? {};
        setProbeData({
          tempVal: Math.round(d.current?.temperature_2m ?? NaN),
          tempUnit: cu.temperature_2m ?? "°",
          windVal: Math.round(d.current?.wind_speed_10m ?? NaN),
          windDir: d.current?.wind_direction_10m ?? 0,
          windUnit: cu.wind_speed_10m ?? "",
          snowVal: round1(d.daily?.snowfall_sum?.[0] ?? 0),
          snowUnit: du.snowfall_sum ?? "cm",
          rainProb: Math.round(d.daily?.precipitation_probability_max?.[0] ?? 0),
          rainUnit: du.precipitation_probability_max ?? "%",
        });
      })
      .catch((e) => {
        if (!cancelled) setProbeError(String(e));
      })
      .finally(() => {
        if (!cancelled) setProbeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [probe, metric]);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const handleMapReady = useCallback((m: L.Map) => setMapInstance(m), []);

  // Pins span the whole country the current region sits in, so you can
  // browse neighbouring regions' towns + resorts without leaving the page.
  // Caller-passed markers (none today) still take precedence.
  const countryPins = useMemo(() => countryPinsFor(region), [region]);
  const pins = useMemo<CountryPin[]>(
    () =>
      markers
        ? markers.map((m) => ({ ...m, accent: "#0ea5e9", region, isCurrent: true }))
        : countryPins,
    [markers, countryPins, region],
  );
  const hasOtherRegions = useMemo(() => pins.some((p) => !p.isCurrent), [pins]);
  const country = REGION_COUNTRY[region];
  // The "official" tab shows a different national agency per country, so
  // label it honestly · a blanket "BOM" only holds for Australia.
  const officialAgency = country === "AU" ? "BOM" : country === "JP" ? "JMA" : "MetService";
  // One-line explainer for whichever tab is active · shown beside the tab
  // row on wider screens (the icons + labels carry it on mobile).
  const viewExplainer =
    view === "windy"
      ? "windy.com · rich forecast layers"
      : view === "official"
        ? `official ${officialAgency} radar`
        : "our interactive ski radar";

  const showAllCountry = useCallback(() => {
    if (!mapInstance || pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    mapInstance.fitBounds(bounds, { padding: [56, 56], maxZoom: 9, animate: true });
  }, [mapInstance, pins]);

  const focusCurrentRegion = useCallback(() => {
    if (!mapInstance) return;
    mapInstance.setView([effectiveCenter.lat, effectiveCenter.lng], zoom, { animate: true });
  }, [mapInstance, effectiveCenter.lat, effectiveCenter.lng, zoom]);
  const currentRadar = radarFrames[frameIndex];
  const stamp = currentRadar ? formatStamp(currentRadar.time) : null;
  const centerTuple: [number, number] = [effectiveCenter.lat, effectiveCenter.lng];

  // Windy embed URL — built per-region.
  const windyUrl = useMemo(() => {
    const params = new URLSearchParams({
      lat: String(effectiveWindy.lat),
      lon: String(effectiveWindy.lon),
      detailLat: String(effectiveWindy.lat),
      detailLon: String(effectiveWindy.lon),
      zoom: String(effectiveWindy.zoom),
      level: "surface",
      overlay: windyOverlay,
      product: "ecmwf",
      menu: "",
      message: "true",
      marker: "",
      calendar: "now",
      type: "map",
      location: "coordinates",
      metricWind: "default",
      metricTemp: "default",
      radarRange: "-1",
    });
    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  }, [windyOverlay, effectiveWindy]);

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900">
      {/* View switcher (top-left). Three modes: our interactive ski radar
          (default · dark map, weather layers, click-to-read points), Windy
          (rich multi-layer), and the official regional source. */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg p-1 max-w-[calc(100%-1.5rem)]">
        <div className="flex gap-1">
          {showOfficialTab && officialIsPrimary && (
            <TabPill active={view === "official"} onClick={() => setView("official")} icon={Radio} label={officialAgency} />
          )}
          <TabPill active={view === "interactive"} onClick={() => setView("interactive")} icon={MapIcon} label="Map" />
          <TabPill active={view === "windy"} onClick={() => setView("windy")} icon={Globe2} label="Windy" />
          {showOfficialTab && !officialIsPrimary && (
            <TabPill active={view === "official"} onClick={() => setView("official")} icon={Radio} label={officialAgency} />
          )}
        </div>
        <span className="hidden md:block pr-1 pl-0.5 text-[11px] leading-tight text-slate-400 whitespace-nowrap">
          {viewExplainer}
        </span>
      </div>

      {/* Cross-region framing · jump between the whole country's towns +
          resorts and the current region. Interactive view only, and only
          when there are neighbouring regions to show. */}
      {view === "interactive" && hasOtherRegions && (
        <div className="absolute top-16 left-3 z-[1000] flex gap-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg p-1">
          <button
            type="button"
            onClick={showAllCountry}
            title={`show all of ${COUNTRY_LABEL[country]}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
            <span className="lowercase">all of {COUNTRY_LABEL[country]}</span>
          </button>
          <button
            type="button"
            onClick={focusCurrentRegion}
            title="back to this region"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 shrink-0" />
            <span className="sr-only sm:not-sr-only">this region</span>
          </button>
        </div>
      )}

      {view === "windy" && (
        <>
          {/* Overlay switcher placed BEFORE the iframe in DOM order so
              keyboard users hit the layer pills before tab-focus enters
              the third-party Windy frame (which can trap focus). */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg p-1">
            <ModePill active={windyOverlay === "snow"} onClick={() => setWindyOverlay("snow")} icon={CloudSnow} label="Snow" />
            <ModePill active={windyOverlay === "wind"} onClick={() => setWindyOverlay("wind")} icon={Wind} label="Wind" />
            <ModePill active={windyOverlay === "temp"} onClick={() => setWindyOverlay("temp")} icon={Thermometer} label="Temp" />
            <ModePill active={windyOverlay === "rain"} onClick={() => setWindyOverlay("rain")} icon={CloudRain} label="Radar" />
          </div>
          <iframe
            title="windy.com weather map · snow, wind, temperature and radar"
            src={windyUrl}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </>
      )}

      {view === "official" && effectiveOfficial && (
        // key by the source URL so switching regions / locations remounts the
        // view and resets its internal `imgFailed` state.
        <OfficialView
          key={effectiveOfficial.imageUrl ?? effectiveOfficial.href}
          official={effectiveOfficial}
          center={effectiveCenter}
        />
      )}

      {view === "interactive" && (
        <MapContainer
          center={centerTuple}
          zoom={zoom}
          scrollWheelZoom
          zoomControl={false}
          className="absolute inset-0 w-full h-full"
          minZoom={4}
          maxZoom={12}
        >
          <RecenterOnChange lat={effectiveCenter.lat} lng={effectiveCenter.lng} zoom={zoom} />
          <CaptureMap onReady={handleMapReady} />
          <RadarBlur nativeZoom={7} />

          {/* Esri world hillshade · shaded relief gives the map its terrain
              feel (mountains read as ridges, not flat). Sits at the bottom;
              the light labelled basemap rides on top. */}
          <TileLayer
            attribution='Hillshade © <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
          />

          {/* Light basemap (CARTO Voyager, free, no key, CDN-hosted). Light,
              labelled and geographic (towns, roads, water) so it reads like
              the BOM / Apple rain maps people compared us to · a clean, simple
              base the colour radar pops against. Slightly transparent so the
              hillshade terrain relief still bleeds through underneath. */}
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxNativeZoom={19}
            opacity={0.92}
          />

          {/* Precipitation layers.
              Every frame is mounted once as its own persistent TileLayer and
              animation is driven purely by opacity · the active frame is
              visible, all others sit at opacity 0 (still loaded, just hidden).
              Previously we rendered a single TileLayer keyed by frame time,
              which forced React to unmount + remount the layer on every frame
              swap. A freshly mounted Leaflet layer starts blank and refetches
              all tiles, so each step flashed a gap before tiles arrived. Keying
              each frame by its own (stable) timestamp keeps it mounted for the
              layer's lifetime, so stepping is an instant opacity flip with no
              blank frame.
              maxNativeZoom: verified empirically (AU + JP, Jun 2026) that
              RainViewer's radar mosaic carries real data through z7 and
              returns a uniform placeholder PNG at z8+. We cap native fetches
              at z7 (the most detail available) and let Leaflet CSS-upscale
              that for higher zooms · going to z8 would swap real precip for
              blank placeholders. */}
          {showPrecip &&
            manifest &&
            radarFrames.map((frame, idx) => {
              // Only mount frames within a small window of the current one.
              // Neighbours stay mounted at opacity 0 so stepping playback is
              // flash-free, but we no longer carry all ~16 layers · that made
              // every zoom refetch 16 tile sets and blanked the map on mobile
              // after a big zoom-out/in. The window is CIRCULAR: playback wraps
              // (last → 0), so frame 0 must already be mounted when the current
              // frame is near the end · a linear window would flash on wrap.
              const linear = Math.abs(idx - frameIndex);
              const ring = Math.min(linear, radarFrames.length - linear);
              if (ring > RADAR_WINDOW) return null;
              const active = idx === frameIndex;
              const frameIsNowcast = idx >= nowcastStart;
              return (
                <TileLayer
                  key={`rad-${frame.time}`}
                  className="radar-fx"
                  url={radarTileUrl(manifest.host, frame.path)}
                  opacity={active ? (frameIsNowcast ? 0.65 : 0.85) : 0}
                  zIndex={active ? 401 : 400}
                  maxNativeZoom={7}
                  updateWhenZooming={false}
                  attribution=""
                />
              );
            })}

          <ClickProbe enabled={anyPointLayer} onPick={(lat, lng) => setProbe({ lat, lng })} />

          {probe && (
            <ProbeMarker key={`${probe.lat},${probe.lng}`} lat={probe.lat} lng={probe.lng}>
              <div className="min-w-[150px]">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5 tabular-nums">
                  {probe.lat.toFixed(3)}, {probe.lng.toFixed(3)}
                </div>
                {probeLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-300 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> loading…
                  </div>
                ) : probeError ? (
                  <div className="text-xs text-amber-300 py-1">couldn't load · try again</div>
                ) : probeData ? (
                  <div className="space-y-1.5">
                    {pointLayers.snowfall && (
                      <ReadoutRow icon={Snowflake} label="snowfall · 24h" value={`${probeData.snowVal} ${probeData.snowUnit}`} />
                    )}
                    {pointLayers.temp && (
                      <ReadoutRow icon={Thermometer} label="temperature" value={`${probeData.tempVal}${probeData.tempUnit}`} />
                    )}
                    {pointLayers.wind && (
                      <ReadoutRow icon={Wind} label="wind" value={`${probeData.windVal} ${probeData.windUnit} ${compassDir(probeData.windDir)}`} />
                    )}
                    {pointLayers.rainRisk && (
                      <ReadoutRow icon={Droplet} label="rain risk" value={`${probeData.rainProb}%`} />
                    )}
                  </div>
                ) : null}
              </div>
            </ProbeMarker>
          )}

          {pins.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={PIN_ICONS[p.id] ?? makePinIcon(p.name, p.accent ?? "#0ea5e9")}
              opacity={p.isCurrent ? 1 : 0.78}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <span className="font-semibold">{p.name}</span>
                {!p.isCurrent && (
                  <span className="block text-[10px] font-medium text-slate-500 lowercase">
                    {REGION_LABEL[p.region]}
                  </span>
                )}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Weather Layers panel (top-right). Precip radar lit on load; the
          rest are point readouts surfaced on map click. Interactive only. */}
      {view === "interactive" && !panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-2 text-white"
          aria-label="Show weather layers"
        >
          <Layers className="w-4 h-4 text-sky-300" />
          <span className="text-xs font-bold lowercase">layers</span>
        </button>
      )}
      {view === "interactive" && panelOpen && (
        <div className="absolute top-3 right-3 z-[1000] w-64 max-w-[calc(100%-1.5rem)] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <h3 className="text-sm font-bold lowercase leading-tight">weather layers</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMetric((m) => !m)}
                className="flex items-center gap-1.5"
                aria-pressed={metric}
                aria-label="Toggle metric units"
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", metric ? "text-sky-300" : "text-slate-500")}>
                  metric
                </span>
                <Switch on={metric} />
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="md:hidden -mr-1 p-1 text-slate-400 hover:text-white"
                aria-label="Hide weather layers"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-2 pb-2 space-y-0.5">
            <LayerToggle
              icon={Radar}
              title="precip radar"
              desc="live animated precipitation from rainviewer · past 2h + 30min nowcast."
              active={showPrecip}
              onToggle={() => setShowPrecip((v) => !v)}
            />
            <LayerToggle
              icon={Snowflake}
              title="snowfall · 24h"
              desc="forecast snow in the next 24 hours. shown when you click any point."
              active={pointLayers.snowfall}
              onToggle={() => togglePoint("snowfall")}
            />
            <LayerToggle
              icon={Wind}
              title="wind speed"
              desc="10m wind speed and direction at the clicked point."
              active={pointLayers.wind}
              onToggle={() => togglePoint("wind")}
            />
            <LayerToggle
              icon={Thermometer}
              title="temperature"
              desc="2m air temperature at the clicked point."
              active={pointLayers.temp}
              onToggle={() => togglePoint("temp")}
            />
            <LayerToggle
              icon={Droplet}
              title="rain risk"
              desc="chance of liquid rain at the clicked point · the skier's nemesis."
              active={pointLayers.rainRisk}
              onToggle={() => togglePoint("rainRisk")}
            />
          </div>
          <div className="border-t border-white/10 px-3 py-2.5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">map key</p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#0ea5e9" }} />
              <span className="text-[11px] text-slate-300">town · base for your stay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#f97316" }} />
              <span className="text-[11px] text-slate-300">ski resort</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-white/40" />
              <span className="text-[11px] text-slate-300">dimmed pin · another region</span>
            </div>
          </div>
        </div>
      )}

      {/* Hint chip · only when a point layer is armed but nothing clicked
          yet, so users know the readout is a click away. */}
      {view === "interactive" && anyPointLayer && !probe && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-[1000] rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-1.5 text-[11px] font-medium text-slate-200">
          click anywhere on the map to read values here
        </div>
      )}

      {/* Floating control bar (bottom): play/pause + timestamp + scrubber.
          Shown only when the precip radar layer is on. */}
      {view === "interactive" && showPrecip && (
        <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-2 flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={radarFrames.length === 0}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white disabled:opacity-40"
            aria-label={playing ? "Pause radar animation" : "Play radar animation"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-300 font-semibold flex items-center gap-2">
              {loading
                ? "loading radar…"
                : error
                  ? "radar unavailable"
                  : stamp
                    ? (
                        <>
                          <span className="tabular-nums">{stamp}</span>
                          {isNowcast && (
                            <span className="inline-flex items-center rounded-full bg-amber-400/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                              FORECAST
                            </span>
                          )}
                        </>
                      )
                    : "no frames"}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, radarFrames.length - 1)}
              value={frameIndex}
              onChange={(e) => {
                setPlaying(false);
                setFrameIndex(parseInt(e.target.value));
              }}
              disabled={radarFrames.length === 0}
              className="w-full mt-1 accent-sky-500"
              aria-label="Radar frame scrubber"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            RainViewer · global radar
          </span>
        </div>
      )}
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-7 shrink-0 items-center rounded-full px-0.5 transition-colors",
        on ? "bg-sky-500" : "bg-slate-600",
      )}
      aria-hidden="true"
    >
      <span className={cn("h-3 w-3 rounded-full bg-white transition-transform", on ? "translate-x-3" : "translate-x-0")} />
    </span>
  );
}

function LayerToggle({
  icon: Icon,
  title,
  desc,
  active,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
        active ? "bg-white/10" : "hover:bg-white/5",
      )}
      aria-pressed={active}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", active ? "text-sky-300" : "text-slate-400")} />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-white lowercase">{title}</span>
        <span className="block text-[10px] leading-snug text-slate-400 mt-0.5">{desc}</span>
      </span>
      <Switch on={active} />
    </button>
  );
}

// Dark-themed view tab (Map / Windy / agency) for the floating
// switcher over the dark basemap.
function TabPill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
        active ? "bg-sky-500 text-white" : "text-slate-300 hover:bg-white/10",
      )}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {/* Always show the label · icon-only pills on mobile hid "BOM" and
          users couldn't tell which source they were looking at. */}
      <span>{label}</span>
    </button>
  );
}

// Light-themed pill · used for the Windy Expert overlay switcher, which
// floats over the (lighter) Windy iframe.
function ModePill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
      )}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// BOM blocks cross-site hotlinking of its radar imagery: a browser <img>
// pointed straight at www.bom.gov.au gets a 403 (the Referer isn't
// bom.gov.au). The api-server's /api/bom-radar proxy refetches it
// server-side with browser headers (verified 200), so route every BOM asset
// through it. Any non-BOM official source (none today) passes through
// untouched; a proxy/BOM failure still trips the <img> onError and degrades
// to the same "open source" link-out.
const BOM_RADAR_GIF = /^https?:\/\/(?:www\.)?bom\.gov\.au\/radar\/(IDR\d+)\.gif$/;

function bomRadarId(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const m = imageUrl.match(BOM_RADAR_GIF);
  return m ? m[1] : null;
}

function officialImageSrc(imageUrl: string): string {
  const m = imageUrl.match(BOM_RADAR_GIF);
  return m ? `/api/bom-radar?type=loop&file=${m[1]}.gif` : imageUrl;
}

function bomLayerSrc(radarId: string, layer: string): string {
  return `/api/bom-radar?type=transparency&file=${radarId}.${layer}.png`;
}

interface BomFrame {
  ts: string;
  file: string;
  url: string;
}

// Parse a BOM frame timestamp (YYYYMMDDHHMM, UTC) into a Date, or null.
function parseFrameTs(ts: string): Date | null {
  if (ts.length !== 12) return null;
  const d = new Date(
    Date.UTC(
      Number(ts.slice(0, 4)),
      Number(ts.slice(4, 6)) - 1,
      Number(ts.slice(6, 8)),
      Number(ts.slice(8, 10)),
      Number(ts.slice(10, 12)),
    ),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

// Convert a BOM frame timestamp (YYYYMMDDHHMM, UTC) into a short local time.
function frameLocalTime(ts: string): string {
  const d = parseFrameTs(ts);
  if (!d) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// "Just now" / "9 min ago" / "1 h 20 min ago" · how old the newest frame is.
// BOM burns a UTC timestamp into its imagery (e.g. "21:44UTC"), which reads
// like last night to anyone thinking in local time · an explicit local-time
// age readout is what makes the radar's freshness verifiable at a glance.
function frameAgeLabel(ts: string, nowMs: number): string {
  const d = parseFrameTs(ts);
  if (!d) return "";
  const mins = Math.max(0, Math.round((nowMs - d.getTime()) / 60_000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min ago` : `${h} h ago`;
}

// Newest-frame age (minutes) past which we stop presenting the loop as
// "live" and flag it as delayed. BOM publishes every 6-10 min · 45 min of
// silence means the feed (or our path to it) is genuinely behind.
const FRAME_DELAYED_MIN = 45;

// Lets the user pan + zoom the otherwise-static Official radar imagery so it
// behaves like the Interactive (Leaflet) tab people compared us to. The
// BOM/JMA composites are fixed-resolution rasters · zooming magnifies the
// pixels (imageRendering: pixelated keeps the cells crisp-edged) rather than
// fetching finer data, but it lets people move around and inspect a corner of
// the loop. Wheel, pinch, double-tap and the on-screen buttons all drive one
// shared transform. The controls live in the gesture layer, NOT the scaled
// layer, so they stay put while the radar moves underneath.
function PanZoomStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  // Live mirror of the transform so the (effect-bound, non-passive) wheel
  // handler and the pointer-move pan branch read the current scale without
  // re-subscribing on every change.
  const tRef = useRef(t);
  tRef.current = t;
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);

  const MIN = 1;
  const MAX = 6;

  // Keep scale in range and stop the image being dragged off-screen · at base
  // scale (1) there is nothing to pan, so translation is pinned to 0.
  const clamp = useCallback((next: { s: number; x: number; y: number }) => {
    const el = ref.current;
    const s = Math.min(MAX, Math.max(MIN, next.s));
    if (!el || s <= 1) return { s, x: 0, y: 0 };
    const maxX = ((s - 1) * el.clientWidth) / 2;
    const maxY = ((s - 1) * el.clientHeight) / 2;
    return {
      s,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, []);

  // Zoom by `factor`, keeping the point (mx,my) · measured from the stage
  // centre in CSS px · pinned under the cursor / pinch midpoint. The inner
  // layer uses transform `translate(x,y) scale(s)` with a centre origin, so a
  // point's screen offset from centre is `point*s + (x,y)`; solving to keep the
  // anchor fixed gives the new translate below.
  const zoomAbout = useCallback(
    (factor: number, mx: number, my: number) => {
      setT((p) => {
        const ns = Math.min(MAX, Math.max(MIN, p.s * factor));
        const ratio = ns / p.s;
        return clamp({ s: ns, x: mx - (mx - p.x) * ratio, y: my - (my - p.y) * ratio });
      });
    },
    [clamp],
  );

  const offsetFromCentre = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
  };

  // Wheel must be a native, non-passive listener so preventDefault works ·
  // React's synthetic onWheel can be passive depending on the build.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const m = offsetFromCentre(e.clientX, e.clientY);
      zoomAbout(Math.exp(-e.deltaY * 0.0015), m.x, m.y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAbout]);

  const capture = (id: number) => {
    try {
      ref.current?.setPointerCapture(id);
    } catch {
      /* setPointerCapture can throw if the pointer already ended · ignore */
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
      // Only capture (and thus block native scroll) once zoomed · at base
      // scale a one-finger drag should still scroll the page past the radar.
      if (tRef.current.s > 1) capture(e.pointerId);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      lastPinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      lastPan.current = null;
      capture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const prev = lastPinch.current;
      if (prev && prev.dist > 0) {
        const m = offsetFromCentre(cx, cy);
        zoomAbout(dist / prev.dist, m.x, m.y);
        const mdx = cx - prev.cx;
        const mdy = cy - prev.cy;
        if (mdx || mdy) setT((p) => clamp({ ...p, x: p.x + mdx, y: p.y + mdy }));
      }
      lastPinch.current = { dist, cx, cy };
    } else if (lastPan.current && tRef.current.s > 1) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      setT((p) => clamp({ ...p, x: p.x + dx, y: p.y + dy }));
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastPinch.current = null;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      lastPan.current = { x: p.x, y: p.y };
    } else if (pointers.current.size === 0) {
      lastPan.current = null;
    }
  };

  const reset = () => setT({ s: 1, x: 0, y: 0 });
  const zoomed = t.s > 1.01;
  // Stop control taps from also starting a pan on the stage underneath.
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={ref}
      data-radar-gesture
      className={cn(
        "absolute inset-0 overflow-hidden select-none",
        zoomed ? "cursor-grab" : "cursor-default",
      )}
      // pan-y at rest lets a one-finger drag scroll the page past the tall
      // radar; once zoomed we own every direction so the user can pan freely.
      style={{ touchAction: zoomed ? "none" : "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onDoubleClick={(e) => {
        if (zoomed) {
          reset();
          return;
        }
        const m = offsetFromCentre(e.clientX, e.clientY);
        zoomAbout(2.5, m.x, m.y);
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>

      <div
        className="absolute bottom-16 right-3 z-[1000] flex flex-col gap-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg p-1"
        // Keep taps on the controls from bubbling to the stage · a quick
        // double-tap on +/- must not also fire the stage's double-click
        // zoom/reset underneath.
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="zoom in"
          onPointerDown={stop}
          onClick={() => zoomAbout(1.6, 0, 0)}
          className="grid place-items-center w-7 h-7 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="zoom out"
          onPointerDown={stop}
          onClick={() => zoomAbout(1 / 1.6, 0, 0)}
          className="grid place-items-center w-7 h-7 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoomed && (
          <button
            type="button"
            aria-label="reset zoom"
            onPointerDown={stop}
            onClick={reset}
            className="grid place-items-center w-7 h-7 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// The "Official" tab. Australian points lead with the LICENSED WillyWeather
// radar (a commercial BOM reseller): georeferenced 5-min frames layered on
// our own labelled basemap. If that's unavailable we degrade down the same
// honest ladder as before · the self-hosted BOM animated composite, then the
// single still gif, then the link-out. Japanese points render the JMA
// nowcast tiles (link-out on failure); NZ is link-out only, having no
// embeddable image.
function OfficialView({
  official,
  center,
}: {
  official: OfficialRadarSource;
  center: { lat: number; lng: number };
}) {
  const radarId = bomRadarId(official.imageUrl);
  if (radarId) {
    return <WillyOfficialView official={official} radarId={radarId} center={center} />;
  }
  // Japanese points render the JMA nowcast as live map tiles · same
  // layered-on-our-basemap pattern as the AU licensed feed. NZ (MetService)
  // stays link-out only.
  if (official.href.includes("jma.go.jp")) {
    return <JmaOfficialView official={official} center={center} />;
  }
  return <OfficialStillView official={official} />;
}

// ─── WillyWeather licensed AU radar ─────────────────────────────────────
interface WillyRadarData {
  provider: {
    name: string;
    lat: number;
    lng: number;
    bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number };
    interval: number;
    statusCode: string;
  };
  frames: BomFrame[]; // same {ts,url} shape · ts is compact UTC YYYYMMDDHHMM
  stale?: boolean;
}

// Drops the "Leaflet" prefix (and its flag emoji) from the attribution
// control so the credits line reads as tidy source credits, not clutter ·
// the Esri/OSM/CARTO credits themselves stay.
function StripAttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix("");
  }, [map]);
  return null;
}

function WillyOfficialView({
  official,
  radarId,
  center,
}: {
  official: OfficialRadarSource;
  radarId: string;
  center: { lat: number; lng: number };
}) {
  const [data, setData] = useState<WillyRadarData | null>(null);
  // null = first fetch still in flight · true = WillyWeather unusable, fall
  // back to the BOM composite path (which has its own still/link-out ladder).
  const [failed, setFailed] = useState<boolean | null>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  // Discovery succeeded but the overlay PNGs themselves may fail to load
  // (CDN blip) · if EVERY frame errors we have no radar data, so fall back.
  const [failedFrames, setFailedFrames] = useState<Set<string>>(new Set());

  const loadRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/willy-radar?lat=${center.lat.toFixed(3)}&lng=${center.lng.toFixed(3)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`willy ${res.status}`);
        const next = (await res.json()) as WillyRadarData;
        if (cancelled) return;
        if (!next.provider || !Array.isArray(next.frames) || next.frames.length < 2) {
          setFailed(true);
          return;
        }
        setData(next);
        setActive(next.frames.length - 1);
        setFailedFrames(new Set());
        setFailed(false);
      } catch {
        // Only fall back if we have nothing usable on screen · a transient
        // blip on a background refresh shouldn't discard a working loop
        // (the freshness readout goes amber on its own past 45 min).
        if (!cancelled) setFailed((prev) => (prev === false ? false : true));
      }
    }
    loadRef.current = load;
    load();
    // New frame roughly every 5 min · refresh a little faster than the BOM
    // path so the loop tracks the licensed feed's cadence.
    const id = window.setInterval(load, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [center.lat, center.lng]);
  useForegroundRefresh(() => loadRef.current());

  // Tick for the "x min ago" freshness readout.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const frames = data?.frames ?? [];

  // Advance the loop · same rhythm as the BOM composite (longer newest hold).
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const isNewest = active === frames.length - 1;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % frames.length),
      isNewest ? 1400 : 550,
    );
    return () => window.clearTimeout(id);
  }, [playing, active, frames.length]);

  const allFramesFailed = frames.length > 0 && failedFrames.size >= frames.length;
  if (failed || allFramesFailed) {
    return <BomAnimatedOfficialView official={official} radarId={radarId} />;
  }
  if (failed === null || !data) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const { provider } = data;
  const bounds = L.latLngBounds(
    [provider.bounds.minLat, provider.bounds.minLng],
    [provider.bounds.maxLat, provider.bounds.maxLng],
  );
  const activeTs = frames[active]?.ts ?? "";
  // Freshness is judged by the NEWEST frame, not whichever frame the loop is
  // currently showing (older frames in the loop are old by design).
  const newestTs = frames[frames.length - 1]?.ts ?? "";
  const newestAge = frameAgeLabel(newestTs, nowMs);
  const newestDate = parseFrameTs(newestTs);
  const delayed =
    newestDate !== null &&
    nowMs - newestDate.getTime() > FRAME_DELAYED_MIN * 60_000;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          bounds={bounds}
          maxBounds={bounds.pad(0.4)}
          minZoom={6}
          maxZoom={11}
          zoomControl={false}
          scrollWheelZoom
          touchZoom
          doubleClickZoom
          dragging
          attributionControl
          className="absolute inset-0 w-full h-full"
        >
          {/* Default topleft zoom control would clash with the tab bar ·
              bottomright is free now the source bar lives below the map. */}
          <ZoomControl position="bottomright" />
          <StripAttributionPrefix />
          {/* Same basemap pairing as the Interactive tab so the Official view
              reads as part of the same product · hillshade under a light
              labelled base. */}
          <TileLayer
            attribution='Hillshade © <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
          />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxNativeZoom={19}
            opacity={0.92}
          />
          {/* Every frame stays mounted (they're small single PNGs, not tile
              pyramids) · animation is an opacity flip so stepping never
              flashes a blank frame. */}
          {frames.map((f, i) => (
            <ImageOverlay
              key={f.ts}
              url={f.url}
              bounds={bounds}
              opacity={i === active ? 0.8 : 0}
              zIndex={400}
              eventHandlers={{
                error: () => {
                  setFailedFrames((prev) => {
                    if (prev.has(f.ts)) return prev;
                    const next = new Set(prev);
                    next.add(f.ts);
                    return next;
                  });
                },
              }}
            />
          ))}
          {/* The town / searched point the user came from. */}
          <CircleMarker
            center={[center.lat, center.lng]}
            radius={6}
            pathOptions={{ color: "#0284c7", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.85 }}
          />
        </MapContainer>

        {/* top-16 (not top-3) · the parent view-switcher tab bar lives at
            top-3 left-3, and a top-3 chip here paints straight over its
            "BOM" pill. */}
        <div className="absolute left-3 top-16 z-[1000] flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid place-items-center w-6 h-6 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            aria-label={playing ? "pause radar loop" : "play radar loop"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
            {frameLocalTime(activeTs)}
          </span>
        </div>

        {/* top-16 mirrors the play chip · with tab labels always visible the
            switcher can span most of a phone's width, so the top-3 row
            belongs to it alone. */}
        <div className="absolute right-3 top-16 z-[1000] flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow px-2 py-1.5">
          {frames.map((f, i) => (
            <button
              key={f.ts}
              type="button"
              onClick={() => {
                setPlaying(false);
                setActive(i);
              }}
              aria-label={`show ${frameLocalTime(f.ts)}`}
              className="group flex items-center -my-2 py-2 px-0.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  i === active
                    ? "w-4 bg-sky-600"
                    : "w-1.5 bg-slate-300 group-hover:bg-slate-400",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Static footer BELOW the map, not a floating overlay · a bar across
          the imagery hid the radar echoes and the basemap credits. */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-600 font-medium truncate">
            BOM radar · {provider.name} · licensed via{" "}
            <a
              href="https://www.willyweather.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 hover:text-slate-800"
            >
              WillyWeather
            </a>
          </div>
          {newestAge && (
            <div
              className={cn(
                "text-[11px] font-semibold truncate",
                delayed ? "text-amber-600" : "text-slate-500",
              )}
            >
              {delayed
                ? `Radar feed delayed · latest frame ${frameLocalTime(newestTs)} (${newestAge})`
                : `Updated ${frameLocalTime(newestTs)} local · ${newestAge}`}
            </div>
          )}
        </div>
        <a
          href={official.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
        >
          Open source →
        </a>
      </div>
    </div>
  );
}

// ─── JMA official nowcast radar (Japan) ─────────────────────────────────
// Japan's Official tab renders the JMA high-resolution precipitation
// nowcast (hrpns) as real map tiles layered on our own labelled basemap ·
// the same pattern as the AU licensed feed. Frame-time discovery goes
// through our /api/jma-radar/times proxy (the JMA JSON has no CORS); the
// tiles themselves load straight off JMA's public CDN. Observed PAST frames
// only · the server filters out the model nowcast forecasts, so everything
// animated here is measurement. On any failure the view degrades to the
// existing official-site link-out card.
interface JmaTimesData {
  times: { basetime: string; validtime: string }[];
  stale?: boolean;
}

// How many five-minute frames the loop animates (~35 min of history) ·
// every frame is a live tile pyramid, so more frames = more tile fetches.
const JMA_FRAME_COUNT = 7;
// hrpns tiles exist up to zoom 10 · beyond that Leaflet upscales.
const JMA_MAX_NATIVE_ZOOM = 10;

function jmaTileUrl(t: { basetime: string; validtime: string }): string {
  return `https://www.jma.go.jp/bosai/jmatile/data/nowc/${t.basetime}/none/${t.validtime}/surf/hrpns/{z}/{x}/{y}.png`;
}

function JmaOfficialView({
  official,
  center,
}: {
  official: OfficialRadarSource;
  center: { lat: number; lng: number };
}) {
  const [times, setTimes] = useState<JmaTimesData["times"] | null>(null);
  // null = first fetch still in flight · true = discovery unusable, fall
  // back to the official-site link-out card.
  const [failed, setFailed] = useState<boolean | null>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // The background refresh must not yank a PAUSED user off the frame they
  // picked · only snap to the newest frame while the loop is playing (or on
  // first load, when there's nothing selected yet). Ref, not state, so the
  // []-dep load closure always sees the current value.
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const loadRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    let firstLoad = true;
    async function load() {
      try {
        const res = await fetch("/api/jma-radar/times", { cache: "no-store" });
        if (!res.ok) throw new Error(`jma ${res.status}`);
        const next = (await res.json()) as JmaTimesData;
        if (cancelled) return;
        if (!Array.isArray(next.times) || next.times.length < 2) {
          setFailed(true);
          return;
        }
        const frames = next.times.slice(-JMA_FRAME_COUNT);
        setTimes(frames);
        if (playingRef.current || firstLoad) {
          setActive(frames.length - 1);
        } else {
          // Paused · keep the user's frame, just clamp into the new range.
          setActive((i) => Math.min(i, frames.length - 1));
        }
        firstLoad = false;
        setFailed(false);
      } catch {
        // Only fall back if nothing usable is on screen · a transient blip
        // on a background refresh shouldn't discard a working loop.
        if (!cancelled) setFailed((prev) => (prev === false ? false : true));
      }
    }
    loadRef.current = load;
    load();
    // JMA publishes every 5 min · refresh on the same cadence as the AU
    // licensed feed so the loop tracks the upstream.
    const id = window.setInterval(load, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  useForegroundRefresh(() => loadRef.current());

  // Tick for the "x min ago" freshness readout.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const frames = times ?? [];

  // Advance the loop · same rhythm as the AU feeds (longer newest hold).
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const isNewest = active === frames.length - 1;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % frames.length),
      isNewest ? 1400 : 550,
    );
    return () => window.clearTimeout(id);
  }, [playing, active, frames.length]);

  if (failed) {
    return <OfficialStillView official={official} />;
  }
  if (failed === null || !times) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // JMA timestamps are UTC YYYYMMDDHHMMSS · the shared frame helpers parse
  // the compact 12-char YYYYMMDDHHMM form, so slice off the seconds.
  const activeTs = frames[active]?.validtime.slice(0, 12) ?? "";
  const newestTs = frames[frames.length - 1]?.validtime.slice(0, 12) ?? "";
  const newestAge = frameAgeLabel(newestTs, nowMs);
  const newestDate = parseFrameTs(newestTs);
  const delayed =
    newestDate !== null &&
    nowMs - newestDate.getTime() > FRAME_DELAYED_MIN * 60_000;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={9}
          minZoom={6}
          maxZoom={11}
          zoomControl={false}
          scrollWheelZoom
          touchZoom
          doubleClickZoom
          dragging
          attributionControl
          className="absolute inset-0 w-full h-full"
        >
          <ZoomControl position="bottomright" />
          <StripAttributionPrefix />
          {/* Same basemap pairing as the Interactive tab so the Official view
              reads as part of the same product · hillshade under a light
              labelled base. */}
          <TileLayer
            attribution='Hillshade © <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
          />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxNativeZoom={19}
            opacity={0.92}
          />
          {/* Every frame's tile layer stays mounted · animation is an opacity
              flip so stepping never flashes a blank frame while tiles load. */}
          {frames.map((f, i) => (
            <TileLayer
              key={`${f.basetime}-${f.validtime}`}
              attribution='Radar © <a href="https://www.jma.go.jp/">Japan Meteorological Agency</a>'
              url={jmaTileUrl(f)}
              maxNativeZoom={JMA_MAX_NATIVE_ZOOM}
              opacity={i === active ? 0.75 : 0}
              zIndex={400}
            />
          ))}
          {/* The town / searched point the user came from. */}
          <CircleMarker
            center={[center.lat, center.lng]}
            radius={6}
            pathOptions={{ color: "#0284c7", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.85 }}
          />
        </MapContainer>

        {/* top-16 (not top-3) · the parent view-switcher tab bar lives at
            top-3 left-3, and a top-3 chip here paints straight over its
            "JMA" pill. */}
        <div className="absolute left-3 top-16 z-[1000] flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid place-items-center w-6 h-6 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            aria-label={playing ? "pause radar loop" : "play radar loop"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
            {frameLocalTime(activeTs)}
          </span>
        </div>

        {/* top-16 mirrors the play chip · the top-3 row belongs to the
            view-switcher tabs alone. */}
        <div className="absolute right-3 top-16 z-[1000] flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow px-2 py-1.5">
          {frames.map((f, i) => (
            <button
              key={`${f.basetime}-${f.validtime}`}
              type="button"
              onClick={() => {
                setPlaying(false);
                setActive(i);
              }}
              aria-label={`show ${frameLocalTime(f.validtime.slice(0, 12))}`}
              className="group flex items-center -my-2 py-2 px-0.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  i === active
                    ? "w-4 bg-sky-600"
                    : "w-1.5 bg-slate-300 group-hover:bg-slate-400",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Static footer BELOW the map, not a floating overlay · a bar across
          the imagery hid the radar echoes and the basemap credits. */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-600 font-medium truncate">
            JMA nowcast radar · Japan Meteorological Agency
          </div>
          {newestAge && (
            <div
              className={cn(
                "text-[11px] font-semibold truncate",
                delayed ? "text-amber-600" : "text-slate-500",
              )}
            >
              {delayed
                ? `Radar feed delayed · latest frame ${frameLocalTime(newestTs)} (${newestAge})`
                : `Updated ${frameLocalTime(newestTs)} local · ${newestAge}`}
            </div>
          )}
        </div>
        <a
          href={official.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
        >
          Open source →
        </a>
      </div>
    </div>
  );
}

function BomAnimatedOfficialView({
  official,
  radarId,
}: {
  official: OfficialRadarSource;
  radarId: string;
}) {
  const [frames, setFrames] = useState<BomFrame[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [active, setActive] = useState(0);
  // Respect reduced-motion: discover the frames either way, but start paused so
  // the radar doesn't auto-loop for users who've asked the OS to limit motion.
  const [playing, setPlaying] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  // Frame discovery only HEAD-confirms the files exist · the actual GETs can
  // still 403 (BOM rate-limiting our egress). If EVERY frame fails to load we
  // have no real radar data, so degrade to the still/link-out rather than
  // showing an honest-looking-but-empty basemap.
  const [failedFrames, setFailedFrames] = useState<Set<string>>(new Set());
  useEffect(() => {
    setFailedFrames(new Set());
  }, [frames]);

  // Discover the recent frames (server-side: cached, de-duped, cadence-aware)
  // and keep the list fresh while the tab stays open. `cache:"no-store"` skips
  // the browser HTTP cache (server sends max-age=60) · the service worker also
  // routes /api/bom-radar/frames network-first, so the loop can't go stale.
  const framesLoadRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/bom-radar/frames?radar=${radarId}&count=6`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`frames ${res.status}`);
        const data = (await res.json()) as { frames?: BomFrame[] };
        const next = data.frames ?? [];
        if (cancelled) return;
        if (next.length < 2) {
          setUnavailable(true);
          return;
        }
        setFrames(next);
        setActive(next.length - 1);
        setUnavailable(false);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    }
    framesLoadRef.current = load;
    load();
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [radarId]);
  // Reopening the app (especially an installed PWA) jumps straight to BOM's
  // newest frame instead of waiting up to 5 min for the next interval tick.
  useForegroundRefresh(() => framesLoadRef.current());

  // Tick every 30s so the "x min ago" freshness readout stays honest while
  // the tab sits open (the frame list itself refreshes on its own interval).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Advance the loop · ~550ms per frame with a longer hold on the newest.
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const isNewest = active === frames.length - 1;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % frames.length),
      isNewest ? 1400 : 550,
    );
    return () => window.clearTimeout(id);
  }, [playing, active, frames.length]);

  // While discovering (or if discovery is unavailable, or every frame GET has
  // failed to load) show the single still so the tab is never blank · the still
  // keeps its own onError link-out ladder.
  const allFramesFailed = frames.length > 0 && failedFrames.size >= frames.length;
  if (unavailable || frames.length < 2 || allFramesFailed) {
    return <OfficialStillView official={official} />;
  }

  const layerClass =
    "absolute inset-0 m-auto max-h-full max-w-full object-contain pointer-events-none select-none";
  const pixelated = { imageRendering: "pixelated" as const };
  const activeTs = frames[active]?.ts ?? "";
  // Freshness is judged by the NEWEST frame, not whichever frame the loop is
  // currently showing (older frames in the loop are old by design).
  const newestTs = frames[frames.length - 1]?.ts ?? "";
  const newestAge = frameAgeLabel(newestTs, nowMs);
  const newestDate = parseFrameTs(newestTs);
  const delayed =
    newestDate !== null &&
    nowMs - newestDate.getTime() > FRAME_DELAYED_MIN * 60_000;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="relative flex-1 overflow-hidden p-3">
        <PanZoomStage>
        <img
          src={bomLayerSrc(radarId, "background")}
          alt=""
          className={layerClass}
          style={pixelated}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <img
          src={bomLayerSrc(radarId, "topography")}
          alt=""
          className={layerClass}
          style={pixelated}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        {frames.map((f, i) => (
          <img
            key={f.ts}
            src={f.url}
            alt=""
            className={cn(layerClass, "transition-opacity duration-200 ease-linear")}
            style={{ ...pixelated, opacity: i === active ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
              setFailedFrames((prev) => {
                if (prev.has(f.ts)) return prev;
                const next = new Set(prev);
                next.add(f.ts);
                return next;
              });
            }}
          />
        ))}
        <img
          src={bomLayerSrc(radarId, "locations")}
          alt=""
          className={layerClass}
          style={pixelated}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <img
          src={bomLayerSrc(radarId, "range")}
          alt={official.label}
          className={layerClass}
          style={pixelated}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        </PanZoomStage>

        <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid place-items-center w-6 h-6 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            aria-label={playing ? "pause radar loop" : "play radar loop"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
            {frameLocalTime(activeTs)}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow px-2 py-1.5">
          {frames.map((f, i) => (
            <button
              key={f.ts}
              type="button"
              onClick={() => {
                setPlaying(false);
                setActive(i);
              }}
              aria-label={`show ${frameLocalTime(f.ts)}`}
              // Larger transparent hit area (·my-2/px-0.5) for touch · the
              // visible bar stays small via the inner span.
              className="group flex items-center -my-2 py-2 px-0.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  i === active
                    ? "w-4 bg-sky-600"
                    : "w-1.5 bg-slate-300 group-hover:bg-slate-400",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-600 font-medium truncate">
            Source · {official.attribution}
          </div>
          {newestAge && (
            <div
              className={cn(
                "text-[11px] font-semibold truncate",
                delayed ? "text-amber-600" : "text-slate-500",
              )}
            >
              {delayed
                ? `Bureau feed delayed · latest frame ${frameLocalTime(newestTs)} (${newestAge})`
                : `Updated ${frameLocalTime(newestTs)} local · ${newestAge}`}
            </div>
          )}
        </div>
        <a
          href={official.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
        >
          Open source →
        </a>
      </div>
    </div>
  );
}

function OfficialStillView({ official }: { official: OfficialRadarSource }) {
  // Track upstream image failure (BOM/JMA blocks our request, gif 404,
  // network blip, etc.) so we can degrade gracefully to the same
  // "open source" link-out we show for non-embeddable regions, instead
  // of leaving the user with a broken image icon.
  const [imgFailed, setImgFailed] = useState(false);
  // BOM also serves a single composite still gif · we keep it live by
  // preloading a cache-busted copy every few minutes and only swapping it in
  // once it has loaded, so the picture stays current without flashing a gap.
  // This is the fallback when the animated frame loop isn't available.
  const baseSrc = official.imageUrl ? officialImageSrc(official.imageUrl) : null;
  const [src, setSrc] = useState<string | null>(baseSrc);
  const preloadRef = useRef<() => void>(() => {});
  useEffect(() => {
    setSrc(baseSrc);
    setImgFailed(false);
    if (!baseSrc) {
      preloadRef.current = () => {};
      return;
    }
    const preload = () => {
      const next = `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}r=${Date.now()}`;
      const img = new Image();
      // Clearing imgFailed on a successful preload doubles as gentle
      // auto-recovery: if the initial load hit a transient BOM 403/blip and
      // showed the link-out, a later refresh that loads cleanly brings
      // the official image back · no extra requests beyond the refresh itself.
      img.onload = () => {
        setSrc(next);
        setImgFailed(false);
      };
      img.src = next;
    };
    preloadRef.current = preload;
    // Kick one preload IMMEDIATELY: the plain baseSrc URL is constant, so the
    // service worker's catch-all stale-while-revalidate can paint a PREVIOUS
    // SESSION'S gif on first open (an installed PWA reopened in the morning
    // showed last night's radar). The instant cache-busted fetch swaps in the
    // current picture within seconds while the cached copy avoids a blank gap.
    preload();
    const id = window.setInterval(preload, 4 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [baseSrc]);
  // Match the animated + RainViewer views: pull a fresh still the moment the
  // app is reopened, rather than lagging on a backgrounded interval.
  useForegroundRefresh(() => preloadRef.current());
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="relative flex-1 overflow-hidden p-4">
        {src && !imgFailed ? (
          <PanZoomStage>
            <img
              src={src}
              alt={official.label}
              className="absolute inset-0 m-auto max-h-full max-w-full object-contain pointer-events-none select-none"
              style={{ imageRendering: "pixelated" }}
              onError={() => setImgFailed(true)}
            />
          </PanZoomStage>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-4">
          <div className="text-center max-w-sm px-4">
            <p className="text-sm text-slate-700 font-semibold mb-2">
              {official.label}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              This source can't be embedded directly. Open it in a new tab to
              see the official live radar.
            </p>
            <a
              href={official.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800"
            >
              Open {official.label}
            </a>
          </div>
          </div>
        )}
      </div>
      <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg px-3 py-2 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-600 font-medium truncate">
          Source · {official.attribution}
        </div>
        <a
          href={official.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
        >
          Open source →
        </a>
      </div>
    </div>
  );
}

function formatStamp(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}
