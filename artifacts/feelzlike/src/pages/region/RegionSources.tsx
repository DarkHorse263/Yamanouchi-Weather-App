import { Database, ExternalLink } from "lucide-react";

import { useLanguage, useRegion, LiveBadge, PageHeader } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

/**
 * RegionSources - single source of truth for "where the data comes from".
 *
 * Lifted from the landing-page trust footer (Apr 2026 reset): users on a
 * region need the same attribution available at any time, not only from the
 * landing page. Region-aware: the "Live observations" + "Resort & transport"
 * sections vary by region, while the forecast ensemble + Open-Meteo
 * aggregation block is shared (same models everywhere).
 */

interface SourceLink {
  label: string;
  labelJa?: string;
  url: string;
  detail?: string;
  detailJa?: string;
}

interface SourceGroup {
  title: string;
  titleJa: string;
  blurb?: string;
  blurbJa?: string;
  items: SourceLink[];
}

const FORECAST_ENSEMBLE: SourceGroup = {
  title: "Forecast ensemble",
  titleJa: "予報モデル",
  blurb: "Aggregated via Open-Meteo so you see the consensus, not a single guess.",
  blurbJa: "Open-Meteo経由で集約 - 単一モデルの予測ではなく合意ベースの予報を表示。",
  items: [
    { label: "ECMWF IFS", detail: "Europe", url: "https://www.ecmwf.int/en/forecasts" },
    { label: "GFS", detail: "NOAA, USA", url: "https://www.nco.ncep.noaa.gov/pmb/products/gfs/" },
    { label: "ICON", detail: "DWD, Germany", url: "https://www.dwd.de/EN/research/weatherforecasting/num_modelling/01_num_weather_prediction_modells/icon_description.html" },
    { label: "BOM ACCESS-G", detail: "Australia", url: "http://www.bom.gov.au/nwp/" },
    { label: "JMA Seamless", detail: "Japan", url: "https://www.jma.go.jp/jma/en/Activities/nwp.html" },
    { label: "MET Norway Locationforecast", detail: "Norway", url: "https://api.met.no/" },
    { label: "Open-Meteo aggregator", detail: "open API", url: "https://open-meteo.com" },
  ],
};

/**
 * Canada reference block. Deliberately titled "Official references" rather
 * than "Live observations": no ECCC / Avalanche Canada / DriveBC / 511
 * Alberta feed is wired into a feelzlike reading in this pass, so presenting
 * them alongside the AU/JP live-observation blocks would overclaim. The
 * forecast ensemble below is the only thing actually powering the numbers.
 */
const CA_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "Environment and Climate Change Canada", detail: "national forecasts & warnings", url: "https://weather.gc.ca/" },
    { label: "MSC GeoMet / api.weather.gc.ca", detail: "ECCC open data API", url: "https://api.weather.gc.ca/" },
    { label: "Avalanche Canada", detail: "daily avalanche forecasts", url: "https://avalanche.ca/forecasts" },
  ],
};

const CA_ROADS_BC: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "DriveBC", detail: "highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { label: "DriveBC cameras", detail: "provincial camera map", url: "https://www.drivebc.ca/cameras" },
  ],
};

const CA_ROADS_AB: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "511 Alberta", detail: "road reports", url: "https://511.alberta.ca/" },
    { label: "511 Alberta cameras", detail: "provincial camera map", url: "https://511.alberta.ca/cctv" },
  ],
};

/**
 * Québec variant of the reference block. Avalanche Canada does not forecast
 * for Québec · Avalanche Québec covers the Chic-Chocs and the province's
 * backcountry, so the QC regions swap that item rather than reuse the
 * national one.
 */
const CA_QC_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "Environment and Climate Change Canada", detail: "national forecasts & warnings", url: "https://weather.gc.ca/" },
    { label: "MSC GeoMet / api.weather.gc.ca", detail: "ECCC open data API", url: "https://api.weather.gc.ca/" },
    { label: "Avalanche Québec", detail: "backcountry bulletins", url: "https://www.avalanchequebec.ca/bulletin-davalanche/" },
  ],
};

const CA_ROADS_QC: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "Québec 511", detail: "road conditions & cameras", url: "https://www.quebec511.info/" },
  ],
};

/**
 * United States (Colorado) reference block. Same "Official references"
 * posture as Canada: no CAIC / NWS feed is wired into a feelzlike reading in
 * this pass, these are link-outs only · the forecast ensemble below is what
 * actually powers the numbers shown.
 */
const US_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Colorado Avalanche Information Center (CAIC)", detail: "daily avalanche forecasts", url: "https://avalanche.state.co.us/" },
  ],
};

const US_ROADS_CO: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "CDOT · Colorado Department of Transportation", detail: "road conditions & Traction/Chain Law", url: "https://www.codot.gov/" },
    { label: "COtrip.org", detail: "real-time conditions & camera map", url: "https://www.cotrip.org/" },
    { label: "CDOT · I-70 Mountain Corridor", url: "https://www.codot.gov/travel/i70mountain" },
  ],
};

/**
 * United States (Utah) reference block. Same "Official references" posture
 * as Colorado: no Utah Avalanche Center / NWS feed is wired into a
 * feelzlike reading in this pass, these are link-outs only · the forecast
 * ensemble below is what actually powers the numbers shown.
 */
const UT_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Utah Avalanche Center", detail: "daily avalanche forecasts (Salt Lake, Logan, Skyline zones)", url: "https://utahavalanchecenter.org/" },
  ],
};

const UT_ROADS_COTTONWOOD: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "UDOT · Cottonwood Canyons", detail: "SR-210/SR-190 closures, uphill restrictions & Class 3 traction status", url: "https://cottonwoodcanyons.udot.utah.gov/" },
    { label: "UDOT Traffic", detail: "statewide real-time conditions & camera map", url: "https://www.udottraffic.utah.gov/" },
    { label: "UDOT · snow tire & chain-up requirements", url: "https://connect.udot.utah.gov/public/snow-tire-and-chain-up-requirements/" },
  ],
};

