import ResortDetail from "./pages/resort";
import Alerts from "./pages/alerts";
import MapView from "./pages/map";
import Stay from "./pages/stay";
import type { RegionRouter } from "@/layouts/RegionLayout";

export const yamanouchiRouter: RegionRouter = {
  MountainDetail: ResortDetail,
  Alerts,
  Radar: MapView,
  Stay,
};
