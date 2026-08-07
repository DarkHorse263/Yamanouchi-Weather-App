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

export type RegionKey =
  | "snowy-mountains"
  | "victorias-high-country"
  | "tasmania"
  | "yamanouchi"
  | "nozawa-onsen"
  | "iiyama"
  | "hakuba-valley"
  | "myoko"
  | "niseko"
  | "furano"
  | "sapporo"
  | "tomamu-sahoro"
  | "asahikawa"
  | "rusutsu-kiroro"
  | "yuzawa"
  | "zao-onsen"
  | "hakkoda-aomori-spring"
  | "appi-shizukuishi"
  | "bandai"
  | "daisen"
  | "minakami"
  | "kusatsu-manza"
  | "hachimantai"
  | "queenstown"
  | "wanaka"
  | "mt-hutt"
  | "ruapehu"
  | "whistler"
  | "powder-highway"
  | "banff-lake-louise"
  | "canmore"
  | "jasper"
  | "quebec-laurentians"
  | "quebec-charlevoix"
  | "quebec-eastern-townships"
  | "summit-county"
  | "vail-valley"
  | "aspen-snowmass"
  | "steamboat"
  | "winter-park"
  | "crested-butte"
  | "telluride"
  | "durango"
  | "boulder-front-range"
  | "cottonwood-canyons"
  | "park-city"
  | "ogden-valley"
  | "provo"
  | "cache-valley"
  | "north-lake-tahoe"
  | "south-lake-tahoe"
  | "mammoth-lakes"
  | "big-bear"
  | "bear-valley"
  | "mt-shasta"
  | "killington-pico"
  | "stowe-smugglers-notch"
  | "mad-river-valley"
  | "southern-vermont"
  | "okemo"
  | "jay-peak-nek"
  | "jackson-hole"
  | "grand-targhee"
  | "big-sky"
  | "bozeman-bridger-bowl"
  | "whitefish"
  | "red-lodge"
  | "taos"
  | "angel-fire"
  | "santa-fe"
  | "albuquerque-sandia"
  | "mt-hood"
  | "bend"
  | "crystal-mountain"
  | "snoqualmie-pass"
  | "stevens-pass"
  | "mt-baker"
  | "sun-valley"
  | "sandpoint"
  | "boise"
  | "donnelly-mccall"
  | "white-mountains"
  | "franconia-notch"
  | "waterville-valley"
  | "lakes-region"
  | "carrabassett-valley"
  | "newry-bethel"
  | "rangeley"
  | "lake-placid"
  | "north-creek"
  | "hunter"
  | "windham"
  | "highmount"
  | "harbor-springs"
  | "keweenaw-peninsula"
  | "poconos"
  | "laurel-highlands"
  | "berkshires"
  | "central-massachusetts"
  | "lutsen-north-shore"
  | "wausau"
  | "wisconsin-dells"
  | "snowshoe"
  | "canaan-valley"
  | "high-country"
  | "maggie-valley"
  | "blue-ridge"
  | "shenandoah-valley";
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

interface PinSpec { id: string; name: string; lat: number; lng: number; accent: string }

