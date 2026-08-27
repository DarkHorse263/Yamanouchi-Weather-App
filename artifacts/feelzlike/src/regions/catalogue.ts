import {
  getPublishedMountainCapabilities as getJapanCapabilities,
  mountainDetailRouteMode as japanRouteMode,
  publishedMountainBelongsToRegion as japanMountainBelongsToRegion,
  type PublishedMountainCapabilities,
} from "./japan-catalogue";
import {
  isWesternUsCatalogueMountain,
  westernUsPublishedMountainBelongsToRegion,
} from "./western-us-catalogue";
export {
  catalogueTownLandingModel,
  isCatalogueMountainLinkTown,
  type CatalogueTownLandingItem,
  type CatalogueTownLandingModel,
} from "./catalogue-towns";


export function publishedMountainBelongsToRegion(regionId: string, mountainId: string): boolean {
  return (
    japanMountainBelongsToRegion(regionId, mountainId) &&
    westernUsPublishedMountainBelongsToRegion(regionId, mountainId)
  );
}

export function getPublishedMountainCapabilities(
  regionId: string,
  mountainId: string,
): PublishedMountainCapabilities | undefined {
  if (isWesternUsCatalogueMountain(regionId, mountainId)) {
    return { hasAlerts: false, powderAlertsAvailable: false, contentMode: "weather-only" };
  }
  return getJapanCapabilities(regionId, mountainId);
}

export function mountainDetailRouteMode(input: {
  regionId: string;
  mountainId: string;
  hasBespokeRouter: boolean;
}): "generic" | "bespoke" {
  if (isWesternUsCatalogueMountain(input.regionId, input.mountainId)) return "generic";
  return japanRouteMode(input);
}