import { Router, type IRouter } from "express";
import { LruTtlCache } from "../lib/lru-cache.js";
import { fetchOpenWeatherMapAsOpenMeteo } from "../lib/openweathermap.js";
import { reconcileDryToWet } from "../lib/amedas.js";
import { reconcileNzMetarDryToWet } from "../lib/metar-nz.js";
import { publishedCatalogueRecords, travelRegions } from "@workspace/japan-ski-catalogue/public-runtime";
import {
  publishedRecords as publishedSkiCatalogueRecords,
  publishedRegions as publishedSkiCatalogueRegions,
} from "@workspace/ski-catalogue/public-runtime";

const router: IRouter = Router();

type RegionStatus = "live" | "soon";

interface RegionConfig {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP" | "NZ" | "CA" | "US";
  region: string;
  status: RegionStatus;
  href: string;
  baseTowns: string[];
  mountains: string[];
  headlineLabel: string;
  lat?: number;
  lon?: number;
  elevation?: number;
  model?: string;
  timezone?: string;
  sourceLabel?: string;
}

const REGIONS: RegionConfig[] = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    status: "live",
    href: "/snowy-mountains/",
    baseTowns: ["Jindabyne", "Berridale", "Cooma"],
    mountains: ["Perisher", "Thredbo", "Selwyn", "Charlotte's Pass"],
    // Headline reading is for the base town (Jindabyne, ~918m) - not the
    // mountain peak - so the home page reflects what visitors actually feel
    // when they arrive in town. Per-mountain peak forecasts live on the
    // dedicated region page.
    headlineLabel: "Jindabyne",
    lat: -36.4137,
    lon: 148.6207,
    timezone: "Australia/Sydney",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "victorias-high-country",
    name: "Victoria's High Country",
    country: "Australia",
    countryCode: "AU",
    region: "Victoria",
    status: "live",
    href: "/victorias-high-country/",
    baseTowns: ["Mansfield", "Bright", "Mount Beauty", "Harrietville", "Dinner Plain", "Omeo", "Marysville", "Warburton"],
    mountains: ["Mt Buller", "Falls Creek", "Mt Hotham", "Mt Stirling", "Lake Mountain", "Mt Donna Buang"],
    // Headline reading is for Mount Beauty (~357m) - closest sealed-road
    // town to Falls Creek and the most-stayed base for Victoria's High
    // Country off-mountain visitors. Per-mountain peak forecasts live on
    // the dedicated region page.
    headlineLabel: "Mount Beauty",
    lat: -36.7327,
    lon: 147.1696,
    timezone: "Australia/Melbourne",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "tasmania",
    name: "Tasmania",
    country: "Australia",
    countryCode: "AU",
    region: "Tasmania",
    status: "live",
    href: "/tasmania/",
    baseTowns: ["Ben Lomond Base", "Launceston", "Hobart"],
    mountains: ["Ben Lomond"],
    // Headline reading from Launceston (~30m) · closest city base and
    // where most visiting skiers actually arrive. Ben Lomond summit
    // forecast lives on the dedicated mountain page.
    headlineLabel: "Launceston",
    lat: -41.4332,
    lon: 147.1442,
    timezone: "Australia/Hobart",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/yamanouchi/",
    baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],
    mountains: ["Shiga Kogen", "Yomase", "X-Jam", "Ryuoo"],
    // Headline reading is for the base town (Yudanaka Onsen, ~600m) - not
    // the Shiga Kogen peak - so the home page shows what visitors feel on
    // arrival. Per-mountain peak forecasts live on the dedicated region page.
    headlineLabel: "Yudanaka",
    lat: 36.7414,
    lon: 138.4242,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "nozawa-onsen",
    name: "Nozawa Onsen",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/nozawa-onsen/",
    baseTowns: ["Nozawa Onsen"],
    mountains: ["Nozawa Onsen"],
    // Headline reading from the onsen village core (~565m) - what guests
    // step out into off the bus from Iiyama Shinkansen.
    headlineLabel: "Nozawa Onsen",
    lat: 36.9243,
    lon: 138.4485,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "iiyama",
    name: "Iiyama",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/iiyama/",
    baseTowns: ["Iiyama", "Madarao Kogen", "Togari Onsen", "Kijimadaira"],
    mountains: ["Madarao", "Tangram", "Togari Onsen", "Kijimadaira · Romance no Kamisama", "Kijima Snow Park"],
    // Headline reading from Iiyama City (~315m) - Hokuriku Shinkansen
    // gateway and the rail-in pivot for the whole north-east Nagano
    // resort cluster.
    headlineLabel: "Iiyama",
    lat: 36.8514,
    lon: 138.3676,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "hakuba-valley",
    name: "Hakuba Valley",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/hakuba-valley/",
    baseTowns: ["Hakuba", "Otari", "Omachi"],
    mountains: ["Happo-One", "Hakuba Goryu", "Hakuba 47", "Hakuba Iwatake", "Tsugaike Kogen", "Hakuba Norikura", "Hakuba Cortina", "Hakuba Sanosaka", "Kashimayari", "Jiigatake"],
    // Headline reading from Hakuba village (~700m) · the central base and
    // the valley's main hotel/ryokan hub beneath the Happo lifts.
    headlineLabel: "Hakuba",
    lat: 36.6982,
    lon: 137.8619,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "myoko",
    name: "Myoko",
    country: "Japan",
    countryCode: "JP",
    region: "Niigata",
    status: "live",
    href: "/myoko/",
    baseTowns: ["Akakura Onsen", "Ikenotaira Onsen", "Suginosawa", "Arai"],
    mountains: ["Akakura Onsen", "Akakura Kanko", "Ikenotaira Alpen Blick", "Myoko Suginohara", "Seki Onsen", "Lotte Arai"],
    // Headline reading from Akakura Onsen village (~750m) · Myoko's main
    // hub with the largest strip of ryokan and restaurants, beneath the
    // Akakura Onsen / Akakura Kanko slopes.
    headlineLabel: "Akakura Onsen",
    lat: 36.8876,
    lon: 138.1802,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "niseko",
    name: "Niseko",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/niseko/",
    baseTowns: ["Hirafu", "Kutchan", "Niseko Town"],
    mountains: ["Grand Hirafu", "Hanazono", "Niseko Village", "Annupuri", "Moiwa"],
    // Headline reading from Hirafu village (~260m) · the hub village at
    // the foot of Grand Hirafu where most international guests stay.
    headlineLabel: "Hirafu",
    lat: 42.8577,
    lon: 140.6982,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "furano",
    name: "Furano",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/furano/",
    baseTowns: ["Furano", "Kitanomine"],
    mountains: ["Furano Ski Resort", "Kamui Ski Links", "Tomamu"],
    // Headline reading from Furano town (~175m) · the hub town on the
    // JR Furano Line below the Kitanomine gondola.
    headlineLabel: "Furano",
    lat: 43.3420,
    lon: 142.3833,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "sapporo",
    name: "Sapporo",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/sapporo/",
    baseTowns: ["Sapporo", "Jozankei"],
    mountains: ["Sapporo Teine", "Sapporo Kokusai", "Sapporo Bankei"],
    // Headline reading from Sapporo city centre (~26m) · downtown, where
    // visitors stay and ski the three surrounding hills as day trips.
    headlineLabel: "Sapporo",
    lat: 43.0621,
    lon: 141.3544,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "tomamu-sahoro",
    name: "Tomamu & Sahoro",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/tomamu-sahoro/",
    baseTowns: ["Tomamu", "Shimukappu"],
    mountains: ["Hoshino Resorts Tomamu", "Sahoro Resort"],
    // Headline reading from Tomamu resort village (~620m) · the hotel
    // towers and JR Tomamu Station at the base of Mt Tomamu.
    headlineLabel: "Tomamu",
    lat: 43.0572,
    lon: 142.6126,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "asahikawa",
    name: "Asahikawa",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/asahikawa/",
    baseTowns: ["Asahikawa", "Higashikawa"],
    mountains: ["Kamui Ski Links", "Asahidake"],
    // Headline reading from Asahikawa city centre (~120m) · downtown,
    // where visitors stay and ski Kamui as a day hill.
    headlineLabel: "Asahikawa",
    lat: 43.7706,
    lon: 142.3649,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "rusutsu-kiroro",
    name: "Rusutsu & Kiroro",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/rusutsu-kiroro/",
    baseTowns: ["Rusutsu", "Kiroro"],
    mountains: ["Rusutsu Resort", "Kiroro"],
    // Headline reading from Rusutsu village (~400m) · the farming
    // village on Route 230 directly across from the resort.
    headlineLabel: "Rusutsu",
    lat: 42.7333,
    lon: 140.8833,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "yuzawa",
    name: "Yuzawa",
    country: "Japan",
    countryCode: "JP",
    region: "Niigata",
    status: "live",
    href: "/yuzawa/",
    baseTowns: ["Echigo-Yuzawa", "Ishiuchi", "Mitsumata"],
    mountains: ["GALA Yuzawa", "Yuzawa Kogen", "Iwappara", "Ishiuchi Maruyama", "Kagura", "Naeba"],
    // Headline reading from Echigo-Yuzawa town (~360m) · the onsen town
    // around the shinkansen station where most visitors stay, beneath the
    // Yuzawa Kogen ropeway and GALA gondola.
    headlineLabel: "Echigo-Yuzawa",
    lat: 36.9354,
    lon: 138.8090,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "zao-onsen",
    name: "Zao Onsen",
    country: "Japan",
    countryCode: "JP",
    region: "Yamagata",
    status: "live",
    href: "/zao-onsen/",
    baseTowns: ["Zao Onsen"],
    mountains: ["Zao Onsen Ski Resort"],
    // Headline reading from Zao Onsen village (~880m) · the hot-spring
    // village where visitors stay, with the ropeways rising straight
    // off the village streets.
    headlineLabel: "Zao Onsen",
    lat: 38.1674,
    lon: 140.3937,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "hakkoda-aomori-spring",
    name: "Hakkoda & Aomori Spring",
    country: "Japan",
    countryCode: "JP",
    region: "Aomori",
    status: "live",
    href: "/hakkoda-aomori-spring/",
    baseTowns: ["Aomori", "Sukayu Onsen", "Ajigasawa"],
    mountains: ["Hakkoda", "Aomori Spring"],
    // Headline reading from Sukayu Onsen (~900m) · the classic mountain
    // base for Hakkoda skiing and the winter bus terminus. Aomori city
    // sits at sea level on the bay and would misrepresent conditions on
    // the hills, so the higher base is the honest headline.
    headlineLabel: "Sukayu Onsen",
    lat: 40.6506,
    lon: 140.8505,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "appi-shizukuishi",
    name: "Appi & Shizukuishi",
    country: "Japan",
    countryCode: "JP",
    region: "Iwate",
    status: "live",
    href: "/appi-shizukuishi/",
    baseTowns: ["Appi Kogen", "Shizukuishi", "Morioka"],
    mountains: ["Appi Kogen", "Shizukuishi"],
    // Headline reading from the Appi resort village (~620m) · where
    // visitors actually stay at the lifts. Morioka sits at ~140m in the
    // valley and would misrepresent conditions on the hills.
    headlineLabel: "Appi Kogen",
    lat: 40.0028,
    lon: 140.9452,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "minakami",
    name: "Minakami",
    country: "Japan",
    countryCode: "JP",
    region: "Gunma",
    status: "live",
    href: "/minakami/",
    baseTowns: ["Minakami"],
    mountains: ["Tanigawadake Tenjindaira", "Minakami Kogen", "Norn Minakami"],
    // Headline reading from Minakami onsen town (~490m) · where visitors
    // stay, with buses to every hill in the valley.
    headlineLabel: "Minakami",
    lat: 36.780,
    lon: 138.968,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "kusatsu-manza",
    name: "Kusatsu & Manza",
    country: "Japan",
    countryCode: "JP",
    region: "Gunma",
    status: "live",
    href: "/kusatsu-manza/",
    baseTowns: ["Kusatsu Onsen", "Manza Onsen"],
    mountains: ["Kusatsu Onsen", "Manza Onsen"],
    // Headline reading from Kusatsu Onsen town (~1,180m) · the main bed
    // base. Manza sits higher at 1,800m and has its own town page.
    headlineLabel: "Kusatsu Onsen",
    lat: 36.621,
    lon: 138.596,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "hachimantai",
    name: "Hachimantai",
    country: "Japan",
    countryCode: "JP",
    region: "Iwate",
    status: "live",
    href: "/hachimantai/",
    baseTowns: ["Hachimantai"],
    mountains: ["Hachimantai Panorama", "Hachimantai Shimokura"],
    // Headline reading from Hachimantai city around Obuke station
    // (~230m) · the rail gateway below the plateau.
    headlineLabel: "Hachimantai",
    lat: 39.900,
    lon: 141.130,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "bandai",
    name: "Bandai",
    country: "Japan",
    countryCode: "JP",
    region: "Fukushima",
    status: "live",
    href: "/bandai/",
    baseTowns: ["Inawashiro", "Urabandai"],
    mountains: ["Nekoma Mountain", "Grandeco"],
    // Headline reading from the Urabandai highland (~850m) · the lake
    // district behind Mt Bandai with the closest beds to Grandeco and
    // the Nekoma north side. Inawashiro sits at ~520m on the lake plain
    // and would misrepresent conditions on the hills.
    headlineLabel: "Urabandai",
    lat: 37.660,
    lon: 140.065,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "daisen",
    name: "Daisen",
    country: "Japan",
    countryCode: "JP",
    region: "Tottori",
    status: "live",
    href: "/daisen/",
    baseTowns: ["Daisenji", "Yonago"],
    mountains: ["Daisen White Resort"],
    // Headline reading from the Daisenji temple village (~800m) · right
    // at the base of the lifts, where visitors stay. Yonago sits at sea
    // level on the coast and would misrepresent conditions on the hill.
    headlineLabel: "Daisenji",
    lat: 35.396,
    lon: 133.540,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "queenstown",
    name: "Queenstown",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Otago",
    status: "live",
    href: "/queenstown/",
    baseTowns: ["Queenstown"],
    mountains: ["Coronet Peak", "The Remarkables"],
    // Headline reading from Queenstown town (~310m) · the base everyone
    // arrives into. Per-mountain peak forecasts live on the region page.
    headlineLabel: "Queenstown",
    lat: -45.0312,
    lon: 168.6626,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "wanaka",
    name: "Wanaka",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Otago",
    status: "live",
    href: "/wanaka/",
    baseTowns: ["Wanaka"],
    mountains: ["Cardrona", "Treble Cone"],
    // Headline reading from Wanaka town (~300m) · lakeside base for
    // Cardrona and Treble Cone.
    headlineLabel: "Wanaka",
    lat: -44.7032,
    lon: 169.1321,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mt-hutt",
    name: "Mt Hutt",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Canterbury",
    status: "live",
    href: "/mt-hutt/",
    baseTowns: ["Methven"],
    mountains: ["Mt Hutt"],
    // Headline reading from Methven (~320m) · the farm-town base at the
    // foot of the Mt Hutt access road. Summit forecast lives on the
    // mountain page.
    headlineLabel: "Methven",
    lat: -43.6333,
    lon: 171.6500,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "ruapehu",
    name: "Ruapehu",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Central Plateau",
    status: "live",
    href: "/ruapehu/",
    baseTowns: ["Ohakune"],
    mountains: ["Whakapapa", "Turoa"],
    // Headline reading from Ohakune (~610m) · the Turoa-side base town.
    // Per-mountain peak forecasts live on the region page.
    headlineLabel: "Ohakune",
    lat: -39.4181,
    lon: 175.3956,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // ── Canada · BC + Alberta. Northern hemisphere (Dec-Apr winter). No
  // national obs feed is reconciled here yet - Environment Canada / MSC
  // GeoMet is surfaced as an official link-out only, so every reading below
  // is straight Open-Meteo like the NZ regions.
  {
    id: "whistler",
    name: "Whistler",
    country: "Canada",
    countryCode: "CA",
    region: "British Columbia",
    status: "live",
    href: "/whistler/",
    baseTowns: ["Whistler"],
    mountains: ["Whistler Mountain", "Blackcomb Mountain"],
    // Headline reading from Whistler Village (~670m) · the ski-in village
    // between the two mountains. Peak forecasts live on the mountain pages.
    headlineLabel: "Whistler",
    lat: 50.1163,
    lon: -122.9574,
    timezone: "America/Vancouver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "powder-highway",
    name: "Powder Highway",
    country: "Canada",
    countryCode: "CA",
    region: "BC Interior",
    status: "live",
    href: "/powder-highway/",
    baseTowns: ["Revelstoke", "Golden", "Fernie", "Nelson", "Kimberley", "Invermere"],
    mountains: [
      "Revelstoke Mountain Resort",
      "Kicking Horse",
      "Fernie Alpine Resort",
      "Whitewater",
      "Kimberley Alpine Resort",
      "Panorama",
    ],
    // Revelstoke anchors the loop · the biggest vertical and the town most
    // people start from. Each of the other six towns has its own page.
    headlineLabel: "Revelstoke",
    lat: 50.9981,
    lon: -118.1957,
    timezone: "America/Vancouver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "okanagan",
    name: "Okanagan",
    country: "Canada",
    countryCode: "CA",
    region: "BC Interior",
    status: "live",
    href: "/okanagan/",
    baseTowns: ["Kelowna", "Vernon", "Penticton", "Kamloops", "Sun Peaks"],
    mountains: ["Big White Ski Resort", "SilverStar Mountain Resort", "Apex Mountain Resort", "Sun Peaks Resort"],
    // Kelowna is the biggest gateway city and the base for Big White · the
    // other towns (Vernon, Penticton, Kamloops, Sun Peaks) have their own pages.
    headlineLabel: "Kelowna",
    lat: 49.8880,
    lon: -119.4960,
    timezone: "America/Vancouver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "vancouver",
    name: "Vancouver & the Island",
    country: "Canada",
    countryCode: "CA",
    region: "British Columbia",
    status: "live",
    href: "/vancouver/",
    baseTowns: ["Vancouver", "Courtenay"],
    mountains: ["Cypress Mountain", "Grouse Mountain", "Mt Seymour", "Mount Washington Alpine Resort"],
    // Headline from downtown Vancouver · the three North Shore hills are day
    // trips from the city, Mount Washington is a separate Island trip.
    headlineLabel: "Vancouver",
    lat: 49.2827,
    lon: -123.1207,
    timezone: "America/Vancouver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "banff-lake-louise",
    name: "Banff & Lake Louise",
    country: "Canada",
    countryCode: "CA",
    region: "Alberta",
    status: "live",
    href: "/banff-lake-louise/",
    baseTowns: ["Banff", "Lake Louise"],
    mountains: ["Banff Sunshine Village", "Mt. Norquay", "Lake Louise Ski Resort"],
    // Headline reading from the Town of Banff (~1,383m) inside Banff
    // National Park · the base for all three SkiBig3 mountains.
    headlineLabel: "Banff",
    lat: 51.1784,
    lon: -115.5708,
    timezone: "America/Edmonton",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "canmore",
    name: "Canmore",
    country: "Canada",
    countryCode: "CA",
    region: "Alberta",
    status: "live",
    href: "/canmore/",
    baseTowns: ["Canmore"],
    mountains: ["Nakiska"],
    // Headline reading from Canmore (~1,309m) · the Bow Valley town just
    // outside the park gates, about 45 min from Nakiska in Kananaskis.
    headlineLabel: "Canmore",
    lat: 51.0884,
    lon: -115.3479,
    timezone: "America/Edmonton",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "jasper",
    name: "Jasper",
    country: "Canada",
    countryCode: "CA",
    region: "Alberta",
    status: "live",
    href: "/jasper/",
    baseTowns: ["Jasper"],
    mountains: ["Marmot Basin"],
    // Headline reading from the Town of Jasper (~1,062m) · 20 min from
    // Marmot Basin, the highest base elevation of any major Canadian field.
    headlineLabel: "Jasper",
    lat: 52.8737,
    lon: -118.0814,
    timezone: "America/Edmonton",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "quebec-laurentians",
    name: "Laurentians",
    country: "Canada",
    countryCode: "CA",
    region: "Québec",
    status: "live",
    href: "/quebec-laurentians/",
    baseTowns: ["Mont-Tremblant"],
    mountains: ["Tremblant"],
    // Headline reading from the pedestrian village (~261m) at the gondola
    // base rather than the 875m Pic White summit above it.
    headlineLabel: "Mont-Tremblant",
    lat: 46.2127,
    lon: -74.5844,
    timezone: "America/Toronto",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "quebec-charlevoix",
    name: "Charlevoix",
    country: "Canada",
    countryCode: "CA",
    region: "Québec",
    status: "live",
    href: "/quebec-charlevoix/",
    baseTowns: ["Beaupré", "Petite-Rivière-Saint-François"],
    mountains: ["Mont-Sainte-Anne", "Le Massif de Charlevoix"],
    // Headline reading from Beaupré (~24m) on the Côte-de-Beaupré flats ·
    // the larger of the two base towns and 10 min from Mont-Sainte-Anne.
    headlineLabel: "Beaupré",
    lat: 47.0443,
    lon: -70.8953,
    timezone: "America/Toronto",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "quebec-eastern-townships",
    name: "Eastern Townships",
    country: "Canada",
    countryCode: "CA",
    region: "Québec",
    status: "live",
    href: "/quebec-eastern-townships/",
    baseTowns: ["Bromont", "Sutton"],
    mountains: ["Ski Bromont", "Mont Sutton"],
    // Headline reading from Bromont (~126m) off Autoroute 10 · the nearer
    // of the two towns to Montréal and about 5 min from the ski hill.
    headlineLabel: "Bromont",
    lat: 45.3168,
    lon: -72.6491,
    timezone: "America/Toronto",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "summit-county",
    name: "Summit County",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/summit-county/",
    baseTowns: ["Breckenridge", "Keystone", "Copper Mountain", "Georgetown"],
    mountains: ["Breckenridge", "Keystone", "Copper Mountain", "Arapahoe Basin", "Loveland"],
    // Headline reading from Breckenridge (~2,926m town) · the largest of
    // the four Summit County base towns and the most-searched resort.
    headlineLabel: "Breckenridge",
    lat: 39.4817,
    lon: -106.0384,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "vail-valley",
    name: "Vail Valley",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/vail-valley/",
    baseTowns: ["Vail", "Avon"],
    mountains: ["Vail Mountain", "Beaver Creek"],
    // Headline reading from Vail village, at the base of the largest
    // single ski mountain in Colorado.
    headlineLabel: "Vail",
    lat: 39.6403,
    lon: -106.3742,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "aspen-snowmass",
    name: "Aspen Snowmass",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/aspen-snowmass/",
    baseTowns: ["Aspen", "Snowmass Village"],
    mountains: ["Snowmass", "Aspen Mountain", "Aspen Highlands", "Buttermilk"],
    // Headline reading from Aspen, the historic base town for three of
    // the four mountains.
    headlineLabel: "Aspen",
    lat: 39.1911,
    lon: -106.8175,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "steamboat",
    name: "Steamboat",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/steamboat/",
    baseTowns: ["Steamboat Springs"],
    mountains: ["Steamboat Resort"],
    headlineLabel: "Steamboat Springs",
    lat: 40.4850,
    lon: -106.8317,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "winter-park",
    name: "Winter Park",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/winter-park/",
    baseTowns: ["Winter Park"],
    mountains: ["Winter Park Resort"],
    headlineLabel: "Winter Park",
    lat: 39.8867,
    lon: -105.7631,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "crested-butte",
    name: "Crested Butte",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/crested-butte/",
    baseTowns: ["Crested Butte"],
    mountains: ["Crested Butte Mountain Resort"],
    headlineLabel: "Crested Butte",
    lat: 38.8697,
    lon: -106.9878,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "telluride",
    name: "Telluride",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/telluride/",
    baseTowns: ["Telluride"],
    mountains: ["Telluride Ski Resort"],
    headlineLabel: "Telluride",
    lat: 37.9375,
    lon: -107.8123,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "durango",
    name: "Durango",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/durango/",
    baseTowns: ["Durango"],
    mountains: ["Purgatory Resort"],
    headlineLabel: "Durango",
    lat: 37.2753,
    lon: -107.8801,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "boulder-front-range",
    name: "Boulder / Front Range",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    status: "live",
    href: "/boulder-front-range/",
    baseTowns: ["Nederland"],
    mountains: ["Eldora Mountain Resort"],
    headlineLabel: "Nederland",
    lat: 39.9614,
    lon: -105.5108,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "cottonwood-canyons",
    name: "Cottonwood Canyons",
    country: "United States",
    countryCode: "US",
    region: "Utah",
    status: "live",
    href: "/cottonwood-canyons/",
    baseTowns: ["Salt Lake City", "Sandy"],
    mountains: ["Alta", "Snowbird", "Brighton", "Solitude"],
    // Headline reading from Salt Lake City · the primary gateway for all
    // four Cottonwood Canyon resorts.
    headlineLabel: "Salt Lake City",
    lat: 40.7608,
    lon: -111.8910,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "park-city",
    name: "Park City",
    country: "United States",
    countryCode: "US",
    region: "Utah",
    status: "live",
    href: "/park-city/",
    baseTowns: ["Park City"],
    mountains: ["Park City Mountain", "Deer Valley"],
    headlineLabel: "Park City",
    lat: 40.6461,
    lon: -111.4980,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "ogden-valley",
    name: "Ogden Valley",
    country: "United States",
    countryCode: "US",
    region: "Utah",
    status: "live",
    href: "/ogden-valley/",
    baseTowns: ["Ogden", "Eden"],
    mountains: ["Snowbasin", "Powder Mountain", "Nordic Valley"],
    headlineLabel: "Ogden",
    lat: 41.2230,
    lon: -111.9738,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "provo",
    name: "Provo",
    country: "United States",
    countryCode: "US",
    region: "Utah",
    status: "live",
    href: "/provo/",
    baseTowns: ["Provo", "Sundance"],
    mountains: ["Sundance Mountain Resort"],
    headlineLabel: "Provo",
    lat: 40.2338,
    lon: -111.6585,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "cache-valley",
    name: "Cache Valley",
    country: "United States",
    countryCode: "US",
    region: "Utah",
    status: "live",
    href: "/cache-valley/",
    baseTowns: ["Logan"],
    mountains: ["Beaver Mountain", "Cherry Peak"],
    headlineLabel: "Logan",
    lat: 41.7370,
    lon: -111.8338,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "north-lake-tahoe",
    name: "North Lake Tahoe",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/north-lake-tahoe/",
    baseTowns: ["Truckee"],
    mountains: ["Palisades Tahoe", "Northstar California", "Sugar Bowl"],
    headlineLabel: "Truckee",
    lat: 39.3280,
    lon: -120.1833,
    // First Pacific-timezone (America/Los_Angeles) US region on this
    // branch - Colorado and Utah both use America/Denver.
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "south-lake-tahoe",
    name: "South Lake Tahoe",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/south-lake-tahoe/",
    baseTowns: ["South Lake Tahoe"],
    mountains: ["Heavenly", "Kirkwood", "Sierra-at-Tahoe", "Homewood Mountain Resort"],
    headlineLabel: "South Lake Tahoe",
    lat: 38.9399,
    lon: -119.9772,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mammoth-lakes",
    name: "Mammoth Lakes",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/mammoth-lakes/",
    baseTowns: ["Mammoth Lakes"],
    mountains: ["Mammoth Mountain", "June Mountain"],
    headlineLabel: "Mammoth Lakes",
    lat: 37.6485,
    lon: -118.9721,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "big-bear",
    name: "Big Bear",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/big-bear/",
    baseTowns: ["Big Bear Lake"],
    mountains: ["Bear Mountain", "Snow Summit"],
    headlineLabel: "Big Bear Lake",
    lat: 34.2439,
    lon: -116.9114,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "bear-valley",
    name: "Bear Valley",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/bear-valley/",
    baseTowns: ["Arnold"],
    mountains: ["Bear Valley Mountain Resort"],
    headlineLabel: "Arnold",
    lat: 38.2494,
    lon: -120.3552,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mt-shasta",
    name: "Mt. Shasta",
    country: "United States",
    countryCode: "US",
    region: "California",
    status: "live",
    href: "/mt-shasta/",
    baseTowns: ["Mount Shasta"],
    mountains: ["Mt. Shasta Ski Park"],
    headlineLabel: "Mount Shasta",
    lat: 41.3099,
    lon: -122.3106,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Vermont
  {
    id: "killington-pico",
    name: "Killington/Pico",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/killington-pico/",
    baseTowns: ["Killington"],
    mountains: ["Killington", "Pico Mountain"],
    headlineLabel: "Killington",
    lat: 43.6045,
    lon: -72.8201,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "stowe-smugglers-notch",
    name: "Stowe/Smugglers' Notch",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/stowe-smugglers-notch/",
    baseTowns: ["Stowe", "Jeffersonville"],
    mountains: ["Stowe Mountain Resort", "Smugglers' Notch"],
    headlineLabel: "Stowe",
    lat: 44.4654,
    lon: -72.6874,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mad-river-valley",
    name: "Mad River Valley",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/mad-river-valley/",
    baseTowns: ["Warren", "Waitsfield"],
    mountains: ["Sugarbush", "Mad River Glen"],
    headlineLabel: "Waitsfield",
    lat: 44.1975,
    lon: -72.809,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "southern-vermont",
    name: "Southern Vermont",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/southern-vermont/",
    baseTowns: ["Stratton", "West Dover", "Peru", "Manchester"],
    mountains: ["Stratton", "Mount Snow", "Bromley Mountain", "Magic Mountain"],
    headlineLabel: "Manchester",
    lat: 43.1642,
    lon: -73.0729,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "okemo",
    name: "Okemo",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/okemo/",
    baseTowns: ["Ludlow"],
    mountains: ["Okemo Mountain Resort"],
    headlineLabel: "Ludlow",
    lat: 43.3959,
    lon: -72.7096,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "jay-peak-nek",
    name: "Jay Peak/Northeast Kingdom",
    country: "United States",
    countryCode: "US",
    region: "Vermont",
    status: "live",
    href: "/jay-peak-nek/",
    baseTowns: ["Jay", "East Burke"],
    mountains: ["Jay Peak", "Burke Mountain"],
    headlineLabel: "Jay",
    lat: 44.9417,
    lon: -72.5083,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Wyoming
  {
    id: "jackson-hole",
    name: "Jackson Hole",
    country: "United States",
    countryCode: "US",
    region: "Wyoming",
    status: "live",
    href: "/jackson-hole/",
    baseTowns: ["Jackson", "Teton Village"],
    mountains: ["Jackson Hole Mountain Resort", "Snow King Mountain"],
    headlineLabel: "Jackson",
    lat: 43.4799,
    lon: -110.7624,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "grand-targhee",
    name: "Grand Targhee",
    country: "United States",
    countryCode: "US",
    region: "Wyoming",
    status: "live",
    href: "/grand-targhee/",
    baseTowns: ["Alta"],
    mountains: ["Grand Targhee Resort"],
    headlineLabel: "Alta",
    lat: 43.7897,
    lon: -110.931,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Montana
  {
    id: "big-sky",
    name: "Big Sky",
    country: "United States",
    countryCode: "US",
    region: "Montana",
    status: "live",
    href: "/big-sky/",
    baseTowns: ["Big Sky"],
    mountains: ["Big Sky Resort"],
    headlineLabel: "Big Sky",
    lat: 45.2849,
    lon: -111.3806,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "bozeman-bridger-bowl",
    name: "Bozeman",
    country: "United States",
    countryCode: "US",
    region: "Montana",
    status: "live",
    href: "/bozeman-bridger-bowl/",
    baseTowns: ["Bozeman"],
    mountains: ["Bridger Bowl"],
    headlineLabel: "Bozeman",
    lat: 45.677,
    lon: -111.0429,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "whitefish",
    name: "Whitefish",
    country: "United States",
    countryCode: "US",
    region: "Montana",
    status: "live",
    href: "/whitefish/",
    baseTowns: ["Whitefish"],
    mountains: ["Whitefish Mountain Resort"],
    headlineLabel: "Whitefish",
    lat: 48.4111,
    lon: -114.3376,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "red-lodge",
    name: "Red Lodge",
    country: "United States",
    countryCode: "US",
    region: "Montana",
    status: "live",
    href: "/red-lodge/",
    baseTowns: ["Red Lodge"],
    mountains: ["Red Lodge Mountain"],
    headlineLabel: "Red Lodge",
    lat: 45.1863,
    lon: -109.2468,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // New Mexico
  {
    id: "taos",
    name: "Taos",
    country: "United States",
    countryCode: "US",
    region: "New Mexico",
    status: "live",
    href: "/taos/",
    baseTowns: ["Taos Ski Valley"],
    mountains: ["Taos Ski Valley"],
    headlineLabel: "Taos",
    lat: 36.5946,
    lon: -105.4497,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "angel-fire",
    name: "Angel Fire",
    country: "United States",
    countryCode: "US",
    region: "New Mexico",
    status: "live",
    href: "/angel-fire/",
    baseTowns: ["Angel Fire"],
    mountains: ["Angel Fire Resort"],
    headlineLabel: "Angel Fire",
    lat: 36.3762,
    lon: -105.2894,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "santa-fe",
    name: "Santa Fe",
    country: "United States",
    countryCode: "US",
    region: "New Mexico",
    status: "live",
    href: "/santa-fe/",
    baseTowns: ["Santa Fe"],
    mountains: ["Ski Santa Fe"],
    headlineLabel: "Santa Fe",
    lat: 35.687,
    lon: -105.9378,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "albuquerque-sandia",
    name: "Albuquerque",
    country: "United States",
    countryCode: "US",
    region: "New Mexico",
    status: "live",
    href: "/albuquerque-sandia/",
    baseTowns: ["Albuquerque"],
    mountains: ["Sandia Peak Ski Area"],
    headlineLabel: "Albuquerque",
    lat: 35.0844,
    lon: -106.6504,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Oregon
  {
    id: "mt-hood",
    name: "Mt. Hood",
    country: "United States",
    countryCode: "US",
    region: "Oregon",
    status: "live",
    href: "/mt-hood/",
    baseTowns: ["Government Camp"],
    mountains: ["Mt. Hood Meadows", "Timberline Lodge", "Mt. Hood Skibowl"],
    headlineLabel: "Mt. Hood",
    lat: 45.30222,
    lon: -121.7525,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "bend",
    name: "Bend",
    country: "United States",
    countryCode: "US",
    region: "Oregon",
    status: "live",
    href: "/bend/",
    baseTowns: ["Bend"],
    mountains: ["Mt. Bachelor"],
    headlineLabel: "Bend",
    lat: 44.05806,
    lon: -121.31528,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Washington
  {
    id: "crystal-mountain",
    name: "Crystal Mountain",
    country: "United States",
    countryCode: "US",
    region: "Washington",
    status: "live",
    href: "/crystal-mountain/",
    baseTowns: ["Enumclaw"],
    mountains: ["Crystal Mountain Resort"],
    headlineLabel: "Crystal Mountain",
    lat: 47.20111,
    lon: -121.99694,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "snoqualmie-pass",
    name: "Snoqualmie Pass",
    country: "United States",
    countryCode: "US",
    region: "Washington",
    status: "live",
    href: "/snoqualmie-pass/",
    baseTowns: ["Snoqualmie Pass"],
    mountains: ["The Summit at Snoqualmie"],
    headlineLabel: "Snoqualmie Pass",
    lat: 47.39222,
    lon: -121.4,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "stevens-pass",
    name: "Stevens Pass",
    country: "United States",
    countryCode: "US",
    region: "Washington",
    status: "live",
    href: "/stevens-pass/",
    baseTowns: ["Skykomish"],
    mountains: ["Stevens Pass Ski Area"],
    headlineLabel: "Stevens Pass",
    lat: 47.71028,
    lon: -121.35833,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mt-baker",
    name: "Mt. Baker",
    country: "United States",
    countryCode: "US",
    region: "Washington",
    status: "live",
    href: "/mt-baker/",
    baseTowns: ["Glacier"],
    mountains: ["Mt. Baker Ski Area"],
    headlineLabel: "Mt. Baker",
    lat: 48.88833,
    lon: -121.93389,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Idaho
  {
    id: "sun-valley",
    name: "Sun Valley",
    country: "United States",
    countryCode: "US",
    region: "Idaho",
    status: "live",
    href: "/sun-valley/",
    baseTowns: ["Ketchum"],
    mountains: ["Bald Mountain", "Dollar Mountain"],
    headlineLabel: "Sun Valley",
    lat: 43.68074,
    lon: -114.36366,
    timezone: "America/Boise",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "sandpoint",
    name: "Sandpoint",
    country: "United States",
    countryCode: "US",
    region: "Idaho",
    status: "live",
    href: "/sandpoint/",
    baseTowns: ["Sandpoint"],
    mountains: ["Schweitzer Mountain Resort"],
    headlineLabel: "Sandpoint",
    lat: 48.28222,
    lon: -116.56139,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "boise",
    name: "Boise",
    country: "United States",
    countryCode: "US",
    region: "Idaho",
    status: "live",
    href: "/boise/",
    baseTowns: ["Boise"],
    mountains: ["Bogus Basin"],
    headlineLabel: "Boise",
    lat: 43.61583,
    lon: -116.20167,
    timezone: "America/Boise",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "donnelly-mccall",
    name: "Donnelly / McCall",
    country: "United States",
    countryCode: "US",
    region: "Idaho",
    status: "live",
    href: "/donnelly-mccall/",
    baseTowns: ["Donnelly"],
    mountains: ["Tamarack Resort", "Brundage Mountain"],
    headlineLabel: "Donnelly / McCall",
    lat: 44.73028,
    lon: -116.07444,
    timezone: "America/Boise",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // New Hampshire
  {
    id: "white-mountains",
    name: "White Mountains",
    country: "United States",
    countryCode: "US",
    region: "New Hampshire",
    status: "live",
    href: "/white-mountains/",
    baseTowns: ["North Conway"],
    mountains: ["Cranmore Mountain", "Wildcat Mountain", "Attitash Mountain Resort"],
    headlineLabel: "North Conway",
    lat: 44.0537,
    lon: -71.1289,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "franconia-notch",
    name: "Franconia Notch",
    country: "United States",
    countryCode: "US",
    region: "New Hampshire",
    status: "live",
    href: "/franconia-notch/",
    baseTowns: ["Franconia", "Bretton Woods"],
    mountains: ["Cannon Mountain", "Bretton Woods", "Loon Mountain"],
    headlineLabel: "Franconia",
    lat: 44.227,
    lon: -71.747,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "waterville-valley",
    name: "Waterville Valley",
    country: "United States",
    countryCode: "US",
    region: "New Hampshire",
    status: "live",
    href: "/waterville-valley/",
    baseTowns: ["Waterville Valley"],
    mountains: ["Waterville Valley Resort"],
    headlineLabel: "Waterville Valley",
    lat: 43.95,
    lon: -71.499,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "lakes-region",
    name: "Lakes Region",
    country: "United States",
    countryCode: "US",
    region: "New Hampshire",
    status: "live",
    href: "/lakes-region/",
    baseTowns: ["Gilford"],
    mountains: ["Gunstock Mountain Resort"],
    headlineLabel: "Gilford",
    lat: 43.548,
    lon: -71.406,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Maine
  {
    id: "carrabassett-valley",
    name: "Carrabassett Valley",
    country: "United States",
    countryCode: "US",
    region: "Maine",
    status: "live",
    href: "/carrabassett-valley/",
    baseTowns: ["Carrabassett Valley"],
    mountains: ["Sugarloaf"],
    headlineLabel: "Carrabassett Valley",
    lat: 45.085,
    lon: -70.265,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "newry-bethel",
    name: "Newry / Bethel",
    country: "United States",
    countryCode: "US",
    region: "Maine",
    status: "live",
    href: "/newry-bethel/",
    baseTowns: ["Newry"],
    mountains: ["Sunday River"],
    headlineLabel: "Newry / Bethel",
    lat: 44.499,
    lon: -70.8,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "rangeley",
    name: "Rangeley",
    country: "United States",
    countryCode: "US",
    region: "Maine",
    status: "live",
    href: "/rangeley/",
    baseTowns: ["Rangeley"],
    mountains: ["Saddleback Mountain"],
    headlineLabel: "Rangeley",
    lat: 44.966,
    lon: -70.644,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // New York
  {
    id: "lake-placid",
    name: "Lake Placid",
    country: "United States",
    countryCode: "US",
    region: "New York",
    status: "live",
    href: "/lake-placid/",
    baseTowns: ["Lake Placid", "Wilmington"],
    mountains: ["Whiteface Mountain"],
    headlineLabel: "Lake Placid",
    lat: 44.279,
    lon: -73.979,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "north-creek",
    name: "North Creek",
    country: "United States",
    countryCode: "US",
    region: "New York",
    status: "live",
    href: "/north-creek/",
    baseTowns: ["North Creek"],
    mountains: ["Gore Mountain"],
    headlineLabel: "North Creek",
    lat: 43.697,
    lon: -73.985,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "hunter",
    name: "Hunter",
    country: "United States",
    countryCode: "US",
    region: "New York",
    status: "live",
    href: "/hunter/",
    baseTowns: ["Hunter"],
    mountains: ["Hunter Mountain"],
    headlineLabel: "Hunter",
    lat: 42.214,
    lon: -74.213,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "windham",
    name: "Windham",
    country: "United States",
    countryCode: "US",
    region: "New York",
    status: "live",
    href: "/windham/",
    baseTowns: ["Windham"],
    mountains: ["Windham Mountain Club"],
    headlineLabel: "Windham",
    lat: 42.309,
    lon: -74.251,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "highmount",
    name: "Highmount",
    country: "United States",
    countryCode: "US",
    region: "New York",
    status: "live",
    href: "/highmount/",
    baseTowns: ["Highmount"],
    mountains: ["Belleayre Mountain"],
    headlineLabel: "Highmount",
    lat: 42.147,
    lon: -74.514,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Michigan
  {
    id: "harbor-springs",
    name: "Harbor Springs",
    country: "United States",
    countryCode: "US",
    region: "Michigan",
    status: "live",
    href: "/harbor-springs/",
    baseTowns: ["Harbor Springs"],
    mountains: ["Boyne Mountain", "The Highlands", "Nub's Nob"],
    headlineLabel: "Harbor Springs",
    lat: 45.4317,
    lon: -84.9889,
    timezone: "America/Detroit",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "keweenaw-peninsula",
    name: "Keweenaw Peninsula",
    country: "United States",
    countryCode: "US",
    region: "Michigan",
    status: "live",
    href: "/keweenaw-peninsula/",
    baseTowns: ["Mohawk"],
    mountains: ["Mt. Bohemia"],
    headlineLabel: "Mohawk",
    lat: 47.3308,
    lon: -88.3743,
    timezone: "America/Detroit",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Pennsylvania
  {
    id: "poconos",
    name: "Poconos",
    country: "United States",
    countryCode: "US",
    region: "Pennsylvania",
    status: "live",
    href: "/poconos/",
    baseTowns: ["Tannersville", "Pocono Manor"],
    mountains: ["Camelback Mountain Resort", "Blue Mountain Resort", "Shawnee Mountain Ski Area"],
    headlineLabel: "Tannersville",
    lat: 41.04,
    lon: -75.305,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "laurel-highlands",
    name: "Laurel Highlands",
    country: "United States",
    countryCode: "US",
    region: "Pennsylvania",
    status: "live",
    href: "/laurel-highlands/",
    baseTowns: ["Seven Springs"],
    mountains: ["Seven Springs Mountain Resort", "Blue Knob All Seasons Resort"],
    headlineLabel: "Seven Springs",
    lat: 40.041,
    lon: -79.467,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Massachusetts
  {
    id: "berkshires",
    name: "Berkshires",
    country: "United States",
    countryCode: "US",
    region: "Massachusetts",
    status: "live",
    href: "/berkshires/",
    baseTowns: ["Hancock", "Great Barrington"],
    mountains: ["Jiminy Peak", "Ski Butternut", "Berkshire East"],
    headlineLabel: "Hancock",
    lat: 42.547,
    lon: -73.323,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "central-massachusetts",
    name: "Central Massachusetts",
    country: "United States",
    countryCode: "US",
    region: "Massachusetts",
    status: "live",
    href: "/central-massachusetts/",
    baseTowns: ["Princeton"],
    mountains: ["Wachusett Mountain"],
    headlineLabel: "Princeton",
    lat: 42.473,
    lon: -71.877,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Minnesota
  {
    id: "lutsen-north-shore",
    name: "Lutsen / North Shore",
    country: "United States",
    countryCode: "US",
    region: "Minnesota",
    status: "live",
    href: "/lutsen-north-shore/",
    baseTowns: ["Lutsen"],
    mountains: ["Lutsen Mountains"],
    headlineLabel: "Lutsen",
    lat: 47.643,
    lon: -90.714,
    timezone: "America/Chicago",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Wisconsin
  {
    id: "wausau",
    name: "Wausau",
    country: "United States",
    countryCode: "US",
    region: "Wisconsin",
    status: "live",
    href: "/wausau/",
    baseTowns: ["Wausau"],
    mountains: ["Granite Peak Ski Area"],
    headlineLabel: "Wausau",
    lat: 44.959,
    lon: -89.63,
    timezone: "America/Chicago",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "wisconsin-dells",
    name: "Wisconsin Dells",
    country: "United States",
    countryCode: "US",
    region: "Wisconsin",
    status: "live",
    href: "/wisconsin-dells/",
    baseTowns: ["Portage"],
    mountains: ["Cascade Mountain"],
    headlineLabel: "Portage",
    lat: 43.539,
    lon: -89.462,
    timezone: "America/Chicago",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // New Jersey
  {
    id: "vernon",
    name: "Vernon",
    country: "United States",
    countryCode: "US",
    region: "New Jersey",
    status: "live",
    href: "/vernon/",
    baseTowns: ["Vernon"],
    mountains: ["Mountain Creek Resort"],
    headlineLabel: "Vernon",
    lat: 41.2,
    lon: -74.484,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Connecticut
  {
    id: "litchfield-hills",
    name: "Litchfield Hills",
    country: "United States",
    countryCode: "US",
    region: "Connecticut",
    status: "live",
    href: "/litchfield-hills/",
    baseTowns: ["Cornwall"],
    mountains: ["Mohawk Mountain"],
    headlineLabel: "Cornwall",
    lat: 41.833,
    lon: -73.328,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Alaska
  {
    id: "juneau",
    name: "Juneau",
    country: "United States",
    countryCode: "US",
    region: "Alaska",
    status: "live",
    href: "/juneau/",
    baseTowns: ["Juneau"],
    mountains: ["Eaglecrest Ski Area"],
    headlineLabel: "Juneau",
    lat: 58.302,
    lon: -134.42,
    timezone: "America/Anchorage",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "girdwood",
    name: "Girdwood",
    country: "United States",
    countryCode: "US",
    region: "Alaska",
    status: "live",
    href: "/girdwood/",
    baseTowns: ["Girdwood"],
    mountains: ["Alyeska Resort"],
    headlineLabel: "Girdwood",
    lat: 60.942,
    lon: -149.166,
    timezone: "America/Anchorage",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // South Dakota
  {
    id: "black-hills",
    name: "Black Hills",
    country: "United States",
    countryCode: "US",
    region: "South Dakota",
    status: "live",
    href: "/black-hills/",
    baseTowns: ["Lead / Deadwood"],
    mountains: ["Terry Peak"],
    headlineLabel: "Lead / Deadwood",
    lat: 44.352,
    lon: -103.765,
    timezone: "America/Denver",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Arizona
  {
    id: "white-mountains-az",
    name: "White Mountains",
    country: "United States",
    countryCode: "US",
    region: "Arizona",
    status: "live",
    href: "/white-mountains-az/",
    baseTowns: ["Greer"],
    mountains: ["Sunrise Park Resort"],
    headlineLabel: "Greer",
    lat: 34.01,
    lon: -109.458,
    timezone: "America/Phoenix",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "flagstaff",
    name: "Flagstaff",
    country: "United States",
    countryCode: "US",
    region: "Arizona",
    status: "live",
    href: "/flagstaff/",
    baseTowns: ["Flagstaff"],
    mountains: ["Arizona Snowbowl"],
    headlineLabel: "Flagstaff",
    lat: 35.198,
    lon: -111.651,
    timezone: "America/Phoenix",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Nevada
  {
    id: "lake-tahoe-nevada",
    name: "Lake Tahoe Nevada",
    country: "United States",
    countryCode: "US",
    region: "Nevada",
    status: "live",
    href: "/lake-tahoe-nevada/",
    baseTowns: ["Incline Village"],
    mountains: ["Mt. Rose Ski Tahoe", "Diamond Peak"],
    headlineLabel: "Incline Village",
    lat: 39.251,
    lon: -119.952,
    timezone: "America/Los_Angeles",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // Virginia
  {
    id: "shenandoah-valley",
    name: "Shenandoah Valley",
    country: "United States",
    countryCode: "US",
    region: "Virginia",
    status: "live",
    href: "/shenandoah-valley/",
    baseTowns: ["McGaheysville"],
    mountains: ["Massanutten Resort"],
    headlineLabel: "McGaheysville",
    lat: 38.372,
    lon: -78.73,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "blue-ridge",
    name: "Blue Ridge",
    country: "United States",
    countryCode: "US",
    region: "Virginia",
    status: "live",
    href: "/blue-ridge/",
    baseTowns: ["Wintergreen"],
    mountains: ["Wintergreen Resort"],
    headlineLabel: "Wintergreen",
    lat: 37.913,
    lon: -78.945,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // North Carolina
  {
    id: "maggie-valley",
    name: "Maggie Valley",
    country: "United States",
    countryCode: "US",
    region: "North Carolina",
    status: "live",
    href: "/maggie-valley/",
    baseTowns: ["Maggie Valley"],
    mountains: ["Cataloochee Ski Area"],
    headlineLabel: "Maggie Valley",
    lat: 35.519,
    lon: -83.084,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "high-country",
    name: "High Country",
    country: "United States",
    countryCode: "US",
    region: "North Carolina",
    status: "live",
    href: "/high-country/",
    baseTowns: ["Banner Elk / Beech Mountain"],
    mountains: ["Sugar Mountain", "Beech Mountain Resort"],
    headlineLabel: "Banner Elk / Beech Mountain",
    lat: 36.166,
    lon: -81.872,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  // West Virginia
  {
    id: "canaan-valley",
    name: "Canaan Valley",
    country: "United States",
    countryCode: "US",
    region: "West Virginia",
    status: "live",
    href: "/canaan-valley/",
    baseTowns: ["Davis / Canaan Valley"],
    mountains: ["Canaan Valley Resort", "Timberline Mountain"],
    headlineLabel: "Davis / Canaan Valley",
    lat: 39.105,
    lon: -79.468,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "snowshoe",
    name: "Snowshoe",
    country: "United States",
    countryCode: "US",
    region: "West Virginia",
    status: "live",
    href: "/snowshoe/",
    baseTowns: ["Snowshoe"],
    mountains: ["Snowshoe Mountain"],
    headlineLabel: "Snowshoe",
    lat: 38.41,
    lon: -79.995,
    timezone: "America/New_York",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
];

/**
 * Published catalogue regions that do not yet have a hand-curated regional
 * headline. These are metadata-only by design: no coordinates means
 * /api/regions never fan-outs to Open-Meteo once per catalogue record.
 */
const CATALOGUE_REGIONS: RegionConfig[] = travelRegions
  .filter((region) => !REGIONS.some((existing) => existing.id === region.travelRegionId))
  .map((region) => ({
    id: region.travelRegionId,
    name: region.name,
    country: "Japan",
    countryCode: "JP",
    region: region.prefectures.join(", "),
    status: "live",
    href: `/${region.travelRegionId}/`,
    baseTowns: region.baseTowns.map((town) => town.name),
    mountains: publishedCatalogueRecords
      .filter((record) => record.travelRegionId === region.travelRegionId)
      .map((record) => record.name),
    headlineLabel: region.name,
    sourceLabel: "Published Japan ski catalogue",
  }));

const GENERIC_CATALOGUE_REGIONS: RegionConfig[] = publishedSkiCatalogueRegions
  .filter((region) =>
    !REGIONS.some((existing) => existing.id === region.regionId) &&
    !CATALOGUE_REGIONS.some((existing) => existing.id === region.regionId),
  )
  .map((region) => {
    const records = publishedSkiCatalogueRecords.filter((record) => record.regionId === region.regionId);
    return {
      id: region.regionId,
      name: region.name,
      country: region.country,
      countryCode: region.countryCode as RegionConfig["countryCode"],
      region: region.stateOrProvince,
      status: "live",
      href: `/${region.regionId}/`,
      baseTowns: region.localities.map((locality) => locality.name),
      mountains: records.map((record) => record.name),
      headlineLabel: region.name,
      sourceLabel: "Published ski catalogue",
    };
  });

const BASE_REGIONS: readonly RegionConfig[] = [...REGIONS, ...CATALOGUE_REGIONS];
const ALL_REGIONS: readonly RegionConfig[] = [
  ...BASE_REGIONS.map((region) => {
    const additions = publishedSkiCatalogueRecords
      .filter((record) => record.regionId === region.id)
      .map((record) => record.name)
      .filter((name) => !region.mountains.includes(name));
    return additions.length ? { ...region, mountains: [...region.mountains, ...additions] } : region;
  }),
  ...GENERIC_CATALOGUE_REGIONS,
];

/** Published JP travel-region metadata, keyed by the catalogue's shared id. */
export const CATALOGUE_REGION_METADATA = new Map(
  travelRegions.map((region) => [region.travelRegionId, {
    ...region,
    country: "Japan" as const,
    countryCode: "JP" as const,
  }] as const),
);

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
};

function describe(code: number | undefined): string {
  if (code == null) return "-";
  return WEATHER_DESCRIPTIONS[code] ?? "-";
}

function compass(deg: number | undefined): string {
  if (deg == null || Number.isNaN(deg)) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

interface HeadlineReading {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  snowfallMmNext24h: number;
  observedAt: string;
  source: string;
  forecast: Array<{
    date: string;
    maxC: number;
    minC: number;
    weatherCode: number | null;
    description: string;
    precipMm: number;
    snowfallMm: number;
  }>;
}

interface RegionPayload extends Omit<RegionConfig, "lat" | "lon" | "elevation" | "model" | "timezone" | "sourceLabel"> {
  elevation?: number;
  sourceLabel?: string;
  headline: HeadlineReading | null;
}

// ── Cache + dogpile protection ────────────────────────────────────────────
// freshUntil: serve straight from cache, no upstream call
// staleUntil: serve cached data immediately AND kick off a background refresh
// past staleUntil: must wait for fresh data (or return null on failure)
interface CacheEntry { data: HeadlineReading; freshUntil: number; staleUntil: number }
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<HeadlineReading | null>>();
const FRESH_MS = 5 * 60 * 1000;          // serve straight from cache for 5 min
const STALE_MS = 6 * 60 * 60 * 1000;     // keep stale entries usable for 6 hours

let cacheStats = { hits: 0, staleServed: 0, upstreamCalls: 0, upstreamFails: 0, coalesced: 0 };
export function getCacheStats() { return { ...cacheStats, entries: cache.size, inFlight: inFlight.size }; }

async function fetchHeadline(r: RegionConfig): Promise<HeadlineReading | null> {
  if (r.status === "soon" || !r.lat || !r.lon) return null;

  const cacheKey = r.id;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  // Fresh hit - fastest path
  if (cached && cached.freshUntil > now) {
    cacheStats.hits++;
    return cached.data;
  }

  // Coalesce: if a refresh is already in flight for this key, ride it
  const existing = inFlight.get(cacheKey);
  if (existing) {
    cacheStats.coalesced++;
    // If we have stale data, serve it immediately rather than waiting
    if (cached && cached.staleUntil > now) {
      cacheStats.staleServed++;
      return cached.data;
    }
    return existing;
  }

  // Kick off the refresh
  const refresh = fetchHeadlineUpstream(r)
    .then((fresh) => {
      if (fresh) {
        cache.set(cacheKey, {
          data: fresh,
          freshUntil: Date.now() + FRESH_MS,
          staleUntil: Date.now() + STALE_MS,
        });
        cacheStats.upstreamCalls++;
        return fresh;
      }
      // Upstream gave us nothing usable
      cacheStats.upstreamFails++;
      return cached?.data ?? null;
    })
    .catch((err) => {
      cacheStats.upstreamFails++;
      console.warn(`[regions] headline fetch failed for ${r.id}:`, err);
      return cached?.data ?? null; // serve stale on error if we have any
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, refresh);

  // Stale-while-revalidate: serve cached data immediately, refresh runs in background
  if (cached && cached.staleUntil > now) {
    cacheStats.staleServed++;
    return cached.data;
  }

  // No cache at all - must wait for fresh
  return refresh;
}

async function fetchHeadlineUpstream(r: RegionConfig): Promise<HeadlineReading | null> {
  const params = new URLSearchParams({
    latitude: String(r.lat),
    longitude: String(r.lon),
    elevation: String(r.elevation ?? ""),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,snowfall",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,weather_code",
    hourly: "snowfall",
    forecast_days: "7",
    forecast_hours: "24",
    timezone: r.timezone ?? "auto",
    ...(r.model ? { models: r.model } : {}),
  });

  try {
    // Open-Meteo asks all integrators to identify themselves so they can reach
    // out about quota / abuse before throttling. They're CC-BY 4.0; commercial
    // use needs their commercial tier - see replit.md "External Dependencies".
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "feelzlike/1.0 (mountain-weather-pwa; contact: info@feelzlike.com)",
      },
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const d: any = await res.json();
    const cur = d.current ?? {};
    const daily = d.daily ?? {};
    const hourly = d.hourly ?? {};

    // ── Open-Meteo returns naive local time + utc_offset_seconds; build proper ISO UTC
    const utcOffsetSec = Number.isFinite(d.utc_offset_seconds) ? Number(d.utc_offset_seconds) : 0;
    const toIsoUtc = (localStr: string | undefined): string => {
      if (!localStr) return new Date().toISOString();
      const epochAsIfUtc = new Date(`${localStr}Z`).getTime();
      if (Number.isNaN(epochAsIfUtc)) return new Date().toISOString();
      return new Date(epochAsIfUtc - utcOffsetSec * 1000).toISOString();
    };

    // Open-Meteo snowfall default unit is cm - *10 converts to mm
    const snowfallCm24 = Array.isArray(hourly.snowfall)
      ? hourly.snowfall.slice(0, 24).reduce((a: number, b: number) => a + (Number.isFinite(b) ? Number(b) : 0), 0)
      : 0;
    const snowfallMm24 = Math.round(snowfallCm24 * 10 * 10) / 10;

    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m);

    if (tempC == null) {
      console.warn(`[regions] ${r.id}: upstream returned no temperature, skipping cache`);
      return null;
    }

    const headline: HeadlineReading = {
      locationName: r.headlineLabel,
      tempC,
      feelsLikeC: feelsLikeC ?? tempC,
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      snowfallMmNext24h: snowfallMm24,
      observedAt: toIsoUtc(cur.time),
      source: r.sourceLabel ?? "Open-Meteo",
      forecast: (daily.time ?? []).slice(0, 6).map((date: string, i: number) => {
        const max = numOrNull(daily.temperature_2m_max?.[i]);
        const min = numOrNull(daily.temperature_2m_min?.[i]);
        return {
          date,
          maxC: max != null ? Math.round(max) : 0,
          minC: min != null ? Math.round(min) : 0,
          weatherCode: numOrNull(daily.weather_code?.[i]),
          description: describe(daily.weather_code?.[i]),
          precipMm: Math.round((Number.isFinite(daily.precipitation_sum?.[i]) ? Number(daily.precipitation_sum[i]) : 0) * 10) / 10,
          snowfallMm: Math.round((Number.isFinite(daily.snowfall_sum?.[i]) ? Number(daily.snowfall_sum[i]) : 0) * 10 * 10) / 10,
        };
      }),
    };

    // JMA AMeDAS reconciliation: correct a "clear" headline when a nearby
    // Japanese station is actually reporting rain/snow at this moment.
    if (r.countryCode === "JP" && r.lat != null && r.lon != null) {
      const override = await reconcileDryToWet({
        lat: r.lat,
        lon: r.lon,
        modelWeatherCode: headline.weatherCode,
        tempC: headline.tempC,
        refElevationM: numOrNull(d.elevation) ?? r.elevation ?? null,
      });
      if (override) {
        headline.weatherCode = override.weatherCode;
        headline.description = describe(override.weatherCode);
        headline.source = `JMA AMeDAS \u00b7 ${override.stationName}`;
        headline.observedAt = override.observedAt;
      }
    }

    // NZ airport-METAR reconciliation: same idea for New Zealand, where the only
    // free real-time surface-obs signal is airport METAR. Only fires when a town
    // is genuinely co-located with an airport (Queenstown -> NZQN, Wanaka -> NZWF).
    if (r.countryCode === "NZ" && r.lat != null && r.lon != null) {
      const override = await reconcileNzMetarDryToWet({
        lat: r.lat,
        lon: r.lon,
        modelWeatherCode: headline.weatherCode,
        tempC: headline.tempC,
        refElevationM: numOrNull(d.elevation) ?? r.elevation ?? null,
      });
      if (override) {
        headline.weatherCode = override.weatherCode;
        headline.description = describe(override.weatherCode);
        headline.source = `METAR \u00b7 ${override.stationName}`;
        headline.observedAt = override.observedAt;
      }
    }

    return headline;
  } catch (err) {
    console.warn(`[regions] upstream fetch failed for ${r.id}:`, err);
    throw err; // let the caller fall back to stale cache
  }
}

router.get("/regions", async (_req, res) => {
  try {
    const headlines = await Promise.all(
      ALL_REGIONS.map((r) => fetchHeadline(r).catch(() => null)),
    );
    const regions: RegionPayload[] = ALL_REGIONS.map((r, i) => {
      const { lat, lon, model, timezone, ...rest } = r;
      void lat; void lon; void model; void timezone;
      return { ...rest, headline: headlines[i] };
    });
    // Edge cache: serve fresh for 5 min, allow stale for 1h while revalidating.
    // CDNs/proxies will absorb load; our server-side cache also coalesces.
    res.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    );
    res.json({
      regions,
      generatedAt: new Date().toISOString(),
      sourceCount: 7,
      refreshIntervalMin: 15,
    });
  } catch (err) {
    // Log full error server-side (Sentry catches it via the express handler)
    // but only surface a generic message to the client. Echoing String(err)
    // can leak upstream URLs, stack snippets, or library internals.
    console.error("[regions] error:", err);
    res.status(500).json({ error: "REGIONS_FETCH_ERROR" });
  }
});

// Internal cache stats endpoint - useful for monitoring + debugging
router.get("/regions/_stats", (_req, res) => {
  res.json({
    cache: getCacheStats(),
    fresh_ms: FRESH_MS,
    stale_ms: STALE_MS,
    regions: ALL_REGIONS.map((r) => ({ id: r.id, status: r.status })),
  });
});

// ── Local weather (arbitrary coords) + nearest region ─────────────────────
// Powers the location-first landing: given the visitor's GPS coordinates we
// return (a) their current local conditions and (b) the nearest live mountain
// region. Open-Meteo is the source for arbitrary coords - this is a plain
// "where you are" reading (auto timezone, no elevation/model correction), not
// a peak forecast. Results are cached by coarse (2dp ≈ 1.1km) coordinates so a
// burst of nearby visitors stays a good citizen of Open-Meteo's shared quota.
interface LocalCurrent {
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  isDay: boolean;
  todayMaxC: number | null;
  todayMinC: number | null;
  // How heavy it's coming down right now. precipMm is total precipitation
  // (mm) over the preceding hour; snowfallCm is fresh snow (cm) over the same
  // window. Null when the upstream source doesn't report it.
  precipMm: number | null;
  snowfallCm: number | null;
  observedAt: string;
  source: string;
}

// Unlike the 6-key regions cache, this is keyed by an unbounded set of visitor
// coordinates, so it must be bounded - the LRU caps memory and Open-Meteo quota
// burn. Fresh for 10min; stale-but-servable for 6h so an upstream blip still
// returns last-known local conditions.
const localCache = new LruTtlCache<LocalCurrent>({
  maxEntries: 5000,
  freshMs: 10 * 60 * 1000,
  staleMs: 6 * 60 * 60 * 1000,
});

// Reverse-geocoded place labels change far more slowly than weather, so they
// get their own longer-lived bounded cache. Best-effort: a miss or failure just
// means the client falls back to a neutral "where you are now" label.
const placeNameCache = new LruTtlCache<string>({
  maxEntries: 5000,
  freshMs: 24 * 60 * 60 * 1000,
  staleMs: 24 * 60 * 60 * 1000,
});

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function findNearestRegion(
  lat: number,
  lon: number,
): { r: RegionConfig; distanceKm: number } | null {
  let best: { r: RegionConfig; distanceKm: number } | null = null;
  for (const r of ALL_REGIONS) {
    if (r.status !== "live" || r.lat == null || r.lon == null) continue;
    const distanceKm = haversineKm(lat, lon, r.lat, r.lon);
    if (!best || distanceKm < best.distanceKm) best = { r, distanceKm };
  }
  return best;
}

// Reconcile a model-derived current reading against real JMA AMeDAS surface
// observations. When the model claims dry but a nearby Japanese station is
// actually wet, swap in the observed condition (and credit the station) so the
// headline never says "clear" while it rains. No-op outside Japan / when the
// model already shows precipitation. Best-effort: any failure returns as-is.
async function applyObservedOverride(
  current: LocalCurrent,
  lat: number,
  lon: number,
  refElevationM: number | null,
): Promise<LocalCurrent> {
  const override = await reconcileDryToWet({
    lat,
    lon,
    modelWeatherCode: current.weatherCode,
    tempC: current.tempC,
    refElevationM,
  });
  if (override) {
    return {
      ...current,
      weatherCode: override.weatherCode,
      description: describe(override.weatherCode),
      source: `JMA AMeDAS \u00b7 ${override.stationName}`,
      observedAt: override.observedAt,
    };
  }

  // New Zealand: correct a dry headline against a co-located airport METAR.
  const nzOverride = await reconcileNzMetarDryToWet({
    lat,
    lon,
    modelWeatherCode: current.weatherCode,
    tempC: current.tempC,
    refElevationM,
  });
  if (nzOverride) {
    return {
      ...current,
      weatherCode: nzOverride.weatherCode,
      description: describe(nzOverride.weatherCode),
      source: `METAR \u00b7 ${nzOverride.stationName}`,
      observedAt: nzOverride.observedAt,
    };
  }

  return current;
}

async function fetchLocalCurrentFromOpenMeteo(
  lat: number,
  lon: number,
): Promise<LocalCurrent | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,is_day,precipitation,rain,snowfall",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "1",
    timezone: "auto",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "feelzlike/1.0 (mountain-weather-pwa; contact: info@feelzlike.com)",
      },
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const d: any = await res.json();
    const cur = d.current ?? {};
    const utcOffsetSec = Number.isFinite(d.utc_offset_seconds) ? Number(d.utc_offset_seconds) : 0;
    const toIsoUtc = (localStr: string | undefined): string => {
      if (!localStr) return new Date().toISOString();
      const epochAsIfUtc = new Date(`${localStr}Z`).getTime();
      if (Number.isNaN(epochAsIfUtc)) return new Date().toISOString();
      return new Date(epochAsIfUtc - utcOffsetSec * 1000).toISOString();
    };
    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    if (tempC == null) return null;
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m);
    const daily = d.daily ?? {};
    const todayMaxRaw = numOrNull(Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null);
    const todayMinRaw = numOrNull(Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null);
    const base: LocalCurrent = {
      tempC: Math.round(tempC),
      feelsLikeC: feelsLikeC != null ? Math.round(feelsLikeC) : Math.round(tempC),
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      isDay: cur.is_day === 1,
      todayMaxC: todayMaxRaw != null ? Math.round(todayMaxRaw) : null,
      todayMinC: todayMinRaw != null ? Math.round(todayMinRaw) : null,
      // Open-Meteo: current.precipitation is mm, current.snowfall is cm.
      precipMm: numOrNull(cur.precipitation) != null ? Math.round(Number(cur.precipitation) * 10) / 10 : null,
      snowfallCm: numOrNull(cur.snowfall) != null ? Math.round(Number(cur.snowfall) * 10) / 10 : null,
      observedAt: toIsoUtc(cur.time),
      source: "Open-Meteo",
    };
    // Open-Meteo returns the grid-cell elevation; use it to prefer same-altitude
    // stations when reconciling against observations.
    return applyObservedOverride(base, lat, lon, numOrNull(d.elevation));
  } catch (err) {
    console.warn("[local-weather] upstream fetch failed:", err);
    return null;
  }
}

// OpenWeatherMap fallback for current conditions. Open-Meteo throttles the
// Replit egress IP for sustained periods, and a cold visitor's unique coords
// have no warm cache to serve from, so the cheap local-current request must
// have the same fallback the town pages already use. Reuses the shared
// reshaper (Open-Meteo object shape) and pulls just the current + today's
// range out of it.
async function fetchLocalCurrentFromOwm(
  lat: number,
  lon: number,
): Promise<LocalCurrent | null> {
  try {
    const om = await fetchOpenWeatherMapAsOpenMeteo({ latitude: lat, longitude: lon });
    if (!om) return null;
    const cur = om.current ?? {};
    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    if (tempC == null) return null;
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m); // already km/h from the reshaper
    const daily = om.daily ?? {};
    const todayMaxRaw = numOrNull(Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null);
    const todayMinRaw = numOrNull(Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null);
    const base: LocalCurrent = {
      tempC: Math.round(tempC),
      feelsLikeC: feelsLikeC != null ? Math.round(feelsLikeC) : Math.round(tempC),
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      isDay: cur.is_day === 1,
      todayMaxC: todayMaxRaw != null ? Math.round(todayMaxRaw) : null,
      todayMinC: todayMinRaw != null ? Math.round(todayMinRaw) : null,
      // OWM reshaper exposes current.precipitation (mm liquid-equivalent);
      // it has no separate snow-cm field, so snowfallCm stays null on this path.
      precipMm: numOrNull(cur.precipitation) != null ? Math.round(Number(cur.precipitation) * 10) / 10 : null,
      snowfallCm: numOrNull(cur.snowfall) != null ? Math.round(Number(cur.snowfall) * 10) / 10 : null,
      observedAt: new Date().toISOString(),
      source: "OpenWeatherMap",
    };
    // No grid elevation on the OWM path; reconcile by distance alone.
    return applyObservedOverride(base, lat, lon, null);
  } catch (err) {
    console.warn("[local-weather] OWM fallback failed:", err);
    return null;
  }
}

// Resolve current conditions for arbitrary visitor coords, Open-Meteo first
// with an OpenWeatherMap fallback. Never let a single degraded upstream leave
// the visitor with "local conditions unavailable" when the other source works.
async function fetchLocalCurrent(lat: number, lon: number): Promise<LocalCurrent | null> {
  const direct = await fetchLocalCurrentFromOpenMeteo(lat, lon);
  if (direct) return direct;
  return fetchLocalCurrentFromOwm(lat, lon);
}

// Friendly locality label for arbitrary coords. Builds "Locality, Subdivision"
// (e.g. "Woolloomooloo, New South Wales"), best-effort: any failure returns null
// and the client falls back to a neutral label.
//
// Three sources, tried in order of suburb-accuracy then reliability
// (see fetchPlaceName):
//   - Google Geocoding API (keyed by GOOGLE_PLACES_API_KEY) is the primary: a
//     server-appropriate, reliable source that resolves the actual suburb
//     ("Woolloomooloo") from its locality/sublocality components. Billable, but
//     labels are cached per ~1.1km cell for 24h (placeNameCache) so real call
//     volume - and cost - stays tiny.
//   - BigDataCloud's keyless "reverse-geocode-client" is a free suburb-level
//     backup, used only when Google is unavailable. It is a browser-intended
//     geocoder that can get rate-limited when hammered from a single server IP,
//     so we never depend on it alone.
//   - OpenWeatherMap's keyed reverse-geocoder is the dependable floor: it only
//     resolves to town/city ("Sydney"), never the suburb, but it always answers,
//     so the label degrades to the city rather than vanishing.
async function fetchPlaceNameFromOwm(
  lat: number,
  lon: number,
): Promise<string | null> {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const arr: unknown = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const d = arr[0] as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const locality = str(d.name);
    const region = str(d.state);
    const parts = [locality, region].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return locality || null;
  } catch (err) {
    console.warn("[local-weather] OWM reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceNameFromBigDataCloud(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const d: any = await res.json();
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    // Prefer the suburb (`locality`, e.g. "Woolloomooloo") over the broader
    // `city` ("Sydney") - the finer label is the whole point of this source. In
    // rural areas `locality` is the town (e.g. "Jindabyne") while `city` is the
    // wider LGA ("Snowy Monaro"), so suburb-first is the better label there too.
    // Fall through to null (not the country) so the chain can prefer OWM's town
    // label over a useless "Australia".
    const locality = str(d.locality) || str(d.city);
    const region = str(d.principalSubdivision);
    const parts = [locality, region].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return null;
  } catch (err) {
    console.warn("[local-weather] BigDataCloud reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceNameFromGoogle(
  lat: number,
  lon: number,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=en&key=${apiKey}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.status !== "OK" || !Array.isArray(data.results)) return null;
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    // Pick the best populated-place label across all results. `locality` is the
    // right unit in BOTH markets: in Australia the suburb is the locality
    // ("Woolloomooloo", "Surry Hills"; the CBD correctly reads "Sydney"), and in
    // Japan the locality is the recognisable town/village ("Hakuba", "Niseko",
    // "Yamanouchi"). Google's JP `sublocality` is a hyper-local district ("Hokujo",
    // "Fujimi") that nobody recognises, so locality MUST rank above sublocality.
    // The finer types are only fallbacks for the rare point with no locality.
    const SUBURB_TYPES = [
      "locality",
      "postal_town",
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
    ];
    let suburb = "";
    let suburbRank = SUBURB_TYPES.length;
    let region = "";
    for (const result of data.results) {
      for (const comp of result?.address_components ?? []) {
        const types: string[] = Array.isArray(comp?.types) ? comp.types : [];
        if (!region && types.includes("administrative_area_level_1")) {
          region = str(comp.long_name);
        }
        for (let i = 0; i < suburbRank; i++) {
          if (types.includes(SUBURB_TYPES[i])) {
            suburb = str(comp.long_name);
            suburbRank = i;
            break;
          }
        }
      }
    }
    if (!suburb) return null;
    const parts = [suburb, region].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  } catch (err) {
    console.warn("[local-weather] Google reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceName(lat: number, lon: number): Promise<string | null> {
  // Google is the reliable suburb-level primary, so try it first and return its
  // label when it answers (the common path - one keyed call, then cached 24h).
  const google = await fetchPlaceNameFromGoogle(lat, lon);
  if (google) return google;
  // Google unavailable (quota/error): fall back to the free suburb source and
  // the dependable town/city floor, resolved in parallel. `bdc ?? cityLevel`
  // still degrades cleanly to "Sydney" rather than no label - never a regression.
  const [bdc, cityLevel] = await Promise.all([
    fetchPlaceNameFromBigDataCloud(lat, lon),
    fetchPlaceNameFromOwm(lat, lon),
  ]);
  return bdc ?? cityLevel;
}

router.get("/local-weather", async (req, res) => {
  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    res.status(400).json({ error: "INVALID_COORDINATES" });
    return;
  }

  try {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cachedWeather = localCache.get(key);
    const cachedName = placeNameCache.get(key);

    // Resolve current conditions and the friendly place label together
    // (cache-first, both best-effort) so a cold cache costs a single round-trip
    // rather than two sequential ones.
    const [current, placeName] = await Promise.all([
      (async (): Promise<LocalCurrent | null> => {
        if (cachedWeather?.fresh) return cachedWeather.value;
        const fresh = await fetchLocalCurrent(lat, lon);
        if (fresh) {
          localCache.set(key, fresh);
          return fresh;
        }
        return cachedWeather?.value ?? null; // serve stale on upstream failure
      })(),
      (async (): Promise<string | null> => {
        if (cachedName?.fresh) return cachedName.value;
        const fresh = await fetchPlaceName(lat, lon);
        if (fresh) {
          placeNameCache.set(key, fresh);
          return fresh;
        }
        return cachedName?.value ?? null;
      })(),
    ]);

    const nearest = findNearestRegion(lat, lon);
    const nearestRegion = nearest
      ? {
          id: nearest.r.id,
          name: nearest.r.name,
          country: nearest.r.country,
          countryCode: nearest.r.countryCode,
          href: nearest.r.href,
          headlineLabel: nearest.r.headlineLabel,
          distanceKm: Math.round(nearest.distanceKm),
        }
      : null;

    if (!current && !nearestRegion) {
      res.status(502).json({ error: "LOCAL_WEATHER_UNAVAILABLE" });
      return;
    }

    // Per-visitor data keyed on their coordinates - mark private so shared
    // CDNs/proxies never serve one person's location to another.
    res.set("Cache-Control", "private, max-age=300");
    res.json({
      place: { latitude: lat, longitude: lon, name: placeName },
      current,
      nearestRegion,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[local-weather] error:", err);
    res.status(500).json({ error: "LOCAL_WEATHER_ERROR" });
  }
});


// Region ids · used by routes/engagement.ts to whitelist page labels so
// page_view_daily cardinality stays finite (unknown labels collapse to "other").
export const REGION_IDS: ReadonlySet<string> = new Set(ALL_REGIONS.map((r) => r.id));

export default router;
