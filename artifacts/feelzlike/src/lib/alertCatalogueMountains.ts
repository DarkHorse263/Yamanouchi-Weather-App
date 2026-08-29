import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import {
  publishedCatalogueRecords as publishedWesternUsCatalogueRecords,
  states as westernUsStates,
} from "@workspace/western-us-ski-catalogue/public-runtime";

export interface AlertCatalogueMountain {
  publicId: string;
  name: string;
  stateOrProvince: string;
}

const westernUsStateNames = new Map(
  westernUsStates.map((state) => [state.stateCode, state.name]),
);

export const alertCatalogueMountains: readonly AlertCatalogueMountain[] = [
  ...publishedRecords
    .filter((record) => record.alertEligible)
    .map((record) => ({
      publicId: record.publicId,
      name: record.name,
      stateOrProvince: record.stateOrProvince,
    })),
  ...publishedWesternUsCatalogueRecords.map((record) => ({
    publicId: record.publicId,
    name: record.name,
    stateOrProvince: westernUsStateNames.get(record.stateCode) ?? record.stateCode,
  })),
];

const seenIds = new Set<string>();
for (const record of alertCatalogueMountains) {
  if (seenIds.has(record.publicId)) {
    throw new Error(`[catalogue-alerts] duplicate mountain id: "${record.publicId}"`);
  }
  seenIds.add(record.publicId);
}

export function isAlertCatalogueMountain(id: string): boolean {
  return seenIds.has(id);
}