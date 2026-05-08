import LocationDetail from "./pages/LocationDetail";
import Alerts from "./pages/alerts";
import { SnowyTransport } from "./pages/Transport";
import type { RegionRouter } from "@/layouts/RegionLayout";

// May 2026 v2: standalone Radar page deleted. The /radar URL is kept
// alive in RegionLayout as a redirect to /:defaultTown/weather, where
// the radar lives embedded inside the Weather forecast page.
export const snowyMountainsRouter: RegionRouter = {
  MountainDetail: LocationDetail,
  Alerts,
  Transport: SnowyTransport,
};
