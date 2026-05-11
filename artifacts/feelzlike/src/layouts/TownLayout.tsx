import { Switch, Route, Router as WouterRouter, useParams, Redirect } from "wouter";
import { useEffect } from "react";
import { useBaseTown, useRegion } from "@workspace/feelzlike-shell";
import { TownHome } from "@/pages/region/TownHome";
import { TownSubpageStub } from "@/pages/region/TownSubpageStub";
import { TownStay } from "@/pages/town/TownStay";
import { TownEat } from "@/pages/town/TownEat";
import { TownExplore } from "@/pages/town/TownExplore";
import { TownRoads } from "@/pages/town/TownRoads";
import { TownTransport } from "@/pages/town/TownTransport";
import { TownWeather } from "@/pages/town/TownWeather";
import { snowyMountainsRouter } from "@/regions/snowy-mountains/router";
import { yamanouchiRouter } from "@/regions/yamanouchi/router";
import type { RegionRouter } from "@/layouts/RegionLayout";

const REGION_ROUTERS: Record<string, RegionRouter> = {
  "snowy-mountains": snowyMountainsRouter,
  yamanouchi: yamanouchiRouter,
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
        {/* Cams folded into /roads ("Roads & cams") in May 2026 reset.
            Keep /cams routable so existing bookmarks still land somewhere
            useful instead of 404'ing. */}
        <Route path="/cams">
          <Redirect to="/roads" />
        </Route>
        <Route path="/transport" component={TransportPage} />
        <Route path="/stay" component={TownStay} />
        <Route path="/eat" component={TownEat} />
        <Route path="/explore" component={TownExplore} />
        <Route>
          <TownSubpageStub title="Not found" titleJa="ページが見つかりません" />
        </Route>
      </Switch>
    </WouterRouter>
  );
}