const UT_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "UDOT Traffic", detail: "statewide real-time conditions & camera map", url: "https://www.udottraffic.utah.gov/" },
    { label: "UDOT · current conditions", url: "https://connect.udot.utah.gov/current-conditions/" },
  ],
};

/**
 * United States (California) reference block. Same "Official references"
 * posture as Colorado/Utah: no live feed is wired into a feelzlike reading
 * in this pass, these are link-outs only · the forecast ensemble below is
 * what actually powers the numbers shown. Big Bear and Mt. Shasta have no
 * dedicated avalanche-forecasting authority (outside both the Sierra and
 * Eastern Sierra Avalanche Centers' coverage), so they get a references
 * block without an avalanche-center link rather than one that doesn't apply.
 */
const CA_OFFICIAL_REFERENCES_SIERRA: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Sierra Avalanche Center", detail: "daily avalanche forecasts for the Tahoe/Bear Valley backcountry", url: "https://www.sierraavalanchecenter.org/" },
  ],
};
const CA_OFFICIAL_REFERENCES_EASTERN_SIERRA: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Eastern Sierra Avalanche Center", detail: "daily avalanche forecasts for the Mammoth/June Mountain backcountry", url: "https://www.esavalanche.org/" },
  ],
};
const CA_OFFICIAL_REFERENCES_NO_AVALANCHE: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. \u26a0\ufe0f No dedicated backcountry avalanche-forecasting authority covers this region \u2014 neither the Sierra Avalanche Center nor the Eastern Sierra Avalanche Center extends this far, so no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。この地域を担当する雪崩予報機関はありません。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};

const CA_ROADS_RLEVEL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "Caltrans QuickMap", detail: "statewide real-time conditions, chain control & camera map", url: "https://quickmap.dot.ca.gov/" },
    { label: "Caltrans · chain requirements (R1/R2/R3)", url: "https://dot.ca.gov/travel/chain-requirements" },
  ],
};
const CA_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "Caltrans QuickMap", detail: "statewide real-time conditions & camera map", url: "https://quickmap.dot.ca.gov/" },
  ],
};

/**
 * Vermont reference block. Vermont has no dedicated backcountry
 * avalanche-forecasting authority (no significant avalanche terrain in the
 * Green Mountains) — applied to ALL six VT regions, same honesty pattern as
 * CA_OFFICIAL_REFERENCES_NO_AVALANCHE, since none of them have coverage.
 */
const VT_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. ⚠️ Vermont has no significant avalanche terrain and no dedicated backcountry avalanche-forecasting authority — no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。バーモント州には雪崩予報機関はありません。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};
const VT_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb: "Vermont has no winter chain law — unlike CO/UT/CA, VTrans does not operate a chain-control tier system.",
  blurbJa: "バーモント州にはチェーン法規はありません。",
  items: [
    { label: "VTrans · 511vt.com", detail: "statewide real-time road conditions & camera map", url: "https://511vt.com/" },
  ],
};

/**
 * Wyoming reference block. Bridger-Teton Avalanche Center covers both WY
 * regions (Jackson Hole, Grand Targhee) under its "Tetons" zone, so unlike
 * Vermont/California's no-coverage gaps, an avalanche-bulletin link IS
 * offered here.
 */
const WY_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. Bridger-Teton Avalanche Center's \"Tetons\" zone covers both Jackson Hole and Grand Targhee.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "Bridger-Teton Avalanche Center", detail: "Tetons zone forecast (covers Jackson Hole & Grand Targhee)", url: "https://bridgertetonavalanchecenter.org/" },
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};
const WY_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "Wyoming has a real, dynamic Level 1/Level 2 chain law (WY Statute § 31-5-956), posted by WYDOT variable message sign rather than a fixed calendar — most frequently activated on Teton Pass (WY-22), the main road to Grand Targhee.",
  blurbJa: "ワイオミング州には動的なチェーン規制があります（テトンパス WY-22で頻繁に発動）。",
  items: [
    { label: "WYDOT · wyoroad.info", detail: "statewide real-time road conditions, chain-law status & camera map", url: "https://wyoroad.info/" },
  ],
};

/**
 * Montana reference blocks. Coverage is split three ways: GNFAC covers Big
 * Sky and Bozeman-Bridger Bowl, the Flathead Avalanche Center covers
 * Whitefish, and Red Lodge/Beartooth has NO dedicated avalanche-forecast
 * authority — same honesty pattern as California's Big Bear/Mt. Shasta gap.
 */
const MT_OFFICIAL_REFERENCES_GNFAC: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Gallatin National Forest Avalanche Center", detail: "daily avalanche forecasts for the Big Sky/Bridger Bowl backcountry", url: "https://www.mtavalanche.com/" },
  ],
};
const MT_OFFICIAL_REFERENCES_FLATHEAD: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Flathead Avalanche Center", detail: "daily avalanche forecasts for the Whitefish/Glacier backcountry", url: "https://www.flatheadavalanche.org/" },
  ],
};
const MT_OFFICIAL_REFERENCES_NO_AVALANCHE: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. \u26a0\ufe0f No dedicated backcountry avalanche-forecasting authority covers this region — the Gallatin National Forest Avalanche Center's coverage does not extend to Red Lodge/Beartooth, so no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。この地域を担当する雪崩予報機関はありません。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};
const MT_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "Montana has no statewide chain law for passenger vehicles — only a heavy-vehicle rule under MCA 61-9-436 (towing units ≥ 26,001 lbs GVW), which doesn't apply here.",
  blurbJa: "モンタナ州には乗用車向けのチェーン規制はありません。",
  items: [
    { label: "MDT · 511mt.net", detail: "statewide real-time road conditions & camera map", url: "https://www.511mt.net/" },
  ],
};

/**
 * New Mexico reference blocks. The Taos Avalanche Center covers only "the
 * mountains surrounding Taos" — Angel Fire, Santa Fe and Albuquerque/Sandia
 * Peak have NO dedicated avalanche-forecast authority, same honesty pattern
 * as Montana's Red Lodge/California's Big Bear gaps.
 */
