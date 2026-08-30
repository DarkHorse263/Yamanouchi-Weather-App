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
  // Coronet Express is a chondola (combination 6-chair + 8-gondola cabins)
  { id: "cp-coronet-express",   mountainId: "coronet-peak",    name: "Coronet Express",      baseElevation: 1187, topElevation: 1620, exposure: "exposed",        windHoldThresholdKmh: 70, type: "gondola",          verifiedAt: V },
  { id: "cp-greengates-express", mountainId: "coronet-peak",   name: "Greengates Express",   baseElevation: 1240, topElevation: 1620, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "cp-meadows-express",   mountainId: "coronet-peak",    name: "Meadows Express",      baseElevation: 1230, topElevation: 1440, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "cp-rocky-gully-tbar",  mountainId: "coronet-peak",    name: "Rocky Gully T-Bar",    baseElevation: 1440, topElevation: 1649, exposure: "highly_exposed", windHoldThresholdKmh: 70, type: "t-bar",            verifiedAt: V },

  // ─── THE REMARKABLES (Queenstown · NZSki) ───
  // Current lift list = Sugar Bowl Express (2020), Shadow Basin Express
  // (2024), Curvey Basin Express (2014) + the fixed Alta Chair (base
  // area); there is no "Alpine Express" here.
  { id: "rm-alta-chair",        mountainId: "the-remarkables", name: "Alta Chair",           baseElevation: 1586, topElevation: 1690, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "rm-sugar-bowl-express", mountainId: "the-remarkables", name: "Sugar Bowl Express",  baseElevation: 1610, topElevation: 1900, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "rm-curvey-basin",      mountainId: "the-remarkables", name: "Curvey Basin Express", baseElevation: 1590, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "rm-shadow-basin-express", mountainId: "the-remarkables", name: "Shadow Basin Express", baseElevation: 1620, topElevation: 1943, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",    verifiedAt: V },

  // ─── CARDRONA (Wanaka · RealNZ) ───
  { id: "ca-mcdougalls-chondola", mountainId: "cardrona",      name: "McDougall's Chondola", baseElevation: 1670, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "ca-whitestar-express", mountainId: "cardrona",        name: "Whitestar Express",    baseElevation: 1670, topElevation: 1855, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "ca-captains-express",  mountainId: "cardrona",        name: "Captain's Express",    baseElevation: 1700, topElevation: 1894, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "ca-valley-view-quad",  mountainId: "cardrona",        name: "Valley View Quad",     baseElevation: 1560, topElevation: 1670, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  // Willow Basin Quad = the relocated old McDougall's fixed quad (2021)
  { id: "ca-willows-quad",      mountainId: "cardrona",        name: "Willow Basin Quad",    baseElevation: 1700, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  // Soho Express (new 2025) · official 2026 map + published 380 m vertical
  { id: "ca-soho-express",      mountainId: "cardrona",        name: "Soho Express",         baseElevation: 1480, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: "2026-08-29" },

  // ─── TREBLE CONE (Wanaka · RealNZ) ───
  { id: "tc-home-basin-express", mountainId: "treble-cone",    name: "Home Basin Express",   baseElevation: 1260, topElevation: 1660, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "tc-saddle-basin-quad", mountainId: "treble-cone",     name: "Saddle Quad",          baseElevation: 1500, topElevation: 1860, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MT HUTT (Canterbury · NZSki) · famously wind-exposed ("Mt Shutt") ───
  { id: "mh-summit-six",        mountainId: "mt-hutt",         name: "Summit Six",           baseElevation: 1615, topElevation: 2086, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  // Nor'West Express (2021) = NZ's first 8-seater, replaced the old quad
  { id: "mh-quad-chair",        mountainId: "mt-hutt",         name: "Nor'West Express",     baseElevation: 1585, topElevation: 1830, exposure: "exposed",        windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "mh-triple-chair",      mountainId: "mt-hutt",         name: "Towers Triple Chair",  baseElevation: 1615, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── WHAKAPAPA (Mt Ruapehu north side) ───
  // Waterfall Express no longer exists - the Sky Waka (2019) replaced it.
  { id: "wk-sky-waka",          mountainId: "whakapapa",       name: "Sky Waka Gondola",     baseElevation: 1630, topElevation: 2020, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "wk-rangatira-express", mountainId: "whakapapa",       name: "Rangatira Express",    baseElevation: 1660, topElevation: 1980, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "wk-west-ridge-quad",   mountainId: "whakapapa",       name: "West Ridge Quad",      baseElevation: 1700, topElevation: 2000, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "wk-delta-quad",        mountainId: "whakapapa",       name: "Delta Quad",           baseElevation: 1700, topElevation: 1840, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── TUROA (Mt Ruapehu south side · NZ's highest lifts) ───
  // Giant + Parklane are fixed triples, not quads; the two parallel base
  // quads are Movenpick and Ngā Wai Heke (2019).
  { id: "tu-high-noon-express", mountainId: "turoa",           name: "High Noon Express",    baseElevation: 2000, topElevation: 2322, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "tu-giant-quad",        mountainId: "turoa",           name: "Giant Triple",         baseElevation: 1740, topElevation: 2010, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tu-parklane-quad",     mountainId: "turoa",           name: "Parklane Triple",      baseElevation: 1623, topElevation: 1760, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tu-movenpick-quad",    mountainId: "turoa",           name: "Movenpick Quad",       baseElevation: 1623, topElevation: 1740, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tu-nga-wai-heke",      mountainId: "turoa",           name: "Ngā Wai Heke Quad",    baseElevation: 1623, topElevation: 1740, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];
