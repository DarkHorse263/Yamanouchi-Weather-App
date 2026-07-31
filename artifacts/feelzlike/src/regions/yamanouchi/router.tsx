import ResortDetail from "./pages/resort";
import Alerts from "./pages/alerts";
import MapView from "./pages/map";
import TransportPage from "./pages/transport";
import type { RegionRouter } from "@/layouts/RegionLayout";

// The RegionRouter contract is a zero-arg component (the layout calls it
// without props). Some of these pages accept optional props for embedded
// use elsewhere - wrap them so the type check stays strict.
function Transport() {
  return <TransportPage />;
}

// Stay override removed July 2026 (owner decision): Yamanouchi now uses the
// same generic Stay (affiliate platform links) and Eat (Google Maps launch
// pad) pages as every other town, for a consistent format. The curated
// pages/stay.tsx + pages/eat.tsx remain in the folder but are unrouted.
export const yamanouchiRouter: RegionRouter = {
  MountainDetail: ResortDetail,
  Alerts,
  Radar: MapView,
  Transport,
};