const NM_OFFICIAL_REFERENCES_TAOS: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Taos Avalanche Center", detail: "backcountry avalanche forecasts for the mountains surrounding Taos", url: "https://taosavalanchecenter.org/" },
  ],
};
const NM_OFFICIAL_REFERENCES_NO_AVALANCHE: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. \u26a0\ufe0f No dedicated backcountry avalanche-forecasting authority covers this region — the Taos Avalanche Center's coverage does not extend here, so no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。この地域を担当する雪崩予報機関はありません。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};
const NM_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "New Mexico has no statewide chain law for passenger vehicles — NMSA 1978 § 66-3-847 permits but does not require chains or studded tires.",
  blurbJa: "ニューメキシコ州には乗用車向けのチェーン規制はありません。",
  items: [
    { label: "NMDOT · nmroads.com", detail: "statewide real-time road conditions & camera map (or dial 511)", url: "https://www.nmroads.com/mapIndex.html" },
  ],
};

/**
 * Oregon reference blocks. Mt. Hood is covered by the Northwest Avalanche
 * Center (NWAC) — the same authority used for Washington. Bend/Mt. Bachelor
 * sits outside NWAC's coverage area and is instead covered by the smaller,
 * volunteer-run Central Oregon Avalanche Center (COAC) — flagged explicitly
 * as a different/lesser-resourced authority, not a coverage gap.
 */
const OR_OFFICIAL_REFERENCES_MT_HOOD: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Northwest Avalanche Center (NWAC)", detail: "backcountry avalanche forecasts for the Mt. Hood zone", url: "https://nwac.us/" },
  ],
};
const OR_OFFICIAL_REFERENCES_BEND: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. ⚠️ This region falls outside NWAC's coverage area — backcountry avalanche forecasting here is provided by the smaller, volunteer-run Central Oregon Avalanche Center (COAC), a different and less-resourced authority than NWAC.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。この地域はNWACの対象外です。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Central Oregon Avalanche Center (COAC)", detail: "volunteer-run backcountry avalanche forecasts for the Bend/Mt. Bachelor area", url: "https://coavalanche.org/" },
  ],
};
const OR_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "Oregon has a broad, mandatory traction-device law — ORS 815.045/815.140/815.142/815.145 and OAR 734-017 require chains or traction tires on ODOT-designated routes during posted conditions, in the same 'must-carry' spirit as Colorado's law.",
  blurbJa: "オレゴン州では指定区間・気象条件下でチェーンまたはトラクションタイヤの携行が義務付けられています。",
  items: [
    { label: "ODOT TripCheck · tripcheck.com", detail: "statewide real-time road conditions, cameras & traction advisories (or dial 511)", url: "https://www.tripcheck.com/" },
  ],
};

/**
 * Washington: all four WA regions fall within NWAC's (Northwest Avalanche
 * Center) coverage area, unlike Oregon's Bend/COAC gap above — one shared
 * official-references group is used for all four.
 */
const WA_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Northwest Avalanche Center (NWAC)", detail: "backcountry avalanche forecasts covering all of the WA Cascades, including Crystal Mountain, Snoqualmie Pass, Stevens Pass and Mt. Baker", url: "https://nwac.us/" },
  ],
};
const WA_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "Washington's chain law is storm-activated rather than always-on — RCW 47.36.250 lets WSDOT require chains on designated mountain-pass routes only when posted, rather than for the whole season.",
  blurbJa: "ワシントン州では、峰を越える主要道路で気象状況に応じてチェーン規制が発令されます（RCW 47.36.250）。",
  items: [
    { label: "WSDOT Mountain Pass Reports", detail: "real-time pass conditions, cameras & storm-activated chain-up requirements", url: "https://wsdot.com/travel/real-time/mountainpasses" },
  ],
};

/**
 * Idaho: avalanche-forecast coverage is genuinely fragmented across three
 * separate, non-overlapping centers, plus one confirmed gap (Boise/Bogus
 * Basin) — modeled as four distinct SourceGroups rather than one shared
 * block, mirroring the honesty-gate pattern used for Oregon's Bend/COAC
 * split above.
 */
const ID_OFFICIAL_REFERENCES_SUN_VALLEY: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Sawtooth Avalanche Center", detail: "backcountry avalanche forecasts for the Sun Valley / Ketchum zone", url: "https://www.sawtoothavalanche.com/" },
  ],
};
const ID_OFFICIAL_REFERENCES_SANDPOINT: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。 ⚠️ この地域はアイダホ州の他の地域とは異なり、山帯時間ではなく太平洋時間を使用します。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Idaho Panhandle Avalanche Center", detail: "backcountry avalanche forecasts for the Schweitzer / Sandpoint zone", url: "https://idahopanhandleavalanche.org/" },
  ],
};
const ID_OFFICIAL_REFERENCES_BOISE: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour. ⚠️ No dedicated backcountry avalanche-forecast center covers the Boise/Bogus Basin zone — the nearest Sawtooth Avalanche Center (SAC) zones are roughly 56-61 miles away and do not extend coverage here. This is a genuine data gap, not an omission.",
  blurbJa:
    "リンクのみで、データ連携はしていません。この地域を専門にカバーする雪崩予報センターはありません。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
  ],
};
const ID_OFFICIAL_REFERENCES_DONNELLY_MCCALL: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" },
    { label: "Payette Avalanche Center", detail: "backcountry avalanche forecasts for the Brundage / Tamarack / McCall zone", url: "https://payetteavalanche.org/" },
  ],
};
const ID_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  blurb:
    "Idaho's traction-device law is narrower than Oregon's or Colorado's — Idaho Code § 49-948 mandates chains only for commercial vehicles on designated routes during posted conditions, not for passenger vehicles generally.",
  blurbJa: "アイダホ州のチェーン規制は商用車のみ対象です（アイダホ州法第49-948条）。",
  items: [
    { label: "Idaho 511 · 511.idaho.gov", detail: "statewide real-time road conditions, cameras & commercial-vehicle chain requirements", url: "https://511.idaho.gov/" },
  ],
};


/** New Hampshire: MWAC is a real daily Presidential Range/Tuckerman forecast
 * authority near Wildcat/Pinkham Notch. It is relevant to backcountry travel,
 * not ordinary in-bounds skiing at the listed resorts. */
