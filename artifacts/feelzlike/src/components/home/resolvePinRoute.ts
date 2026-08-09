import type { RegionConfig } from "@workspace/feelzlike-shell";

export function resolvePinRoute(region: RegionConfig | undefined, pinId: string): string | null {
  if (!region) return null;

  if (region.baseTowns?.some((t: any) => t.id === pinId)) {
    return `/${region.id}/${pinId}`;
  }

  if (region.mountains?.some((m: any) => m.id === pinId)) {
    return `/${region.id}/mountain/${pinId}`;
  }

  return null;
}
