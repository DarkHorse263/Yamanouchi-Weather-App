import type { LiftSeed } from "../lifts";

/**
 * QUEBEC (CA) - Charlevoix (Mont-Sainte-Anne, Le Massif), Eastern Townships
 * (Bromont, Mont Sutton) and the Laurentians (Tremblant).
 *
 * Lift names taken from each resort's official trail map / lift list
 * (mont-sainte-anne.com, lemassif.com, bromontmontagne.com, montsutton.com,
 * tremblant.ca), cross-checked against public lift-status pages. Base/top
 * elevations are approximate on-mountain figures rounded from the published
 * stats. Wind-hold thresholds are conservative best-estimates by lift type
 * and exposure, not published operating limits · surfaced in the UI with
 * `verifiedAt` for transparency.
 */
const V = "2026-08-02";

export const QUEBEC_CHARLEVOIX: LiftSeed[] = [
  // ─── MONT-SAINTE-ANNE (summit exposed to St. Lawrence nordet winds) ───
  { id: "msa-etoile-filante",     mountainId: "mont-sainte-anne", name: "L'Étoile Filante Gondola", baseElevation: 175, topElevation: 800, exposure: "moderate",  windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "msa-express-du-sud",     mountainId: "mont-sainte-anne", name: "L'Express du Sud",         baseElevation: 175, topElevation: 800, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "msa-panorama-express",   mountainId: "mont-sainte-anne", name: "Panorama Express",         baseElevation: 350, topElevation: 800, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "msa-express-du-nord",    mountainId: "mont-sainte-anne", name: "L'Express du Nord",        baseElevation: 250, topElevation: 625, exposure: "sheltered", windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "msa-la-tortue",          mountainId: "mont-sainte-anne", name: "La Tortue",                baseElevation: 175, topElevation: 490, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── LE MASSIF (drops toward the St. Lawrence · river-wind exposure) ───
  { id: "lm-camp-boule-express",  mountainId: "le-massif",        name: "Camp Boule Express",       baseElevation: 350, topElevation: 806, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "lm-grande-pointe",       mountainId: "le-massif",        name: "Grande Pointe Express",    baseElevation: 41,  topElevation: 770, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "lm-maillard-express",    mountainId: "le-massif",        name: "Le Maillard Express",      baseElevation: 41,  topElevation: 720, exposure: "sheltered", windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
];

export const QUEBEC_EASTERN_TOWNSHIPS: LiftSeed[] = [
  // ─── BROMONT (night-skiing hill · mostly below treeline) ───
  { id: "br-express-du-lac",      mountainId: "bromont-resort",   name: "Express du Lac",           baseElevation: 265, topElevation: 565, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "br-la-directe",          mountainId: "bromont-resort",   name: "La Directe",               baseElevation: 265, topElevation: 565, exposure: "sheltered", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "br-mont-soleil",         mountainId: "bromont-resort",   name: "Mont Soleil",              baseElevation: 300, topElevation: 520, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "br-du-midi",             mountainId: "bromont-resort",   name: "Du Midi",                  baseElevation: 265, topElevation: 540, exposure: "sheltered", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MONT SUTTON (glade skiing · lifts numbered on the trail map) ───
  { id: "su-chair-iv",            mountainId: "mont-sutton",      name: "Chair IV (quad)",          baseElevation: 550, topElevation: 860, exposure: "moderate",  windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "su-chair-ii",            mountainId: "mont-sutton",      name: "Chair II",                 baseElevation: 400, topElevation: 680, exposure: "sheltered", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "su-chair-vii",           mountainId: "mont-sutton",      name: "Chair VII",                baseElevation: 640, topElevation: 960, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];

export const QUEBEC_LAURENTIANS: LiftSeed[] = [
  // ─── TREMBLANT (summit catches north-westerlies off the Laurentians) ───
  { id: "tr-telecabine-express",  mountainId: "tremblant",        name: "Télécabine Express",       baseElevation: 230, topElevation: 875, exposure: "moderate",  windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "tr-flying-mile",         mountainId: "tremblant",        name: "Flying Mile",              baseElevation: 230, topElevation: 570, exposure: "sheltered", windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "tr-duncan-express",      mountainId: "tremblant",        name: "Duncan Express",           baseElevation: 400, topElevation: 875, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "tr-expo-express",        mountainId: "tremblant",        name: "Expo Express",             baseElevation: 405, topElevation: 875, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "tr-lowell-thomas",       mountainId: "tremblant",        name: "Lowell Thomas Express",    baseElevation: 500, topElevation: 870, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "tr-le-soleil",           mountainId: "tremblant",        name: "Le Soleil",                baseElevation: 405, topElevation: 850, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
];
