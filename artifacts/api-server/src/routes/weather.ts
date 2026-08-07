import { Router, type IRouter } from "express";
import { GetWeatherResponse, GetLocationWeatherResponse, GetLocationWeatherParams, GetResortSnowReportParams } from "@workspace/api-zod";
import { getResortSnowReport } from "../lib/resortSnowReports";
import { getEnsembleForecast } from "../lib/ensemble-forecast.js";
import { locationMatchesRegion, parseRegionParam, RegionParamError } from "../lib/regions.js";
import { fetchOpenWeatherMapAsOpenMeteo } from "../lib/openweathermap.js";
import { dailyConditionLabel } from "../lib/dailyConditionLabel.js";
import { reconcileBomCondition } from "../lib/bom-obs.js";
import { reconcileNzMetarDryToWet } from "../lib/metar-nz.js";
import { partitionHourlySnowfallCm, partitionPrecipByBand, hourCountsByDay } from "../lib/openMeteoElevation.js";

const router: IRouter = Router();

interface LocationConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  description: string;
  bomStation: string;
  bomStationId: string;
  bomWmoId: number;
  bomSecondaryWmoId?: number;
  bomSecondaryStation?: string;
  /** BOM observation product id for the station's state: NSW=IDN60801 (default), VIC=IDV60801, TAS=IDT60801. */
  bomProduct?: string;
  /** Open-Meteo timezone, defaults to "Australia/Sydney". JP locations use "Asia/Tokyo", NZ uses "Pacific/Auckland", CA uses America/Vancouver (BC) or America/Edmonton (AB), US uses America/Denver (CO). */
  timezone?: string;
  /** ISO region code; AU=Australia, JP=Japan, NZ=New Zealand, CA=Canada, US=United States. Used for ensemble model selection + forecast horizon. */
  region?: "AU" | "JP" | "NZ" | "CA" | "US";
}

