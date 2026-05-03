import { Switch, Route } from "wouter";
import Home from "./pages/home";
import Resorts from "./pages/resorts";
import ResortDetail from "./pages/resort";
import MapView from "./pages/map";
import Alerts from "./pages/alerts";
import Guide from "./pages/guide";
import Cams from "./pages/cams";
import Transport from "./pages/transport";
import Stay from "./pages/stay";
import Eat from "./pages/eat";
import Explore from "./pages/explore";
import Activities from "./pages/activities";
import { RegionStub } from "@/pages/region/RegionStub";

export function YamanouchiRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mountains" component={Resorts} />
      <Route path="/resort/:id" component={ResortDetail} />
      <Route path="/cams" component={Cams} />
      <Route path="/transport" component={Transport} />
      <Route path="/stay" component={Stay} />
      <Route path="/eat" component={Eat} />
      <Route path="/explore" component={Explore} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/radar" component={MapView} />
      <Route path="/activities" component={Activities} />
      <Route path="/guide" component={Guide} />
      <Route path="/lifts">
        <RegionStub title="Lifts" titleJa="リフト運行" />
      </Route>
      <Route path="/roads">
        <RegionStub title="Roads" titleJa="道路" />
      </Route>
      <Route>
        <RegionStub title="Not found" titleJa="ページが見つかりません" />
      </Route>
    </Switch>
  );
}