// Per-region defaults: centre + pins. Used when the caller (e.g. the
// town weather page) doesn't pass an explicit center/markers. Previously
// the component always fell back to Snowy Mountains pins, which surfaced
// Perisher/Thredbo/Jindabyne on VHC and Japan pages.
const REGION_DEFAULTS: Record<RegionKey, { center: { lat: number; lng: number }; pins: PinSpec[] }> = {
  "snowy-mountains": {
    center: { lat: -36.42, lng: 148.42 },
    pins: [
      { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086, accent: "#f97316" },
      { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089, accent: "#f97316" },
      { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297, accent: "#f97316" },
      { id: "selwyn", name: "Selwyn", lat: -35.8383, lng: 148.5267, accent: "#f97316" },
      { id: "jindabyne", name: "Jindabyne", lat: -36.4106, lng: 148.6206, accent: "#0ea5e9" },
    ],
  },
  "victorias-high-country": {
    center: { lat: -36.86, lng: 147.27 },
    pins: [
      { id: "mt-buller", name: "Mt Buller", lat: -37.1456, lng: 146.4391, accent: "#f97316" },
      { id: "mt-stirling", name: "Mt Stirling", lat: -37.1167, lng: 146.4500, accent: "#f97316" },
      { id: "falls-creek", name: "Falls Creek", lat: -36.8628, lng: 147.2778, accent: "#f97316" },
      { id: "mt-hotham", name: "Mt Hotham", lat: -36.9779, lng: 147.1361, accent: "#f97316" },
      { id: "lake-mountain", name: "Lake Mountain", lat: -37.5181, lng: 145.8983, accent: "#f97316" },
      { id: "mt-donna-buang", name: "Mt Donna Buang", lat: -37.6961, lng: 145.6989, accent: "#f97316" },
      { id: "mount-beauty", name: "Mount Beauty", lat: -36.7327, lng: 147.1696, accent: "#0ea5e9" },
      { id: "bright", name: "Bright", lat: -36.7300, lng: 146.9617, accent: "#0ea5e9" },
      { id: "mansfield", name: "Mansfield", lat: -37.0539, lng: 146.0894, accent: "#0ea5e9" },
    ],
  },
  tasmania: {
    center: { lat: -41.54, lng: 147.67 },
    pins: [
      { id: "ben-lomond", name: "Ben Lomond", lat: -41.5378, lng: 147.6736, accent: "#f97316" },
      { id: "ben-lomond-base", name: "Ben Lomond Base", lat: -41.5392, lng: 147.6486, accent: "#0ea5e9" },
      { id: "launceston", name: "Launceston", lat: -41.4332, lng: 147.1442, accent: "#0ea5e9" },
      { id: "hobart", name: "Hobart", lat: -42.8821, lng: 147.3272, accent: "#0ea5e9" },
    ],
  },
  yamanouchi: {
    center: { lat: 36.74, lng: 138.42 },
    pins: [
      { id: "shiga-kogen", name: "Shiga Kogen", lat: 36.7167, lng: 138.5083, accent: "#f97316" },
      { id: "ryuoo", name: "Ryuoo", lat: 36.7458, lng: 138.4283, accent: "#f97316" },
      { id: "kita-shiga", name: "Kita Shiga Kogen", lat: 36.7600, lng: 138.4750, accent: "#f97316" },
      { id: "yudanaka", name: "Yudanaka", lat: 36.7406, lng: 138.4222, accent: "#0ea5e9" },
      { id: "shibu", name: "Shibu Onsen", lat: 36.7367, lng: 138.4214, accent: "#0ea5e9" },
    ],
  },
  "nozawa-onsen": {
    center: { lat: 36.928, lng: 138.449 },
    pins: [
      { id: "nozawa-onsen", name: "Nozawa Onsen", lat: 36.9278, lng: 138.4486, accent: "#f97316" },
      { id: "nozawa-onsen-village", name: "Nozawa village", lat: 36.9219, lng: 138.4361, accent: "#0ea5e9" },
    ],
  },
  iiyama: {
    center: { lat: 36.873, lng: 138.366 },
    pins: [
      { id: "madarao", name: "Madarao", lat: 36.9056, lng: 138.2858, accent: "#f97316" },
      { id: "tangram", name: "Tangram", lat: 36.8917, lng: 138.2806, accent: "#f97316" },
      { id: "togari-onsen", name: "Togari Onsen", lat: 36.8722, lng: 138.4014, accent: "#f97316" },
      { id: "kijimadaira", name: "Kijimadaira", lat: 36.8639, lng: 138.4006, accent: "#f97316" },
      { id: "kijima-snow-park", name: "Kijima Snow Park", lat: 36.8556, lng: 138.4108, accent: "#f97316" },
      { id: "iiyama", name: "Iiyama City", lat: 36.852, lng: 138.366, accent: "#0ea5e9" },
    ],
  },
  "hakuba-valley": {
    center: { lat: 36.68, lng: 137.85 },
    pins: [
      { id: "happo-one", name: "Happo-One", lat: 36.6981, lng: 137.8597, accent: "#f97316" },
      { id: "hakuba-goryu", name: "Goryu", lat: 36.7076, lng: 137.8312, accent: "#f97316" },
      { id: "hakuba-47", name: "Hakuba 47", lat: 36.6988, lng: 137.8256, accent: "#f97316" },
      { id: "hakuba-iwatake", name: "Iwatake", lat: 36.6927, lng: 137.8398, accent: "#f97316" },
      { id: "tsugaike-kogen", name: "Tsugaike Kogen", lat: 36.7490, lng: 137.8662, accent: "#f97316" },
      { id: "hakuba-norikura", name: "Norikura", lat: 36.7580, lng: 137.8580, accent: "#f97316" },
      { id: "hakuba-cortina", name: "Cortina", lat: 36.7756, lng: 137.8875, accent: "#f97316" },
      { id: "hakuba-sanosaka", name: "Sanosaka", lat: 36.6200, lng: 137.8500, accent: "#f97316" },
      { id: "kashimayari", name: "Kashimayari", lat: 36.5930, lng: 137.8270, accent: "#f97316" },
      { id: "jiigatake", name: "Jiigatake", lat: 36.5686, lng: 137.8339, accent: "#f97316" },
      { id: "hakuba", name: "Hakuba", lat: 36.6982, lng: 137.8619, accent: "#0ea5e9" },
      { id: "otari", name: "Otari", lat: 36.7550, lng: 137.8640, accent: "#0ea5e9" },
      { id: "omachi", name: "Omachi", lat: 36.5030, lng: 137.8514, accent: "#0ea5e9" },
    ],
  },
  "myoko": {
    center: { lat: 36.90, lng: 138.17 },
    pins: [
      { id: "akakura-onsen", name: "Akakura Onsen", lat: 36.8964, lng: 138.1674, accent: "#f97316" },
      { id: "akakura-kanko", name: "Akakura Kanko", lat: 36.8903, lng: 138.1604, accent: "#f97316" },
      { id: "ikenotaira", name: "Ikenotaira", lat: 36.8733, lng: 138.1584, accent: "#f97316" },
      { id: "myoko-suginohara", name: "Suginohara", lat: 36.8633, lng: 138.1357, accent: "#f97316" },
      { id: "seki-onsen", name: "Seki Onsen", lat: 36.9050, lng: 138.1569, accent: "#f97316" },
      { id: "lotte-arai", name: "Lotte Arai", lat: 36.9909, lng: 138.1816, accent: "#f97316" },
      { id: "akakura", name: "Akakura", lat: 36.8876, lng: 138.1802, accent: "#0ea5e9" },
      { id: "ikenotaira-onsen", name: "Ikenotaira Onsen", lat: 36.8750, lng: 138.1660, accent: "#0ea5e9" },
      { id: "suginosawa", name: "Suginosawa", lat: 36.8495, lng: 138.1601, accent: "#0ea5e9" },
      { id: "arai", name: "Arai", lat: 37.0006, lng: 138.2259, accent: "#0ea5e9" },
    ],
  },
  "niseko": {
    center: { lat: 42.86, lng: 140.69 },
    pins: [
      { id: "grand-hirafu", name: "Grand Hirafu", lat: 42.8590, lng: 140.6900, accent: "#f97316" },
      { id: "hanazono", name: "Hanazono", lat: 42.8869, lng: 140.7028, accent: "#f97316" },
      { id: "niseko-village", name: "Niseko Village", lat: 42.8365, lng: 140.6851, accent: "#f97316" },
      { id: "annupuri", name: "Annupuri", lat: 42.8390, lng: 140.6570, accent: "#f97316" },
      { id: "moiwa", name: "Moiwa", lat: 42.8318, lng: 140.6479, accent: "#f97316" },
      { id: "hirafu", name: "Hirafu", lat: 42.8577, lng: 140.6982, accent: "#0ea5e9" },
      { id: "kutchan", name: "Kutchan", lat: 42.9010, lng: 140.7545, accent: "#0ea5e9" },
      { id: "niseko-town", name: "Niseko Town", lat: 42.8046, lng: 140.6595, accent: "#0ea5e9" },
    ],
  },
  "furano": {
    center: { lat: 43.34, lng: 142.38 },
    pins: [
      { id: "furano-ski-resort", name: "Furano Ski Resort", lat: 43.335, lng: 142.361, accent: "#f97316" },
      { id: "kamui-ski-links", name: "Kamui Ski Links", lat: 43.709, lng: 142.192, accent: "#f97316" },
      { id: "tomamu", name: "Tomamu", lat: 43.058, lng: 142.621, accent: "#f97316" },
      { id: "furano", name: "Furano", lat: 43.3420, lng: 142.3833, accent: "#0ea5e9" },
      { id: "kitanomine", name: "Kitanomine", lat: 43.3400, lng: 142.3655, accent: "#0ea5e9" },
    ],
  },
  "sapporo": {
    center: { lat: 43.03, lng: 141.25 },
    pins: [
      { id: "sapporo-teine", name: "Sapporo Teine", lat: 43.083, lng: 141.185, accent: "#f97316" },
      { id: "sapporo-kokusai", name: "Sapporo Kokusai", lat: 42.987, lng: 141.135, accent: "#f97316" },
      { id: "sapporo-bankei", name: "Sapporo Bankei", lat: 43.033, lng: 141.264, accent: "#f97316" },
      { id: "sapporo", name: "Sapporo", lat: 43.0621, lng: 141.3544, accent: "#0ea5e9" },
      { id: "jozankei", name: "Jozankei", lat: 42.971, lng: 141.180, accent: "#0ea5e9" },
    ],
  },
  "tomamu-sahoro": {
    center: { lat: 43.12, lng: 142.71 },
    pins: [
      // resort pin nudged slightly north (display only) so it doesn't
      // stack under furano's day-trip "tomamu" pin on the JP-wide map
      { id: "tomamu-resort", name: "Hoshino Resorts Tomamu", lat: 43.062, lng: 142.625, accent: "#f97316" },
      { id: "sahoro", name: "Sahoro Resort", lat: 43.187, lng: 142.804, accent: "#f97316" },
      { id: "tomamu-village", name: "Tomamu", lat: 43.0636, lng: 142.6357, accent: "#0ea5e9" },
      { id: "shimukappu", name: "Shimukappu", lat: 43.0, lng: 142.4167, accent: "#0ea5e9" },
    ],
  },
  "asahikawa": {
    center: { lat: 43.71, lng: 142.50 },
    pins: [
      // Kamui pin nudged slightly north (display only) so it doesn't
      // stack under furano's day-trip "kamui-ski-links" pin on the
      // JP-wide map
      { id: "kamui", name: "Kamui Ski Links", lat: 43.713, lng: 142.196, accent: "#f97316" },
      { id: "asahidake", name: "Asahidake", lat: 43.654, lng: 142.797, accent: "#f97316" },
      { id: "asahikawa", name: "Asahikawa", lat: 43.7706, lng: 142.3649, accent: "#0ea5e9" },
      { id: "higashikawa", name: "Higashikawa", lat: 43.699, lng: 142.510, accent: "#0ea5e9" },
    ],
  },
  "rusutsu-kiroro": {
    center: { lat: 42.91, lng: 140.94 },
    pins: [
      { id: "rusutsu-resort", name: "Rusutsu Resort", lat: 42.7497, lng: 140.9033, accent: "#f97316" },
      { id: "kiroro-resort", name: "Kiroro", lat: 43.0758, lng: 140.9822, accent: "#f97316" },
      { id: "rusutsu", name: "Rusutsu", lat: 42.7333, lng: 140.8833, accent: "#0ea5e9" },
      { id: "kiroro", name: "Kiroro base", lat: 43.0758, lng: 140.9822, accent: "#0ea5e9" },
    ],
  },
  "yuzawa": {
    center: { lat: 36.89, lng: 138.79 },
    pins: [
      { id: "gala-yuzawa", name: "GALA Yuzawa", lat: 36.9509, lng: 138.7995, accent: "#f97316" },
      { id: "yuzawa-kogen", name: "Yuzawa Kogen", lat: 36.9388, lng: 138.7974, accent: "#f97316" },
      { id: "ishiuchi-maruyama", name: "Ishiuchi Maruyama", lat: 36.9761, lng: 138.7947, accent: "#f97316" },
      { id: "iwappara", name: "Iwappara", lat: 36.9389, lng: 138.8444, accent: "#f97316" },
      { id: "kagura", name: "Kagura", lat: 36.8948, lng: 138.7756, accent: "#f97316" },
      { id: "naeba", name: "Naeba", lat: 36.7917, lng: 138.7846, accent: "#f97316" },
      { id: "echigo-yuzawa", name: "Echigo-Yuzawa", lat: 36.9354, lng: 138.8090, accent: "#0ea5e9" },
      { id: "ishiuchi", name: "Ishiuchi", lat: 36.9894, lng: 138.8043, accent: "#0ea5e9" },
      // canonical Mitsumata coords match the Kagura ropeway base · nudged
      // slightly here (display only) so the town pin doesn't stack under
      // the Kagura mountain pin
      { id: "mitsumata", name: "Mitsumata", lat: 36.8975, lng: 138.7790, accent: "#0ea5e9" },
    ],
  },
  "zao-onsen": {
    center: { lat: 38.164, lng: 140.40 },
    pins: [
      // resort pin uses the mid-mountain ski-area point (display only)
      // so it doesn't stack under the village pin at the ropeway base
      { id: "zao-onsen-resort", name: "Zao Onsen Ski Resort", lat: 38.1613, lng: 140.4077, accent: "#f97316" },
      { id: "zao-onsen", name: "Zao Onsen", lat: 38.1674, lng: 140.3937, accent: "#0ea5e9" },
    ],
  },
  "hakkoda-aomori-spring": {
    center: { lat: 40.69, lng: 140.56 },
    pins: [
      { id: "hakkoda", name: "Hakkoda", lat: 40.6784, lng: 140.8453, accent: "#f97316" },
      { id: "aomori-spring", name: "Aomori Spring", lat: 40.6952, lng: 140.2833, accent: "#f97316" },
      { id: "aomori", name: "Aomori", lat: 40.8289, lng: 140.7336, accent: "#0ea5e9" },
      { id: "sukayu-onsen", name: "Sukayu Onsen", lat: 40.6506, lng: 140.8505, accent: "#0ea5e9" },
      { id: "ajigasawa", name: "Ajigasawa", lat: 40.7755, lng: 140.2209, accent: "#0ea5e9" },
    ],
  },
  "appi-shizukuishi": {
    center: { lat: 39.85, lng: 140.98 },
    pins: [
      { id: "appi", name: "Appi Kogen", lat: 40.0028, lng: 140.9452, accent: "#f97316" },
      { id: "shizukuishi-resort", name: "Shizukuishi", lat: 39.6940, lng: 140.9060, accent: "#f97316" },
      { id: "shizukuishi", name: "Shizukuishi Town", lat: 39.6941, lng: 140.9844, accent: "#0ea5e9" },
      { id: "morioka", name: "Morioka", lat: 39.7019, lng: 141.1365, accent: "#0ea5e9" },
    ],
  },
  "bandai": {
    center: { lat: 37.64, lng: 140.08 },
    pins: [
      { id: "nekoma-mountain", name: "Nekoma Mountain", lat: 37.578, lng: 140.030, accent: "#f97316" },
      { id: "grandeco", name: "Grandeco", lat: 37.702, lng: 140.135, accent: "#f97316" },
      { id: "inawashiro", name: "Inawashiro", lat: 37.5566, lng: 140.1044, accent: "#0ea5e9" },
      { id: "urabandai", name: "Urabandai", lat: 37.660, lng: 140.065, accent: "#0ea5e9" },
    ],
  },
  "daisen": {
    center: { lat: 35.41, lng: 133.48 },
    pins: [
      { id: "daisen-white-resort", name: "Daisen White Resort", lat: 35.400, lng: 133.528, accent: "#f97316" },
      { id: "daisenji", name: "Daisenji", lat: 35.396, lng: 133.540, accent: "#0ea5e9" },
      { id: "yonago", name: "Yonago", lat: 35.4281, lng: 133.3311, accent: "#0ea5e9" },
    ],
  },
  "minakami": {
    center: { lat: 36.80, lng: 138.97 },
    pins: [
      { id: "tenjindaira", name: "Tanigawadake Tenjindaira", lat: 36.833, lng: 138.947, accent: "#f97316" },
      { id: "minakami-kogen", name: "Minakami Kogen", lat: 36.878, lng: 139.040, accent: "#f97316" },
      { id: "norn-minakami", name: "Norn Minakami", lat: 36.743, lng: 138.942, accent: "#f97316" },
      { id: "minakami", name: "Minakami", lat: 36.780, lng: 138.968, accent: "#0ea5e9" },
    ],
  },
  "kusatsu-manza": {
    center: { lat: 36.63, lng: 138.55 },
    pins: [
      { id: "kusatsu-onsen-resort", name: "Kusatsu Onsen Ski Resort", lat: 36.628, lng: 138.588, accent: "#f97316" },
      { id: "manza-onsen-resort", name: "Manza Onsen Ski Resort", lat: 36.644, lng: 138.507, accent: "#f97316" },
      { id: "kusatsu-onsen", name: "Kusatsu Onsen", lat: 36.621, lng: 138.596, accent: "#0ea5e9" },
      // village pin nudged slightly south of the resort point (display
      // only) so it doesn't stack under the mountain pin
      { id: "manza-onsen", name: "Manza Onsen", lat: 36.640, lng: 138.503, accent: "#0ea5e9" },
    ],
  },
  "hachimantai": {
    center: { lat: 39.93, lng: 141.05 },
    pins: [
      { id: "hachimantai-panorama", name: "Hachimantai Panorama", lat: 39.946, lng: 141.000, accent: "#f97316" },
      { id: "hachimantai-shimokura", name: "Hachimantai Shimokura", lat: 39.951, lng: 140.972, accent: "#f97316" },
      { id: "hachimantai", name: "Hachimantai", lat: 39.900, lng: 141.130, accent: "#0ea5e9" },
    ],
  },
  queenstown: {
    center: { lat: -44.99, lng: 168.74 },
    pins: [
      { id: "coronet-peak", name: "Coronet Peak", lat: -44.9206, lng: 168.7361, accent: "#f97316" },
      { id: "the-remarkables", name: "The Remarkables", lat: -45.0556, lng: 168.8194, accent: "#f97316" },
      { id: "queenstown", name: "Queenstown", lat: -45.0312, lng: 168.6626, accent: "#0ea5e9" },
    ],
  },
  wanaka: {
    center: { lat: -44.73, lng: 168.99 },
    pins: [
      { id: "cardrona", name: "Cardrona", lat: -44.8741, lng: 168.9492, accent: "#f97316" },
      { id: "treble-cone", name: "Treble Cone", lat: -44.6311, lng: 168.8978, accent: "#f97316" },
      { id: "wanaka", name: "Wanaka", lat: -44.7032, lng: 169.1321, accent: "#0ea5e9" },
    ],
  },
  "mt-hutt": {
    center: { lat: -43.55, lng: 171.59 },
    pins: [
      { id: "mt-hutt", name: "Mt Hutt", lat: -43.4707, lng: 171.5306, accent: "#f97316" },
      { id: "methven", name: "Methven", lat: -43.6333, lng: 171.6500, accent: "#0ea5e9" },
    ],
  },
  ruapehu: {
    center: { lat: -39.32, lng: 175.50 },
    pins: [
      { id: "whakapapa", name: "Whakapapa", lat: -39.2547, lng: 175.5619, accent: "#f97316" },
      { id: "turoa", name: "Turoa", lat: -39.3072, lng: 175.5286, accent: "#f97316" },
      { id: "ohakune", name: "Ohakune", lat: -39.4181, lng: 175.3956, accent: "#0ea5e9" },
    ],
  },
  whistler: {
    center: { lat: 50.09, lng: -122.92 },
    pins: [
      { id: "whistler-mountain", name: "Whistler Mountain", lat: 50.0594, lng: -122.9575, accent: "#f97316" },
      { id: "blackcomb-mountain", name: "Blackcomb Mountain", lat: 50.0900, lng: -122.8620, accent: "#f97316" },
      { id: "whistler", name: "Whistler", lat: 50.1163, lng: -122.9574, accent: "#0ea5e9" },
    ],
  },
  // The Powder Highway is a ~600 km loop, so the centre sits in the middle
  // of the Selkirks rather than on any one resort and the zoom is wide.
  "powder-highway": {
    center: { lat: 50.60, lng: -117.30 },
    pins: [
      { id: "revelstoke-mountain-resort", name: "Revelstoke Mountain Resort", lat: 50.9581, lng: -118.1633, accent: "#f97316" },
      { id: "kicking-horse", name: "Kicking Horse", lat: 51.2977, lng: -117.0464, accent: "#f97316" },
      { id: "fernie-alpine", name: "Fernie Alpine Resort", lat: 49.4628, lng: -115.0872, accent: "#f97316" },
      { id: "whitewater", name: "Whitewater", lat: 49.3830, lng: -117.1470, accent: "#f97316" },
      { id: "kimberley-alpine", name: "Kimberley Alpine Resort", lat: 49.6811, lng: -116.0053, accent: "#f97316" },
      { id: "panorama", name: "Panorama", lat: 50.4600, lng: -116.2400, accent: "#f97316" },
      { id: "sun-peaks-resort", name: "Sun Peaks Resort", lat: 50.8833, lng: -119.8833, accent: "#f97316" },
      { id: "revelstoke", name: "Revelstoke", lat: 50.9981, lng: -118.1957, accent: "#0ea5e9" },
      { id: "golden", name: "Golden", lat: 51.2960, lng: -116.9631, accent: "#0ea5e9" },
      { id: "fernie", name: "Fernie", lat: 49.5040, lng: -115.0631, accent: "#0ea5e9" },
      { id: "nelson", name: "Nelson", lat: 49.4928, lng: -117.2948, accent: "#0ea5e9" },
      { id: "kimberley", name: "Kimberley", lat: 49.6697, lng: -115.9781, accent: "#0ea5e9" },
      { id: "invermere", name: "Invermere", lat: 50.5064, lng: -116.0311, accent: "#0ea5e9" },
      { id: "sun-peaks", name: "Sun Peaks", lat: 50.8836, lng: -119.8869, accent: "#0ea5e9" },
    ],
  },
  "banff-lake-louise": {
    center: { lat: 51.25, lng: -115.85 },
    pins: [
      { id: "banff-sunshine", name: "Banff Sunshine Village", lat: 51.0781, lng: -115.7772, accent: "#f97316" },
      { id: "mt-norquay", name: "Mt. Norquay", lat: 51.1990, lng: -115.5980, accent: "#f97316" },
      { id: "lake-louise-resort", name: "Lake Louise Ski Resort", lat: 51.4419, lng: -116.1622, accent: "#f97316" },
      { id: "banff", name: "Banff", lat: 51.1784, lng: -115.5708, accent: "#0ea5e9" },
      { id: "lake-louise", name: "Lake Louise", lat: 51.4254, lng: -116.1773, accent: "#0ea5e9" },
    ],
  },
  canmore: {
    center: { lat: 51.02, lng: -115.25 },
    pins: [
      { id: "nakiska", name: "Nakiska", lat: 50.9422, lng: -115.1519, accent: "#f97316" },
      { id: "canmore", name: "Canmore", lat: 51.0884, lng: -115.3479, accent: "#0ea5e9" },
    ],
  },
  jasper: {
    center: { lat: 52.84, lng: -118.08 },
    pins: [
      { id: "marmot-basin", name: "Marmot Basin", lat: 52.8000, lng: -118.0833, accent: "#f97316" },
      { id: "jasper", name: "Jasper", lat: 52.8737, lng: -118.0814, accent: "#0ea5e9" },
    ],
  },
  "quebec-laurentians": {
    center: { lat: 46.22, lng: -74.57 },
    pins: [
      { id: "tremblant", name: "Tremblant", lat: 46.2200, lng: -74.5530, accent: "#f97316" },
      { id: "mont-tremblant", name: "Mont-Tremblant", lat: 46.2127, lng: -74.5844, accent: "#0ea5e9" },
    ],
  },
  "quebec-charlevoix": {
    center: { lat: 47.18, lng: -70.78 },
    pins: [
      { id: "mont-sainte-anne", name: "Mont-Sainte-Anne", lat: 47.0876, lng: -70.9324, accent: "#f97316" },
      { id: "le-massif", name: "Le Massif de Charlevoix", lat: 47.2757, lng: -70.6257, accent: "#f97316" },
      { id: "beaupre", name: "Beaupré", lat: 47.0443, lng: -70.8953, accent: "#0ea5e9" },
      { id: "petite-riviere-saint-francois", name: "Petite-Rivière-Saint-François", lat: 47.3100, lng: -70.5660, accent: "#0ea5e9" },
    ],
  },
  "quebec-eastern-townships": {
    center: { lat: 45.20, lng: -72.60 },
    pins: [
      { id: "bromont-resort", name: "Ski Bromont", lat: 45.2892, lng: -72.6378, accent: "#f97316" },
      { id: "mont-sutton", name: "Mont Sutton", lat: 45.0850, lng: -72.5500, accent: "#f97316" },
      { id: "bromont", name: "Bromont", lat: 45.3168, lng: -72.6491, accent: "#0ea5e9" },
      { id: "sutton", name: "Sutton", lat: 45.1001, lng: -72.6158, accent: "#0ea5e9" },
    ],
  },
  "summit-county": {
    center: { lat: 39.62, lng: -105.95 },
    pins: [
      { id: "breckenridge-resort", name: "Breckenridge", lat: 39.4817, lng: -106.0384, accent: "#f97316" },
      { id: "keystone-resort", name: "Keystone", lat: 39.6084, lng: -105.9439, accent: "#f97316" },
      { id: "copper-mountain-resort", name: "Copper Mountain", lat: 39.5022, lng: -106.1512, accent: "#f97316" },
      { id: "arapahoe-basin", name: "Arapahoe Basin", lat: 39.6425, lng: -105.8719, accent: "#f97316" },
      { id: "loveland", name: "Loveland", lat: 39.6803, lng: -105.8974, accent: "#f97316" },
      { id: "breckenridge", name: "Breckenridge", lat: 39.4817, lng: -106.0384, accent: "#0ea5e9" },
      { id: "keystone", name: "Keystone / Dillon", lat: 39.5769, lng: -105.9469, accent: "#0ea5e9" },
      { id: "copper-mountain", name: "Copper Mountain", lat: 39.5022, lng: -106.1512, accent: "#0ea5e9" },
      { id: "georgetown", name: "Georgetown", lat: 39.7047, lng: -105.6997, accent: "#0ea5e9" },
    ],
  },
  "vail-valley": {
    center: { lat: 39.62, lng: -106.45 },
    pins: [
      { id: "vail-mountain", name: "Vail Mountain", lat: 39.6061, lng: -106.3550, accent: "#f97316" },
      { id: "beaver-creek", name: "Beaver Creek", lat: 39.6042, lng: -106.5165, accent: "#f97316" },
      { id: "vail", name: "Vail", lat: 39.6403, lng: -106.3742, accent: "#0ea5e9" },
      { id: "avon", name: "Avon", lat: 39.6317, lng: -106.5219, accent: "#0ea5e9" },
    ],
  },
  "aspen-snowmass": {
    center: { lat: 39.20, lng: -106.88 },
    pins: [
      { id: "snowmass", name: "Snowmass", lat: 39.2110, lng: -106.9500, accent: "#f97316" },
      { id: "aspen-mountain", name: "Aspen Mountain", lat: 39.1836, lng: -106.8231, accent: "#f97316" },
      { id: "aspen-highlands", name: "Aspen Highlands", lat: 39.1811, lng: -106.8697, accent: "#f97316" },
      { id: "buttermilk", name: "Buttermilk", lat: 39.1997, lng: -106.8683, accent: "#f97316" },
      { id: "aspen", name: "Aspen", lat: 39.1911, lng: -106.8175, accent: "#0ea5e9" },
      { id: "snowmass-village", name: "Snowmass Village", lat: 39.2103, lng: -106.9378, accent: "#0ea5e9" },
    ],
  },
  steamboat: {
    center: { lat: 40.46, lng: -106.80 },
    pins: [
      { id: "steamboat-resort", name: "Steamboat Resort", lat: 40.4572, lng: -106.8045, accent: "#f97316" },
      { id: "steamboat-springs", name: "Steamboat Springs", lat: 40.4850, lng: -106.8317, accent: "#0ea5e9" },
    ],
  },
  "winter-park": {
    center: { lat: 39.89, lng: -105.76 },
    pins: [
      { id: "winter-park-resort", name: "Winter Park Resort", lat: 39.8868, lng: -105.7625, accent: "#f97316" },
      { id: "winter-park", name: "Winter Park", lat: 39.8867, lng: -105.7631, accent: "#0ea5e9" },
    ],
  },
  "crested-butte": {
    center: { lat: 38.90, lng: -106.97 },
    pins: [
      { id: "crested-butte-mountain-resort", name: "Crested Butte Mountain Resort", lat: 38.8992, lng: -106.9650, accent: "#f97316" },
      { id: "crested-butte-town", name: "Crested Butte", lat: 38.8697, lng: -106.9878, accent: "#0ea5e9" },
    ],
  },
  telluride: {
    center: { lat: 37.94, lng: -107.81 },
    pins: [
      { id: "telluride-ski-resort", name: "Telluride Ski Resort", lat: 37.9375, lng: -107.8123, accent: "#f97316" },
      { id: "telluride-town", name: "Telluride", lat: 37.9375, lng: -107.8123, accent: "#0ea5e9" },
    ],
  },
  durango: {
    center: { lat: 37.63, lng: -107.81 },
    pins: [
      { id: "purgatory-resort", name: "Purgatory Resort", lat: 37.6297, lng: -107.8144, accent: "#f97316" },
      { id: "durango-town", name: "Durango", lat: 37.2753, lng: -107.8801, accent: "#0ea5e9" },
    ],
  },
  "boulder-front-range": {
    center: { lat: 39.94, lng: -105.58 },
    pins: [
      { id: "eldora-mountain-resort", name: "Eldora Mountain Resort", lat: 39.9375, lng: -105.5828, accent: "#f97316" },
      { id: "nederland", name: "Nederland", lat: 39.9614, lng: -105.5108, accent: "#0ea5e9" },
    ],
  },
  "cottonwood-canyons": {
    center: { lat: 40.61, lng: -111.64 },
    pins: [
      { id: "alta", name: "Alta", lat: 40.5883, lng: -111.6383, accent: "#f97316" },
      { id: "snowbird", name: "Snowbird", lat: 40.5830, lng: -111.6556, accent: "#f97316" },
      { id: "brighton-resort", name: "Brighton", lat: 40.5977, lng: -111.5836, accent: "#f97316" },
      { id: "solitude-mountain-resort", name: "Solitude", lat: 40.6199, lng: -111.5928, accent: "#f97316" },
      { id: "salt-lake-city", name: "Salt Lake City", lat: 40.7608, lng: -111.8910, accent: "#0ea5e9" },
      { id: "sandy", name: "Sandy", lat: 40.5649, lng: -111.8389, accent: "#0ea5e9" },
    ],
  },
  "park-city": {
    center: { lat: 40.65, lng: -111.50 },
    pins: [
      { id: "park-city-mountain", name: "Park City Mountain", lat: 40.6514, lng: -111.5080, accent: "#f97316" },
      { id: "deer-valley-resort", name: "Deer Valley", lat: 40.6374, lng: -111.4783, accent: "#f97316" },
      { id: "park-city-town", name: "Park City", lat: 40.6461, lng: -111.4980, accent: "#0ea5e9" },
    ],
  },
  "ogden-valley": {
    center: { lat: 41.27, lng: -111.87 },
    pins: [
      { id: "snowbasin", name: "Snowbasin", lat: 41.2160, lng: -111.8567, accent: "#f97316" },
      { id: "powder-mountain", name: "Powder Mountain", lat: 41.3797, lng: -111.7811, accent: "#f97316" },
      { id: "nordic-valley", name: "Nordic Valley", lat: 41.3311, lng: -111.8497, accent: "#f97316" },
      { id: "ogden", name: "Ogden", lat: 41.2230, lng: -111.9738, accent: "#0ea5e9" },
      { id: "eden", name: "Eden", lat: 41.3211, lng: -111.8636, accent: "#0ea5e9" },
    ],
  },
  provo: {
    center: { lat: 40.40, lng: -111.58 },
    pins: [
      { id: "sundance-mountain-resort", name: "Sundance Mountain Resort", lat: 40.3970, lng: -111.5847, accent: "#f97316" },
      { id: "provo-town", name: "Provo", lat: 40.2338, lng: -111.6585, accent: "#0ea5e9" },
      { id: "sundance-town", name: "Sundance", lat: 40.3970, lng: -111.5847, accent: "#0ea5e9" },
    ],
  },
  "cache-valley": {
    center: { lat: 41.74, lng: -111.83 },
    pins: [
      { id: "beaver-mountain", name: "Beaver Mountain", lat: 41.9742, lng: -111.4547, accent: "#f97316" },
      { id: "cherry-peak", name: "Cherry Peak", lat: 41.9897, lng: -111.9250, accent: "#f97316" },
      { id: "logan", name: "Logan", lat: 41.7370, lng: -111.8338, accent: "#0ea5e9" },
    ],
  },
  "north-lake-tahoe": {
    center: { lat: 39.33, lng: -120.18 },
    pins: [
      { id: "palisades-tahoe", name: "Palisades Tahoe", lat: 39.1966, lng: -120.2347, accent: "#f97316" },
      { id: "northstar-california", name: "Northstar California", lat: 39.2640, lng: -120.1250, accent: "#f97316" },
      { id: "sugar-bowl", name: "Sugar Bowl", lat: 39.3044, lng: -120.3358, accent: "#f97316" },
      { id: "truckee", name: "Truckee", lat: 39.3280, lng: -120.1833, accent: "#0ea5e9" },
    ],
  },
  "south-lake-tahoe": {
    center: { lat: 38.94, lng: -119.98 },
    pins: [
      { id: "heavenly", name: "Heavenly", lat: 38.9353, lng: -119.9400, accent: "#f97316" },
      { id: "kirkwood", name: "Kirkwood", lat: 38.6840, lng: -120.0664, accent: "#f97316" },
      { id: "sierra-at-tahoe", name: "Sierra-at-Tahoe", lat: 38.8002, lng: -120.0806, accent: "#f97316" },
      { id: "homewood-mountain-resort", name: "Homewood", lat: 39.0827, lng: -120.1755, accent: "#f97316" },
      { id: "south-lake-tahoe-town", name: "South Lake Tahoe", lat: 38.9399, lng: -119.9772, accent: "#0ea5e9" },
    ],
  },
  "mammoth-lakes": {
    center: { lat: 37.65, lng: -118.97 },
    pins: [
      { id: "mammoth-mountain", name: "Mammoth Mountain", lat: 37.6306, lng: -119.0326, accent: "#f97316" },
      { id: "june-mountain", name: "June Mountain", lat: 37.7683, lng: -119.0906, accent: "#f97316" },
      { id: "mammoth-lakes-town", name: "Mammoth Lakes", lat: 37.6485, lng: -118.9721, accent: "#0ea5e9" },
    ],
  },
  "big-bear": {
    center: { lat: 34.24, lng: -116.91 },
    pins: [
      { id: "bear-mountain", name: "Bear Mountain", lat: 34.2267, lng: -116.8602, accent: "#f97316" },
      { id: "snow-summit", name: "Snow Summit", lat: 34.2286, lng: -116.8911, accent: "#f97316" },
      { id: "big-bear-lake", name: "Big Bear Lake", lat: 34.2439, lng: -116.9114, accent: "#0ea5e9" },
    ],
  },
  "bear-valley": {
    center: { lat: 38.25, lng: -120.36 },
    pins: [
      { id: "bear-valley-mountain-resort", name: "Bear Valley Mountain Resort", lat: 38.4706, lng: -120.0471, accent: "#f97316" },
      { id: "arnold", name: "Arnold", lat: 38.2494, lng: -120.3552, accent: "#0ea5e9" },
    ],
  },
  "mt-shasta": {
    center: { lat: 41.31, lng: -122.31 },
    pins: [
      { id: "mt-shasta-ski-park", name: "Mt. Shasta Ski Park", lat: 41.3208, lng: -122.2036, accent: "#f97316" },
      { id: "mount-shasta", name: "Mount Shasta", lat: 41.3099, lng: -122.3106, accent: "#0ea5e9" },
    ],
  },
  "killington-pico": {
    center: { lat: 43.60, lng: -72.82 },
    pins: [
      { id: "killington-resort", name: "Killington", lat: 43.6045, lng: -72.8201, accent: "#f97316" },
      { id: "pico-mountain", name: "Pico Mountain", lat: 43.6659, lng: -72.8323, accent: "#f97316" },
      { id: "killington", name: "Killington", lat: 43.6042, lng: -72.8092, accent: "#0ea5e9" },
    ],
  },
  "stowe-smugglers-notch": {
    center: { lat: 44.56, lng: -72.75 },
    pins: [
      { id: "stowe-mountain-resort", name: "Stowe Mountain Resort", lat: 44.5303, lng: -72.7883, accent: "#f97316" },
      { id: "smugglers-notch", name: "Smugglers' Notch", lat: 44.5991, lng: -72.7864, accent: "#f97316" },
      { id: "stowe", name: "Stowe", lat: 44.4654, lng: -72.6874, accent: "#0ea5e9" },
      { id: "jeffersonville", name: "Jeffersonville", lat: 44.6511, lng: -72.8298, accent: "#0ea5e9" },
    ],
  },
  "mad-river-valley": {
    center: { lat: 44.17, lng: -72.92 },
    pins: [
      { id: "sugarbush", name: "Sugarbush", lat: 44.1358, lng: -72.9204, accent: "#f97316" },
      { id: "mad-river-glen", name: "Mad River Glen", lat: 44.2001, lng: -72.9192, accent: "#f97316" },
      { id: "warren", name: "Warren", lat: 44.1195, lng: -72.8626, accent: "#0ea5e9" },
      { id: "waitsfield", name: "Waitsfield", lat: 44.1975, lng: -72.8090, accent: "#0ea5e9" },
    ],
  },
  "southern-vermont": {
    center: { lat: 43.15, lng: -72.90 },
    pins: [
      { id: "stratton-mountain-resort", name: "Stratton", lat: 43.1131, lng: -72.9081, accent: "#f97316" },
      { id: "mount-snow", name: "Mount Snow", lat: 42.9601, lng: -72.9201, accent: "#f97316" },
      { id: "bromley-mountain", name: "Bromley Mountain", lat: 43.2226, lng: -72.9376, accent: "#f97316" },
      { id: "magic-mountain", name: "Magic Mountain", lat: 43.1706, lng: -72.7534, accent: "#f97316" },
      { id: "stratton", name: "Stratton", lat: 43.1334, lng: -72.9298, accent: "#0ea5e9" },
      { id: "west-dover", name: "West Dover", lat: 42.9709, lng: -72.8265, accent: "#0ea5e9" },
      { id: "peru-vt", name: "Peru", lat: 43.2333, lng: -72.8990, accent: "#0ea5e9" },
      { id: "manchester-vt", name: "Manchester", lat: 43.1642, lng: -73.0729, accent: "#0ea5e9" },
    ],
  },
  "okemo": {
    center: { lat: 43.40, lng: -72.72 },
    pins: [
      { id: "okemo-mountain-resort", name: "Okemo Mountain Resort", lat: 43.4009, lng: -72.7168, accent: "#f97316" },
      { id: "ludlow", name: "Ludlow", lat: 43.3959, lng: -72.7096, accent: "#0ea5e9" },
    ],
  },
  "jay-peak-nek": {
    center: { lat: 44.76, lng: -72.22 },
    pins: [
      { id: "jay-peak", name: "Jay Peak", lat: 44.9241, lng: -72.5215, accent: "#f97316" },
      { id: "burke-mountain", name: "Burke Mountain", lat: 44.5876, lng: -71.9106, accent: "#f97316" },
      { id: "jay", name: "Jay", lat: 44.9417, lng: -72.5083, accent: "#0ea5e9" },
      { id: "east-burke", name: "East Burke", lat: 44.6112, lng: -71.9227, accent: "#0ea5e9" },
    ],
  },
  "jackson-hole": {
    center: { lat: 43.62, lng: -110.85 },
    pins: [
      { id: "jackson-hole-mtn-resort", name: "Jackson Hole Mountain Resort", lat: 43.5875, lng: -110.8279, accent: "#f97316" },
      { id: "snow-king-mountain", name: "Snow King Mountain", lat: 43.4783, lng: -110.7581, accent: "#f97316" },
      { id: "jackson", name: "Jackson", lat: 43.4799, lng: -110.7624, accent: "#0ea5e9" },
      { id: "teton-village", name: "Teton Village", lat: 43.5881, lng: -110.8273, accent: "#0ea5e9" },
    ],
  },
  "grand-targhee": {
    center: { lat: 43.79, lng: -110.95 },
    pins: [
      { id: "grand-targhee-resort", name: "Grand Targhee Resort", lat: 43.7904, lng: -110.9576, accent: "#f97316" },
      { id: "alta-wy", name: "Alta", lat: 43.7897, lng: -110.9310, accent: "#0ea5e9" },
    ],
  },
  "big-sky": {
    center: { lat: 45.29, lng: -111.39 },
    pins: [
      { id: "big-sky-resort", name: "Big Sky Resort", lat: 45.2871, lng: -111.4010, accent: "#f97316" },
      { id: "big-sky-town", name: "Big Sky", lat: 45.2849, lng: -111.3806, accent: "#0ea5e9" },
    ],
  },
  "bozeman-bridger-bowl": {
    center: { lat: 45.75, lng: -110.97 },
    pins: [
      { id: "bridger-bowl", name: "Bridger Bowl", lat: 45.8266, lng: -110.8988, accent: "#f97316" },
      { id: "bozeman", name: "Bozeman", lat: 45.6770, lng: -111.0429, accent: "#0ea5e9" },
    ],
  },
  "whitefish": {
    center: { lat: 48.45, lng: -114.35 },
    pins: [
      { id: "whitefish-mountain-resort", name: "Whitefish Mountain Resort", lat: 48.4890, lng: -114.3670, accent: "#f97316" },
      { id: "whitefish-town", name: "Whitefish", lat: 48.4111, lng: -114.3376, accent: "#0ea5e9" },
    ],
  },
  "red-lodge": {
    center: { lat: 45.18, lng: -109.33 },
    pins: [
      { id: "red-lodge-mountain", name: "Red Lodge Mountain", lat: 45.1699, lng: -109.4137, accent: "#f97316" },
      { id: "red-lodge-town", name: "Red Lodge", lat: 45.1863, lng: -109.2468, accent: "#0ea5e9" },
    ],
  },
  "taos": {
    center: { lat: 36.595, lng: -105.449 },
    pins: [
      { id: "taos-ski-valley", name: "Taos Ski Valley", lat: 36.5960, lng: -105.4478, accent: "#f97316" },
      { id: "taos-ski-valley-town", name: "Taos Ski Valley", lat: 36.5946, lng: -105.4497, accent: "#0ea5e9" },
    ],
  },
  "angel-fire": {
    center: { lat: 36.385, lng: -105.287 },
    pins: [
      { id: "angel-fire-resort", name: "Angel Fire Resort", lat: 36.3929, lng: -105.2853, accent: "#f97316" },
      { id: "angel-fire", name: "Angel Fire", lat: 36.3762, lng: -105.2894, accent: "#0ea5e9" },
    ],
  },
  "santa-fe": {
    center: { lat: 35.744, lng: -105.869 },
    pins: [
      { id: "ski-santa-fe", name: "Ski Santa Fe", lat: 35.8000, lng: -105.8000, accent: "#f97316" },
      { id: "santa-fe", name: "Santa Fe", lat: 35.6870, lng: -105.9378, accent: "#0ea5e9" },
    ],
  },
  "albuquerque-sandia": {
    center: { lat: 35.145, lng: -106.549 },
    pins: [
      { id: "sandia-peak", name: "Sandia Peak Ski Area", lat: 35.2062, lng: -106.4475, accent: "#f97316" },
      { id: "albuquerque", name: "Albuquerque", lat: 35.0844, lng: -106.6504, accent: "#0ea5e9" },
    ],
  },
  "harbor-springs": { center: { lat: 45.39, lng: -84.95 }, pins: [{ id: "boyne-mountain", name: "Boyne Mountain", lat: 45.1639, lng: -84.9308, accent: "#f97316" }, { id: "boyne-highlands", name: "The Highlands", lat: 45.4717, lng: -84.9233, accent: "#f97316" }, { id: "nubs-nob", name: "Nub's Nob", lat: 45.4623, lng: -84.9420, accent: "#f97316" }, { id: "harbor-springs-town", name: "Harbor Springs", lat: 45.4317, lng: -84.9889, accent: "#0ea5e9" }] },
  "keweenaw-peninsula": { center: { lat: 47.38, lng: -88.24 }, pins: [{ id: "mt-bohemia", name: "Mt. Bohemia", lat: 47.4080, lng: -88.1010, accent: "#f97316" }, { id: "mohawk", name: "Mohawk", lat: 47.3308, lng: -88.3743, accent: "#0ea5e9" }] },
  "poconos": {center:{lat:41.04,lng:-75.30},pins:[{id:"camelback-mountain",name:"Camelback",lat:41.052,lng:-75.352,accent:"#f97316"},{id:"blue-mountain-pa",name:"Blue Mountain PA",lat:40.810,lng:-75.521,accent:"#f97316"},{id:"shawnee-mountain",name:"Shawnee",lat:41.003,lng:-75.116,accent:"#f97316"},{id:"tannersville",name:"Tannersville",lat:41.040,lng:-75.305,accent:"#0ea5e9"},{id:"pocono-manor",name:"Pocono Manor",lat:41.101,lng:-75.347,accent:"#0ea5e9"}]},
  "laurel-highlands": {center:{lat:40.20,lng:-79.05},pins:[{id:"seven-springs-mountain",name:"Seven Springs",lat:40.022,lng:-79.297,accent:"#f97316"},{id:"blue-knob",name:"Blue Knob",lat:40.685,lng:-78.535,accent:"#f97316"},{id:"seven-springs-town",name:"Seven Springs",lat:40.041,lng:-79.467,accent:"#0ea5e9"}]},
  "berkshires":{center:{lat:42.45,lng:-73.15},pins:[{id:"jiminy-peak",name:"Jiminy Peak",lat:42.554,lng:-73.292,accent:"#f97316"},{id:"ski-butternut",name:"Ski Butternut",lat:42.196,lng:-73.319,accent:"#f97316"},{id:"berkshire-east",name:"Berkshire East",lat:42.684,lng:-72.875,accent:"#f97316"},{id:"hancock",name:"Hancock",lat:42.547,lng:-73.323,accent:"#0ea5e9"},{id:"great-barrington",name:"Great Barrington",lat:42.196,lng:-73.363,accent:"#0ea5e9"}]},
  "central-massachusetts":{center:{lat:42.48,lng:-71.88},pins:[{id:"wachusett-mountain",name:"Wachusett Mountain",lat:42.488,lng:-71.887,accent:"#f97316"},{id:"princeton-ma",name:"Princeton",lat:42.473,lng:-71.877,accent:"#0ea5e9"}]},
  "lutsen-north-shore":{center:{lat:47.65,lng:-90.70},pins:[{id:"lutsen-mountains",name:"Lutsen Mountains",lat:47.663,lng:-90.714,accent:"#f97316"},{id:"lutsen",name:"Lutsen",lat:47.643,lng:-90.714,accent:"#0ea5e9"}]},
  "wausau":{center:{lat:44.94,lng:-89.66},pins:[{id:"granite-peak",name:"Granite Peak",lat:44.931,lng:-89.688,accent:"#f97316"},{id:"wausau-town",name:"Wausau",lat:44.959,lng:-89.630,accent:"#0ea5e9"}]},
  "wisconsin-dells":{center:{lat:43.54,lng:-89.43},pins:[{id:"cascade-mountain",name:"Cascade Mountain",lat:43.531,lng:-89.395,accent:"#f97316"},{id:"portage",name:"Portage",lat:43.539,lng:-89.462,accent:"#0ea5e9"}]},
  "snowshoe":{center:{lat:38.41,lng:-79.995},pins:[{id:"snowshoe-mountain",name:"Snowshoe Mountain",lat:38.41,lng:-79.995,accent:"#f97316"},{id:"snowshoe-town",name:"Snowshoe",lat:38.41,lng:-79.995,accent:"#0ea5e9"}]},
  "canaan-valley":{center:{lat:39.041,lng:-79.438},pins:[{id:"canaan-valley-resort",name:"Canaan Valley Resort",lat:39.045,lng:-79.46,accent:"#f97316"},{id:"timberline-mountain",name:"Timberline Mountain",lat:39.041,lng:-79.438,accent:"#f97316"},{id:"canaan-valley-town",name:"Davis / Canaan Valley",lat:39.105,lng:-79.468,accent:"#0ea5e9"}]},
  "high-country":{center:{lat:36.183,lng:-81.874},pins:[{id:"sugar-mountain",name:"Sugar Mountain",lat:36.13,lng:-81.871,accent:"#f97316"},{id:"beech-mountain",name:"Beech Mountain Resort",lat:36.183,lng:-81.874,accent:"#f97316"},{id:"banner-elk-beech-mountain",name:"Banner Elk / Beech Mountain",lat:36.166,lng:-81.872,accent:"#0ea5e9"}]},
  "maggie-valley":{center:{lat:35.562,lng:-83.094},pins:[{id:"cataloochee-ski-area",name:"Cataloochee Ski Area",lat:35.562,lng:-83.094,accent:"#f97316"},{id:"maggie-valley-town",name:"Maggie Valley",lat:35.519,lng:-83.084,accent:"#0ea5e9"}]},
  "blue-ridge":{center:{lat:37.913,lng:-78.945},pins:[{id:"wintergreen-resort",name:"Wintergreen Resort",lat:37.913,lng:-78.945,accent:"#f97316"},{id:"wintergreen-town",name:"Wintergreen",lat:37.913,lng:-78.945,accent:"#0ea5e9"}]},
  "shenandoah-valley":{center:{lat:38.407,lng:-78.738},pins:[{id:"massanutten-resort",name:"Massanutten Resort",lat:38.407,lng:-78.738,accent:"#f97316"},{id:"mcgaheysville",name:"McGaheysville",lat:38.372,lng:-78.73,accent:"#0ea5e9"}]},
  "mt-hood": {
    center: { lat: 45.320, lng: -121.720 },
    pins: [
      { id: "mt-hood-meadows", name: "Mt. Hood Meadows", lat: 45.32889, lng: -121.66250, accent: "#f97316" },
      { id: "timberline-lodge", name: "Timberline Lodge", lat: 45.33111, lng: -121.71000, accent: "#f97316" },
      { id: "mt-hood-skibowl", name: "Mt. Hood Skibowl", lat: 45.30189, lng: -121.77321, accent: "#f97316" },
      { id: "government-camp", name: "Government Camp", lat: 45.30222, lng: -121.75250, accent: "#0ea5e9" },
    ],
  },
  "bend": {
    center: { lat: 44.019, lng: -121.503 },
    pins: [
      { id: "mt-bachelor", name: "Mt. Bachelor", lat: 43.9794, lng: -121.6885, accent: "#f97316" },
      { id: "bend", name: "Bend", lat: 44.05806, lng: -121.31528, accent: "#0ea5e9" },
    ],
  },
  "crystal-mountain": {
    center: { lat: 47.064, lng: -121.735 },
    pins: [
      { id: "crystal-mountain", name: "Crystal Mountain Resort", lat: 46.9280, lng: -121.4749, accent: "#f97316" },
      { id: "enumclaw", name: "Enumclaw", lat: 47.20111, lng: -121.99694, accent: "#0ea5e9" },
    ],
  },
  "snoqualmie-pass": {
    center: { lat: 47.408, lng: -121.413 },
    pins: [
      { id: "snoqualmie-pass", name: "The Summit at Snoqualmie", lat: 47.42400, lng: -121.41600, accent: "#f97316" },
      { id: "snoqualmie-pass-town", name: "Snoqualmie Pass", lat: 47.39222, lng: -121.40000, accent: "#0ea5e9" },
    ],
  },
  "stevens-pass": {
    center: { lat: 47.727, lng: -121.222 },
    pins: [
      { id: "stevens-pass", name: "Stevens Pass Ski Area", lat: 47.74472, lng: -121.08889, accent: "#f97316" },
      { id: "skykomish", name: "Skykomish", lat: 47.71028, lng: -121.35833, accent: "#0ea5e9" },
    ],
  },
  "mt-baker": {
    center: { lat: 48.875, lng: -121.794 },
    pins: [
      { id: "mt-baker", name: "Mt. Baker Ski Area", lat: 48.861944, lng: -121.653889, accent: "#f97316" },
      { id: "glacier", name: "Glacier", lat: 48.88833, lng: -121.93389, accent: "#0ea5e9" },
    ],
  },
  "sun-valley": {
    center: { lat: 43.669, lng: -114.387 },
    pins: [
      { id: "bald-mountain", name: "Bald Mountain", lat: 43.65500, lng: -114.40917, accent: "#f97316" },
      { id: "dollar-mountain", name: "Dollar Mountain", lat: 43.68306, lng: -114.34694, accent: "#f97316" },
      { id: "ketchum", name: "Ketchum", lat: 43.68074, lng: -114.36366, accent: "#0ea5e9" },
    ],
  },
  "sandpoint": {
    center: { lat: 48.325, lng: -116.592 },
    pins: [
      { id: "schweitzer-mountain-resort", name: "Schweitzer Mountain Resort", lat: 48.36700, lng: -116.62300, accent: "#f97316" },
      { id: "sandpoint", name: "Sandpoint", lat: 48.28222, lng: -116.56139, accent: "#0ea5e9" },
    ],
  },
  "boise": {
    center: { lat: 43.690, lng: -116.153 },
    pins: [
      { id: "bogus-basin", name: "Bogus Basin", lat: 43.76468, lng: -116.10329, accent: "#f97316" },
      { id: "boise", name: "Boise", lat: 43.61583, lng: -116.20167, accent: "#0ea5e9" },
    ],
  },
  "donnelly-mccall": {
    center: { lat: 44.802, lng: -116.117 },
    pins: [
      { id: "tamarack-resort", name: "Tamarack Resort", lat: 44.671, lng: -116.123, accent: "#f97316" },
      { id: "brundage-mountain", name: "Brundage Mountain", lat: 45.00500, lng: -116.15500, accent: "#f97316" },
      { id: "donnelly", name: "Donnelly", lat: 44.73028, lng: -116.07444, accent: "#0ea5e9" },
    ],
  },
  "white-mountains": { center: { lat: 44.14, lng: -71.20 }, pins: [{ id: "cranmore-mountain", name: "Cranmore Mountain", lat: 44.0550, lng: -71.1090, accent: "#f97316" }, { id: "wildcat-mountain", name: "Wildcat Mountain", lat: 44.2590, lng: -71.2370, accent: "#f97316" }, { id: "attitash-mountain-resort", name: "Attitash Mountain Resort", lat: 44.0820, lng: -71.2290, accent: "#f97316" }, { id: "north-conway", name: "North Conway", lat: 44.0537, lng: -71.1289, accent: "#0ea5e9" }] },
  "franconia-notch": { center: { lat: 44.15, lng: -71.59 }, pins: [{ id: "cannon-mountain", name: "Cannon Mountain", lat: 44.1569, lng: -71.6980, accent: "#f97316" }, { id: "bretton-woods", name: "Bretton Woods", lat: 44.2600, lng: -71.4410, accent: "#f97316" }, { id: "loon-mountain", name: "Loon Mountain", lat: 44.0360, lng: -71.6220, accent: "#f97316" }, { id: "franconia", name: "Franconia", lat: 44.2270, lng: -71.7470, accent: "#0ea5e9" }, { id: "bretton-woods-town", name: "Bretton Woods", lat: 44.2580, lng: -71.4410, accent: "#0ea5e9" }] },
  "waterville-valley": { center: { lat: 43.95, lng: -71.51 }, pins: [{ id: "waterville-valley-resort", name: "Waterville Valley Resort", lat: 43.9500, lng: -71.5140, accent: "#f97316" }, { id: "waterville-valley-town", name: "Waterville Valley", lat: 43.9500, lng: -71.4990, accent: "#0ea5e9" }] },
  "lakes-region": { center: { lat: 43.54, lng: -71.39 }, pins: [{ id: "gunstock-mountain-resort", name: "Gunstock Mountain Resort", lat: 43.5270, lng: -71.3690, accent: "#f97316" }, { id: "gilford", name: "Gilford", lat: 43.5480, lng: -71.4060, accent: "#0ea5e9" }] },
  "carrabassett-valley": { center: { lat: 45.03, lng: -70.31 }, pins: [{ id: "sugarloaf", name: "Sugarloaf", lat: 45.031, lng: -70.314, accent: "#f97316" }, { id: "carrabassett-valley-town", name: "Carrabassett Valley", lat: 45.085, lng: -70.265, accent: "#0ea5e9" }] },
  "newry-bethel": { center: { lat: 44.48, lng: -70.83 }, pins: [{ id: "sunday-river", name: "Sunday River", lat: 44.473, lng: -70.856, accent: "#f97316" }, { id: "newry", name: "Newry", lat: 44.499, lng: -70.800, accent: "#0ea5e9" }] },
  "rangeley": { center: { lat: 44.95, lng: -70.56 }, pins: [{ id: "saddleback-mountain", name: "Saddleback Mountain", lat: 44.936, lng: -70.510, accent: "#f97316" }, { id: "rangeley", name: "Rangeley", lat: 44.966, lng: -70.644, accent: "#0ea5e9" }] },
  "lake-placid": { center: { lat: 44.33, lng: -73.91 }, pins: [{ id: "whiteface-mountain", name: "Whiteface Mountain", lat: 44.365, lng: -73.902, accent: "#f97316" }, { id: "lake-placid", name: "Lake Placid", lat: 44.279, lng: -73.979, accent: "#0ea5e9" }, { id: "wilmington", name: "Wilmington", lat: 44.387, lng: -73.817, accent: "#0ea5e9" }] },
  "north-creek": { center: { lat: 43.68, lng: -74.00 }, pins: [{ id: "gore-mountain", name: "Gore Mountain", lat: 43.673, lng: -74.016, accent: "#f97316" }, { id: "north-creek", name: "North Creek", lat: 43.697, lng: -73.985, accent: "#0ea5e9" }] },
  "hunter": { center: { lat: 42.21, lng: -74.22 }, pins: [{ id: "hunter-mountain", name: "Hunter Mountain", lat: 42.204, lng: -74.225, accent: "#f97316" }, { id: "hunter", name: "Hunter", lat: 42.214, lng: -74.213, accent: "#0ea5e9" }] },
  "windham": { center: { lat: 42.30, lng: -74.25 }, pins: [{ id: "windham-mountain", name: "Windham Mountain Club", lat: 42.289, lng: -74.257, accent: "#f97316" }, { id: "windham", name: "Windham", lat: 42.309, lng: -74.251, accent: "#0ea5e9" }] },
  "highmount": { center: { lat: 42.14, lng: -74.51 }, pins: [{ id: "belleayre-mountain", name: "Belleayre Mountain", lat: 42.139, lng: -74.505, accent: "#f97316" }, { id: "highmount", name: "Highmount", lat: 42.147, lng: -74.514, accent: "#0ea5e9" }] },
};

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
