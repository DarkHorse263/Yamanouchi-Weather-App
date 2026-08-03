import type { LiftSeed } from "../lifts";

/**
 * NEW ZEALAND - Queenstown (Coronet Peak, The Remarkables), Wanaka
 * (Cardrona, Treble Cone), Canterbury (Mt Hutt) and Ruapehu
 * (Whakapapa, Turoa).
 *
 * Lift names taken from each resort's official trail map / lift list
 * (nzski.com, cardrona-treblecone.com, whakapapa.com, pureturoa.nz),
 * focused on the main named lifts rather than learner carpets.
 * Base/top elevations are approximate on-mountain figures rounded from
 * published stats. Wind-hold thresholds are conservative best-estimates
 * by lift type and exposure, not published operating limits - NZ club
 * and alpine fields hold to wind notoriously often (Mt Hutt especially),
 * so exposed lifts here carry lower thresholds. Surfaced in the UI with
 * `verifiedAt` for transparency.
 */
const V = "2026-08-03";

export const NZ: LiftSeed[] = [
  // ─── CORONET PEAK (Queenstown · NZSki) ───
  { id: "cp-coronet-express",   mountainId: "coronet-peak",    name: "Coronet Express",      baseElevation: 1187, topElevation: 1620, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "cp-greengates-express", mountainId: "coronet-peak",   name: "Greengates Express",   baseElevation: 1240, topElevation: 1620, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "cp-meadows-express",   mountainId: "coronet-peak",    name: "Meadows Express",      baseElevation: 1230, topElevation: 1440, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "cp-rocky-gully-tbar",  mountainId: "coronet-peak",    name: "Rocky Gully T-Bar",    baseElevation: 1440, topElevation: 1649, exposure: "highly_exposed", windHoldThresholdKmh: 70, type: "t-bar",            verifiedAt: V },

  // ─── THE REMARKABLES (Queenstown · NZSki) ───
  { id: "rm-alpine-express",    mountainId: "the-remarkables", name: "Alpine Express",       baseElevation: 1586, topElevation: 1798, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "rm-sugar-bowl-express", mountainId: "the-remarkables", name: "Sugar Bowl Express",  baseElevation: 1610, topElevation: 1900, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "rm-curvey-basin",      mountainId: "the-remarkables", name: "Curvey Basin",         baseElevation: 1590, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "rm-shadow-basin-express", mountainId: "the-remarkables", name: "Shadow Basin Express", baseElevation: 1620, topElevation: 1943, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",    verifiedAt: V },

  // ─── CARDRONA (Wanaka · RealNZ) ───
  { id: "ca-mcdougalls-chondola", mountainId: "cardrona",      name: "McDougall's Chondola", baseElevation: 1670, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "ca-whitestar-express", mountainId: "cardrona",        name: "Whitestar Express",    baseElevation: 1670, topElevation: 1855, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "ca-captains-express",  mountainId: "cardrona",        name: "Captain's Express",    baseElevation: 1700, topElevation: 1894, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "ca-valley-view-quad",  mountainId: "cardrona",        name: "Valley View Quad",     baseElevation: 1560, topElevation: 1670, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ca-willows-quad",      mountainId: "cardrona",        name: "Willows Quad",         baseElevation: 1740, topElevation: 1894, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── TREBLE CONE (Wanaka · RealNZ) ───
  { id: "tc-home-basin-express", mountainId: "treble-cone",    name: "Home Basin Express",   baseElevation: 1260, topElevation: 1660, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "tc-saddle-basin-quad", mountainId: "treble-cone",     name: "Saddle Basin Quad",    baseElevation: 1500, topElevation: 1860, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MT HUTT (Canterbury · NZSki) · famously wind-exposed ("Mt Shutt") ───
  { id: "mh-summit-six",        mountainId: "mt-hutt",         name: "Summit Six",           baseElevation: 1615, topElevation: 2086, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "mh-quad-chair",        mountainId: "mt-hutt",         name: "Quad Chair",           baseElevation: 1585, topElevation: 1830, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-triple-chair",      mountainId: "mt-hutt",         name: "Triple Chair",         baseElevation: 1615, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── WHAKAPAPA (Mt Ruapehu north side) ───
  { id: "wk-sky-waka",          mountainId: "whakapapa",       name: "Sky Waka Gondola",     baseElevation: 1630, topElevation: 2020, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "wk-rangatira-express", mountainId: "whakapapa",       name: "Rangatira Express",    baseElevation: 1660, topElevation: 1980, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "wk-waterfall-express", mountainId: "whakapapa",       name: "Waterfall Express",    baseElevation: 1690, topElevation: 2010, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },

  // ─── TUROA (Mt Ruapehu south side · NZ's highest lifts) ───
  { id: "tu-high-noon-express", mountainId: "turoa",           name: "High Noon Express",    baseElevation: 2000, topElevation: 2322, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "tu-giant-quad",        mountainId: "turoa",           name: "Giant Quad",           baseElevation: 1740, topElevation: 2010, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tu-parklane-quad",     mountainId: "turoa",           name: "Parklane Quad",        baseElevation: 1623, topElevation: 1760, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];
