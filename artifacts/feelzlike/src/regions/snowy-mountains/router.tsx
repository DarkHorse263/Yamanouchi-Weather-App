import { Switch, Route } from "wouter";
import Dashboard from "./pages/Dashboard";
import LocationDetail from "./pages/LocationDetail";
import Webcams from "./pages/Webcams";
import RoadConditions from "./pages/RoadConditions";
import LiftStatus from "./pages/LiftStatus";
import BusServices from "./pages/BusServices";
import Radar from "./pages/Radar";
import { RegionStub } from "@/pages/region/RegionStub";

export function SnowyMountainsRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/mountains" component={Dashboard} />
      <Route path="/resort/:id" component={LocationDetail} />
      <Route path="/cams" component={Webcams} />
      <Route path="/roads" component={RoadConditions} />
      <Route path="/lifts" component={LiftStatus} />
      <Route path="/transport" component={BusServices} />
      <Route path="/radar" component={Radar} />
      <Route path="/stay">
        <RegionStub title="Stay" />
      </Route>
      <Route path="/eat">
        <RegionStub title="Eat" />
      </Route>
      <Route path="/explore">
        <RegionStub title="Explore" />
      </Route>
      <Route path="/alerts">
        <RegionStub title="Alerts" />
      </Route>
      <Route>
        <RegionStub title="Not found" />
      </Route>
    </Switch>
  );
}
