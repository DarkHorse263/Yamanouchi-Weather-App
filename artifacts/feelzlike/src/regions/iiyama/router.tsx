import { Switch, Route } from "wouter";
import Home from "./pages/home";
import Resorts from "./pages/resorts";
import ResortDetail from "./pages/resort";
import MapView from "./pages/map";
import Outlook from "./pages/outlook";
import Alerts from "./pages/alerts";
import Cams from "./pages/cams";
import Stay from "./pages/stay";
import Eat from "./pages/eat";
import Explore from "./pages/explore";
import NotFound from "./pages/not-found";
import { RegionStub } from "@/pages/region/RegionStub";

export function IiyamaRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mountains" component={Resorts} />
      <Route path="/resorts" component={Resorts} />
      <Route path="/resort/:id" component={ResortDetail} />
      <Route path="/cams" component={Cams} />
      <Route path="/stay" component={Stay} />
      <Route path="/eat" component={Eat} />
      <Route path="/explore" component={Explore} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/radar" component={MapView} />
      <Route path="/map" component={MapView} />
      <Route path="/outlook" component={Outlook} />
      <Route path="/transport">
        <RegionStub title="Transport" titleJa="交通" />
      </Route>
      <Route path="/lifts">
        <RegionStub title="Lifts" titleJa="リフト運行" />
      </Route>
      <Route path="/roads">
        <RegionStub title="Roads" titleJa="道路" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}