const LOCATIONS: LocationConfig[] = [
  {
    id: "thredbo",
    name: "Thredbo",
    latitude: -36.5054,
    longitude: 148.3089,
    // Forecast at mid-mountain (1737m = midMountainElevation(2037m summit)),
    // NOT the valley-floor village AWS (1365m). Every peer resort's elevation
    // already sits on-mountain (Perisher 1720m, Charlotte's Pass 1837m, the VHC
    // resorts 1805-1862m), so pinning Thredbo to its low village station made it
    // the lone outlier: on a marginal storm the same system fell as rain at
    // 1365m while snowing at the peers' higher query points, so Thredbo alone
    // showed no snow. 1737m matches the exact snowElevationM the clients already
    // request, so daily, headline outlook and ensemble all align at one figure.
    // Live current conditions still come from BOM Village AWS (bomWmoId 95908
    // below), so the "feels like" you feel arriving in the village stays honest;
    // only the model forecast is lifted to the hill, mirroring the existing
    // mid-mountain snow-outlook design.
    elevation: 1737,
    description: "Australia's premier alpine resort village, home to the longest ski runs in the country with a vertical drop of 672m.",
    bomStation: "Thredbo Village AWS",
    bomStationId: "071032",
    bomWmoId: 95908,
    bomSecondaryWmoId: 95909,
    bomSecondaryStation: "Thredbo Top Station AWS"
  },
  {
    id: "perisher",
    name: "Perisher",
    latitude: -36.3717,
    longitude: 148.4086,
    elevation: 1720,
    description: "Australia's largest ski resort spanning four interconnected resort areas: Perisher Valley, Blue Cow, Smiggin Holes, and Guthega.",
    bomStation: "Perisher Valley AWS",
    bomStationId: "071075",
    bomWmoId: 94915
  },
  {
    id: "charlottes-pass",
    name: "Charlotte's Pass",
    latitude: -36.4314,
    longitude: 148.3297,
    elevation: 1837,
    description: "Australia's highest ski resort and snowsure destination, accessible only by oversnow transport during winter.",
    // BOM has no AWS at Charlotte's Pass; the nearest (Cabramurra at ~1500m)
    // would understate cold by hundreds of metres of lapse rate. We use
    // elevation-corrected Open-Meteo as the truthful primary source instead.
    bomStation: "Open-Meteo (no BOM station at 1837m)",
    bomStationId: "",
    bomWmoId: 0,
  },
  {
    id: "jindabyne",
    name: "Jindabyne",
    latitude: -36.4174,
    longitude: 148.6217,
    elevation: 918,
    description: "The gateway town to the Snowy Mountains, situated on the shores of Lake Jindabyne. Base for all ski resort access.",
    bomStation: "Cooma Airport AWS",
    bomStationId: "071014",
    bomWmoId: 94921,
    bomSecondaryStation: "Cooma Airport AWS (nearest BOM station)"
  },
  {
    id: "selwyn",
    name: "Selwyn",
    latitude: -35.8383,
    longitude: 148.5267,
    elevation: 1492,
    description: "Family-focused snow resort in northern Kosciuszko National Park, rebuilt in 2022 after the 2020 bushfires. Gentle terrain ideal for first-timers and families.",
    // No BOM AWS at the resort. The nearest (Cabramurra) is ~10km north at
    // slightly lower elevation, which would understate cold by hundreds of
    // metres of lapse rate. Use elevation-corrected Open-Meteo as the
    // truthful primary source instead.
    bomStation: "Open-Meteo (no BOM station at resort)",
    bomStationId: "",
    bomWmoId: 0,
  },

  // ─── Victoria's High Country (VIC, Australia) ────────────
  // 6 mountains + 7 base towns. BOM AWS coverage in the VIC alpine
  // is patchy and the verified station IDs aren't in this file's
  // canonical list yet, so every VHC entry uses Open-Meteo as the
  // truthful primary source (elevation-corrected) - same conservative
  // pattern as Selwyn / Charlotte's Pass. Add BOM stations later when
  // the IDs are verified end-to-end.
  { id: "mt-buller",       name: "Mt Buller",       latitude: -37.1456, longitude: 146.4391, elevation: 1805, description: "VIC's biggest day-tripper resort - full alpine village with chairlift downhill, terrain park and ski school. ~3 hrs from Melbourne.",          bomStation: "Mount Buller AWS", bomStationId: "", bomWmoId: 94894, bomProduct: "IDV60801", timezone: "Australia/Melbourne", region: "AU" },
  { id: "mt-stirling",     name: "Mt Stirling",     latitude: -37.1167, longitude: 146.4500, elevation: 1747, description: "Cross-country and backcountry sister of Buller - shared Mansfield gateway. Tickets at Telephone Box Junction. No chairlifts.",                bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "falls-creek",     name: "Falls Creek",     latitude: -36.8628, longitude: 147.2778, elevation: 1842, description: "Largest alpine ski area in VIC by skiable terrain - self-contained ski-in / ski-out village above Mount Beauty.",                              bomStation: "Falls Creek AWS", bomStationId: "", bomWmoId: 94903, bomProduct: "IDV60801", timezone: "Australia/Melbourne", region: "AU" },
  { id: "mt-hotham",       name: "Mt Hotham",       latitude: -36.9779, longitude: 147.1361, elevation: 1862, description: "Highest VIC resort - the steep one. Hotham Airport for direct fly-in. Dinner Plain alpine village 10 min away.",                              bomStation: "Mount Hotham AWS", bomStationId: "", bomWmoId: 94906, bomProduct: "IDV60801", timezone: "Australia/Melbourne", region: "AU" },
  { id: "lake-mountain",   name: "Lake Mountain",   latitude: -37.5181, longitude: 145.8983, elevation: 1480, description: "Nordic and snow play only - no chairlift downhill. The closest snow to Melbourne (~2 hrs via Marysville).",                                    bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "mt-donna-buang", name: "Mt Donna Buang",   latitude: -37.6961, longitude: 145.6989, elevation: 1250, description: "Free public snow play summit run by Parks Victoria / Yarra Ranges - no resort, no lifts, just toboggans on the day.",                          bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "mansfield",       name: "Mansfield",       latitude: -37.0539, longitude: 146.0894, elevation: 320,  description: "Cattle country gateway town - 50 min drive to Mt Buller and Mt Stirling.",                                                                     bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "bright",          name: "Bright",          latitude: -36.7300, longitude: 146.9617, elevation: 309,  description: "Great Alpine Road hub - gateway to both Falls Creek and Mt Hotham.",                                                                            bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "mount-beauty",    name: "Mount Beauty",    latitude: -36.7327, longitude: 147.1696, elevation: 357,  description: "Closest sealed-road town to Falls Creek - 30 min up the mountain road.",                                                                       bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "harrietville",    name: "Harrietville",    latitude: -36.8868, longitude: 147.0656, elevation: 510,  description: "Last village before Mt Hotham on the Great Alpine Road - chains-fit point in winter.",                                                         bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "dinner-plain",    name: "Dinner Plain",    latitude: -36.9276, longitude: 147.2400, elevation: 1550, description: "Alpine village 10 min from Mt Hotham - ski-in feel without the resort prices.",                                                                bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "marysville",      name: "Marysville",      latitude: -37.5128, longitude: 145.7497, elevation: 320,  description: "Yarra Ranges gateway town - 20 min drive to Lake Mountain.",                                                                                   bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },
  { id: "warburton",       name: "Warburton",       latitude: -37.7553, longitude: 145.6906, elevation: 175,  description: "Yarra Valley town - closest base to Mt Donna Buang.",                                                                                          bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Melbourne", region: "AU" },

  // ─── Tasmania (TAS, Australia) ───────────────────────────
  // 1 mountain (Ben Lomond · the only commercial chairlift) across 3 base
  // towns (on-mountain village + Launceston + Hobart). No BOM AWS at the
  // resort · Open-Meteo elevation-corrected is the primary source.
  { id: "ben-lomond",      name: "Ben Lomond",      latitude: -41.5378, longitude: 147.6736, elevation: 1572, description: "Tasmania's only commercial chairlift operation · Legges Tor summit, weather-dependent and short windows reward locals.",                bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Hobart", region: "AU" },
  { id: "ben-lomond-base", name: "Ben Lomond Base", latitude: -41.5392, longitude: 147.6486, elevation: 1450, description: "On-mountain village at the foot of the lifts · Carr Villa / Creek Inn precinct.",                                                       bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Hobart", region: "AU" },
  { id: "launceston",      name: "Launceston",      latitude: -41.4332, longitude: 147.1442, elevation: 30,   description: "Closest city base for Ben Lomond · ~90 min drive via Jacobs Ladder.",                                                                    bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Hobart", region: "AU" },
  { id: "hobart",          name: "Hobart",          latitude: -42.8821, longitude: 147.3272, elevation: 19,   description: "Tasmania's capital · long day-trips (~3 hrs each way) to Ben Lomond when conditions deliver.",                                           bomStation: "Open-Meteo (no BOM AWS mapped)", bomStationId: "", bomWmoId: 0, timezone: "Australia/Hobart", region: "AU" },

  // ─── Yamanouchi (Nagano, Japan) ──────────────────────────
  // 22 individually-tracked mountains. Shiga Kogen is one Ikon-Pass connected
  // area but the lift authority groups it into 18 sub-resorts; we model each
  // because snow / wind / aspect differ meaningfully across them. Plus 4
  // standalone Kita-Shiga resorts (Ryuoo, X-Jam Takaifuji, Yomase, Komaruyama).
  // All lack BOM stations - Open-Meteo elevation-corrected is the primary source.
  { id: "shiga-sun-valley",          name: "Sun Valley",                latitude: 36.7910, longitude: 138.5030, elevation: 1500, description: "Entry-level base lifts on the Shiga loop road - first sub-resort skiers hit driving up from Yudanaka.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-maruike",             name: "Maruike",                   latitude: 36.7920, longitude: 138.5050, elevation: 1620, description: "Wide intermediate carving terrain - classic Shiga family piste, mid-mountain Central Area.",                                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-hasuike",             name: "Hasuike",                   latitude: 36.7935, longitude: 138.5065, elevation: 1550, description: "Pondside base - gateway to the eastern Shiga lift network and to the Higashidateyama gondola.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-giant",               name: "Giant",                     latitude: 36.7980, longitude: 138.5085, elevation: 1700, description: "Steep Giant slalom course - short pitchy laps off the central road, race-team training venue.",                            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-hoppo-bunadaira",     name: "Hoppo Bunadaira",           latitude: 36.8000, longitude: 138.5060, elevation: 1830, description: "Mid-mountain wide-open cruisers with a sunny aspect - gondola access from Hasuike.",                                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-higashidateyama",     name: "Higashidateyama",           latitude: 36.7965, longitude: 138.5090, elevation: 1994, description: "Central Shiga summit - gondola-served high alpine bowls and the iconic peak-to-base groomer.",                            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-nishidateyama",       name: "Nishidateyama",             latitude: 36.7948, longitude: 138.5075, elevation: 1900, description: "North-facing carving slopes - holds snow latest in the Central Area thanks to shaded aspect.",                            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-terakoya",            name: "Terakoya",                  latitude: 36.8060, longitude: 138.5120, elevation: 2125, description: "Highest central Shiga lift - steep mogul faces and powder pockets above the treeline.",                                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-takamagahara",        name: "Takamagahara",              latitude: 36.8005, longitude: 138.5100, elevation: 2000, description: "Wide intermediate plateau feeding into Terakoya and Ichinose - heart of the Shiga lift connection.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-tannenomori-okojo",   name: "Tannenomori Okojo",         latitude: 36.7980, longitude: 138.5210, elevation: 1800, description: "Tree-lined family zone between Takamagahara and Yakebitaiyama - sheltered from wind on stormy days.",                      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-ichinose-family",     name: "Ichinose Family",           latitude: 36.7972, longitude: 138.5138, elevation: 1850, description: "Central Shiga base - easiest gateway to the connected lift system, broadest beginner-to-intermediate terrain.",            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-ichinose-diamond",    name: "Ichinose Diamond",          latitude: 36.7985, longitude: 138.5150, elevation: 1900, description: "Steep race-spec pitches - the FIS-grade Diamond course, expert-only.",                                                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-ichinose-yamanokami", name: "Ichinose Yama-no-kami",     latitude: 36.7960, longitude: 138.5130, elevation: 1850, description: "Quiet annex of Ichinose - short laps used for warm-ups and ski-school terrain.",                                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-yakebitaiyama",       name: "Yakebitaiyama",             latitude: 36.8195, longitude: 138.5310, elevation: 2009, description: "Highest Prince-run sub-resort - 1998 Olympic GS course, long top-to-bottom groomers above the trees.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-okushiga-kogen",      name: "Okushiga Kogen",            latitude: 36.8380, longitude: 138.5480, elevation: 1960, description: "Quietest, most remote sub-resort of Shiga Kogen - long uncrowded groomers and a powder pocket that lasts.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-kumanoyu",            name: "Kumanoyu",                  latitude: 36.8107, longitude: 138.5248, elevation: 2000, description: "North-facing high alpine - long natural-snow season, shares the road and lift with Yokoteyama / Shibutoge.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-yokoteyama",          name: "Yokoteyama",                latitude: 36.7159, longitude: 138.5450, elevation: 2305, description: "Japan's highest lift-served summit - alpine views to the Northern Alps, exposed and often wind-affected.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shiga-shibutoge",           name: "Shibutoge",                 latitude: 36.7044, longitude: 138.5364, elevation: 2172, description: "Highest skiable pass on Honshu - sea-of-clouds backdrop, road closes November to April.",                                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "ryuoo",                     name: "Ryuoo Ski Park",            latitude: 36.7536, longitude: 138.4197, elevation: 1930, description: "Signature Kita-Shiga gondola-served resort. SORA terrace at 1770m, panoramic views over the Northern Alps.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "xjam-takaifuji",            name: "X-Jam Takaifuji",           latitude: 36.7506, longitude: 138.4767, elevation: 1330, description: "Park-focused Kita-Shiga resort - biggest jib and jump features in north Nagano, family terrain on the lower slopes.",     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "yomase-onsen",              name: "Yomase Onsen",              latitude: 36.7714, longitude: 138.4253, elevation: 1240, description: "Locals' mountain on the Yomase river - night skiing, gentle terrain, onsen finish straight off the slopes.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kita-shiga-komaruyama",     name: "Kita-shiga Komaruyama",     latitude: 36.7820, longitude: 138.4310, elevation: 1100, description: "Smallest Kita-Shiga resort - gentle beginner laps directly under the lifts, popular with school groups.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Nozawa Onsen (Nagano, Japan) ────────────────────────
  { id: "nozawa-onsen",              name: "Nozawa Onsen",              latitude: 36.9290, longitude: 138.4500, elevation: 1650, description: "Mt Kenashi summit · long groomers, tree runs and the Nagasaka Olympic course above the onsen village.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Iiyama (Nagano, Japan) ──────────────────────────────
  // 5 mountains across 4 base towns · Madarao/Tangram lift-linked,
  // Togari standalone, Kijimadaira + Kijima Snow Park share a village.
  { id: "madarao",                   name: "Madarao",                   latitude: 36.9056, longitude: 138.2858, elevation: 1382, description: "Tree-run-famous Madarao · shared 2-mountain pass with Tangram across the ridge.",                                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "tangram",                   name: "Tangram",                   latitude: 36.8917, longitude: 138.2806, elevation: 1148, description: "Niigata-side base of the Madarao massif · family-oriented, lift-linked to Madarao.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "togari-onsen",              name: "Togari Onsen",              latitude: 36.8722, longitude: 138.4014, elevation: 1050, description: "Quiet onsen-side mountain · long beginner-intermediate runs above the village.",                                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kijimadaira",               name: "Kijimadaira · Romance no Kamisama", latitude: 36.8639, longitude: 138.4006, elevation: 1351, description: "Rebranded 2023 from Kita-Shinshu Kijimadaira · wide groomers and family terrain on Mt Kayano.",                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kijima-snow-park",          name: "Kijima Snow Park",          latitude: 36.8556, longitude: 138.4108, elevation:  700, description: "Snow play and toboggan park (Makinoiri Kogen) · sledding, snow tubing, kids' first-time terrain.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Hakuba Valley (Nagano, Japan) ───────────────────────
  // 10 individually-tracked resorts along the Ōito line beneath the
  // Northern Alps · shared HAKUBA VALLEY pass but physically separate ski
  // areas. No BOM stations - Open-Meteo elevation-corrected + JMA is the
  // primary source (region "JP" drives ensemble model + forecast horizon).
  { id: "happo-one",                 name: "Hakuba Happo-One",          latitude: 36.6981, longitude: 137.8597, elevation: 1831, description: "Hakuba's biggest and steepest · 1998 Olympic downhill runs and long Northern Alps views.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-goryu",              name: "Hakuba Goryu",              latitude: 36.7076, longitude: 137.8312, elevation: 1676, description: "Gentle Toomi base to steep Alps Daira up top · one ticket shared with neighbouring Hakuba 47.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-47",                 name: "Hakuba 47",                 latitude: 36.6988, longitude: 137.8256, elevation: 1614, description: "Renowned terrain park and tree runs · lift-linked and one ticket with Hakuba Goryu.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-iwatake",            name: "Hakuba Iwatake",            latitude: 36.6927, longitude: 137.8398, elevation: 1289, description: "Rounded family mountain · home of the Hakuba Mountain Harbor deck, open in the green season too.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "tsugaike-kogen",            name: "Tsugaike Kogen",            latitude: 36.7490, longitude: 137.8662, elevation: 1704, description: "Vast gentle beginner slope at the base · gated Tsugaike backcountry up high.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-norikura",           name: "Hakuba Norikura Onsen",     latitude: 36.7580, longitude: 137.8580, elevation: 1598, description: "Quiet Otari mountain · tree skiing off the Alps 11 lift, linked by ticket to Cortina next door.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-cortina",            name: "Hakuba Cortina",            latitude: 36.7756, longitude: 137.8875, elevation: 1402, description: "Hakuba's powder magnet · deep snow and tree runs under the landmark red hotel.",                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hakuba-sanosaka",           name: "Hakuba Sanosaka",           latitude: 36.6200, longitude: 137.8500, elevation: 1010, description: "Southern gateway by Lake Aoki · gentle family slopes with a lake-view run.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kashimayari",               name: "Kashimayari",               latitude: 36.5930, longitude: 137.8270, elevation: 1550, description: "Sun Alpina family resort in Omachi · broad beginner terrain beneath Mt Kashimayari.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "jiigatake",                 name: "Jiigatake",                 latitude: 36.5686, longitude: 137.8339, elevation: 1205, description: "Gentle south-end learner hill in Omachi · wide easy slopes for first-timers and families.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Myoko (Niigata, Japan) ──────────────────────────────
  // Six separate resorts around Mt Myoko (2,454m) plus Lotte Arai on Mt
  // Okenashi to the north · no shared pass, each its own ski area. One of
  // Japan's deepest-snow pockets. Coordinates are base-area points
  // (OpenStreetMap winter_sports nodes); elevation is each top-lift summit.
  { id: "akakura-onsen",             name: "Akakura Onsen",             latitude: 36.8964, longitude: 138.1674, elevation: 1200, description: "Myoko's liveliest slopes above the historic onsen village · 100% natural snow and nightly night skiing.",   bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "akakura-kanko",             name: "Akakura Kanko",             latitude: 36.8903, longitude: 138.1604, elevation: 1500, description: "Japan's first international mountain resort (1937) · long groomers beneath the Akakura Kanko Hotel.",      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "ikenotaira",                name: "Ikenotaira Alpen Blick",    latitude: 36.8733, longitude: 138.1584, elevation: 1413, description: "Broad, open slopes on Mt Myoko's flank · relaxed cruising above Ikenotaira village and Imori Pond.",        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "myoko-suginohara",          name: "Myoko Suginohara",          latitude: 36.8633, longitude: 138.1357, elevation: 1855, description: "Japan's longest run · 8.5 km top to bottom off the area's highest lifts.",                                 bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "seki-onsen",                name: "Seki Onsen",                latitude: 36.9050, longitude: 138.1569, elevation: 1200, description: "Two lifts and some of Japan's heaviest snowfall · small, steep and ungroomed on the north-east side.",      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "lotte-arai",                name: "Lotte Arai Resort",         latitude: 36.9909, longitude: 138.1816, elevation: 1280, description: "Big-vertical freeride resort on Mt Okenashi · gated powder zones over 951 m of drop.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Niseko (Hokkaido, Japan) ────────────────────────────
  // First Hokkaido region · four interlinked Niseko United resorts on
  // Mt Niseko Annupuri (1,308m) plus independent Moiwa next to Annupuri.
  // Coordinates are base-area points; elevation is each top-lift height
  // (the on-mountain forecast height, not the village).
  { id: "grand-hirafu",              name: "Niseko Grand Hirafu",       latitude: 42.8590, longitude: 140.6900, elevation: 1200, description: "Niseko's biggest resort · night skiing above Hirafu village and peak gates to Annupuri's summit.",          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hanazono",                  name: "Niseko Hanazono",           latitude: 42.8869, longitude: 140.7028, elevation: 1080, description: "Quieter north-east flank linked to Hirafu · powder bowls, tree runs and terrain parks.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "niseko-village",            name: "Niseko Village",            latitude: 42.8365, longitude: 140.6851, elevation: 1170, description: "Gondola from the village base into long fall-line runs · quiet trees between Hirafu and Annupuri.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "annupuri",                  name: "Niseko Annupuri",           latitude: 42.8390, longitude: 140.6570, elevation: 1156, description: "Gentlest of the four united resorts · wide mellow groomers and well-known side-country gates.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "moiwa",                     name: "Niseko Moiwa",              latitude: 42.8318, longitude: 140.6479, elevation: 840,  description: "Small independent hill beside Annupuri · quiet lifts and deep snow away from the united crowds.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Furano (Hokkaido, Japan) ────────────────────────────
  // Second Hokkaido region · Furano Ski Resort is the anchor above
  // Furano town, with Kamui Ski Links (an hour north toward Asahikawa)
  // and Hoshino Resorts Tomamu (50 min south-east) as day-trip
  // siblings. Coordinates are base-area points; elevation is the top
  // of each resort's lift-served terrain.
  { id: "furano-ski-resort",         name: "Furano Ski Resort",         latitude: 43.3350, longitude: 142.3610, elevation: 1074, description: "Prince-run flagship of central Hokkaido · two linked zones with about 950 m of vertical, on the Ikon Pass.",  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kamui-ski-links",           name: "Kamui Ski Links",           latitude: 43.7090, longitude: 142.1920, elevation: 751,  description: "Asahikawa's local powder hill · relaxed tree skiing and quiet gondola laps at day-ticket prices.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "tomamu",                    name: "Hoshino Resorts Tomamu",    latitude: 43.0580, longitude: 142.6210, elevation: 1239, description: "Hotel-tower resort under Mt Tomamu · groomed cruisers, kids' programmes and the winter Ice Village.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Sapporo (Hokkaido, Japan) ───────────────────────────
  // The three ski hills that ring the capital, all day trips from
  // downtown · Sapporo Teine (two zones on Mt Teine), Sapporo Kokusai
  // (deep-snow hill above Jozankei onsen) and Sapporo Bankei (in-city
  // night hill). Coordinates are base-area points; elevation is an
  // on-mountain forecast height (mid-mountain-ish), not the summit.
  { id: "sapporo-teine",             name: "Sapporo Teine",             latitude: 43.0830, longitude: 141.1850, elevation: 820,  description: "City powder hill 40 min from downtown Sapporo · Olympia and Highland zones with sea-of-Japan views from Mt Teine.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "sapporo-kokusai",           name: "Sapporo Kokusai",           latitude: 42.9870, longitude: 141.1350, elevation: 900,  description: "Deep-snow local favourite above Jozankei onsen · wide gondola-served cruisers in one of the city's heaviest snow pockets.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "sapporo-bankei",            name: "Sapporo Bankei",            latitude: 43.0330, longitude: 141.2640, elevation: 360,  description: "In-city night-skiing hill 20 min from Odori · floodlit runs and lessons for a quick evening ski.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Tomamu & Sahoro (Hokkaido, Japan) ──────────────────
  // The two Sekisho Line destination resorts · Hoshino Resorts Tomamu
  // (Mt Tomamu, 1,239m top) and Sahoro Resort (Mt Sahoro, 1,030m top).
  // Coordinates are base-area points; elevation is an on-mountain
  // forecast height (upper-mid mountain), not the summit.
  { id: "tomamu-resort",             name: "Hoshino Resorts Tomamu",    latitude: 43.0580, longitude: 142.6210, elevation: 1000, description: "Hotel-tower resort off Mt Tomamu on the JR Sekisho Line · groomed cruisers, the winter Ice Village and ski-in stays.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "sahoro",                    name: "Sahoro Resort",             latitude: 43.1870, longitude: 142.8040, elevation: 820,  description: "Quiet Tokachi resort on Mt Sahoro above Shintoku · long fall-line cruisers off a single gondola.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Asahikawa (Hokkaido, Japan) ──────────────────
  // Kamui Ski Links (the city's local powder hill, 751m top) and the
  // Asahidake Ropeway (Sugatami station ~1,600m on Hokkaido's highest
  // peak). Coordinates are base-area points; elevation is an
  // on-mountain forecast height, not the summit.
  { id: "kamui",                     name: "Kamui Ski Links",           latitude: 43.7090, longitude: 142.1920, elevation: 600,  description: "Asahikawa's local powder hill 40 min west of the city · relaxed tree-skiing and quiet gondola laps.",          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "asahidake",                 name: "Asahidake",                 latitude: 43.6540, longitude: 142.7970, elevation: 1350, description: "Ropeway-served powder on Hokkaido's highest peak · ungroomed Daisetsuzan terrain above Asahidake Onsen.",        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Rusutsu & Kiroro (Hokkaido, Japan) ──────────────────
  // Third Hokkaido region · the two big independent powder resorts
  // either side of the Niseko range, about 90 min apart by road.
  // Coordinates are base-area points; elevation is the top of each
  // resort's lift-served terrain.
  { id: "rusutsu-resort",            name: "Rusutsu Resort",            latitude: 42.7497, longitude: 140.9033, elevation: 994,  description: "Hokkaido's big all-in-one resort across West Mt, East Mt and Mt Isola · 37 courses, on the Epic Pass.",      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kiroro-resort",             name: "Kiroro",                    latitude: 43.0758, longitude: 140.9822, elevation: 1180, description: "Deep-snow resort between Otaru and Sapporo · about 660 m of vertical in a heavy Hokkaido snowfall pocket.",  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Yuzawa (Niigata, Japan) ─────────────────────────────
  // Snow country classic 70 minutes from Tokyo by shinkansen · GALA,
  // Yuzawa Kogen and Ishiuchi Maruyama linked at the top (Yuzawa Snow
  // Link), Kagura and Naeba linked by the Dragondola, Iwappara
  // independent on Mt Iiji. Elevations are top-lift heights.
  { id: "gala-yuzawa",               name: "GALA Yuzawa",               latitude: 36.9509, longitude: 138.7995, elevation: 1181, description: "Shinkansen straight into the gondola base · linked at the top to Yuzawa Kogen and Ishiuchi Maruyama.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "yuzawa-kogen",              name: "Yuzawa Kogen",              latitude: 36.9388, longitude: 138.7974, elevation: 1000, description: "Ropeway straight off the onsen street · gentle high bowl above town, linked at the top to GALA.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "iwappara",                  name: "Iwappara",                  latitude: 36.9389, longitude: 138.8444, elevation: 985,  description: "Wide open slopes on Mt Iiji east of the valley · a long-standing learner and family favourite.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "ishiuchi-maruyama",         name: "Ishiuchi Maruyama",         latitude: 36.9761, longitude: 138.7947, elevation: 920,  description: "Historic broad hill above Ishiuchi village · big parks and long runs to the valley floor.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "kagura",                    name: "Kagura",                    latitude: 36.8948, longitude: 138.7756, elevation: 1845, description: "Highest terrain and longest season in the area · three linked zones rising from the Mitsumata base.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "naeba",                     name: "Naeba",                     latitude: 36.7917, longitude: 138.7846, elevation: 1789, description: "Big classic resort beneath Mt Takenoko · linked to Kagura by the Dragondola gondola.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Zao Onsen (Yamagata, Japan) ─────────────────────────
  // Yamagata's juhyo classic · one broad resort from the onsen village
  // (~880m) up to Jizo Sancho at 1,661m. Coordinates are the base-area
  // point; elevation is the top of the lift-served terrain.
  { id: "zao-onsen-resort",          name: "Zao Onsen Ski Resort",      latitude: 38.1616, longitude: 140.3952, elevation: 1661, description: "Yamagata's big juhyo classic · about 880 m of vertical from the onsen village to Jizo Sancho, on the Ikon Pass.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Hakkoda & Aomori Spring (Aomori, Japan) ─────────────
  // Two very different mountains either side of Aomori city ·
  // coordinates are base-area points, elevations are lift-served tops.
  { id: "hakkoda",                   name: "Hakkoda",                   latitude: 40.6784, longitude: 140.8453, elevation: 1324, description: "Ropeway big-mountain terrain on Mt Tamoyachi · juhyo snow monsters and long ungroomed descents.",            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "aomori-spring",             name: "Aomori Spring",             latitude: 40.6952, longitude: 140.2833, elevation: 921,  description: "Quiet powder resort on Mt Iwaki's northwest slopes above Ajigasawa · a gondola and about 545 m of vertical.",  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "appi",                      name: "Appi Kogen",                latitude: 40.0028, longitude: 140.9452, elevation: 1305, description: "One of Tohoku's largest resorts · long groomed runs off a 2.8 km gondola to Mt Maemori, on the Ikon Pass from 2025-26.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "shizukuishi-resort",        name: "Shizukuishi",               latitude: 39.6940, longitude: 140.9060, elevation: 1128, description: "Prince-operated hill on Takakura · about 700 m of vertical, host of the 1993 Alpine World Championships.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Bandai (Fukushima, Japan) ───────────────────────────
  // Nekoma Mountain (former Alts Bandai south + Nekoma north, linked by
  // lift) and Grandeco in Urabandai · coordinates are base-area points,
  // elevations are lift-served tops.
  { id: "nekoma-mountain",           name: "Nekoma Mountain",           latitude: 37.5780, longitude: 140.0300, elevation: 1337, description: "The former Alts Bandai and Nekoma linked by lift into one of Japan's largest resorts · 33 courses, on the Ikon Pass.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "grandeco",                  name: "Grandeco",                  latitude: 37.7020, longitude: 140.1350, elevation: 1590, description: "High-base gondola hill in Urabandai at 1,010-1,590 m · dry Aizu powder and one of Tohoku's longest seasons.",          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Daisen (Tottori, Japan) ─────────────────────────────
  // Western Japan's biggest ski hill on Mt Daisen's sea-facing slopes.
  { id: "daisen-white-resort",       name: "Daisen White Resort",       latitude: 35.4000, longitude: 133.5280, elevation: 1121, description: "Western Japan's biggest ski hill on Mt Daisen · four linked areas from 655 to 1,121 m with Japan-Sea views.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Minakami (Gunma, Japan) ─────────────────────────────
  // Tokyo's weekend ski valley · Tenjindaira (Mt.T) ropeway bowl on
  // Tanigawa-dake plus the Kogen and Norn hills. Coordinates are
  // base-area points; elevation is an on-mountain forecast height
  // (mid-mountain-ish), not the summit.
  { id: "tenjindaira",               name: "Tanigawadake Tenjindaira",  latitude: 36.8330, longitude: 138.9470, elevation: 1410, description: "Ropeway snow bowl at 1,319 m on Tanigawa-dake, now Mt.T by Hoshino Resorts · huge snowfalls and famous sidecountry.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "minakami-kogen",            name: "Minakami Kogen",            latitude: 36.8780, longitude: 139.0400, elevation: 1050, description: "Family resort around the ski-in Hotel 200 · gentle wide courses at the quiet top of the valley.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "norn-minakami",             name: "Norn Minakami",             latitude: 36.7430, longitude: 138.9420, elevation: 1020, description: "Day-trip hill 5 min off the Kanetsu expressway · tree-lined courses and Kanto-favourite night skiing.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Kusatsu & Manza (Gunma, Japan) ──────────────────────
  // Two onsen-town hills on the Kusatsu-Shirane volcano · elevations
  // are on-mountain forecast heights (mid-mountain-ish).
  { id: "kusatsu-onsen-resort",      name: "Kusatsu Onsen Ski Resort",  latitude: 36.6280, longitude: 138.5880, elevation: 1420, description: "Historic town hill from 1,245 m to 1,600 m · pulse gondola off the base, the Yubatake baths 10 min down the road.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "manza-onsen-resort",        name: "Manza Onsen Ski Resort",    latitude: 36.6440, longitude: 138.5070, elevation: 1820, description: "High, cold Prince resort from 1,646 m to 1,994 m above the sulphur springs · reliably dry snow.",               bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Hachimantai (Iwate, Japan) ──────────────────────────
  // The two shared-ticket Hachimantai Resort hills north of Mt Iwate ·
  // elevations are on-mountain forecast heights (mid-mountain-ish).
  { id: "hachimantai-panorama",      name: "Hachimantai Panorama",      latitude: 39.9460, longitude: 141.0000, elevation:  750, description: "Gentle family hill behind the Hachimantai Mountain Hotel · wide north-facing courses with Mt Iwate views.",     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },
  { id: "hachimantai-shimokura",     name: "Hachimantai Shimokura",     latitude: 39.9510, longitude: 140.9720, elevation:  930, description: "Powder hill on Mt Shimokura's east slope · wind-sheltered tree lines and very dry 'ultralight' snow.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Asia/Tokyo", region: "JP" },

  // ─── Queenstown (Otago, New Zealand) ─────────────────────
  // Open-Meteo primary + OpenWeatherMap fallback · no national AWS feed
  // wired for NZ, so bom* fields stay blank and there's no obs reconciler.
  { id: "coronet-peak",              name: "Coronet Peak",              latitude: -44.9206, longitude: 168.7361, elevation: 1649, description: "Closest field to Queenstown · early-season snowmaking and night skiing above the Shotover.",                      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "the-remarkables",           name: "The Remarkables",           latitude: -45.0556, longitude: 168.8194, elevation: 1943, description: "Higher, sheltered bowls across the lake · family and park terrain in the Remarkables range.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "queenstown",                name: "Queenstown",                latitude: -45.0312, longitude: 168.6626, elevation:  310, description: "South Island resort hub on Lake Wakatipu · the base town for Coronet Peak and The Remarkables.",               bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },

  // ─── Wanaka (Otago, New Zealand) ─────────────────────────
  { id: "cardrona",                  name: "Cardrona",                  latitude: -44.8741, longitude: 168.9492, elevation: 1860, description: "Wide sunny groomers and NZ's biggest terrain parks on the Crown Range above Wanaka.",                         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "treble-cone",               name: "Treble Cone",               latitude: -44.6311, longitude: 168.8978, elevation: 2088, description: "The steep one · big off-piste and the highest skiable terrain in the Southern Lakes.",                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "wanaka",                    name: "Wanaka",                    latitude: -44.7032, longitude: 169.1321, elevation:  300, description: "Laid-back lakeside base town · gateway to Cardrona and Treble Cone.",                                         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },

  // ─── Mt Hutt (Canterbury, New Zealand) ───────────────────
  { id: "mt-hutt",                   name: "Mt Hutt",                   latitude: -43.4707, longitude: 171.5306, elevation: 2075, description: "Canterbury's high-alpine basin · long season and the closest big field to Christchurch.",                      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "methven",                   name: "Methven",                   latitude: -43.6333, longitude: 171.6500, elevation:  320, description: "Farm-town base at the foot of the Mt Hutt access road · about 35 min up to the lifts.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },

  // ─── Ruapehu (Central Plateau, New Zealand) ──────────────
  { id: "whakapapa",                 name: "Whakapapa",                 latitude: -39.2547, longitude: 175.5619, elevation: 2020, description: "The big one on Mt Ruapehu's northwest face · varied terrain up to Knoll Ridge.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "turoa",                     name: "Turoa",                     latitude: -39.3072, longitude: 175.5286, elevation: 2300, description: "Ruapehu's southwest face above Ohakune · highest lifted terrain in New Zealand.",                           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },
  { id: "ohakune",                   name: "Ohakune",                   latitude: -39.4181, longitude: 175.3956, elevation:  610, description: "Lively Turoa-side base town · the Ohakune Mountain Road climbs ~17 km to the lifts.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "Pacific/Auckland", region: "NZ" },

  // ─── Whistler (British Columbia, Canada) ─────────────────
  // Same posture as NZ: Open-Meteo primary + OpenWeatherMap fallback, no
  // national obs feed reconciled, so every bom* field stays blank.
  { id: "whistler-mountain",         name: "Whistler Mountain",         latitude:  50.0594, longitude: -122.9575, elevation: 2182, description: "Peak-to-creek on the Coast Mountains' western flank · alpine bowls above a long treeline pitch.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "blackcomb-mountain",        name: "Blackcomb Mountain",        latitude:  50.0900, longitude: -122.8620, elevation: 2284, description: "Whistler's higher twin · glacier terrain, 7th Heaven and the Blackcomb Glacier descent.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "whistler",                  name: "Whistler",                  latitude:  50.1163, longitude: -122.9574, elevation:  675, description: "Ski-in village between the two mountains · about 2 hrs from Vancouver on the Sea-to-Sky Highway.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },

  // ─── Powder Highway (BC Interior, Canada) ────────────────
  { id: "revelstoke-mountain-resort", name: "Revelstoke Mountain Resort", latitude: 50.9581, longitude: -118.1633, elevation: 2225, description: "North America's longest lift-served vertical on Mt Mackenzie · deep interior snow above the Columbia.",      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "kicking-horse",             name: "Kicking Horse",             latitude:  51.2977, longitude: -117.0464, elevation: 2450, description: "Champagne-powder chutes and four alpine bowls above Golden · steep, high and dry.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "fernie-alpine",             name: "Fernie Alpine Resort",      latitude:  49.4628, longitude: -115.0872, elevation: 2134, description: "Five alpine bowls in the Lizard Range · one of the biggest snowfall totals in the Canadian Rockies.",      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "whitewater",                name: "Whitewater",                latitude:  49.3830, longitude: -117.1470, elevation: 2044, description: "Independent Kootenay hill above Nelson · minimal grooming, big natural snowfall, ski-touring gates.",     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "kimberley-alpine",          name: "Kimberley Alpine Resort",   latitude:  49.6811, longitude: -116.0053, elevation: 1980, description: "Sunny, uncrowded cruisers on North Star Mountain · one of Canada's longest lit night runs.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "panorama",                  name: "Panorama",                  latitude:  50.4600, longitude: -116.2400, elevation: 2380, description: "Big Purcell vertical above the Columbia Valley · Taynton Bowl steeps and long groomed descents.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "sun-peaks-resort",          name: "Sun Peaks Resort",          latitude:  50.8833, longitude: -119.8833, elevation: 2080, description: "Canada's second-largest ski area by terrain · three linked mountains and a ski-through village.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "revelstoke",                name: "Revelstoke",                latitude:  50.9981, longitude: -118.1957, elevation:  450, description: "Railway town on the Columbia River · the lift base is about 10 min from the heritage downtown.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "golden",                    name: "Golden",                    latitude:  51.2960, longitude: -116.9631, elevation:  785, description: "Trans-Canada town where the Kicking Horse meets the Columbia · about 20 min below the resort.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "fernie",                    name: "Fernie",                    latitude:  49.5040, longitude: -115.0631, elevation: 1005, description: "Brick-built Elk Valley town under the Three Sisters · about 5 km from the Fernie Alpine base.",          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "nelson",                    name: "Nelson",                    latitude:  49.4928, longitude: -117.2948, elevation:  535, description: "Heritage arts town on Kootenay Lake · about 20 min up the Whitewater access road.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "kimberley",                 name: "Kimberley",                 latitude:  49.6697, longitude: -115.9781, elevation: 1113, description: "Bavarian-themed Rockies town · ski-in Marysville side, 5 min from the Kimberley Alpine base.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "invermere",                 name: "Invermere",                 latitude:  50.5064, longitude: -116.0311, elevation:  810, description: "Columbia Valley lake town · about 20 min up the winding road to Panorama.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },
  { id: "sun-peaks",                 name: "Sun Peaks",                 latitude:  50.8836, longitude: -119.8869, elevation: 1255, description: "Purpose-built ski-through village 45 min above Kamloops · lifts start from the main street.",            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Vancouver", region: "CA" },

  // ─── Banff & Lake Louise (Alberta, Canada) ───────────────
  { id: "banff-sunshine",            name: "Banff Sunshine Village",    latitude:  51.0781, longitude: -115.7772, elevation: 2730, description: "High on the Continental Divide · all-natural snow and a long season into late May.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "mt-norquay",                name: "Mt. Norquay",               latitude:  51.1990, longitude: -115.5980, elevation: 2133, description: "The steep local hill 10 min above the Town of Banff · night skiing and the North American chair.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "lake-louise-resort",        name: "Lake Louise Ski Resort",    latitude:  51.4419, longitude: -116.1622, elevation: 2637, description: "Four mountain faces above the Bow Valley · big back bowls with Victoria Glacier views.",                 bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "banff",                     name: "Banff",                     latitude:  51.1784, longitude: -115.5708, elevation: 1383, description: "Park townsite on the Bow River · the SkiBig3 shuttle base for Sunshine, Norquay and Lake Louise.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "lake-louise",               name: "Lake Louise",               latitude:  51.4254, longitude: -116.1773, elevation: 1540, description: "Small hamlet by the lake · 5 min across the highway from the Lake Louise ski resort base.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },

  // ─── Canmore (Alberta, Canada) ───────────────────────────
  { id: "nakiska",                   name: "Nakiska",                   latitude:  50.9422, longitude: -115.1519, elevation: 2260, description: "1988 Olympic downhill venue on Mount Allan in Kananaskis · fast, reliably groomed pitches.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "canmore",                   name: "Canmore",                   latitude:  51.0884, longitude: -115.3479, elevation: 1309, description: "Bow Valley town outside the park gates · about 45 min down Highway 40 to Nakiska.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },

  // ─── Jasper (Alberta, Canada) ────────────────────────────
  { id: "marmot-basin",              name: "Marmot Basin",              latitude:  52.8000, longitude: -118.0833, elevation: 2612, description: "Highest base elevation of any major Canadian ski area · quiet, cold, dry snow in Jasper National Park.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },
  { id: "jasper",                    name: "Jasper",                    latitude:  52.8737, longitude: -118.0814, elevation: 1062, description: "Rail-town park base on the Athabasca · about 20 min up the road to the Marmot Basin lifts.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Edmonton", region: "CA" },

  // ─── Laurentians (Québec, Canada) ────────────────────────
  { id: "tremblant",                 name: "Tremblant",                 latitude:  46.2200, longitude:  -74.5530, elevation:  875, description: "Eastern Canada's largest ski area · four faces off Pic White down to the pedestrian village.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "mont-tremblant",            name: "Mont-Tremblant",            latitude:  46.2127, longitude:  -74.5844, elevation:  261, description: "Pedestrian village at the gondola base · about 1 hr 45 min north of Montréal.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },

  // ─── Charlevoix (Québec, Canada) ─────────────────────────
  { id: "mont-sainte-anne",          name: "Mont-Sainte-Anne",          latitude:  47.0876, longitude:  -70.9324, elevation:  800, description: "Three skiable faces 30 min from Québec City · Canada's biggest lit night-ski vertical.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "le-massif",                 name: "Le Massif de Charlevoix",   latitude:  47.2757, longitude:  -70.6257, elevation:  806, description: "Highest vertical east of the Rockies · 770 m dropping straight toward the St. Lawrence.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "beaupre",                   name: "Beaupré",                   latitude:  47.0443, longitude:  -70.8953, elevation:   24, description: "Côte-de-Beaupré town on the river flats · about 10 min up the road to Mont-Sainte-Anne.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "petite-riviere-saint-francois", name: "Petite-Rivière-Saint-François", latitude: 47.3100, longitude: -70.5660, elevation: 36, description: "Shoreline village beneath Le Massif · the base station sits at the water's edge.",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },

  // ─── Eastern Townships (Québec, Canada) ──────────────────
  { id: "bromont-resort",            name: "Ski Bromont",               latitude:  45.2892, longitude:  -72.6378, elevation:  553, description: "Seven sectors across Mont Brome · the largest lit night-ski terrain in North America.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "mont-sutton",               name: "Mont Sutton",               latitude:  45.0850, longitude:  -72.5500, elevation:  840, description: "Québec's glade mountain · an interconnected sous-bois network rather than cut trails.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "bromont",                   name: "Bromont",                   latitude:  45.3168, longitude:  -72.6491, elevation:  126, description: "Townships town off Autoroute 10 · about 5 min from the ski hill, 45 min from Montréal.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },
  { id: "sutton",                    name: "Sutton",                    latitude:  45.1001, longitude:  -72.6158, elevation:  175, description: "Village under the Sutton range near the Vermont line · about 10 min to the lifts.",                   bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Toronto", region: "CA" },

  // Summit County, CO
  { id: "breckenridge-resort",       name: "Breckenridge",              latitude:  39.4817, longitude: -106.0384, elevation: 3914, description: "Four interconnected peaks above a Victorian mining town · high alpine bowls on Peaks 6 and 7.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "keystone-resort",           name: "Keystone",                  latitude:  39.6084, longitude: -105.9436, elevation: 3444, description: "Three-mountain layout with Colorado's biggest night-skiing operation.",                                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "copper-mountain-resort",    name: "Copper Mountain",           latitude:  39.5017, longitude: -106.1512, elevation: 3450, description: "Naturally divided terrain · beginner, intermediate and expert zones split by ridgelines.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "arapahoe-basin",            name: "Arapahoe Basin",            latitude:  39.6425, longitude: -105.8719, elevation: 3978, description: "One of North America's highest lift-served peaks · steep East Wall terrain and a famously long season.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "loveland",                  name: "Loveland",                  latitude:  39.6803, longitude: -105.8975, elevation: 3868, description: "Straddles the Continental Divide at Loveland Pass · usually Colorado's first and last resort open.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "breckenridge",              name: "Breckenridge",              latitude:  39.4817, longitude: -106.0384, elevation: 2926, description: "Victorian-era mining town on Main Street · walkable base for Breckenridge's four peaks.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "keystone",                  name: "Keystone",                  latitude:  39.5797, longitude: -105.9425, elevation: 2835, description: "Purpose-built village at the base of the resort's River Run gondola.",                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "copper-mountain",           name: "Copper Mountain",           latitude:  39.5022, longitude: -106.1497, elevation: 2926, description: "Ski-in village at the resort base, off I-70's Copper Mountain exit.",                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "georgetown",                name: "Georgetown",                latitude:  39.7108, longitude: -105.6997, elevation: 2622, description: "Historic silver-mining town on I-70 · the gateway to Loveland Pass and Loveland ski area.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Vail Valley, CO
  { id: "vail-mountain",             name: "Vail Mountain",             latitude:  39.6061, longitude: -106.3550, elevation: 3527, description: "The largest single ski mountain in Colorado · legendary Back Bowls.",                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "beaver-creek",              name: "Beaver Creek",              latitude:  39.6042, longitude: -106.5165, elevation: 3488, description: "Gated, upscale resort village · impeccably groomed cruisers.",                                             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "vail",                      name: "Vail",                      latitude:  39.6403, longitude: -106.3742, elevation: 2500, description: "Bavarian-styled village at the base of Vail Mountain.",                                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "avon",                      name: "Avon",                      latitude:  39.6317, longitude: -106.5219, elevation: 2286, description: "Valley town at the base of Beaver Creek, a few minutes up the gated access road.",                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Aspen Snowmass, CO
  { id: "snowmass",                  name: "Snowmass",                  latitude:  39.2110, longitude: -106.9500, elevation: 3813, description: "The biggest of the four mountains · full Ikon Pass unlimited access.",                                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "aspen-mountain",            name: "Aspen Mountain",            latitude:  39.1836, longitude: -106.8231, elevation: 3418, description: "Steep, expert-leaning terrain rising straight out of downtown Aspen · no green runs.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "aspen-highlands",           name: "Aspen Highlands",           latitude:  39.1811, longitude: -106.8697, elevation: 3559, description: "Locals' favourite with Highland Bowl's hike-to extreme terrain.",                                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "buttermilk",                name: "Buttermilk",                latitude:  39.1997, longitude: -106.8683, elevation: 3018, description: "Gentle, family-friendly terrain · home of the Winter X Games superpipe.",                                   bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "aspen",                     name: "Aspen",                     latitude:  39.1911, longitude: -106.8175, elevation: 2423, description: "Historic mining-town-turned-resort · base for Aspen Mountain, Highlands and Buttermilk.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "snowmass-village",          name: "Snowmass Village",          latitude:  39.2103, longitude: -106.9378, elevation: 2473, description: "Purpose-built ski-in village about 12 miles from downtown Aspen.",                                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Steamboat, CO
  { id: "steamboat-resort",          name: "Steamboat Resort",          latitude:  40.4572, longitude: -106.8045, elevation: 3221, description: "Home of Champagne Powder® · six interconnected peaks in the Yampa Valley.",                                 bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "steamboat-springs",         name: "Steamboat Springs",         latitude:  40.4850, longitude: -106.8317, elevation: 2076, description: "Ranching-town-turned-resort on the Yampa River · a few minutes' shuttle to the base.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Winter Park, CO
  { id: "winter-park-resort",        name: "Winter Park Resort",        latitude:  39.8868, longitude: -105.7625, elevation: 3676, description: "Denver's closest big mountain over Berthoud Pass · Mary Jane side is bump-and-glade heavy.",                 bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "winter-park",               name: "Winter Park",               latitude:  39.8867, longitude: -105.7631, elevation: 2743, description: "Base town at the foot of the resort, about 67 miles from Denver via US-40.",                                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Crested Butte, CO
  { id: "crested-butte-mountain-resort", name: "Crested Butte Mountain Resort", latitude: 38.8992, longitude: -106.9650, elevation: 3620, description: "Steep, remote and uncrowded · some of the most extreme lift-served terrain in the US.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "crested-butte-town",        name: "Crested Butte",             latitude:  38.8697, longitude: -106.9878, elevation: 2774, description: "Historic Victorian mining town about 3 miles from Mt. Crested Butte's resort base.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Telluride, CO
  { id: "telluride-ski-resort",      name: "Telluride Ski Resort",      latitude:  37.9375, longitude: -107.8123, elevation: 3815, description: "Box-canyon setting in the San Juan Mountains · Epic Pass partner resort (up to 7 days).",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "telluride-town",            name: "Telluride",                 latitude:  37.9375, longitude: -107.8123, elevation: 2660, description: "Historic mining town in a box canyon, connected to Mountain Village by free gondola.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Durango, CO
  { id: "purgatory-resort",          name: "Purgatory Resort",          latitude:  37.6297, longitude: -107.8144, elevation: 3299, description: "Independent, family-friendly San Juan Mountains resort about 25 miles north of Durango.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "durango-town",              name: "Durango",                   latitude:  37.2753, longitude: -107.8801, elevation: 1988, description: "Historic railroad town on the Animas River, about 25 miles south of Purgatory.",                            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Boulder / Front Range, CO
  { id: "eldora-mountain-resort",    name: "Eldora Mountain Resort",    latitude:  39.9375, longitude: -105.5828, elevation: 2853, description: "The closest lift-served skiing to Denver and Boulder, about an hour up Boulder Canyon.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "nederland",                 name: "Nederland",                 latitude:  39.9614, longitude: -105.5108, elevation: 2528, description: "Small mountain town above Boulder Canyon, about 8 miles from the resort.",                                   bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Cottonwood Canyons, UT
  { id: "alta",                      name: "Alta",                      latitude:  40.5883, longitude: -111.6383, elevation: 3374, description: "Ski-only (no snowboarding) · full Ikon Pass only · legendary Little Cottonwood Canyon powder.",              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "snowbird",                  name: "Snowbird",                  latitude:  40.5830, longitude: -111.6556, elevation: 3353, description: "Tram-served big terrain in Little Cottonwood Canyon · usually the last Utah resort to close.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "brighton-resort",           name: "Brighton",                  latitude:  40.5977, longitude: -111.5836, elevation: 3200, description: "Big Cottonwood Canyon local favourite · night skiing and a laid-back, no-frills base.",                      bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "solitude-mountain-resort",  name: "Solitude",                  latitude:  40.6199, longitude: -111.5928, elevation: 3197, description: "Big Cottonwood Canyon · unlimited access for full Ikon Pass holders.",                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "salt-lake-city",            name: "Salt Lake City",            latitude:  40.7608, longitude: -111.8910, elevation: 1288, description: "Utah's capital, about 25-40 minutes from the Cottonwood Canyon mouths.",                                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "sandy",                     name: "Sandy",                     latitude:  40.5649, longitude: -111.8389, elevation: 1355, description: "Suburb at the mouth of Little Cottonwood Canyon, the closest base town for Alta and Snowbird.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Park City, UT
  { id: "park-city-mountain",        name: "Park City Mountain",        latitude:  40.6514, longitude: -111.5080, elevation: 3056, description: "The largest ski resort in the US · Epic Pass, Mountain Village and Canyons Village.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "deer-valley-resort",        name: "Deer Valley",               latitude:  40.6374, longitude: -111.4783, elevation: 2917, description: "Ski-only (no snowboarding) · full Ikon Pass only · famously good grooming and service.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "park-city-town",            name: "Park City",                 latitude:  40.6461, longitude: -111.4980, elevation: 2103, description: "Historic mining-town-turned-resort about 35 minutes from Salt Lake City International Airport.",                bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Ogden Valley, UT
  { id: "snowbasin",                 name: "Snowbasin",                 latitude:  41.2160, longitude: -111.8567, elevation: 2917, description: "2002 Winter Olympics downhill venue · Ikon Pass (7 days).",                                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "powder-mountain",           name: "Powder Mountain",           latitude:  41.3797, longitude: -111.7811, elevation: 2872, description: "Independent, own season pass · vast, uncrowded terrain and night skiing.",                                 bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "nordic-valley",             name: "Nordic Valley",             latitude:  41.3311, longitude: -111.8497, elevation: 2152, description: "Small night-skiing hill on the Power Pass · 2025-26 season dates unconfirmed/unreliable.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "ogden",                     name: "Ogden",                     latitude:  41.2230, longitude: -111.9738, elevation: 1362, description: "Historic railroad city at the mouth of Ogden Canyon, about 35 minutes from Salt Lake City.",                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "eden",                      name: "Eden",                      latitude:  41.3211, longitude: -111.8636, elevation: 1615, description: "Small valley community closest to Powder Mountain and Nordic Valley.",                                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Provo, UT
  { id: "sundance-mountain-resort",  name: "Sundance Mountain Resort",  latitude:  40.3970, longitude: -111.5847, elevation: 2515, description: "Independent (no Ikon or Epic Pass) · Robert Redford's low-key resort in Provo Canyon.",                       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "provo-town",                name: "Provo",                     latitude:  40.2338, longitude: -111.6585, elevation: 1387, description: "University city at the mouth of Provo Canyon, about 20 minutes from Sundance.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "sundance-town",             name: "Sundance",                  latitude:  40.3970, longitude: -111.5847, elevation: 1859, description: "Small village right at the resort base, in Provo Canyon along the Alpine Loop.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Cache Valley, UT
  { id: "beaver-mountain",           name: "Beaver Mountain",           latitude:  41.9742, longitude: -111.4547, elevation: 2701, description: "Family-run since 1939 · one of the oldest continuously-operated ski areas in the US · Indy Pass.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "cherry-peak",               name: "Cherry Peak",               latitude:  41.9897, longitude: -111.9250, elevation: 2146, description: "Small Cache Valley hill on the Indy Pass · 2025-26 opening date unconfirmed by the resort.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "logan",                     name: "Logan",                     latitude:  41.7370, longitude: -111.8338, elevation: 1358, description: "Cache Valley's main town, about 30 minutes from Beaver Mountain and Cherry Peak.",                              bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // North Lake Tahoe, CA · first Pacific-timezone (America/Los_Angeles)
  // US region on this branch.
  { id: "palisades-tahoe",           name: "Palisades Tahoe",           latitude:  39.1966, longitude: -120.2347, elevation: 2758, description: "Ikon Pass · gondola-linked Palisades/Alpine Meadows base areas · Olympic terrain (1960 Winter Games).",             bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "northstar-california",      name: "Northstar California",      latitude:  39.2640, longitude: -120.1250, elevation: 2624, description: "Epic Pass · Vail Resorts' Tahoe trio with Heavenly and Kirkwood · gondola village base.",                        bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "sugar-bowl",                name: "Sugar Bowl",                latitude:  39.3044, longitude: -120.3358, elevation: 2554, description: "Independent · the only Mountain Collective resort in the Tahoe region · Donner Summit tram-served terrain.",         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "truckee",                   name: "Truckee",                   latitude:  39.3280, longitude: -120.1833, elevation: 1808, description: "Historic railroad town on I-80, the main gateway to all three North Lake Tahoe resorts.",                            bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // South Lake Tahoe, CA · Sierra-at-Tahoe is officially closed for the
  // 2025-26 season per the resort's own page — see
  // src/regions/south-lake-tahoe.ts for the full honesty-gate note.
  { id: "heavenly",                  name: "Heavenly",                  latitude:  38.9353, longitude: -119.9400, elevation: 3068, description: "Epic Pass · straddles the CA/NV state line · 2025-26 closing date not confirmed by the resort.",                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "kirkwood",                  name: "Kirkwood",                  latitude:  38.6840, longitude: -120.0664, elevation: 2987, description: "Epic Pass · one of the highest resort base elevations in the Tahoe region · 2025-26 closing date not confirmed.",       bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "sierra-at-tahoe",           name: "Sierra-at-Tahoe",           latitude:  38.8002, longitude: -120.0806, elevation: 2699, description: "⚠️ Officially closed for the 2025/26 season per the resort's own hours-of-operation page — conditions data should be treated as unavailable.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "homewood-mountain-resort",  name: "Homewood Mountain Resort",  latitude:  39.0827, longitude: -120.1755, elevation: 2401, description: "Independent · West Shore lake views · reopened for 2025-26 after a full 2024-25 closure for redevelopment.",           bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "south-lake-tahoe-town",     name: "South Lake Tahoe",          latitude:  38.9399, longitude: -119.9772, elevation: 1907, description: "Lakefront city on the California side of the state line, gateway to Heavenly, Kirkwood, Sierra-at-Tahoe and Homewood.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Mammoth Lakes, CA
  { id: "mammoth-mountain",          name: "Mammoth Mountain",          latitude:  37.6306, longitude: -119.0326, elevation: 3369, description: "Ikon Pass · one of the highest, latest-closing resorts in California · ran a 199-day season into June for 2025-26.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "june-mountain",             name: "June Mountain",             latitude:  37.7683, longitude: -119.0906, elevation: 3075, description: "Ikon Pass · Mammoth's quieter sister mountain across two peaks, near June Lake.",                                     bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "mammoth-lakes-town",        name: "Mammoth Lakes",             latitude:  37.6485, longitude: -118.9721, elevation: 2371, description: "Eastern Sierra resort town on US-395, the base for both Mammoth Mountain and June Mountain.",                         bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Big Bear, CA · outside both the Sierra Avalanche Center's and Eastern
  // Sierra Avalanche Center's coverage areas — no dedicated backcountry
  // avalanche authority identified for this region.
  { id: "bear-mountain",             name: "Bear Mountain",             latitude:  34.2267, longitude: -116.8602, elevation: 2685, description: "Ikon Pass · Southern California's terrain-park anchor · 2025-26 closing date reported as Mar 25 or Mar 29 2026, sources disagree.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "snow-summit",               name: "Snow Summit",               latitude:  34.2286, longitude: -116.8911, elevation: 2500, description: "Ikon Pass (same operator as Bear Mountain) · 2025-26 closing date reported as Apr 6 or Mar 22 2026, sources disagree.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "big-bear-lake",             name: "Big Bear Lake",             latitude:  34.2439, longitude: -116.9114, elevation: 2058, description: "San Bernardino Mountains resort town on Highway 18/38, the base for Bear Mountain and Snow Summit.",                  bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Bear Valley, CA · near the southern edge of the Sierra Avalanche
  // Center's coverage area.
  { id: "bear-valley-mountain-resort", name: "Bear Valley Mountain Resort", latitude: 38.4706, longitude: -120.0471, elevation: 2591, description: "Indy Pass · own multi-resort \"Cali Pass\" + Powder Alliance reciprocity · 2025-26 opening date uncertain in source reporting.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "arnold",                    name: "Arnold",                    latitude:  38.2494, longitude: -120.3552, elevation: 1204, description: "Highway 4 gateway town about 20 minutes below Bear Valley Mountain Resort.",                                          bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Mt. Shasta, CA · California's northernmost ski area, in the Cascades
  // rather than the Sierra Nevada · outside SAC/ESAC coverage · 2025-26
  // season closed early (Mar 2, 2026) for lack of snow. Elevation omitted
  // (unconfirmed from an authoritative source — see src/regions/mt-shasta.ts).
  { id: "mt-shasta-ski-park",        name: "Mt. Shasta Ski Park",       latitude:  41.3208, longitude: -122.2036, elevation: 0, description: "Indy Pass · California's northernmost ski area · 2025-26 season closed early (Mar 2, 2026) due to lack of snow, 5 days short of the resort's 60-day guarantee · base/summit elevation unverified.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "mount-shasta",              name: "Mount Shasta",              latitude:  41.3099, longitude: -122.3106, elevation: 1082, description: "I-5 town at the base of Mt. Shasta, about 15 minutes from the ski park via SR-89.",                                    bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },


  // Killington/Pico, VT · first America/New_York region in the USA
  // module. Elevation is SUMMIT (matches CO/UT/CA convention).
  { id: "killington-resort",         name: "Killington",                latitude:  43.6045, longitude: -72.8201, elevation: 1293, description: "Epic Pass + Beast 365 · Vermont's largest ski area with 6 interconnected peaks · confirmed 183-day 2025-26 season (opened Nov 12 2025, closed May 25 2026).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "pico-mountain",             name: "Pico Mountain",             latitude:  43.6659, longitude: -72.8323, elevation: 1209, description: "Ikon Base Pass (with blackouts) · quieter, family-oriented neighbour to Killington · 2025-26 closing date not confirmed by the resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "killington",                name: "Killington",                latitude:  43.6042, longitude: -72.8092, elevation: 335,  description: "Vermont's best-known ski town along US-4 in the Green Mountains, the main gateway to Killington and Pico Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Stowe/Smugglers' Notch, VT · Smugglers' Notch is independent for
  // 2025-26 pending a Feb 2026 acquisition and a 2026-27 joint pass with
  // Burke Mountain — reflected as current-season-only, no live data
  // fabricated ahead of the pass change.
  { id: "stowe-mountain-resort",     name: "Stowe Mountain Resort",     latitude:  44.5303, longitude: -72.7883, elevation: 1340, description: "Epic Pass · Vail's Northeast group with Mount Snow and Okemo · Vermont's highest peak (Mt. Mansfield) · confirmed 2025-26 season (opened Nov 21 2025, closed Apr 25 2026) · ⚠️ base elevation has conflicting figures across sources (1,340-2,035 ft).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "smugglers-notch",           name: "Smugglers' Notch",          latitude:  44.5991, longitude: -72.7864, elevation: 1109, description: "Independent for the 2025-26 season · acquired by new ownership (Bear Den Partners) in Feb 2026, with a joint pass alongside Burke Mountain planned for 2026-27 — not yet in effect · 2025-26 closing date not confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "stowe",                     name: "Stowe",                     latitude:  44.4654, longitude: -72.6874, elevation: 341,  description: "Classic Vermont mountain town along VT-108, the main gateway to Stowe Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "jeffersonville",            name: "Jeffersonville",            latitude:  44.6511, longitude: -72.8298, elevation: 128,  description: "Small village on VT-108, the closest base town to Smugglers' Notch.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Mad River Valley, VT · Mad River Glen is ski-only for 2025-26 (no
  // snowboarding) — same treatment as Alta/Deer Valley in the Utah pass.
  { id: "sugarbush",                 name: "Sugarbush",                 latitude:  44.1358, longitude: -72.9204, elevation: 1244, description: "Mountain Collective Pass · two connected peaks (Lincoln Peak, Mt. Ellen) with a 2,600 ft vertical drop · 2025-26 closing date not confirmed by the resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "mad-river-glen",            name: "Mad River Glen",            latitude:  44.2001, longitude: -72.9192, elevation: 1109, description: "⚠️ Ski-only for 2025-26 — snowboarding is not permitted · independent, co-operatively owned by its skiers · opened Dec 6 2025, closing date ~Apr 12 2026 is approximate/unconfirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "warren",                    name: "Warren",                    latitude:  44.1195, longitude: -72.8626, elevation: 384,  description: "Small village along VT-100, the closest base town to Sugarbush.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "waitsfield",                name: "Waitsfield",                latitude:  44.1975, longitude: -72.8090, elevation: 320,  description: "Main commercial hub of the Mad River Valley along VT-100, the closest base town to Mad River Glen.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Southern Vermont, VT · Magic Mountain did NOT open for the 2025-26
  // season (lowest snowfall in 20+ years) — same honesty-gate treatment
  // as Sierra-at-Tahoe in the California pass. Elevation IS shown per the
  // task brief since it's independently confirmed, unlike Sierra-at-Tahoe.
  { id: "stratton-mountain-resort",  name: "Stratton",                  latitude:  43.1131, longitude: -72.9081, elevation: 1181, description: "Ikon Pass · gondola-served summit, one of southern Vermont's largest resorts · confirmed 2025-26 season (opened Nov 26 2025, closed Apr 12 2026).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "mount-snow",                name: "Mount Snow",                latitude:  42.9601, longitude: -72.9201, elevation: 1097, description: "Epic Pass · Vail's Northeast group with Stowe and Okemo · popular with Boston/NYC day-trippers · 2025-26 closing date not confirmed by the resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "bromley-mountain",          name: "Bromley Mountain",          latitude:  43.2226, longitude: -72.9376, elevation: 1001, description: "Indy Pass (first season on Indy for 2025-26) · Vermont's highest base elevation (1,950 ft) · south-facing sun exposure · 2025-26 closing date not confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "magic-mountain",            name: "Magic Mountain",            latitude:  43.1706, longitude: -72.7534, elevation: 869,  description: "⚠️ Did NOT open for the 2025-26 season — the lowest snowfall in 20+ years produced the resort's first non-opening in over 20 years under Miller family ownership. Treat all current-season conditions data for this resort as unavailable.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "stratton",                  name: "Stratton",                  latitude:  43.1334, longitude: -72.9298, elevation: 549,  description: "Small village closest to Stratton resort's base area.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "west-dover",                name: "West Dover",                latitude:  42.9709, longitude: -72.8265, elevation: 549,  description: "Village along VT-100, the main gateway to Mount Snow.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "peru-vt",                   name: "Peru",                      latitude:  43.2333, longitude: -72.8990, elevation: 555,  description: "Small hill town near Bromley and Magic Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "manchester-vt",             name: "Manchester",                latitude:  43.1642, longitude: -73.0729, elevation: 240,  description: "Larger shopping/dining town along US-7, a common base for visiting Bromley, Magic Mountain and Stratton.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Okemo, VT
  { id: "okemo-mountain-resort",     name: "Okemo Mountain Resort",     latitude:  43.4009, longitude: -72.7168, elevation: 1019, description: "Epic Pass · Vail's Northeast group with Stowe and Mount Snow · celebrating its 70th season for 2025-26 · confirmed season (opened Nov 22 2025, closed Apr 19 2026).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "ludlow",                    name: "Ludlow",                    latitude:  43.3959, longitude: -72.7096, elevation: 330,  description: "Small town in south-central Vermont, the base town for Okemo Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Jay Peak/Northeast Kingdom, VT · Burke Mountain shares the same Bear
  // Den Partners acquisition context as Smugglers' Notch — reflected as
  // current-season-only.
  { id: "jay-peak",                  name: "Jay Peak",                  latitude:  44.9241, longitude: -72.5215, elevation: 1209, description: "Indy Pass · Vermont's northernmost major resort, known for the region's highest average natural snowfall · very late/approximate 2025-26 closing (among the last 6 New England areas still open per an Apr 20 2026 report).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "burke-mountain",            name: "Burke Mountain",            latitude:  44.5876, longitude: -71.9106, elevation: 996,  description: "Indy Pass · newly linked to Smugglers' Notch via shared Bear Den Partners ownership (Feb 2026) · joint pass with Smugglers' Notch planned for 2026-27, not yet in effect · opened Dec 6 2025, 2025-26 closing date not confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "jay",                       name: "Jay",                       latitude:  44.9417, longitude: -72.5083, elevation: 305,  description: "Small town near the Canadian border, the base town for Jay Peak.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "east-burke",                name: "East Burke",                latitude:  44.6112, longitude: -71.9227, elevation: 305,  description: "Northeast Kingdom village, the base town for Burke Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },

  // Jackson Hole, WY · first Wyoming region, America/Denver (shared with
  // Colorado/Utah). Elevation is SUMMIT (matches CO/UT/CA/VT convention).
  { id: "jackson-hole-mtn-resort",   name: "Jackson Hole Mountain Resort", latitude: 43.5875, longitude: -110.8279, elevation: 3185, description: "Ikon Pass (Full only, excluded from Base) · legendary steep terrain off the Aerial Tram, 4,139 ft vertical · reservation system required for Ikon/Mountain Collective 2025-26 · ⚠️ no confirmed dedicated webcam URL.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "snow-king-mountain",        name: "Snow King Mountain",        latitude: 43.4783, longitude: -110.7581, elevation: 2380, description: "Indy Pass + Powder Alliance · Wyoming's original ski resort, in-town in Jackson with night skiing · official 2025-26 closing Mar 22 2026 per resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "jackson",                   name: "Jackson",                   latitude: 43.4799, longitude: -110.7624, elevation: 1902, description: "Historic town square and main gateway to the valley, home to Snow King Mountain and a short drive from Jackson Hole Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "teton-village",             name: "Teton Village",             latitude: 43.5881, longitude: -110.8273, elevation: 1925, description: "Base village at the foot of Jackson Hole Mountain Resort's Aerial Tram.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Grand Targhee, WY · town id "alta-wy" disambiguated from Utah's Alta.
  { id: "grand-targhee-resort",      name: "Grand Targhee Resort",      latitude: 43.7904, longitude: -110.9576, elevation: 3006, description: "Mountain Collective Pass (not Ikon/Epic) · deepest average annual snowfall on the west side of the Tetons · Fred's Mountain summit 9,862 ft, 2,270 ft vertical · a contested 694-acre USFS expansion is approved but not built, objections run through July 2026 and don't affect the 2025-26 season.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "alta-wy",                   name: "Alta",                      latitude: 43.7897, longitude: -110.9310, elevation: 2393, description: "Small Teton Valley town on the Idaho-Wyoming border, the closest base town to Grand Targhee Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Big Sky, MT · first Montana region, America/Denver.
  { id: "big-sky-resort",            name: "Big Sky Resort",            latitude: 45.2871, longitude: -111.4010, elevation: 3403, description: "Ikon Pass (Full, no blackouts) · \"The Biggest Skiing in America\" · ~5,850 skiable acres, 4,350 ft vertical · official 2025-26 closing day Apr 26 2026 per resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "big-sky-town",              name: "Big Sky",                   latitude: 45.2849, longitude: -111.3806, elevation: 2286, description: "Base town for Big Sky Resort, midway between Bozeman and Yellowstone National Park's West Entrance.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Bozeman / Bridger Bowl, MT.
  { id: "bridger-bowl",              name: "Bridger Bowl",              latitude: 45.8266, longitude: -110.8988, elevation: 2682, description: "Independent nonprofit ski area · ⚠️ closed early for the 2025-26 season on Mar 22 2026 due to low snowfall (138\" season total), expected back to its normal schedule for 2026-27.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "bozeman",                   name: "Bozeman",                   latitude: 45.6770, longitude: -111.0429, elevation: 1466, description: "University town and gateway to Bridger Bowl, about 16 miles north.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Whitefish, MT · town id "whitefish-town" disambiguated from the resort.
  { id: "whitefish-mountain-resort", name: "Whitefish Mountain Resort", latitude: 48.4890, longitude: -114.3670, elevation: 2078, description: "Independent · known locally as \"Big Mountain\" · the largest US ski area not on Epic/Ikon/Indy Pass · official 2025-26 closing day Apr 5 2026 per resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "whitefish-town",            name: "Whitefish",                 latitude: 48.4111, longitude: -114.3376, elevation: 917,  description: "Lakeside base town for Whitefish Mountain Resort, near Glacier National Park.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Red Lodge, MT · town id "red-lodge-town" disambiguated from the resort.
  { id: "red-lodge-mountain",        name: "Red Lodge Mountain",        latitude: 45.1699, longitude: -109.4137, elevation: 2870, description: "Indy Pass member · ⚠️ 2025-26 closing date not confirmed by a dated primary source · no dedicated backcountry avalanche forecast authority covers the Beartooth/Red Lodge area.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "red-lodge-town",            name: "Red Lodge",                 latitude: 45.1863, longitude: -109.2468, elevation: 1740, description: "Historic base town for Red Lodge Mountain, gateway to the Beartooth Mountains (summer-only Beartooth Highway).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Taos, NM · town id "taos-ski-valley-town" disambiguated from the resort.
  { id: "taos-ski-valley",           name: "Taos Ski Valley",           latitude: 36.5960, longitude: -105.4478, elevation: 3804, description: "Ikon Pass (Full, no blackouts) · independent ownership · sole access via NM-150, a narrow, steep, switchback road · ⚠️ closed early for 2025-26 on Mar 29 2026 due to unseasonably warm weather.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "taos-ski-valley-town",      name: "Taos Ski Valley",           latitude: 36.5946, longitude: -105.4497, elevation: 2804, description: "Base village at the literal end of NM-150, directly at the foot of Taos Ski Valley.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Angel Fire, NM.
  { id: "angel-fire-resort",         name: "Angel Fire Resort",         latitude: 36.3929, longitude: -105.2853, elevation: 3254, description: "Powder Alliance member · New Mexico's only night skiing · confirmed season Dec 12 2025 - Mar 22 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "angel-fire",                name: "Angel Fire",                latitude: 36.3762, longitude: -105.2894, elevation: 2555, description: "Moreno Valley town near Wheeler Peak, gateway to Angel Fire Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Santa Fe area, NM.
  { id: "ski-santa-fe",              name: "Ski Santa Fe",              latitude: 35.8000, longitude: -105.8000, elevation: 3681, description: "Independent · one of the highest-base-elevation resorts in the US · ⚠️ closed early for 2025-26 on Mar 22 2026 due to unseasonably warm, dry conditions.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "santa-fe",                  name: "Santa Fe",                  latitude: 35.6870, longitude: -105.9378, elevation: 2194, description: "New Mexico's state capital, roughly 30 minutes' drive from Ski Santa Fe.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Albuquerque area, NM · Sandia Peak is a verify-status resort, see roads.ts.
  { id: "sandia-peak",               name: "Sandia Peak Ski Area",      latitude: 35.2062, longitude: -106.4475, elevation: 2630, description: "Mountain Capital Partners \"Power Pass\" · ⚠️ verify-status resort: exact 2025-26 closing date and total operating days unconfirmed by any dated source found in research.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },
  { id: "albuquerque",               name: "Albuquerque",               latitude: 35.0844, longitude: -106.6504, elevation: 1619, description: "New Mexico's largest city, roughly 30-45 minutes' drive from Sandia Peak Ski Area.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Denver", region: "US" },

  // Michigan · all selected locations, including Keweenaw/Mt. Bohemia, are official Eastern Time (America/Detroit).
  { id: "boyne-mountain", name: "Boyne Mountain", latitude: 45.1639, longitude: -84.9308, elevation: 341, description: "Boyne-owned · Ikon Pass / Boyne Passport · 500 ft vertical.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },
  { id: "boyne-highlands", name: "The Highlands", latitude: 45.4717, longitude: -84.9233, elevation: 404, description: "Boyne-owned · Ikon Pass / Boyne Passport · Michigan Lower Peninsula's highest vertical terrain; no distinct official live-cam URL confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },
  { id: "nubs-nob", name: "Nub's Nob", latitude: 45.4623, longitude: -84.9420, elevation: 408, description: "Independent · Indy Pass partner with unusual holiday blackout dates; official webcam page exists but current live status unverified.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },
  { id: "harbor-springs-town", name: "Harbor Springs", latitude: 45.4317, longitude: -84.9889, elevation: 182, description: "Little Traverse Bay base town for Boyne Mountain, The Highlands, and Nub's Nob.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },
  { id: "mt-bohemia", name: "Mt. Bohemia", latitude: 47.4080, longitude: -88.1010, elevation: 457, description: "Independent, expert-focused resort with genuine zero grooming and zero snowmaking; marketed 900 ft vertical has lower alternate-source estimates; no confirmed official live webcam.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },
  { id: "mohawk", name: "Mohawk", latitude: 47.3308, longitude: -88.3743, elevation: 227, description: "Keweenaw Peninsula base town for Mt. Bohemia; official Eastern Time, not Central.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Detroit", region: "US" },

  // Pennsylvania · entire state uses America/New_York. Camelback affiliation intentionally remains ambiguous.
  { id:"camelback-mountain",name:"Camelback Mountain Resort",latitude:41.052,longitude:-75.352,elevation:634,description:"⚠️ Vail/Epic ownership confirmed, but research also cites Ikon and Peak to Peak Pocono Pass; re-verify direct pass status.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"blue-mountain-pa",name:"Blue Mountain Resort",latitude:40.810,longitude:-75.521,elevation:489,description:"Palmerton, PA · Ikon partner · Pennsylvania's 1,082 ft vertical-drop leader.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"shawnee-mountain",name:"Shawnee Mountain Ski Area",latitude:41.003,longitude:-75.116,elevation:411,description:"Independent · Indy Pass · likely no live webcam confirmed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"tannersville",name:"Tannersville",latitude:41.040,longitude:-75.305,elevation:322,description:"Poconos base town for Camelback and nearby resorts.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"pocono-manor",name:"Pocono Manor",latitude:41.101,longitude:-75.347,elevation:450,description:"Poconos lodging base.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"seven-springs-mountain",name:"Seven Springs Mountain Resort",latitude:40.022,longitude:-79.297,elevation:913,description:"Vail/Epic · Pennsylvania's largest ski resort by acreage.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"blue-knob",name:"Blue Knob All Seasons Resort",latitude:40.685,longitude:-78.535,elevation:967,description:"Independent Indy resort · Pennsylvania's highest-elevation ski mountain · webcam status unresolved.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  { id:"seven-springs-town",name:"Seven Springs",latitude:40.041,longitude:-79.467,elevation:658,description:"Laurel Highlands base area.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US" },
  // Massachusetts · America/New_York throughout.
  {id:"jiminy-peak",name:"Jiminy Peak",latitude:42.554,longitude:-73.292,elevation:725,description:"Independent Ikon Bonus Mountain · wind-turbine sustainability differentiator.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"ski-butternut",name:"Ski Butternut",latitude:42.196,longitude:-73.319,elevation:549,description:"Independent Ikon Bonus Mountain.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"berkshire-east",name:"Berkshire East",latitude:42.684,longitude:-72.875,elevation:561,description:"Indy Pass · 2026 Bear Den Partners acquisition (same group as Burke/Smugglers' Notch) · no confirmed live webcam; longer regional drive.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"hancock",name:"Hancock",latitude:42.547,longitude:-73.323,elevation:320,description:"Jiminy Peak base town.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"great-barrington",name:"Great Barrington",latitude:42.196,longitude:-73.363,elevation:249,description:"Southern Berkshires base town.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"wachusett-mountain",name:"Wachusett Mountain",latitude:42.488,longitude:-71.887,elevation:612,description:"Independent “Boston's Mountain” day-trip and night-skiing destination; separate official webcam URL unconfirmed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"princeton-ma",name:"Princeton",latitude:42.473,longitude:-71.877,elevation:300,description:"Central Massachusetts base town at Wachusett.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  // Minnesota · America/Chicago. Lutsen pass transition and Midwest-vertical claim are honesty-gated.
  {id:"lutsen-mountains",name:"Lutsen Mountains",latitude:47.663,longitude:-90.714,elevation:514,description:"Indy Pass 2025-26 · ⚠️ confirmed Ikon move for 2026-27 · Minnesota’s largest ski area / 825-ft state-high vertical, not Midwest highest (Mt. Bohemia MI and Terry Peak SD exceed it).",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},
  {id:"lutsen",name:"Lutsen",latitude:47.643,longitude:-90.714,elevation:198,description:"North Shore base town; Highway 61 can close in localized Lake Superior lake-effect snow.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},
  // Wisconsin · America/Chicago. Granite Peak pass transition and Cascade’s likely-broken Flash cam are honesty-gated.
  {id:"granite-peak",name:"Granite Peak Ski Area",latitude:44.931,longitude:-89.688,elevation:594,description:"Midwest Family Ski Resorts / Charles Skinner Jr. (not Nash/Skyline) · Indy 2025-26 · ⚠️ confirmed Ikon move 2026-27.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},
  {id:"wausau-town",name:"Wausau",latitude:44.959,longitude:-89.630,elevation:365,description:"Rib Mountain base city for Granite Peak.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},
  {id:"cascade-mountain",name:"Cascade Mountain",latitude:43.531,longitude:-89.395,elevation:378,description:"Independent Walz-family resort · no multi-resort pass (not Indy) · ⚠️ Adobe Flash webcam page is likely broken.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},
  {id:"portage",name:"Portage",latitude:43.539,longitude:-89.462,elevation:246,description:"Wisconsin Dells-area base town for Cascade Mountain.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Chicago",region:"US"},

  // West Virginia · America/New_York. Canaan Valley dates/pass details and some first-party conditions URLs remain honesty-gated.
  {id:"snowshoe-mountain",name:"Snowshoe Mountain",latitude:38.41,longitude:-79.995,elevation:1478,description:"Ikon Pass / Alterra · Mid-Atlantic’s largest vertical (~1,500 ft) · snowmaking is central to operations · ⚠️ distinct first-party conditions URL not independently confirmed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"snowshoe-town",name:"Snowshoe",latitude:38.41,longitude:-79.995,elevation:1150,description:"Remote Cheat Mountain base community for Snowshoe Mountain.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"canaan-valley-resort",name:"Canaan Valley Resort",latitude:39.045,longitude:-79.46,elevation:1304,description:"West Virginia State Park system / state-owned resort · ⚠️ exact 2025–26 dates and current pass affiliation require direct confirmation.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"timberline-mountain",name:"Timberline Mountain",latitude:39.041,longitude:-79.438,elevation:1301,description:"Independent (not Indy, Epic or Ikon) · correctly grouped in Canaan Valley, not Snowshoe · core snowmaking operations.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"canaan-valley-town",name:"Davis / Canaan Valley",latitude:39.105,longitude:-79.468,elevation:975,description:"Davis/Canaan Valley base area; Canaan Valley Resort and Timberline are only ~2–3 miles apart.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  // North Carolina · America/New_York. Beech ski operations use beechmountainresort.com; unconfirmed live condition/webcam details remain gated.
  {id:"sugar-mountain",name:"Sugar Mountain",latitude:36.13,longitude:-81.871,elevation:1615,description:"Independent (not Indy, Epic or Ikon) · heavy snowmaking reliance · ⚠️ dedicated live conditions URL not independently confirmed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"beech-mountain",name:"Beech Mountain Resort",latitude:36.183,longitude:-81.874,elevation:1678,description:"Independent · use beechmountainresort.com (ski operations), not beechmtn.com tourism site · heavy snowmaking reliance · ⚠️ webcam live status needs in-season confirmation.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"banner-elk-beech-mountain",name:"Banner Elk / Beech Mountain",latitude:36.166,longitude:-81.872,elevation:1340,description:"High Country base towns serving Sugar Mountain and Beech Mountain.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"cataloochee-ski-area",name:"Cataloochee Ski Area",latitude:35.562,longitude:-83.094,elevation:1646,description:"Indy Pass · independently owned · “First in Skiing in the South” · heavy snowmaking reliance.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"maggie-valley-town",name:"Maggie Valley",latitude:35.519,longitude:-83.084,elevation:914,description:"Maggie Valley base town for Cataloochee Ski Area.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  // Virginia · America/New_York. Wintergreen’s recent Indy affiliation and Massanutten webcam/closing-day uncertainty are honesty-gated.
  {id:"wintergreen-resort",name:"Wintergreen Resort",latitude:37.913,longitude:-78.945,elevation:1071,description:"Indy Pass (recent addition) · ownership history: James C. Justice II → EPR Properties → Pacific Group Resorts · heavy snowmaking reliance.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"wintergreen-town",name:"Wintergreen",latitude:37.913,longitude:-78.945,elevation:920,description:"Blue Ridge base community for Wintergreen Resort.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"massanutten-resort",name:"Massanutten Resort",latitude:38.407,longitude:-78.738,elevation:870,description:"Indy Pass · four-season resort · heavy snowmaking reliance · ⚠️ exact 2025–26 closing day and dedicated first-party webcam URL unconfirmed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  {id:"mcgaheysville",name:"McGaheysville",latitude:38.372,longitude:-78.73,elevation:470,description:"Shenandoah Valley base town for Massanutten Resort.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/New_York",region:"US"},
  // Nevada · America/Los_Angeles. Sierra Avalanche Center coverage, including Diamond Peak, is material; camera live status is not asserted.
  {id:"mt-rose-ski-tahoe",name:"Mt. Rose Ski Tahoe",latitude:39.315,longitude:-119.886,elevation:2956,description:"Independent · Tahoe’s highest base elevation (8,260 ft) · ⚠️ 2025–26 close-date sources conflict; official snow-report figure preferred.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Los_Angeles",region:"US"},
  {id:"diamond-peak",name:"Diamond Peak",latitude:39.254,longitude:-119.93,elevation:2603,description:"Independent; operated by Incline Village General Improvement District · Sierra Avalanche Center has a dedicated Diamond Peak page · actual 2025–26 close was March 29 after warm weather.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Los_Angeles",region:"US"},
  {id:"incline-village",name:"Incline Village",latitude:39.251,longitude:-119.952,elevation:1934,description:"Nevada-side Lake Tahoe base town; this region is distinct from existing California-side Tahoe coverage.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Los_Angeles",region:"US"},
  // Arizona · America/Phoenix. Arizona does not observe daylight saving time; America/Phoenix stays MST (UTC−7) year-round.
  {id:"arizona-snowbowl",name:"Arizona Snowbowl",latitude:35.33,longitude:-111.709,elevation:3511,description:"Independent proprietary Power Pass · high-elevation, snowmaking-reliant operation · ⚠️ Upper Bowl has genuine informal avalanche-terrain risk despite no formal state forecast center.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Phoenix",region:"US"},
  {id:"flagstaff-town",name:"Flagstaff",latitude:35.198,longitude:-111.651,elevation:2106,description:"Flagstaff base city for Arizona Snowbowl. America/Phoenix remains MST (UTC−7) year-round; Arizona does not observe DST.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Phoenix",region:"US"},
  {id:"sunrise-park-resort",name:"Sunrise Park Resort",latitude:33.973,longitude:-109.563,elevation:3330,description:"White Mountain Apache Tribe-owned · Indy Pass · ⚠️ summit reports conflict (~10,924 vs 11,000 ft) and require direct resort confirmation; no confirmed webcam URL.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Phoenix",region:"US"},
  {id:"greer-az",name:"Greer",latitude:34.01,longitude:-109.458,elevation:2520,description:"Greer base town for Sunrise Park. America/Phoenix remains MST (UTC−7) year-round; Arizona does not observe DST.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Phoenix",region:"US"},
  // South Dakota · America/Denver. Black Hills/Lead/Deadwood use Mountain Time, not South Dakota’s Central Time zone.
  {id:"terry-peak",name:"Terry Peak",latitude:44.339,longitude:-103.85,elevation:2164,description:"Indy Pass · summit 7,100 ft / ~1,100-ft vertical · ⚠️ standalone conditions and confirmed live webcam URLs remain unresolved",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Denver",region:"US"},
  {id:"lead-deadwood",name:"Lead / Deadwood",latitude:44.352,longitude:-103.765,elevation:1600,description:"Black Hills base towns are in Mountain Time (America/Denver), not Central Time.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Denver",region:"US"},
  // Alaska · America/Anchorage. Eaglecrest/Juneau travel is ferry/plane access to Juneau, not a contiguous-highway drive; CNFAIC/Turnagain risk is separately surfaced for Girdwood.
  {id:"alyeska-resort",name:"Alyeska Resort",latitude:60.97,longitude:-149.09,elevation:1201,description:"Ikon Pass since 2023 · Pomeroy Lodging-owned · defining aerial tram · ⚠️ elevation/vertical figures vary depending on whether tram-served terrain is included.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Anchorage",region:"US"},
  {id:"girdwood-town",name:"Girdwood",latitude:60.942,longitude:-149.166,elevation:12,description:"Girdwood base community for Alyeska, reached from Anchorage via the Seward Highway; monitor avalanche-related closures.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Anchorage",region:"US"},
  {id:"eaglecrest-ski-area",name:"Eaglecrest Ski Area",latitude:58.276,longitude:-134.528,elevation:820,description:"City and Borough of Juneau-owned · ⚠️ material operational risk: roughly $1M/year city subsidy, gondola cancelled May 2026, staff reductions and future beyond 2026–27 uncertain · no confirmed webcam feed.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Anchorage",region:"US"},
  {id:"juneau-town",name:"Juneau",latitude:58.302,longitude:-134.42,elevation:17,description:"Juneau has no road connection to Alaska’s contiguous highway system; Eaglecrest access is by local road after arrival by ferry or plane.",bomStation:"",bomStationId:"",bomWmoId:0,timezone:"America/Anchorage",region:"US"},
  // Mt. Hood, OR · one base town (Government Camp) serving three resorts.
  { id: "mt-hood-meadows",           name: "Mt. Hood Meadows",          latitude: 45.32889, longitude: -121.66250, elevation: 2225, description: "Indy Pass (2 days, select blackouts) + Indy+ Pass (2 days, no blackouts) · not on Epic/Ikon · ⚠️ exact 2025-26 opening/closing dates not confirmed by a dated primary source.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "timberline-lodge",          name: "Timberline Lodge",          latitude: 45.33111, longitude: -121.71000, elevation: 2603, description: "Mt. Hood Fusion Pass (bundled with Skibowl) · famous for near-year-round skiing via the Palmer Snowfield · ⚠️ vertical-drop figure is disputed across sources (resort's own 4,540 ft claim vs. ~3,590-3,690 ft per independent aggregators).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "mt-hood-skibowl",           name: "Mt. Hood Skibowl",          latitude: 45.30189, longitude: -121.773212, elevation: 1554, description: "Mt. Hood Fusion Pass + Powder Alliance in its own right · America's largest lit night-skiing operation · confirmed live webcams (West Base, Upper Bowl, East Base).", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "government-camp",           name: "Government Camp",           latitude: 45.30222, longitude: -121.75250, elevation: 1225, description: "Small mountain village on US-26, gateway to Timberline Lodge and Mt. Hood Skibowl; Mt. Hood Meadows is a short drive further up OR-35.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Bend, OR.
  { id: "mt-bachelor",               name: "Mt. Bachelor",              latitude: 43.9794, longitude: -121.6885, elevation: 2763, description: "Ikon Pass destination · 360°-skiable volcanic cone, one of the largest lift-served ski areas in the US by skiable acreage · ⚠️ avalanche forecasting here is from the smaller, volunteer-run Central Oregon Avalanche Center (COAC), not NWAC.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "bend",                      name: "Bend",                      latitude: 44.05806, longitude: -121.31528, elevation: 1104, description: "Central Oregon's largest city, roughly 30 minutes' drive from Mt. Bachelor via Cascade Lakes Highway/OR-372.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Crystal Mountain, WA.
  { id: "crystal-mountain",          name: "Crystal Mountain Resort",   latitude: 46.9280, longitude: -121.4749, elevation: 2138, description: "Ikon Pass (Full tier, no blackouts) · independent (Alterra-owned) · the largest ski area in Washington by vertical drop (3,100 ft) · ⚠️ SR-410 flood damage delayed the 2025-26 opening to approx. Dec 20-24, 2025; no confirmed season-closing date found.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "enumclaw",                  name: "Enumclaw",                  latitude: 47.20111, longitude: -121.99694, elevation: 339,  description: "Gateway town on SR-410, the primary access route to Crystal Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Snoqualmie Pass, WA · one resort with four connected sub-areas (Summit West/Central/East + Alpental).
  { id: "snoqualmie-pass",           name: "The Summit at Snoqualmie",  latitude: 47.42400, longitude: -121.41600, elevation: 1178, description: "Ikon Pass (Full tier, no blackouts) · independent (Boyne Resorts-owned) · four base areas under one ticket (Summit West/Central/East + Alpental) · ⚠️ 2025-26 season opened Dec 23, 2025 with only Summit West running; other sub-areas' dates unconfirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "snoqualmie-pass-town",      name: "Snoqualmie Pass",           latitude: 47.39222, longitude: -121.40000, elevation: 917,  description: "Small community directly on I-90 at the pass summit, adjacent to all four Summit at Snoqualmie base areas.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Stevens Pass, WA.
  { id: "stevens-pass",              name: "Stevens Pass Ski Area",     latitude: 47.74472, longitude: -121.08889, elevation: 1235, description: "Vail Resorts' Epic Local Pass (no blackouts) · sole highway access via US-2 · ⚠️ Dec 2025 US-2 flood closure delayed the 2025-26 opening to Dec 29, 2025; elevation figures are inconsistent across sources.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "skykomish",                 name: "Skykomish",                 latitude: 47.71028, longitude: -121.35833, elevation: 299,  description: "Small town on US-2, roughly 20 minutes' drive from Stevens Pass Ski Area.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Mt. Baker, WA.
  { id: "mt-baker",                  name: "Mt. Baker Ski Area",        latitude: 48.861944, longitude: -121.653889, elevation: 1515, description: "Independent · no major-pass affiliation · holds the world record for most snowfall in a season (1,140 in., 1998-99, verified by NOAA) · confirmed 2025-26 season Dec 21, 2025 - Apr 19, 2026 · ⚠️ NO confirmed live webcam found.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "glacier",                   name: "Glacier",                   latitude: 48.88833, longitude: -121.93389, elevation: 285,  description: "Small town on SR-542 (Mt. Baker Highway), the sole access route to Mt. Baker Ski Area.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Sun Valley, ID · one base town (Ketchum) serving two resorts. Mountain timezone.
  { id: "bald-mountain",             name: "Bald Mountain",             latitude: 43.65500, longitude: -114.40917, elevation: 2789, description: "Ikon Pass (Full tier, no blackouts) + Mountain Collective · the largest ski area in Idaho by vertical drop (3,400 ft) · confirmed 2025-26 season Dec 3, 2025 - Apr 12, 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },
  { id: "dollar-mountain",           name: "Dollar Mountain",           latitude: 43.68306, longitude: -114.34694, elevation: 2024, description: "Ikon Pass (Full tier, no blackouts) + Mountain Collective, shared with Bald Mountain · beginner-oriented · ⚠️ season-closing date not separately confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },
  { id: "ketchum",                   name: "Ketchum",                   latitude: 43.68074, longitude: -114.36366, elevation: 1774, description: "Base town for the Sun Valley resort complex, adjacent to both Bald Mountain and Dollar Mountain via ID-75.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },

  // Sandpoint, ID · Idaho Panhandle, PACIFIC timezone (not Mountain like the rest of Idaho).
  { id: "schweitzer-mountain-resort", name: "Schweitzer Mountain Resort", latitude: 48.36700, longitude: -116.62300, elevation: 1951, description: "Ikon Pass (destination tier) · independent · the 2nd largest ski area in Idaho by vertical drop (2,440 ft) · confirmed 2025-26 season Dec 3, 2025 - Apr 5, 2026, despite a \"historically low snow\" season.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },
  { id: "sandpoint",                 name: "Sandpoint",                 latitude: 48.28222, longitude: -116.56139, elevation: 648,  description: "Town on Lake Pend Oreille, roughly 30 minutes' drive from Schweitzer Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Los_Angeles", region: "US" },

  // Boise, ID · Mountain timezone. No dedicated avalanche-forecast center covers this region (nearest SAC zones 56-61mi away).
  { id: "bogus-basin",               name: "Bogus Basin",               latitude: 43.76468, longitude: -116.10329, elevation: 2394, description: "Nonprofit 501(c)(3), largest nonprofit ski area in the US · Powder Alliance/Freedom Pass · ⚠️ CLOSED EARLY for 2025-26 on Mar 22, 2026 due to unseasonably warm weather.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },
  { id: "boise",                     name: "Boise",                     latitude: 43.61583, longitude: -116.20167, elevation: 824,  description: "Idaho's state capital, roughly 45 minutes' drive from Bogus Basin via Bogus Basin Road.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },

  // Donnelly / McCall, ID · one base town (Donnelly) serving two resorts. Mountain timezone.
  { id: "tamarack-resort",           name: "Tamarack Resort",           latitude: 44.671, longitude: -116.123, elevation: 1490, description: "Indy Pass (capped redemptions); joining Ikon as a Bonus Mountain from 2026-27 · confirmed 2025-26 season opened Dec 22, 2025 · ⚠️ ownership/financial status is a genuinely unresolved conflict in sources (see roads.ts / region file for detail) — not asserted as fact either way.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },
  { id: "brundage-mountain",         name: "Brundage Mountain",         latitude: 45.00500, longitude: -116.15500, elevation: 2320, description: "Indy Pass member · independent · 70 trails, 6 lifts, no night skiing.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },
  { id: "donnelly",                  name: "Donnelly",                  latitude: 44.73028, longitude: -116.07444, elevation: 1500, description: "Valley County town on ID-55, roughly midway between Tamarack Resort and Brundage Mountain near McCall.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/Boise", region: "US" },

  // New Hampshire · all locations use America/New_York. MWAC offers daily Presidential Range forecasts near Wildcat/Pinkham Notch; it is not an in-bounds resort condition feed.
  { id: "cranmore-mountain", name: "Cranmore Mountain", latitude: 44.0550, longitude: -71.1090, elevation: 518, description: "Ikon Pass Bonus Mountain (Full Pass only, 2 days with blackouts) · White Mountain Superpass · confirmed 2025-26 season Nov 28-29, 2025 - Apr 5, 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "wildcat-mountain", name: "Wildcat Mountain", latitude: 44.2590, longitude: -71.2370, elevation: 1238, description: "Epic Pass · Vail Resorts-owned · confirmed 2025-26 season Nov 26, 2025 - Apr 12, 2026 · ⚠️ no distinct live official webcam URL confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "attitash-mountain-resort", name: "Attitash Mountain Resort", latitude: 44.0820, longitude: -71.2290, elevation: 716, description: "Epic Pass · Vail Resorts-owned · confirmed 2025-26 season Dec 6, 2025 - Apr 5, 2026 · ⚠️ no distinct first-party snow-report or live webcam URL confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "north-conway", name: "North Conway", latitude: 44.0537, longitude: -71.1289, elevation: 159, description: "Mount Washington Valley base town for Cranmore, Attitash and Wildcat.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "cannon-mountain", name: "Cannon Mountain", latitude: 44.1569, longitude: -71.6980, elevation: 1244, description: "Indy Pass · the United States' only state-owned ski area · White Mountain Superpass · confirmed 2025-26 season Nov 22, 2025 - Apr 12, 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "bretton-woods", name: "Bretton Woods", latitude: 44.2600, longitude: -71.4410, elevation: 945, description: "Independent Omni-owned resort · anchors the White Mountain Superpass · first NH resort to open in 2025-26 (Nov 15, 2025), closed by Apr 12, 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "loon-mountain", name: "Loon Mountain", latitude: 44.0360, longitude: -71.6220, elevation: 930, description: "Boyne Resorts-owned · Ikon Pass (7 days Full / 5 days Base, Base blackouts) · confirmed 2025-26 season Nov 21, 2025 - approx. Apr 19, 2026.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "franconia", name: "Franconia", latitude: 44.2270, longitude: -71.7470, elevation: 274, description: "Franconia Notch gateway town for Cannon Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "bretton-woods-town", name: "Bretton Woods", latitude: 44.2580, longitude: -71.4410, elevation: 505, description: "Base village for Bretton Woods and a Franconia Notch lodging gateway.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "waterville-valley-resort", name: "Waterville Valley Resort", latitude: 43.9500, longitude: -71.5140, elevation: 1170, description: "Indy Pass (no blackouts on Indy Base) · White Mountain Superpass · confirmed 2025-26 opening weekend Nov 28-30, 2025 · ⚠️ closing date not confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "waterville-valley-town", name: "Waterville Valley", latitude: 43.9500, longitude: -71.4990, elevation: 465, description: "Mountain base village reached from I-93 via NH-49.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "gunstock-mountain-resort", name: "Gunstock Mountain Resort", latitude: 43.5270, longitude: -71.3690, elevation: 684, description: "Belknap County-owned, no major-pass affiliation · confirmed 2025-26 season Dec 5, 2025 - Apr 30, 2026 · historical 2022 county-governance turmoil, operations have continued normally since.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "gilford", name: "Gilford", latitude: 43.5480, longitude: -71.4060, elevation: 174, description: "Lake Winnipesaukee-side base town for Gunstock Mountain Resort.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  // Maine · all locations use America/New_York. Maine has no dedicated avalanche forecasting or observation authority; do not infer MWAC coverage across the state line.
  { id: "sugarloaf", name: "Sugarloaf", latitude: 45.031, longitude: -70.314, elevation: 1291, description: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · confirmed 2025-26 season Nov 21, 2025 - Apr 26, 2026 · ⚠️ webcam sub-URL was unconfirmed/404; official mountain report only.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "carrabassett-valley-town", name: "Carrabassett Valley", latitude: 45.085, longitude: -70.265, elevation: 318, description: "Western Maine base town for Sugarloaf.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "sunday-river", name: "Sunday River", latitude: 44.473, longitude: -70.856, elevation: 957, description: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · confirmed 2025-26 season Nov 12-13, 2025 - Apr 18-19, 2026 · ⚠️ webcam sub-URL was unconfirmed/404; official mountain report only.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "newry", name: "Newry", latitude: 44.499, longitude: -70.800, elevation: 259, description: "Western Maine base town for Sunday River's eight peaks.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  // HONESTY GATE: Saddleback closed 2015-2020 under prior ownership, reopened Dec 2020 under Arctaris and was SKI Magazine readers' #1 East resort for 2025. It is operating normally; exact 2025-26 closing date was not confirmed.
  { id: "saddleback-mountain", name: "Saddleback Mountain", latitude: 44.936, longitude: -70.510, elevation: 1256, description: "Arctaris-owned independent · Indy Pass (no blackouts) · opened Dec 5, 2025 · ⚠️ exact 2025-26 closing date unconfirmed. Verified turnaround: reopened Dec 2020 after a five-year closure and named SKI Magazine readers' #1 East resort for 2025. Official webcam page exists; individual live stream URLs/status are unconfirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "rangeley", name: "Rangeley", latitude: 44.966, longitude: -70.644, elevation: 468, description: "Rangeley Lakes gateway town for Saddleback Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  // New York · all locations use America/New_York. No dedicated daily avalanche forecast authority exists; DEC issues only irregular Adirondack High Peaks backcountry advisories, not resort terrain bulletins.
  { id: "whiteface-mountain", name: "Whiteface Mountain", latitude: 44.365, longitude: -73.902, elevation: 1483, description: "ORDA state-owned · shared SKI3 pass with Gore and Belleayre · new Mountain Collective partner for 2025-26 · opened Nov 15, 2025 · ⚠️ 2025-26 closing date and distinct live webcam URL unconfirmed. Advertised total vertical 3,430 ft includes hike-to Slides; lift-served vertical is ~3,166 ft.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "lake-placid", name: "Lake Placid", latitude: 44.279, longitude: -73.979, elevation: 549, description: "Olympic Adirondack base town for Whiteface Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "wilmington", name: "Wilmington", latitude: 44.387, longitude: -73.817, elevation: 373, description: "Whiteface Mountain's immediate Adirondack base town.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "gore-mountain", name: "Gore Mountain", latitude: 43.673, longitude: -74.016, elevation: 1097, description: "ORDA state-owned · shared SKI3 pass with Whiteface and Belleayre · Nov 21-22, 2025 - Apr 12-13, 2026 (one-day secondary-source discrepancy) · official Base Area Webcam confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "north-creek", name: "North Creek", latitude: 43.697, longitude: -73.985, elevation: 310, description: "Adirondack base town for Gore Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "hunter-mountain", name: "Hunter Mountain", latitude: 42.204, longitude: -74.225, elevation: 975, description: "Vail Resorts-owned · Epic Pass · opened Nov 22, 2025 · ⚠️ projected Apr 13, 2026 close is not resort-confirmed · official live camera page confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "hunter", name: "Hunter", latitude: 42.214, longitude: -74.213, elevation: 485, description: "Catskills base town for Hunter Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  // HONESTY GATE — WINDHAM: Officially left Ikon for 2025-26, first resort ever to leave the network. Private semi-private club with reported $175k-$200k memberships; 2025-26 public access is restricted/season-dependent. Official 1,600 ft vertical is disputed by community GPS/Google Earth estimates near 1,400-1,450 ft; neither is silently substituted.
  { id: "windham-mountain", name: "Windham Mountain Club", latitude: 42.289, longitude: -74.257, elevation: 945, description: "Private semi-private club · officially exited Ikon for 2025-26 (first resort ever to leave); not Epic, Indy or Mountain Collective · reported $175k-$200k memberships and restricted public access — verify before travel. Official 1,600 ft vertical (1,500-3,100 ft) is disputed by community estimates of ~1,400-1,450 ft. Official camera URLs exist but live status is unconfirmed/offline reports. Nov 28, 2025 opening; projected Apr 13 close is unconfirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "windham", name: "Windham", latitude: 42.309, longitude: -74.251, elevation: 465, description: "Catskills base town; verify current Windham Mountain Club public access before travel.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "belleayre-mountain", name: "Belleayre Mountain", latitude: 42.139, longitude: -74.505, elevation: 1045, description: "ORDA state-owned · shared SKI3 pass with Whiteface and Gore · opened Nov 21-22, 2025 · ⚠️ projected Apr 13, 2026 close is not resort-confirmed · official webcam page confirmed.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
  { id: "highmount", name: "Highmount", latitude: 42.147, longitude: -74.514, elevation: 536, description: "Catskills base settlement for Belleayre Mountain.", bomStation: "", bomStationId: "", bomWmoId: 0, timezone: "America/New_York", region: "US" },
];

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

function getWeatherDescription(code: number): string {
  return WEATHER_DESCRIPTIONS[code] || "Unknown";
}

interface BomObservation {
  air_temp: number | null;
  apparent_t: number | null;
  dewpt: number | null;
  rel_hum: number | null;
  wind_spd_kmh: number | null;
  wind_dir: string | null;
  gust_kmh: number | null;
  press: number | null;
  press_msl: number | null;
  rain_trace: string | null;
  cloud: string | null;
  cloud_oktas: number | null;
  vis_km: string | null;
  weather: string | null;
  local_date_time: string | null;
  local_date_time_full: string | null;
  aifstime_utc: string | null;
  name: string;
}

function bomCloudToDescription(cloud: string | null | undefined, weather: string | null | undefined, openMeteoCode?: number): string {
  if (weather && weather !== "-") return weather;
  if (cloud && cloud !== "-") {
    const c = cloud.toLowerCase();
    if (c === "clear") return "Clear sky";
    if (c === "sunny") return "Sunny";
    if (c.includes("partly")) return "Partly cloudy";
    if (c.includes("mostly")) return "Mostly cloudy";
    if (c.includes("cloudy") || c.includes("overcast")) return "Overcast";
    return cloud;
  }
  if (openMeteoCode !== undefined) return getWeatherDescription(openMeteoCode);
  return "Unknown";
}

function windDirToDegrees(dir: string | null): number {
  if (!dir || dir === "-" || dir === "CALM") return 0;
  const dirs: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5
  };
  return dirs[dir.toUpperCase()] ?? 0;
}

async function fetchBomObservations(wmoId: number, product = "IDN60801"): Promise<BomObservation[] | null> {
  if (!wmoId) return null;
  try {
    const response = await fetch(
      `http://www.bom.gov.au/fwo/${product}/${product}.${wmoId}.json`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; SnowyMtsWeatherApp/1.0)" } }
    );
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data?.observations?.data ?? null;
  } catch {
    return null;
  }
}

// BOM stations sometimes drop offline for hours. Treat any reading older than
// this as stale so we don't display an old daytime peak as "current".
const BOM_MAX_AGE_MS = 90 * 60 * 1000; // 90 minutes

function isBomReadingFresh(obs: BomObservation | null | undefined): boolean {
  // Prefer the UTC timestamp BOM provides; falling back to local-time would
  // misinterpret the timezone on a UTC server and let stale data through.
  const utc = obs?.aifstime_utc;
  if (!utc || utc.length < 12) return false;
  const iso = `${utc.slice(0, 4)}-${utc.slice(4, 6)}-${utc.slice(6, 8)}T${utc.slice(8, 10)}:${utc.slice(10, 12)}:00Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms <= BOM_MAX_AGE_MS;
}

function parseBomDateTime(dtStr: string): Date {
  const year = parseInt(dtStr.slice(0, 4));
  const month = parseInt(dtStr.slice(4, 6)) - 1;
  const day = parseInt(dtStr.slice(6, 8));
  const hour = parseInt(dtStr.slice(8, 10));
  const minute = parseInt(dtStr.slice(10, 12));
  return new Date(year, month, day, hour, minute);
}

function safeParseFloat(val: string | null | undefined): number | undefined {
  if (!val || val === "-" || val === "T" || val.trim() === "") return undefined;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : undefined;
}

async function fetchLocationWeather(location: LocationConfig, snowElevationM?: number) {
  // Headline snow can be requested at an on-mountain elevation (the client
  // passes the mid-mountain height). Snow-vs-rain hinges on elevation vs the
  // freezing level. All snow figures below are re-derived from the hourly
  // freezing level at the snow-outlook elevation (same physics as the
  // Elevation forecast bands) so the headline and the bands tell ONE snow
  // story; everything else (temp, feels-like, current condition, BOM
  // reconciliation, freezing level) stays at the village - that is the
  // feelzlike premise of what you feel when you arrive.
  const wantsMountainSnow =
    typeof snowElevationM === "number" && Number.isFinite(snowElevationM);

  const [openMeteoResult, bomObs, bomSecondaryObs] = await Promise.all([
    fetchOpenMeteo(location).catch(() => null),
    fetchBomObservations(location.bomWmoId, location.bomProduct),
    location.bomSecondaryWmoId
      ? fetchBomObservations(location.bomSecondaryWmoId, location.bomProduct)
      : Promise.resolve(null),
  ]);

  // Forecast-source fallback: Open-Meteo is primary, but it periodically
  // returns gateway 502s / throttles our egress IP. When it's down, every
  // non-BOM location (all of VHC, Tasmania, Japan and the AU gateway towns)
  // would otherwise hard-fail. Fall back to OpenWeatherMap, reshaped into
  // the same payload, so those pages keep serving live conditions.
  let openMeteoData = openMeteoResult;
  let forecastSource = "Open-Meteo";
  if (!openMeteoData) {
    openMeteoData = await fetchOpenWeatherMapAsOpenMeteo(location).catch(() => null);
    if (openMeteoData) forecastSource = "OpenWeatherMap";
  }

  if (!openMeteoData && !bomObs && !bomSecondaryObs) {
    throw new Error(`No weather data available for ${location.name} from any source`);
  }

  // Only trust BOM readings that are recent - stale stations cause the
  // wildly inconsistent temperatures we were seeing across resorts.
  const freshPrimary = bomObs?.[0] && isBomReadingFresh(bomObs[0]) ? bomObs[0] : null;
  const freshSecondary = bomSecondaryObs?.[0] && isBomReadingFresh(bomSecondaryObs[0]) ? bomSecondaryObs[0] : null;
  const latestBom = freshPrimary;
  const latestSecondary = freshSecondary;

  const bomTemp = latestBom?.air_temp ?? latestSecondary?.air_temp;
  const bomFeelsLike = latestBom?.apparent_t ?? latestSecondary?.apparent_t;
  const bomHumidity = latestBom?.rel_hum ?? latestSecondary?.rel_hum;
  const bomWindSpeed = latestBom?.wind_spd_kmh ?? latestSecondary?.wind_spd_kmh;
  const bomWindDir = latestBom?.wind_dir ?? latestSecondary?.wind_dir;
  const bomGust = latestBom?.gust_kmh ?? latestSecondary?.gust_kmh;
  const bomPressure = latestBom?.press_msl ?? latestSecondary?.press_msl ?? latestBom?.press ?? latestSecondary?.press;
  const bomCloud = latestBom?.cloud ?? latestSecondary?.cloud;
  const bomWeather = latestBom?.weather ?? latestSecondary?.weather;
  const bomVis = latestBom?.vis_km ?? latestSecondary?.vis_km;
  const bomRain = latestBom?.rain_trace ?? latestSecondary?.rain_trace;
  const bomDewpoint = latestBom?.dewpt ?? latestSecondary?.dewpt;
  const bomObsTime = latestBom?.local_date_time_full ?? latestSecondary?.local_date_time_full;
  const bomStationName = latestBom?.name ?? latestSecondary?.name ?? location.bomStation;

  const hasBomData = bomTemp !== null && bomTemp !== undefined;
  const om = openMeteoData;

  // ── Freezing-level phase partition for all snow figures ────────────────
  // Open-Meteo's own snowfall decides rain-vs-snow at its grid cell's
  // terrain, which routinely calls sub-zero mountain precip "rain" (e.g.
  // Whakapapa: 7cm raw vs 21cm partitioned on the same day the Elevation
  // forecast showed 21cm). Re-derive snow from hourly precip + freezing
  // level at the snow-outlook elevation — the exact physics the Elevation
  // forecast bands use — so every surface tells one story. Fail-soft: hours
  // or days without a usable freezing level keep the model's own figures
  // (the OWM fallback shape has no freezing level at all).
  const snowOutlookElevM = wantsMountainSnow ? snowElevationM! : location.elevation;
  const phaseSnowHourly: (number | null)[] | null =
    Array.isArray(om?.hourly?.time) &&
    Array.isArray(om?.hourly?.precipitation) &&
    Array.isArray(om?.hourly?.freezing_level_height)
      ? partitionHourlySnowfallCm(
          om.hourly.precipitation,
          om.hourly.freezing_level_height,
          snowOutlookElevM,
        )
      : null;
  const phaseByDay =
    phaseSnowHourly != null
      ? partitionPrecipByBand(
          om.hourly.time,
          om.hourly.precipitation,
          om.hourly.freezing_level_height,
          snowOutlookElevM,
        )
      : null;
  // Only trust the day partition for days FULLY covered by hourly rows -
  // a partially covered trailing day would report an undercounted total as
  // confident. (The first day is fully covered because past_hours=24 spans
  // back beyond local midnight.)
  const phaseDayHourCounts =
    phaseSnowHourly != null ? hourCountsByDay(om.hourly.time as string[]) : new Map<string, number>();

  const current = {
    temperature: hasBomData ? bomTemp : (om?.current?.temperature_2m ?? 0),
    feelsLike: bomFeelsLike ?? om?.current?.apparent_temperature ?? (hasBomData ? bomTemp : 0),
    humidity: bomHumidity ?? om?.current?.relative_humidity_2m ?? 0,
    windSpeed: bomWindSpeed ?? om?.current?.wind_speed_10m ?? 0,
    windDirection: bomWindDir ? windDirToDegrees(bomWindDir) : (om?.current?.wind_direction_10m ?? 0),
    windDirectionCompass: bomWindDir ?? undefined,
    windGust: bomGust ?? undefined,
    weatherCode: om?.current?.weather_code ?? 0,
    weatherDescription: hasBomData
      ? bomCloudToDescription(bomCloud, bomWeather, om?.current?.weather_code)
      : getWeatherDescription(om?.current?.weather_code ?? 0),
    isDay: om?.current?.is_day === 1,
    // Open-Meteo current.snow_depth is in METRES; the app's canonical snow
    // depth unit is CM (UI labels, NO_SNOW_CM gate, JP snow_depth_cm all cm).
    // Unknown depth is OMITTED (undefined), never coerced to 0 - a confident
    // zero falsely reads as "no skiable base" downstream (skiSeason contract:
    // null/undefined = unknown, never forces closure).
    snowDepth: typeof om?.current?.snow_depth === "number"
      ? Math.round(om.current.snow_depth * 100)
      : undefined,
    precipitation: om?.current?.precipitation ?? 0,
    cloudCover: om?.current?.cloud_cover ?? 0,
    visibility: (() => { const v = safeParseFloat(bomVis); return v !== undefined ? v * 1000 : (om ? 10000 : undefined); })(),
    pressure: bomPressure ?? undefined,
    dewpoint: bomDewpoint ?? undefined,
    rainSince9am: safeParseFloat(bomRain),
    dataSource: hasBomData ? "BOM" : forecastSource,
    bomStation: bomStationName,
    bomObservationTime: bomObsTime ?? undefined,
    freezingLevel: (() => {
      const v = om?.current?.freezing_level_height;
      return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : undefined;
    })(),
    // Model-estimated snow over the previous 24 full hours ("what fell
    // overnight"). undefined when the source has no past hours (OWM
    // fallback) - unknown must never render as a confident 0.
    snowfallPast24h: sumHourlySnowfallPast24h(om, phaseSnowHourly),
    snowfallNext24h: sumHourlySnowfall(om, 24, phaseSnowHourly),
    snowfallNext48h: sumHourlySnowfall(om, 48, phaseSnowHourly),
    snowfallNext72h: sumHourlySnowfall(om, 72, phaseSnowHourly),
    // Snow outlook elevation provenance. The snow figures are partitioned at
    // the requested on-mountain elevation when the client provides one,
    // otherwise at the location's own registry elevation.
    // Provenance stays honest: only claim "mid-mountain" when the phase
    // partition actually ran (an OWM fallback has no freezing level, so its
    // figures are the model's own - labelling those mid-mountain would
    // present village-phase snow as mountain snow).
    snowfallOutlookElevationM:
      phaseSnowHourly != null ? Math.round(snowOutlookElevM) : location.elevation,
    snowfallOutlookLevel:
      wantsMountainSnow && phaseSnowHourly != null ? "mid-mountain" : "village",
  };

  // AU live-observation reconciliation. Alpine AWS report real temp/humidity and a
  // rain gauge, but not cloud/present-weather/visibility - so the global model can
  // headline "Clear sky" while a station sits at 100% humidity in falling snow. When
  // BOM data is present and the model's current code is "dry", derive a truthful
  // condition from the BOM signals (DRY->WET/cloud only; never turns wet readings dry).
  const freshBomRows = freshPrimary ? bomObs : freshSecondary ? bomSecondaryObs : null;
  if (hasBomData && freshBomRows) {
    try {
      const reco = reconcileBomCondition({
        rows: freshBomRows,
        modelWeatherCode: current.weatherCode,
      });
      if (reco) {
        current.weatherCode = reco.weatherCode;
        current.weatherDescription = getWeatherDescription(reco.weatherCode);
        if (reco.precipitationMm != null) {
          current.precipitation = Math.max(current.precipitation ?? 0, reco.precipitationMm);
        }
      }
    } catch {
      // fail-soft: a reconciliation hiccup must never break base weather.
    }
  }

  // NZ live-observation reconciliation. New Zealand has no AWS feed, so we use
  // airport METAR (NOAA Aviation Weather Center). Only fires for NZ locations that
  // are genuinely co-located with an airport (valley towns like Queenstown/Wanaka);
  // high alpine resorts fail the distance/elevation gate and keep the model reading.
  if (location.region === "NZ") {
    try {
      const override = await reconcileNzMetarDryToWet({
        lat: location.latitude,
        lon: location.longitude,
        modelWeatherCode: current.weatherCode,
        tempC: current.temperature,
        refElevationM: location.elevation ?? null,
      });
      if (override) {
        current.weatherCode = override.weatherCode;
        current.weatherDescription = getWeatherDescription(override.weatherCode);
        const obsMm = Math.round(override.rateMmh * 10) / 10;
        if (obsMm > 0) current.precipitation = Math.max(current.precipitation ?? 0, obsMm);
        current.dataSource = `METAR · ${override.stationName}`;
      }
    } catch {
      // fail-soft: a reconciliation hiccup must never break base weather.
    }
  }

  const daily = om?.daily?.time?.map((date: string, i: number) => {
    // Freezing-level partitioned figures for this day; fall back to the
    // model's own sums when the partition had no usable freezing level
    // (mirrors the Elevation forecast's buildBand fallback).
    const phase =
      (phaseDayHourCounts.get(date) ?? 0) >= 24 ? phaseByDay?.get(date) : undefined;
    const daySnowCm = phase?.reliable ? phase.snowfallCm : om.daily.snowfall_sum[i];
    const dayRainMm = phase?.reliable ? phase.rainfallMm : dailyRainSum(om.daily, i);
    return {
    date,
    maxTemp: om.daily.temperature_2m_max[i],
    minTemp: om.daily.temperature_2m_min[i],
    weatherCode: om.daily.weather_code[i],
    // Daily label derives from the day's TOTALS, not the raw WMO code — the
    // daily code is the most-severe MOMENT of the day, so it calls a 2.7cm
    // day "Heavy snow fall" and a steady 17cm day plain "Snow".
    weatherDescription: dailyConditionLabel({
      code: om.daily.weather_code[i],
      snowfallCm: daySnowCm,
      rainMm: dayRainMm,
      fallback: getWeatherDescription(om.daily.weather_code[i]),
    }),
    precipitationSum: om.daily.precipitation_sum[i],
    // True liquid rain (rain + showers, phase-partitioned). Open-Meteo's
    // precipitation_sum INCLUDES the water equivalent of snowfall, so clients
    // must never label it "rain" — on a snow day that double-reports the
    // snow as rain.
    rainSum: dayRainMm,
    snowfallSum: daySnowCm,
    windSpeedMax: om.daily.wind_speed_10m_max[i],
    uvIndexMax: om.daily.uv_index_max?.[i] ?? 0,
    sunrise: om.daily.sunrise[i],
    sunset: om.daily.sunset[i]
    };
  }) ?? [];

  const bomHourlyData = buildBomHourly(bomObs, bomSecondaryObs);
  // Build the Open-Meteo hourly array (next 72h forecast). past_hours=24 (for
  // the "snow last 24h" stat) adds the previous day of model rows to the OM
  // response - keep them OUT of this payload: past hours in `hourly` have
  // always meant real BOM observations, and downstream consumers assume the
  // OM rows start at the current hour.
  const omPastCutoffMs = Date.now() - 60 * 60 * 1000;
  const omOffsetSec = Number(om?.utc_offset_seconds) || 0;
  const omHourlyAll: any[] = (om?.hourly?.time?.map((time: string, i: number) => ({
    time,
    temperature: om.hourly.temperature_2m[i],
    weatherCode: om.hourly.weather_code[i],
    weatherDescription: getWeatherDescription(om.hourly.weather_code[i]),
    precipitation: om.hourly.precipitation[i],
    // Freezing-level partitioned snow (same story as `current` + `daily`);
    // hours without a usable FL keep the model's own value.
    snowfall: (typeof phaseSnowHourly?.[i] === "number"
      ? Math.round((phaseSnowHourly[i] as number) * 10) / 10
      : om.hourly.snowfall?.[i]) ?? 0,
    windSpeed: om.hourly.wind_speed_10m[i],
    humidity: om.hourly.relative_humidity_2m[i],
    feelsLike: om.hourly.apparent_temperature[i],
    cloudCover: om.hourly.cloud_cover[i]
  })) ?? []).filter((h: any) => {
    const localAsUtcMs = Date.parse(h.time + "Z");
    if (Number.isNaN(localAsUtcMs)) return false;
    const utcMs = localAsUtcMs - omOffsetSec * 1000;
    // Serve the same ~72h forward strip as before forecast_hours grew to
    // 168 (the extra hours exist only for the 7-day phase partition) -
    // consumers assume a ~72h hourly window.
    return utcMs >= omPastCutoffMs && utcMs <= omPastCutoffMs + 73 * 60 * 60 * 1000;
  });
  // Merge BOM past observations with Open-Meteo future forecast so a single
  // `hourly` array serves both the existing 24h-trend chart (past) and the
  // new "Next 48 hours" strip (future). When BOM is unavailable (JP, dropouts)
  // Open-Meteo covers the full window. We dedupe by hour-string: any BOM hour
  // that overlaps an OM hour wins (real observation > model).
  const bomHours = new Set(bomHourlyData.map((h: any) => h.time));
  const omFuture = omHourlyAll.filter((h: any) => !bomHours.has(h.time));
  const hourly = [...bomHourlyData, ...omFuture];

  return {
    location: {
      id: location.id,
      name: location.name,
      elevation: location.elevation,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
      bomStation: bomStationName,
      bomStationId: location.bomStationId
    },
    current,
    daily,
    hourly,
    // Open-Meteo returns hourly `time` as naive ISO in this timezone (no
    // offset). The client uses this to do timezone-safe past/future filtering
    // for the "Next 48 hours" strip regardless of the viewer's browser TZ.
    utcOffsetSeconds: Number(om?.utc_offset_seconds) || 0,
    lastUpdated: new Date().toISOString()
  };
}

function buildBomHourly(
  primary: BomObservation[] | null,
  secondary: BomObservation[] | null
): any[] {
  const obs = primary ?? secondary;
  if (!obs || obs.length === 0) return [];

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const hourlyReadings: any[] = [];
  const seenHours = new Set<string>();

  for (const reading of obs) {
    if (!reading.local_date_time_full) continue;
    const dt = parseBomDateTime(reading.local_date_time_full);
    if (dt < cutoff) break;

    const hourKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:00`;
    if (seenHours.has(hourKey)) continue;
    seenHours.add(hourKey);

    const secReading = secondary?.find(s =>
      s.local_date_time_full === reading.local_date_time_full
    );

    const temp = reading.air_temp ?? secReading?.air_temp;
    if (temp === null || temp === undefined) continue;

    hourlyReadings.push({
      time: hourKey,
      temperature: temp,
      weatherCode: 0,
      weatherDescription: bomCloudToDescription(
        reading.cloud ?? secReading?.cloud,
        reading.weather ?? secReading?.weather
      ),
      precipitation: 0,
      snowfall: 0,
      windSpeed: reading.wind_spd_kmh ?? secReading?.wind_spd_kmh ?? 0,
      humidity: reading.rel_hum ?? secReading?.rel_hum ?? 0,
      feelsLike: reading.apparent_t ?? secReading?.apparent_t ?? temp,
      cloudCover: (reading.cloud_oktas ?? secReading?.cloud_oktas ?? 0) * 12.5
    });
  }

  return hourlyReadings.reverse();
}

// Aggregate the next N hours of snowfall (cm of fresh snow per Open-Meteo).
// Open-Meteo returns `hourly.time` as naive ISO strings ("YYYY-MM-DDTHH:MM")
// in the requested `timezone`, with NO offset suffix. Date.parse() on the
// server treats those as UTC, which would shift the window by ~10h on a UTC
// host. We use the response's `utc_offset_seconds` to convert each local
// timestamp into a true UTC instant before comparing against `Date.now()`.
// Both window sums prefer the freezing-level-partitioned hourly snow when
// available (phaseSnow entry: number = partitioned cm, null = no usable FL
// for that hour → fall back to the model's own snowfall value).
function hourlySnowAt(arr: any[], phaseSnow: (number | null)[] | null, i: number): number {
  const p = phaseSnow?.[i];
  if (typeof p === "number") return p;
  const v = Number(arr[i]);
  return Number.isFinite(v) ? v : 0;
}

function sumHourlySnowfall(
  om: any,
  hours: number,
  phaseSnow: (number | null)[] | null = null,
): number | undefined {
  const arr = om?.hourly?.snowfall;
  const times = om?.hourly?.time;
  if (!Array.isArray(arr) || !Array.isArray(times)) return undefined;
  const offsetSec = Number(om?.utc_offset_seconds) || 0;
  const nowMs = Date.now();
  // Allow the current hour bucket (which may have started up to 1h ago).
  const cutoffMs = nowMs - 60 * 60 * 1000;
  let total = 0;
  let counted = 0;
  for (let i = 0; i < arr.length && counted < hours; i++) {
    // Parse the naive local string as if UTC, then subtract the timezone
    // offset to recover the real UTC instant.
    const localAsUtcMs = Date.parse(times[i] + "Z");
    if (Number.isNaN(localAsUtcMs)) continue;
    const t = localAsUtcMs - offsetSec * 1000;
    if (t < cutoffMs) continue;
    total += hourlySnowAt(arr, phaseSnow, i);
    counted++;
  }
  if (counted === 0) return undefined;
  return Math.round(total * 10) / 10;
}

// Sum the PREVIOUS 24 full hour buckets - the window ending where
// sumHourlySnowfall's "next" window begins (the in-progress hour belongs to
// the next-24h figure), so the two stats never overlap or double count.
// Requires the request to have asked for `past_hours=24`; returns undefined
// when no past buckets exist (OWM fallback) - unknown never renders as 0.
function sumHourlySnowfallPast24h(
  om: any,
  phaseSnow: (number | null)[] | null = null,
): number | undefined {
  const arr = om?.hourly?.snowfall;
  const times = om?.hourly?.time;
  if (!Array.isArray(arr) || !Array.isArray(times)) return undefined;
  const offsetSec = Number(om?.utc_offset_seconds) || 0;
  const endMs = Date.now() - 60 * 60 * 1000;
  const startMs = endMs - 24 * 60 * 60 * 1000;
  let total = 0;
  let counted = 0;
  for (let i = 0; i < arr.length; i++) {
    const localAsUtcMs = Date.parse(times[i] + "Z");
    if (Number.isNaN(localAsUtcMs)) continue;
    const t = localAsUtcMs - offsetSec * 1000;
    if (t < startMs || t >= endMs) continue;
    total += hourlySnowAt(arr, phaseSnow, i);
    counted++;
  }
  if (counted === 0) return undefined;
  return Math.round(total * 10) / 10;
}

// rain_sum + showers_sum for day i, or null when the upstream response has
// neither (e.g. the OWM fallback shape, which only provides rain_sum).
function dailyRainSum(daily: any, i: number): number | null {
  const rain = daily?.rain_sum?.[i];
  const showers = daily?.showers_sum?.[i];
  if (rain == null && showers == null) return null;
  return Math.round(((Number(rain) || 0) + (Number(showers) || 0)) * 10) / 10;
}

async function fetchOpenMeteo(location: LocationConfig) {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    // Critical: pass the resort's true elevation so Open-Meteo lapse-rate-corrects
    // the temperature instead of returning the model's grid-cell surface value.
    elevation: location.elevation.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,snow_depth,freezing_level_height",
    hourly: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,snowfall,freezing_level_height",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,rain_sum,showers_sum,snowfall_sum,wind_speed_10m_max,uv_index_max",
    timezone: location.timezone ?? "Australia/Sydney",
    // AU ski season (opened Jun 2026) runs the premium "extended" outlook out
    // to 14 days · Open-Meteo's reliable ceiling is ~16, and accuracy past ~10
    // is low so we stop at 14. JP resorts keep the 7-day window (their UI caps
    // the outlook at 6 days anyway). Snowy Mtns entries have no `region` set →
    // treated as AU. Free strips still slice(0,5)/slice(1,7), so only the AU
    // resort premium section surfaces the extra days.
    forecast_days: location.region === "JP" ? "7" : "14",
    // 168 hours (7 days) so the freezing-level phase partition covers the
    // full 7-day outlook the clients display (and the Elevation forecast
    // bands mirror). The served hourly[] payload is still capped to 72h
    // below - consumers assume a ~72h strip. Days 8-14 (AU premium extended
    // outlook only) keep the model's own sums; no band panel shows them, so
    // there is no side-by-side story to contradict.
    forecast_hours: "168",
    // Previous day of hourly buckets so we can derive "snow last 24h"
    // (what fell overnight). Kept OUT of the merged `hourly` payload.
    past_hours: "24"
  });

  // Bound the request: when Open-Meteo's gateway is degraded it can hang for
  // tens of seconds, which would stall the whole page before the
  // OpenWeatherMap fallback even gets a chance to run. Fail fast instead.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    return await response.json() as any;
  } finally {
    clearTimeout(timer);
  }
}

router.get("/weather", async (req, res) => {
  try {
    const region = parseRegionParam(req.query["region"]);
    const sources = region
      ? LOCATIONS.filter((loc) => locationMatchesRegion(loc.id, region))
      : LOCATIONS;

    // Use allSettled so a single Open-Meteo / BOM hiccup at one resort
    // doesn't take down the entire /weather feed (which the AU dashboard
    // depends on). Failed locations are dropped from the list and logged.
    const settled = await Promise.all(
      sources.map(async (loc) => {
        try {
          return await fetchLocationWeather(loc);
        } catch (err) {
          console.warn(
            `[weather] dropping ${loc.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
          return null;
        }
      }),
    );
    const locations = settled.filter((x): x is NonNullable<typeof x> => x !== null);

    const result = GetWeatherResponse.parse({
      locations,
      lastUpdated: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    if (error instanceof RegionParamError) {
      res.status(400).json({ error: "INVALID_REGION", message: error.message });
      return;
    }
    res.status(500).json({
      error: "WEATHER_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch weather data"
    });
  }
});

// ── Per-location weather cache ───────────────────────────────────────────
// Weather upstreams (Open-Meteo, OpenWeatherMap, BOM) all have intermittent
// outages. Caching the assembled payload lets us (a) cut upstream request
// volume - which matters because Open-Meteo throttles our egress IP - and
// (b) serve the last good reading when a refresh fails, instead of handing
// the client a 500 that leaves it stuck on "Loading mountain conditions...".
interface WeatherCacheEntry {
  data: unknown;
  freshUntil: number; // serve straight from cache until this time
  staleUntil: number; // still serveable as a fallback when upstreams fail
}
const WEATHER_FRESH_MS = 10 * 60 * 1000; // 10 minutes
const WEATHER_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours
const weatherCache = new Map<string, WeatherCacheEntry>();
const weatherInflight = new Map<string, Promise<unknown>>();

/**
 * Optional on-mountain snow-outlook elevation, in metres. Lenient: an absent
 * or malformed value falls back to the village figure rather than 400-ing, so
 * the all-resorts dashboard (which never passes it) is unaffected.
 */
function parseSnowElevationParam(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const v = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(v) || v < 1 || v > 9000) return undefined;
  return Math.round(v);
}

async function getLocationWeatherCached(
  location: LocationConfig,
  snowElevationM?: number,
): Promise<unknown> {
  const now = Date.now();
  // Key the cache on the requested snow elevation too · a village request and
  // an on-mountain request for the same resort are genuinely different payloads.
  const cacheKey = snowElevationM != null ? `${location.id}@${snowElevationM}` : location.id;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.freshUntil > now) return cached.data;

  // Coalesce concurrent refreshes for the same key into one upstream call.
  let inflight = weatherInflight.get(cacheKey);
  if (!inflight) {
    inflight = (async () => {
      const weatherData = await fetchLocationWeather(location, snowElevationM);
      const result = GetLocationWeatherResponse.parse(weatherData);
      weatherCache.set(cacheKey, {
        data: result,
        freshUntil: Date.now() + WEATHER_FRESH_MS,
        staleUntil: Date.now() + WEATHER_STALE_MS,
      });
      return result;
    })().finally(() => weatherInflight.delete(cacheKey));
    weatherInflight.set(cacheKey, inflight);
  }

  try {
    return await inflight;
  } catch (err) {
    // On a failed refresh, serve the last good reading if it's still within
    // the stale window rather than failing the request outright.
    const fallback = weatherCache.get(cacheKey);
    if (fallback && fallback.staleUntil > now) return fallback.data;
    throw err;
  }
}

router.get("/weather/:locationId", async (req, res) => {
  try {
    // Validate the path-param shape via the generated zod schema (regex
    // `^[a-z0-9-]+$`). The actual id->location resolution still happens
    // against LOCATIONS below, which is the source of truth.
    const { locationId } = GetLocationWeatherParams.parse(req.params);
    const location = LOCATIONS.find(l => l.id === locationId);

    if (!location) {
      res.status(404).json({
        error: "LOCATION_NOT_FOUND",
        message: `Location '${locationId}' not found. Valid locations: ${LOCATIONS.map(l => l.id).join(", ")}`
      });
      return;
    }

    const snowElevationM = parseSnowElevationParam(req.query["snowElevationM"]);
    const result = await getLocationWeatherCached(location, snowElevationM);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "WEATHER_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch weather data"
    });
  }
});

/**
 * Resort-REPORTED snow conditions from the resort's own official feed
 * (pilot: Thredbo XML - see lib/resortSnowReports.ts).
 *
 * ALWAYS answers 200. The shared client fetch throws on any non-2xx and this
 * endpoint is called for every resort detail page, so a 404 for "no feed
 * adapter" would error/retry on all non-pilot resorts. Missing data is
 * `report: null`, never an error status.
 */
router.get("/weather/:locationId/snow-report", async (req, res) => {
  const rawId = String(req.params.locationId ?? "");
  try {
    const { locationId } = GetResortSnowReportParams.parse(req.params);
    // Unknown ids also degrade to null (mirrors the always-200 contract).
    const location = LOCATIONS.find((l) => l.id === locationId);
    if (!location) {
      res.json({ locationId, report: null });
      return;
    }
    const report = await getResortSnowReport(locationId);
    res.json({ locationId, report });
  } catch {
    res.json({ locationId: rawId, report: null });
  }
});

/**
 * Multi-source ensemble forecast: ECMWF + GFS + ICON + BOM ACCESS-G + MET Norway.
 * Returns per-day mean, model spread, confidence rating, and per-source breakdown
 * so the UI can be radically transparent about uncertainty.
 */
router.get("/forecast/:locationId", async (req, res) => {
  try {
    const locationId = String(req.params.locationId ?? "");
    const location = LOCATIONS.find(l => l.id === locationId);
    if (!location) {
      res.status(404).json({ error: "LOCATION_NOT_FOUND" });
      return;
    }
    // Optional on-mountain elevation · keeps the ensemble snow cross-check at
    // the SAME height as the headline outlook so users don't see two numbers.
    const elevationM = parseSnowElevationParam(req.query["elevationM"]);
    const forecastElevation = elevationM ?? location.elevation;
    const ensemble = await getEnsembleForecast({
      latitude: location.latitude,
      longitude: location.longitude,
      elevation: forecastElevation,
      // NZ, CA and US have no dedicated national model in the ensemble ·
      // fall back to the global blend ("OTHER"). JP keeps JMA, everything
      // else is AU.
      region:
        location.region === "JP"
          ? "JP"
          : location.region === "NZ" || location.region === "CA" || location.region === "US"
            ? "OTHER"
            : "AU",
      timezone: location.timezone ?? "Australia/Sydney",
      days: 7,
    });
    res.json({
      location: { id: location.id, name: location.name, elevation: location.elevation },
      forecastElevationM: forecastElevation,
      ...ensemble,
    });
  } catch (error) {
    res.status(500).json({
      error: "ENSEMBLE_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch ensemble forecast",
    });
  }
});

/** All location ids served by `/weather/:locationId`. Source of truth used
 *  by the boot-time location-id contract validator (lib/validate-locations). */
export const WEATHER_LOCATION_IDS = LOCATIONS.map((l) => l.id);

export default router;
