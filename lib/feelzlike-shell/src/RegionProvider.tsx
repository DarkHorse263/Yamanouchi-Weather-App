import { createContext, useContext, type ReactNode } from "react";
import type { RegionConfig } from "./types";

interface RegionContextValue {
  region: RegionConfig;
  /** Region base path, e.g. "/snowy-mountains" — used to prefix sub-routes */
  basePath: string;
  /** Builds an absolute href from a region-relative path */
  href: (path: string) => string;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({
  region,
  children,
}: {
  region: RegionConfig;
  children: ReactNode;
}) {
  const basePath = `/${region.id}`;
  const href = (path: string) => {
    if (path === "/" || path === "") return basePath || "/";
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${clean}`;
  };
  return (
    <RegionContext.Provider value={{ region, basePath, href }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within a RegionProvider");
  return ctx;
}