const NH_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references", titleJa: "公式参照先",
  blurb: "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below. Mount Washington Avalanche Center issues real daily forecasts for Tuckerman/Huntington Ravines and the Presidential Range near Wildcat/Pinkham Notch; these are backcountry forecasts, not in-bounds resort conditions.",
  blurbJa: "リンクのみで、データ連携はしていません。マウント・ワシントン雪崩センターは近隣のバックカントリー向け日次予報を発行します。",
  items: [{ label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" }, { label: "Mount Washington Avalanche Center", detail: "daily Presidential Range / Tuckerman and Huntington Ravines backcountry forecast", url: "https://www.mountwashingtonavalanchecenter.org/" }],
};
const NH_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport", titleJa: "道路・交通",
  blurb: "NHDOT directs travellers to regional New England 511 rather than a standalone NH 511 site. New Hampshire has no broad passenger-vehicle chain law; Saf-C 1312.17 is a narrow Nov 15-Apr 15 snow-tire equipment/inspection provision, not a general chain-up rule.",
  blurbJa: "ニューハンプシャー州には一般的な乗用車用チェーン規制はありません。",
  items: [{ label: "NHDOT · New England 511", detail: "state authority and regional real-time road conditions / camera map", url: "https://newengland511.org/Home/Index" }, { label: "NHDOT real-time travel information", detail: "state travel-information hub", url: "https://www.dot.nh.gov/doing-business-nhdot/general-public/real-time-travel-info" }],
};


/** Maine has no dedicated avalanche forecast or observation authority; do not imply MWAC covers it. */
const ME_OFFICIAL_REFERENCES_NO_AVALANCHE: SourceGroup = {
  title: "Official references", titleJa: "公式参照先", blurb: "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below. Maine has no dedicated avalanche forecasting or observation authority, including no Maine extension of Mount Washington Avalanche Center coverage; its covered resort terrain is lift-served.", blurbJa: "リンクのみで、データ連携はしていません。メイン州には専用の雪崩情報機関がありません。", items: [{ label: "National Weather Service", detail: "US federal forecasts & warnings", url: "https://www.weather.gov/" }],
};
const ME_ROADS_GENERAL: SourceGroup = {
  title: "Roads & transport", titleJa: "道路・交通", blurb: "MaineDOT and 511 Maine are the state road authority. Chains are permitted in slippery conditions under 29-A M.R.S. §2381, not mandatory; Maine has no general chain-up rule.", blurbJa: "メイン州には一般的なチェーン義務はありません。", items: [{ label: "MaineDOT · 511 Maine", detail: "state authority and real-time road conditions / camera map", url: "https://511maine.gov/" }, { label: "MaineDOT", detail: "state transport authority", url: "https://www.maine.gov/dot/" }],
};

