import ResortDetail from "./pages/resort";
import Alerts from "./pages/alerts";
import MapView from "./pages/map";
import StayPage from "./pages/stay";
import TransportPage from "./pages/transport";
import type { RegionRouter } from "@/layouts/RegionLayout";

// The RegionRouter contract is a zero-arg component (the layout calls it
// without props). Some of these pages accept optional props for embedded
// use elsewhere - wrap them so the type check stays strict.
function Stay() {
  return <StayPage />;
}
function Transport() {
  return <TransportPage />;
}

export const yamanouchiRouter: RegionRouter = {
  MountainDetail: ResortDetail,
  Alerts,
  Radar: MapView,
  Stay,
  Transport,
};
