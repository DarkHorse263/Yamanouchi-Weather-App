import ResortDetail from "./pages/resort";
import Alerts from "./pages/alerts";
import MapView from "./pages/map";
import type { RegionRouter } from "@/layouts/RegionLayout";

export const yamanouchiRouter: RegionRouter = {
  MountainDetail: ResortDetail,
  Alerts,
  Radar: MapView,
};
