import legacyRouteDeclarations from "./legacyRoutes.json";

export type LegacyRouteDeclaration = {
  from: string;
  to: string;
  suffixes: string[];
};

export const legacyRoutes = legacyRouteDeclarations satisfies LegacyRouteDeclaration[];

export function legacyRouteDestination(
  location: string,
  route: Pick<LegacyRouteDeclaration, "from" | "to">,
): string {
  const queryOrHashIndex = location.search(/[?#]/);
  const pathname = queryOrHashIndex === -1 ? location : location.slice(0, queryOrHashIndex);
  const queryAndHash = queryOrHashIndex === -1 ? "" : location.slice(queryOrHashIndex);
  const suffix = pathname.startsWith(route.from)
    ? pathname.slice(route.from.length)
    : "";

  return `${route.to}${suffix}${queryAndHash}`;
}