const REGION_SOURCES: Record<string, SourceGroup[]> = {

  "carrabassett-valley": [ME_OFFICIAL_REFERENCES_NO_AVALANCHE, ME_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [{ label: "Sugarloaf", detail: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · ⚠️ webcam sub-URL unconfirmed; use mountain report", url: "https://www.sugarloaf.com/mountain-report" }] }, FORECAST_ENSEMBLE],
  "newry-bethel": [ME_OFFICIAL_REFERENCES_NO_AVALANCHE, ME_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [{ label: "Sunday River", detail: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · ⚠️ webcam sub-URL unconfirmed; use mountain report", url: "https://www.sundayriver.com/mountain-report" }] }, FORECAST_ENSEMBLE],
  "rangeley": [ME_OFFICIAL_REFERENCES_NO_AVALANCHE, ME_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [{ label: "Saddleback Mountain", detail: "Arctaris-owned · Indy Pass, no blackouts · reopened 2020 after five-year closure · SKI Magazine readers' #1 East resort 2025 · ⚠️ exact 2025-26 close and live stream URLs unconfirmed", url: "https://www.saddlebackmaine.com/mountain-report/" }] }, FORECAST_ENSEMBLE],
  "white-mountains": [NH_OFFICIAL_REFERENCES, NH_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [
    { label: "Cranmore Mountain", detail: "Ikon Bonus Mountain (Full Pass only) · White Mountain Superpass · confirmed Observatory-hosted live Meister Cam", url: "https://cranmore.com/" },
    { label: "Wildcat Mountain", detail: "Epic Pass · Vail Resorts-owned · ⚠️ no distinct live official webcam URL confirmed", url: "https://www.skiwildcat.com/" },
    { label: "Attitash Mountain Resort", detail: "Epic Pass · Vail Resorts-owned · ⚠️ no distinct first-party snow-report or live webcam URL confirmed", url: "https://www.attitash.com/" },
  ] }, FORECAST_ENSEMBLE],
  "franconia-notch": [NH_OFFICIAL_REFERENCES, NH_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [
    { label: "Cannon Mountain", detail: "Indy Pass · United States' only state-owned ski area · White Mountain Superpass", url: "https://www.cannonmt.com/" },
    { label: "Bretton Woods", detail: "independent Omni-owned resort · anchors the White Mountain Superpass", url: "https://www.brettonwoods.com/" },
    { label: "Loon Mountain", detail: "Boyne Resorts-owned · Ikon Pass (7 days Full / 5 days Base, Base blackouts)", url: "https://www.loonmtn.com/" },
  ] }, FORECAST_ENSEMBLE],
  "waterville-valley": [NH_OFFICIAL_REFERENCES, NH_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [{ label: "Waterville Valley Resort", detail: "Indy Pass (no blackouts on Indy Base) · White Mountain Superpass · ⚠️ 2025-26 closing date / standalone snow-report URL not confirmed", url: "https://www.waterville.com/" }] }, FORECAST_ENSEMBLE],
  "lakes-region": [NH_OFFICIAL_REFERENCES, NH_ROADS_GENERAL, { title: "Resorts & lifts", titleJa: "スキー場・リフト", items: [{ label: "Gunstock Mountain Resort", detail: "Belknap County-owned, no Epic/Ikon/Indy affiliation · historical 2022 county-governance turmoil, operations have continued normally since", url: "https://www.gunstock.com/" }] }, FORECAST_ENSEMBLE],
  "snowy-mountains": [
    {
      title: "Live observations",
      titleJa: "気象観測",
      items: [
        { label: "Bureau of Meteorology", labelJa: "オーストラリア気象局", detail: "Australia", url: "http://www.bom.gov.au" },
      ],
    },
    {
      title: "Roads & transport",
      titleJa: "道路・交通",
      items: [
        { label: "Transport for NSW - Live Traffic", labelJa: "ライブトラフィックNSW", url: "https://www.livetraffic.com" },
        { label: "Cooma Coaches", url: "https://www.coomacoaches.com.au" },
        { label: "NSW TrainLink", url: "https://transportnsw.info/regional" },
      ],
    },
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Thredbo", url: "https://www.thredbo.com.au" },
        { label: "Perisher", url: "https://www.perisher.com.au" },
        { label: "Charlotte's Pass", url: "https://www.charlottepass.com.au" },
        { label: "Selwyn Snow Resort", url: "https://www.selwynsnow.com.au" },
      ],
    },
    {
      title: "Mapping & imagery",
      titleJa: "地図・画像",
      items: [
        { label: "OpenWeatherMap weather tiles", url: "https://openweathermap.org" },
        { label: "BOM radar - NSW alpine", url: "http://www.bom.gov.au/products/IDR713.loop.shtml" },
        { label: "Jindabyne Image \u00a9 Destination NSW", detail: "Photo courtesy Destination NSW", url: "https://www.destinationnsw.com.au" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  yamanouchi: [
    {
      title: "Live observations",
      titleJa: "気象観測",
      items: [
        { label: "Japan Meteorological Agency", labelJa: "気象庁", detail: "Japan", url: "https://www.jma.go.jp/jma/indexe.html" },
      ],
    },
    {
      title: "Roads & transport",
      titleJa: "道路・交通",
      items: [
        { label: "Japan Road Traffic Information Center (JARTIC)", labelJa: "日本道路交通情報センター", url: "https://www.jartic.or.jp/" },
        { label: "Nagano Dentetsu (Nagaden)", labelJa: "長野電鉄", url: "https://www.nagaden-net.co.jp/" },
        { label: "Nagano Snow Shuttle", labelJa: "長野スノーシャトル", url: "https://www.naganosnowshuttle.com/" },
      ],
    },
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Shiga Kogen Ski Resorts", labelJa: "志賀高原スキー場", url: "https://www.shigakogen-ski.or.jp/" },
        { label: "Ryuoo Ski Park", labelJa: "竜王スキーパーク", url: "https://www.ryuoo.com/" },
        { label: "Kita-Shiga Kogen", labelJa: "北志賀高原", url: "https://ryuoo.com/winter/kitashiga/" },
      ],
    },
    {
      title: "Mapping & imagery",
      titleJa: "地図・画像",
      items: [
        { label: "OpenWeatherMap weather tiles", url: "https://openweathermap.org" },
        { label: "JMA radar - Nagano", labelJa: "気象庁レーダー（長野）", url: "https://www.jma.go.jp/bosai/nowc/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  whistler: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Whistler Blackcomb", url: "https://www.whistlerblackcomb.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "powder-highway": [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Revelstoke Mountain Resort", url: "https://www.revelstokemountainresort.com/" },
        { label: "Kicking Horse", url: "https://kickinghorseresort.com/" },
        { label: "Fernie Alpine Resort", url: "https://skifernie.com/" },
        { label: "Whitewater", url: "https://skiwhitewater.com/" },
        { label: "Kimberley Alpine Resort", url: "https://skikimberley.com/" },
        { label: "Panorama", url: "https://www.panoramaresort.com/" },
        { label: "Sun Peaks Resort", url: "https://www.sunpeaksresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "banff-lake-louise": [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Banff Sunshine Village", url: "https://www.skibanff.com/" },
        { label: "Mt. Norquay", url: "https://banffnorquay.com/" },
        { label: "Lake Louise Ski Resort", url: "https://www.skilouise.com/" },
        { label: "Parks Canada · Banff safety", detail: "park conditions & closures", url: "https://www.pc.gc.ca/en/pn-np/ab/banff/securite-safety" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  canmore: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Nakiska", url: "https://skinakiska.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  jasper: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Marmot Basin", url: "https://www.skimarmot.com/" },
        { label: "Parks Canada · Jasper National Park", url: "https://www.pc.gc.ca/en/pn-np/ab/jasper" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-laurentians": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Tremblant", url: "https://www.tremblant.ca/" },
        { label: "Tremblant · mountain report", url: "https://www.tremblant.ca/mountain-village/mountain-report" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-charlevoix": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mont-Sainte-Anne", url: "https://mont-sainte-anne.com/" },
        { label: "Le Massif de Charlevoix", url: "https://www.lemassif.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-eastern-townships": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Ski Bromont", url: "https://www.bromontmontagne.com/" },
        { label: "Mont Sutton", url: "https://montsutton.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "summit-county": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Breckenridge", url: "https://www.breckenridge.com/" },
        { label: "Keystone", url: "https://www.keystoneresort.com/" },
        { label: "Copper Mountain", url: "https://www.coppercolorado.com/" },
        { label: "Arapahoe Basin", url: "https://www.arapahoebasin.com/" },
        { label: "Loveland Ski Area", url: "https://www.skiloveland.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "vail-valley": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Vail Mountain", url: "https://www.vail.com/" },
        { label: "Beaver Creek", url: "https://www.beavercreek.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "aspen-snowmass": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Aspen Snowmass · four mountains", url: "https://www.aspensnowmass.com/four-mountains" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  steamboat: [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Steamboat Resort", url: "https://www.steamboat.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "winter-park": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Winter Park Resort", url: "https://www.winterparkresort.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "crested-butte": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Crested Butte Mountain Resort", url: "https://www.skicb.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  telluride: [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Telluride Ski Resort", url: "https://www.tellurideskiresort.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  durango: [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Purgatory Resort", url: "https://www.purgatory.ski/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "boulder-front-range": [
    US_OFFICIAL_REFERENCES,
    US_ROADS_CO,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Eldora Mountain Resort", url: "https://www.eldora.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "cottonwood-canyons": [
    UT_OFFICIAL_REFERENCES,
    UT_ROADS_COTTONWOOD,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Alta", detail: "ski-only, no snowboarding", url: "https://www.alta.com/" },
        { label: "Snowbird", url: "https://www.snowbird.com/" },
        { label: "Brighton Resort", url: "https://www.brightonresort.com/" },
        { label: "Solitude Mountain Resort", url: "https://www.solitudemountain.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "park-city": [
    UT_OFFICIAL_REFERENCES,
    UT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Park City Mountain", url: "https://www.parkcitymountain.com/" },
        { label: "Deer Valley", detail: "ski-only, no snowboarding", url: "https://www.deervalley.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "ogden-valley": [
    UT_OFFICIAL_REFERENCES,
    UT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Snowbasin", url: "https://www.snowbasin.com/" },
        { label: "Powder Mountain", url: "https://powdermountain.com/" },
        { label: "Nordic Valley", detail: "2025-26 season dates unconfirmed", url: "https://www.nordicvalley.ski/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  provo: [
    UT_OFFICIAL_REFERENCES,
    UT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Sundance Mountain Resort", url: "https://www.sundanceresort.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "cache-valley": [
    UT_OFFICIAL_REFERENCES,
    UT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Beaver Mountain", url: "https://www.skithebeav.com/" },
        { label: "Cherry Peak", detail: "2025-26 opening date unconfirmed by resort", url: "https://www.skicpr.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "north-lake-tahoe": [
    CA_OFFICIAL_REFERENCES_SIERRA,
    CA_ROADS_RLEVEL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Palisades Tahoe", url: "https://www.palisadestahoe.com/" },
        { label: "Northstar California", url: "https://www.northstarcalifornia.com/" },
        { label: "Sugar Bowl", detail: "Mountain Collective Pass, not Epic or Ikon", url: "https://www.sugarbowl.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "south-lake-tahoe": [
    CA_OFFICIAL_REFERENCES_SIERRA,
    CA_ROADS_RLEVEL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Heavenly", detail: "2025-26 closing date not confirmed by resort", url: "https://www.skiheavenly.com/" },
        { label: "Kirkwood", detail: "2025-26 closing date not confirmed by resort", url: "https://www.kirkwood.com/" },
        { label: "Sierra-at-Tahoe", detail: "\u26a0\ufe0f officially closed for the 2025/26 season per the resort's own page", url: "https://sierraattahoe.com/" },
        { label: "Homewood Mountain Resort", detail: "reopened for 2025-26 after a full 2024-25 closure", url: "https://skihomewood.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "mammoth-lakes": [
    CA_OFFICIAL_REFERENCES_EASTERN_SIERRA,
    CA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mammoth Mountain", url: "https://www.mammothmountain.com/" },
        { label: "June Mountain", url: "https://www.junemountain.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "big-bear": [
    CA_OFFICIAL_REFERENCES_NO_AVALANCHE,
    CA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Bear Mountain", detail: "2025-26 closing date reported as either Mar 25 or Mar 29 2026, sources disagree", url: "https://www.bigbearmountainresort.com/" },
        { label: "Snow Summit", detail: "2025-26 closing date reported as either Apr 6 or Mar 22 2026, sources disagree", url: "https://www.bigbearmountainresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "bear-valley": [
    CA_OFFICIAL_REFERENCES_SIERRA,
    CA_ROADS_RLEVEL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Bear Valley Mountain Resort", detail: "2025-26 opening date uncertain in source reporting", url: "https://www.bearvalley.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "mt-shasta": [
    CA_OFFICIAL_REFERENCES_NO_AVALANCHE,
    CA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mt. Shasta Ski Park", detail: "2025-26 season closed early (Mar 2, 2026) for lack of snow; base/summit elevation unverified", url: "https://www.skipark.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "killington-pico": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Killington", detail: "Beast of the East · Ikon Pass · typically the earliest and latest resort to operate in the Northeast", url: "https://www.killington.com/" },
        { label: "Pico Mountain", detail: "2025-26 closing date not confirmed by resort", url: "https://www.picomountain.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "stowe-smugglers-notch": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Stowe Mountain Resort", detail: "Epic Pass · Vermont's tallest peak, Mt. Mansfield · base elevation reported 1,340–2,035 ft depending on source, treat as approximate", url: "https://www.stowe.com/" },
        { label: "Smugglers' Notch", detail: "⚠️ independently owned through the 2025-26 season · acquisition by new ownership announced for Feb 2026 with a joint pass alongside Burke planned from 2026-27, not yet in effect · 2025-26 closing date not confirmed by resort", url: "https://www.smuggs.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "mad-river-valley": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Sugarbush", detail: "Ikon Pass · twin-peak resort (Lincoln Peak & Mt. Ellen) · 2025-26 closing date not confirmed by resort", url: "https://www.sugarbush.com/" },
        { label: "Mad River Glen (⚠️ ski-only, no snowboarding)", detail: "independent, co-operatively owned by its skiers · a trial snowboard-access lift was floated for Feb 29 2026, with a possible permanent policy change starting 2026-27, not yet in effect this season", url: "https://www.madriverglen.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "southern-vermont": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Stratton", detail: "Ikon Pass · confirmed 2025-26 season (opened Nov 26 2025, closed Apr 12 2026)", url: "https://www.stratton.com/" },
        { label: "Mount Snow", detail: "Epic Pass · Vail's Northeast group with Stowe and Okemo · 2025-26 closing date not confirmed by resort", url: "https://www.mountsnow.com/" },
        { label: "Bromley Mountain", detail: "Indy Pass (first season on Indy for 2025-26) · 2025-26 closing date not confirmed by resort", url: "https://www.bromley.com/" },
        { label: "Magic Mountain (⚠️ did not open for 2025-26 season)", detail: "lowest snowfall in 20+ years produced the resort's first non-opening in over 20 years · elevation shown reflects confirmed data, not current-season conditions", url: "https://www.magicmtn.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "okemo": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Okemo Mountain Resort", detail: "Epic Pass · Vail's Northeast group with Stowe and Mount Snow", url: "https://www.okemo.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "jay-peak-nek": [
    VT_OFFICIAL_REFERENCES,
    VT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Jay Peak", detail: "independent · highest average annual snowfall in the East, close to the Canadian border", url: "https://jaypeakresort.com/" },
        { label: "Burke Mountain", detail: "independent · 2025-26 closing date not confirmed by resort · joint pass with Smugglers' Notch planned from 2026-27, not yet in effect", url: "https://www.skiburke.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "jackson-hole": [
    WY_OFFICIAL_REFERENCES,
    WY_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Jackson Hole Mountain Resort", detail: "Ikon Pass (Full only) · legendary steep terrain, 4,139 ft vertical · reservation required for Ikon/Mountain Collective 2025-26 · ⚠️ no confirmed dedicated webcam URL", url: "https://www.jacksonhole.com/" },
        { label: "Snow King Mountain", detail: "Indy Pass + Powder Alliance · in-town, night skiing · official 2025-26 closing Mar 22 2026 per resort", url: "https://snowkingmountain.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "grand-targhee": [
    WY_OFFICIAL_REFERENCES,
    WY_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Grand Targhee Resort", detail: "Mountain Collective Pass (not Ikon/Epic) · deepest average annual snowfall on the west side of the Tetons · contested 694-acre USFS expansion approved but not yet built (objections through July 2026, doesn't affect 2025-26 season)", url: "https://grandtarghee.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "big-sky": [
    MT_OFFICIAL_REFERENCES_GNFAC,
    MT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Big Sky Resort", detail: "Ikon Pass (Full, no blackouts) · \"The Biggest Skiing in America\" · ~5,850 skiable acres, 4,350 ft vertical · official 2025-26 closing day Apr 26 2026 per resort", url: "https://www.bigskyresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "bozeman-bridger-bowl": [
    MT_OFFICIAL_REFERENCES_GNFAC,
    MT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Bridger Bowl", detail: "independent nonprofit · ⚠️ closed early for the 2025-26 season on Mar 22 2026 due to low snowfall (138\" season total), expected back to its normal schedule for 2026-27 · all guests need a new photo ID card for 2025-26 · Schlasman's/the Ridge requires an avalanche transceiver", url: "https://bridgerbowl.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  whitefish: [
    MT_OFFICIAL_REFERENCES_FLATHEAD,
    MT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Whitefish Mountain Resort", detail: "independent · known locally as \"Big Mountain\" · the largest US ski area not on Epic/Ikon/Indy Pass · official 2025-26 closing day Apr 5 2026 per resort · ⚠️ no confirmed dedicated webcam URL", url: "https://skiwhitefish.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "red-lodge": [
    MT_OFFICIAL_REFERENCES_NO_AVALANCHE,
    MT_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Red Lodge Mountain", detail: "Indy Pass member · ⚠️ 2025-26 closing date not confirmed by a dated primary source · the scenic Beartooth Highway (US-212) toward Yellowstone/Cooke City is closed in winter (mid-October through late May/early June)", url: "https://www.redlodgemountain.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  taos: [
    NM_OFFICIAL_REFERENCES_TAOS,
    NM_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Taos Ski Valley", detail: "Ikon Pass (Full, no blackouts) · independent ownership · sole access via NM-150, a narrow, steep, switchback road · ⚠️ closed early for 2025-26 on Mar 29 2026 due to unseasonably warm weather", url: "https://www.skitaos.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "angel-fire": [
    NM_OFFICIAL_REFERENCES_NO_AVALANCHE,
    NM_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Angel Fire Resort", detail: "Powder Alliance member · New Mexico's only night skiing · confirmed season Dec 12 2025 - Mar 22 2026 · ⚠️ a secondary source claims Indy Pass affiliation too, unconfirmed on Indy Pass's own directory", url: "https://www.angelfireresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "santa-fe": [
    NM_OFFICIAL_REFERENCES_NO_AVALANCHE,
    NM_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Ski Santa Fe", detail: "independent · one of the highest-base-elevation resorts in the US (10,350 ft base) · ⚠️ closed early for 2025-26 on Mar 22 2026 due to unseasonably warm, dry conditions", url: "https://www.skisantafe.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "albuquerque-sandia": [
    NM_OFFICIAL_REFERENCES_NO_AVALANCHE,
    NM_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Sandia Peak Ski Area", detail: "Mountain Capital Partners \"Power Pass\" · ⚠️ VERIFY-STATUS RESORT: multi-year full closures 2021-23, reopened 2024 under new ownership, exact 2025-26 closing date and total operating days unconfirmed by any dated source · no confirmed live webcam", url: "https://www.sandia.ski/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "mt-hood": [
    OR_OFFICIAL_REFERENCES_MT_HOOD,
    OR_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mt. Hood Meadows", detail: "Indy Pass (2 days, select blackouts) + Indy+ Pass (2 days, no blackouts) · not on Epic or Ikon · no confirmed live webcam found", url: "https://www.skihood.com/" },
        { label: "Timberline Lodge", detail: "Mt. Hood Fusion Pass (bundled with Skibowl) · famous for near-year-round skiing via the Palmer Snowfield · ⚠️ vertical-drop figure disputed across sources (resort's own 4,540 ft claim vs. ~3,590-3,690 ft per independent aggregators) · no confirmed live webcam found", url: "https://www.timberlinelodge.com/" },
        { label: "Mt. Hood Skibowl", detail: "Mt. Hood Fusion Pass + Powder Alliance in its own right · America's largest lit night-skiing operation · confirmed live webcams", url: "https://www.skibowl.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  bend: [
    OR_OFFICIAL_REFERENCES_BEND,
    OR_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mt. Bachelor", detail: "Ikon Pass destination · 360°-skiable volcanic cone, one of the largest lift-served ski areas in the US by skiable acreage · confirmed live webcams (8+ feeds)", url: "https://www.mtbachelor.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "crystal-mountain": [
    WA_OFFICIAL_REFERENCES,
    WA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Crystal Mountain Resort", detail: "Ikon Pass (Full tier, no blackouts) · independent (Alterra-owned) · the largest ski area in Washington by vertical drop (3,100 ft) · ⚠️ SR-410 flood damage delayed the 2025-26 opening; no confirmed season-closing date found · webcam page not independently re-verified live", url: "https://www.crystalmountainresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "snoqualmie-pass": [
    WA_OFFICIAL_REFERENCES,
    WA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "The Summit at Snoqualmie", detail: "Ikon Pass (Full tier, no blackouts) · independent (Boyne Resorts-owned) · four base areas under one ticket (Summit West/Central/East + Alpental) · ⚠️ 2025-26 season opened with only Summit West running; other sub-areas' dates unconfirmed · webcam page not independently re-verified live", url: "https://summitatsnoqualmie.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "stevens-pass": [
    WA_OFFICIAL_REFERENCES,
    WA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Stevens Pass Ski Area", detail: "Vail Resorts' Epic Local Pass (no blackouts) · sole highway access via US-2 · ⚠️ Dec 2025 US-2 flood closure delayed the 2025-26 opening · webcam page not independently re-verified live", url: "https://www.stevenspass.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "mt-baker": [
    WA_OFFICIAL_REFERENCES,
    WA_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mt. Baker Ski Area", detail: "Independent · no major-pass affiliation · holds the world record for most snowfall in a season (1,140 in., 1998-99, verified by NOAA) · ⚠️ NO confirmed live webcam found", url: "https://www.mtbaker.us/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "sun-valley": [
    ID_OFFICIAL_REFERENCES_SUN_VALLEY,
    ID_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Bald Mountain", detail: "Ikon Pass (Full tier, no blackouts) + Mountain Collective · the largest ski area in Idaho by vertical drop (3,400 ft) · confirmed live webcams", url: "https://www.sunvalley.com/" },
        { label: "Dollar Mountain", detail: "Ikon Pass (Full tier, no blackouts) + Mountain Collective, shared with Bald Mountain · beginner-oriented · ⚠️ season-closing date not separately confirmed", url: "https://www.sunvalley.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "sandpoint": [
    ID_OFFICIAL_REFERENCES_SANDPOINT,
    ID_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Schweitzer Mountain Resort", detail: "Ikon Pass (destination tier) · independent · the 2nd largest ski area in Idaho by vertical drop (2,440 ft) · confirmed live PanoCam · confirmed 2025-26 season despite a \"historically low snow\" season", url: "https://www.schweitzer.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "boise": [
    ID_OFFICIAL_REFERENCES_BOISE,
    ID_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Bogus Basin", detail: "Nonprofit 501(c)(3), largest nonprofit ski area in the US · Powder Alliance/Freedom Pass · ⚠️ CLOSED EARLY for 2025-26 on Mar 22, 2026 due to unseasonably warm weather · confirmed live conditions/webcam page", url: "https://bogusbasin.org/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "donnelly-mccall": [
    ID_OFFICIAL_REFERENCES_DONNELLY_MCCALL,
    ID_ROADS_GENERAL,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Tamarack Resort", detail: "Indy Pass (capped redemptions); joining Ikon as a Bonus Mountain from 2026-27 · ⚠️ ownership/financial status is a genuinely unresolved conflict in sources — not asserted as fact either way", url: "https://www.tamarackidaho.com/" },
        { label: "Brundage Mountain", detail: "Indy Pass member · independent · 70 trails, 6 lifts, no night skiing · confirmed live named webcams", url: "https://www.brundage.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
};

export function RegionSources() {
  const { region } = useRegion();
  const { t } = useLanguage();

  const groups = REGION_SOURCES[region.id] ?? [FORECAST_ENSEMBLE];

  return (
    <div className="max-w-6xl mx-auto">
      <PageMeta
        title={t(`${region.name} - data sources`, `${region.name}のデータ出典`)}
        description={t(
          `Official sources powering real-time conditions for ${region.name}: weather bureaus, resort feeds, road agencies and forecast ensembles.`,
          `${region.name}のリアルタイム情報を支える公式データ出典：気象機関・スキー場・道路管理・予報モデル。`,
        )}
        path={`/${region.id}/sources`}
      />
      <div className="px-4 md:px-10 pt-4 md:pt-8">
        <PageHeader
          byline={region.name}
          title={t("Where the data comes from", "データの出典")}
          description={t(
            `Real-time conditions for ${region.name} sourced direct from official services. Forecasts blend several global ensemble models so you see the consensus, not a single guess.`,
            `${region.name}のリアルタイム情報は公式機関から直接取得しています。予報は複数のグローバル予報モデルを組み合わせ、合意ベースの予測を表示します。`,
          )}
          badge={<LiveBadge tone="onDark" label={t("Attribution", "出典")} />}
        />
      </div>

      <section className="px-4 md:px-10 pt-4 pb-8 space-y-6">
        {groups.map((group) => (
          <SourceGroupCard key={group.title} group={group} t={t} />
        ))}

        <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          {t(
            "Feelzlike combines but does not replace any of the above sources. For official warnings always consult the issuing authority. We attribute every data point - if you spot something missing, let us know.",
            "Feelzlikeは上記の出典を統合表示するものであり、置き換えるものではありません。公式の警報・警告は必ず発表元を直接ご確認ください。",
          )}
        </p>
      </section>
    </div>
  );
}

function SourceGroupCard({
  group,
  t,
}: {
  group: SourceGroup;
  t: (en: string, ja: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 md:p-7">
      <div className="flex items-start gap-3 mb-1">
        <Database className="w-4 h-4 text-blue-700 mt-1 shrink-0" aria-hidden />
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg">
            {t(group.title, group.titleJa)}
          </h2>
          {group.blurb || group.blurbJa ? (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t(group.blurb ?? "", group.blurbJa ?? group.blurb ?? "")}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2 mt-4">
        {group.items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white px-4 py-2.5 transition-all hover:shadow-sm hover:-translate-y-0.5 hover:border-blue-300"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">
                  {t(item.label, item.labelJa ?? item.label)}
                </span>
                {item.detail || item.detailJa ? (
                  <span className="block text-[11px] text-muted-foreground/70 truncate">
                    {t(item.detail ?? "", item.detailJa ?? item.detail ?? "")}
                  </span>
                ) : null}
              </span>
              <ExternalLink
                className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-blue-700 shrink-0"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
