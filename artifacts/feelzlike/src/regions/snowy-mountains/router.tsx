import LocationDetail from "./pages/LocationDetail";
import Radar from "./pages/Radar";
import type { RegionRouter } from "@/layouts/RegionLayout";

export const snowyMountainsRouter: RegionRouter = {
  MountainDetail: LocationDetail,
  Radar,
};
