import type { BaseTown, MountainLink, RegionConfig } from "@workspace/feelzlike-shell";

export interface CatalogueTownLandingItem {
  id: string;
  name: string;
  nameJa?: string;
  href: string;
}

export interface CatalogueTownLandingModel {
  heading: string;
  description: string;
  mountains: CatalogueTownLandingItem[];
}

export function isCatalogueMountainLinkTown(town: BaseTown | undefined): boolean {
  return (town as (BaseTown & { catalogueContentMode?: string }) | undefined)
    ?.catalogueContentMode === "mountain-links";
}

/**
 * Catalogue town coordinates are map centroids, not observed town-weather
 * locations. The only honest landing is links to published mountain forecasts.
 */
export function catalogueTownLandingModel(
  region: RegionConfig,
  town: BaseTown,
): CatalogueTownLandingModel | undefined {
  if (!isCatalogueMountainLinkTown(town)) return undefined;
  const mountainsById = new Map((region.mountains ?? []).map((mountain) => [mountain.id, mountain]));
  const mountains = (town.nearbyMountainIds ?? []).map((id) => {
    const mountain = mountainsById.get(id);
    if (!mountain) {
      throw new Error(`Catalogue base town references missing mountain: ${region.id}/${town.id}/${id}`);
    }
    return { id, name: mountain.name, nameJa: mountain.nameJa, href: `/${region.id}/mountain/${id}` };
  });
  if (mountains.length === 0) {
    throw new Error(`Catalogue base town has no published mountains: ${region.id}/${town.id}`);
  }
  return {
    heading: "Published mountain weather nearby",
    description: "Town weather is not currently published for this base. Choose a nearby mountain for its weather and forecast.",
    mountains,
  };
}