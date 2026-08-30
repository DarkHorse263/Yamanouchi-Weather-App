import { thredboLiftIdForName } from "./thredboLiftStatus.js";
import type { CuratedLiftThreshold } from "./thredboLiftWindAnalysis.js";

interface ThresholdSource {
  liveNames: string[];
  seedLiftId: string;
  name: string;
  thresholdKmh: number;
  verifiedAt: string;
}

// Official feed names have changed over time. Keep known names as aliases so
// historical transition rows remain attached to the same public lift model.
export const THREDBO_THRESHOLD_SOURCES: ThresholdSource[] = [
  {
    liveNames: ["Kosciuszko Chairlift", "Kosciuszko Express"],
    seedLiftId: "kosciuszko-express",
    name: "Kosciuszko Express",
    thresholdKmh: 70,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Merritts Gondola"],
    seedLiftId: "merritts-gondola",
    name: "Merritts Gondola",
    thresholdKmh: 90,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Snowgums Chairlift", "Snowgums"],
    seedLiftId: "snowgums-chair",
    name: "Snowgums Chair",
    thresholdKmh: 80,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Cruiser Chairlift", "Cruiser"],
    seedLiftId: "cruiser",
    name: "Cruiser",
    thresholdKmh: 70,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Karels T-Bar", "Karel's T-Bar"],
    seedLiftId: "karels-tbar",
    name: "Karels T-Bar",
    thresholdKmh: 85,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Antons T-Bar", "Anton's T-Bar"],
    seedLiftId: "antons-tbar",
    name: "Antons T-Bar",
    thresholdKmh: 85,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Easy Does It Chairlift", "Easy Does It"],
    seedLiftId: "easy-does-it",
    name: "Easy Does It",
    thresholdKmh: 80,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Friday Flat Chairlift", "Friday Flat"],
    seedLiftId: "friday-flat",
    name: "Friday Flat",
    thresholdKmh: 75,
    verifiedAt: "2026-05-05",
  },
  {
    liveNames: ["Gunbarrel Chairlift", "Gunbarrel Express"],
    seedLiftId: "gunbarrel-chair",
    name: "Gunbarrel Express",
    thresholdKmh: 75,
    verifiedAt: "2026-08-12",
  },
  {
    liveNames: ["Basin T-Bar"],
    seedLiftId: "basin-tbar",
    name: "Basin T-Bar",
    thresholdKmh: 85,
    verifiedAt: "2026-08-12",
  },
  {
    liveNames: ["Sponars T-Bar", "Sponar's T-Bar"],
    seedLiftId: "sponars-tbar",
    name: "Sponars T-Bar",
    thresholdKmh: 85,
    verifiedAt: "2026-08-12",
  },
  {
    liveNames: ["Easy Rider T-Bar"],
    seedLiftId: "easy-rider-tbar",
    name: "Easy Rider T-Bar",
    thresholdKmh: 85,
    verifiedAt: "2026-08-12",
  },
];

export const THREDBO_THRESHOLDS: CuratedLiftThreshold[] =
  THREDBO_THRESHOLD_SOURCES.map(
    ({ liveNames, seedLiftId, name, thresholdKmh, verifiedAt }) => ({
      liveLiftIds: [...new Set(liveNames.map(thredboLiftIdForName))],
      seedLiftId,
      name,
      thresholdKmh,
      verifiedAt,
    }),
  );
