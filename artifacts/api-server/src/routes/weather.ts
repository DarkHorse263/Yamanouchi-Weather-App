import { Router, type IRouter } from "express";
import { GetWeatherResponse, GetLocationWeatherResponse, GetLocationWeatherParams, GetResortSnowReportParams } from "@workspace/api-zod";
import { getResortSnowReport } from "../lib/resortSnowReports";
import { getEnsembleForecast } from "../lib/ensemble-forecast.js";
import { locationMatchesRegion, parseRegionParam, RegionParamError } from "../lib/regions.js";
import { fetchOpenWeatherMapAsOpenMeteo } from "../lib/openweathermap.js";
import { reconcileBomCondition } from "../lib/bom-obs.js";
import { reconcileNzMetarDryToWet } from "../lib/metar-nz.js";

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
  /** Open-Meteo timezone, defaults to "Australia/Sydney". JP locations use "Asia/Tokyo", NZ uses "Pacific/Auckland". */
  timezone?: string;
  /** ISO region code; AU=Australia, JP=Japan, NZ=New Zealand. Used for ensemble model selection + forecast horizon. */
  region?: "AU" | "JP" | "NZ";
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
  // freezing level, so the village figure understates what falls up top. We
  // only fire the extra snowfall-only fetch when the requested elevation is
  // meaningfully above the village; everything else (temp, feels-like, current
  // condition, BOM reconciliation, freezing level) stays at the village - that
  // is the feelzlike premise of what you feel when you arrive.
  const wantsMountainSnow =
    typeof snowElevationM === "number" &&
    Number.isFinite(snowElevationM) &&
    snowElevationM - location.elevation >= 50;

  const [openMeteoResult, bomObs, bomSecondaryObs, mountainSnow] = await Promise.all([
    fetchOpenMeteo(location).catch(() => null),
    fetchBomObservations(location.bomWmoId, location.bomProduct),
    location.bomSecondaryWmoId
      ? fetchBomObservations(location.bomSecondaryWmoId, location.bomProduct)
      : Promise.resolve(null),
    wantsMountainSnow
      ? fetchSnowfallAtElevation(location, snowElevationM!).catch(() => null)
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
    snowfallNext24h: sumHourlySnowfall(om, 24),
    snowfallNext48h: sumHourlySnowfall(om, 48),
    snowfallNext72h: sumHourlySnowfall(om, 72),
    // Snow outlook elevation provenance. Defaults to the village / current
    // elevation; overridden below to the on-mountain figure when the client
    // requests it and the second fetch succeeds (fail-soft keeps village).
    snowfallOutlookElevationM: location.elevation,
    snowfallOutlookLevel: "village",
  };

  // Apply the on-mountain snow outlook when the second fetch succeeded.
  // Fail-soft: if it returned nothing we keep the village figures AND leave
  // the label as "village" - we never present village snow as mountain snow.
  if (wantsMountainSnow && mountainSnow) {
    current.snowfallNext24h = mountainSnow.snow24;
    current.snowfallNext48h = mountainSnow.snow48;
    current.snowfallNext72h = mountainSnow.snow72;
    current.snowfallOutlookElevationM = Math.round(snowElevationM!);
    current.snowfallOutlookLevel = "mid-mountain";
  }

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
        current.dataSource = `METAR \u00b7 ${override.stationName}`;
      }
    } catch {
      // fail-soft: a reconciliation hiccup must never break base weather.
    }
  }

  const daily = om?.daily?.time?.map((date: string, i: number) => ({
    date,
    maxTemp: om.daily.temperature_2m_max[i],
    minTemp: om.daily.temperature_2m_min[i],
    weatherCode: om.daily.weather_code[i],
    weatherDescription: getWeatherDescription(om.daily.weather_code[i]),
    precipitationSum: om.daily.precipitation_sum[i],
    // True liquid rain (rain + showers). Open-Meteo's precipitation_sum
    // INCLUDES the water equivalent of snowfall, so clients must never label
    // it "rain" — on a snow day that double-reports the snow as rain.
    rainSum: dailyRainSum(om.daily, i),
    snowfallSum: om.daily.snowfall_sum[i],
    windSpeedMax: om.daily.wind_speed_10m_max[i],
    uvIndexMax: om.daily.uv_index_max?.[i] ?? 0,
    sunrise: om.daily.sunrise[i],
    sunset: om.daily.sunset[i]
  })) ?? [];

  const bomHourlyData = buildBomHourly(bomObs, bomSecondaryObs);
  // Build the full Open-Meteo hourly array (next 72h forecast).
  const omHourlyAll: any[] = om?.hourly?.time?.map((time: string, i: number) => ({
    time,
    temperature: om.hourly.temperature_2m[i],
    weatherCode: om.hourly.weather_code[i],
    weatherDescription: getWeatherDescription(om.hourly.weather_code[i]),
    precipitation: om.hourly.precipitation[i],
    snowfall: om.hourly.snowfall?.[i] ?? 0,
    windSpeed: om.hourly.wind_speed_10m[i],
    humidity: om.hourly.relative_humidity_2m[i],
    feelsLike: om.hourly.apparent_temperature[i],
    cloudCover: om.hourly.cloud_cover[i]
  })) ?? [];
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
function sumHourlySnowfall(om: any, hours: number): number | undefined {
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
    const v = Number(arr[i]);
    if (Number.isFinite(v)) total += v;
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
    // 72 hours so we can derive next-24/48/72h cumulative snowfall on the server.
    forecast_hours: "72"
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

/**
 * Snowfall-only Open-Meteo fetch at an arbitrary (on-mountain) elevation. Used
 * to derive the headline 24/48/72h snow outlook at the height people actually
 * ski, while the rest of the payload stays at the village. Kept deliberately
 * narrow (hourly snowfall, next 72h) to limit extra upstream volume.
 */
async function fetchSnowfallAtElevation(
  location: LocationConfig,
  elevationM: number,
): Promise<{ snow24?: number; snow48?: number; snow72?: number } | null> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    elevation: Math.round(elevationM).toString(),
    hourly: "snowfall",
    timezone: location.timezone ?? "Australia/Sydney",
    forecast_hours: "72",
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo snowfall API error: ${response.status}`);
    }
    const om = (await response.json()) as any;
    return {
      snow24: sumHourlySnowfall(om, 24),
      snow48: sumHourlySnowfall(om, 48),
      snow72: sumHourlySnowfall(om, 72),
    };
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
      // NZ has no dedicated national model in the ensemble · fall back to the
      // global blend ("OTHER"). JP keeps JMA, everything else is AU.
      region: location.region === "JP" ? "JP" : location.region === "NZ" ? "OTHER" : "AU",
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
