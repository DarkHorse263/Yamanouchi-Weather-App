import { Switch, Route, Router as WouterRouter, useParams, Redirect } from "wouter";
import { useEffect } from "react";
import { useBaseTown, useRegion } from "@workspace/feelzlike-shell";
import { TownHome } from "@/pages/region/TownHome";
import { TownSubpageStub } from "@/pages/region/TownSubpageStub";
import { TownStay } from "@/pages/town/TownStay";
import { TownPlaces } from "@/pages/town/TownPlaces";
import { TownRoads } from "@/pages/town/TownRoads";
import { TownTransport } from "@/pages/town/TownTransport";
import { TownWeather } from "@/pages/town/TownWeather";
import { TownCams } from "@/pages/town/TownCams";
import { snowyMountainsRouter } from "@/regions/snowy-mountains/router";
import { yamanouchiRouter } from "@/regions/yamanouchi/router";
import { iiyamaRouter } from "@/regions/iiyama/router";
import type { RegionRouter } from "@/layouts/RegionLayout";

const REGION_ROUTERS: Record<string, RegionRouter> = {
  "snowy-mountains": snowyMountainsRouter,
  yamanouchi: yamanouchiRouter,
  iiyama: iiyamaRouter,
};

/**
 * Wraps all /:town/* routes in a nested wouter base so children render with
 * town-relative paths (e.g. "/", "/stay"). Also syncs the BaseTown selection
 * to the URL token so useBaseTown() always reflects the visible town.
 */
export function TownLayout() {
  const params = useParams<{ town: string }>();
  const townId = params.town;
  const { towns, town, setTownId } = useBaseTown();
  const { region } = useRegion();
  const regionRoutes: RegionRouter = REGION_ROUTERS[region.id] ?? {};
  const TransportPage = regionRoutes.Transport ?? TownTransport;

  useEffect(() => {
    if (!townId) return;
    if (!towns.some((t) => t.id === townId)) return;
    if (town?.id !== townId) setTownId(townId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [townId]);

  if (!townId || !towns.some((t) => t.id === townId)) {
    return <Redirect to="/" />;
  }

  return (
    <WouterRouter base={`/${townId}`}>
      <Switch>
        <Route path="/" component={TownHome} />
        <Route path="/weather" component={TownWeather} />
        <Route path="/roads" component={TownRoads} />
        <Route path="/cams" component={TownCams} />
        <Route path="/transport" component={TransportPage} />
        <Route path="/stay" component={TownStay} />
        <Route path="/eat">
          <TownPlaces
            kind="eat"
            title="Eat"
            titleJa="食事"
            blurb="Restaurants, izakaya, cafés and bars near town."
            blurbJa="町周辺のレストラン・居酒屋・カフェ・バー。"
          />
        </Route>
        <Route path="/explore">
          <TownPlaces
            kind="explore"
            title="Explore"
            titleJa="観光"
            blurb="Attractions, museums, parks and natural sights near town."
            blurbJa="町周辺の観光地・博物館・公園・自然。"
          />
        </Route>
        <Route>
          <TownSubpageStub title="Not found" titleJa="ページが見つかりません" />
        </Route>
      </Switch>
    </WouterRouter>
  );
}
