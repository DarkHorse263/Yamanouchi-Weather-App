import LocationDetail from "./pages/LocationDetail";
import Radar from "./pages/Radar";
import Alerts from "./pages/alerts";
import { SnowyTransport } from "./pages/Transport";
import type { RegionRouter } from "@/layouts/RegionLayout";

export const snowyMountainsRouter: RegionRouter = {
  MountainDetail: LocationDetail,
  Radar,
  Alerts,
  Transport: SnowyTransport,
};
