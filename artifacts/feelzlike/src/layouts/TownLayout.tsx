import { Switch, Route, Router as WouterRouter, useParams, Redirect } from "wouter";
import { useEffect } from "react";
import { useBaseTown, useRegion } from "@workspace/feelzlike-shell";
import { writeLastTown } from "@/lib/favouriteRegion";
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
import { victoriasHighCountryRouter } from "@/regions/victorias-high-country/router";
import { townNavHasContent } from "@/lib/navContent";
import type { RegionRouter } from "@/layouts/RegionLayout";

const REGION_ROUTERS: Record<string, RegionRouter> = {
  "snowy-mountains": snowyMountainsRouter,
  yamanouchi: yamanouchiRouter,
  "victorias-high-country": victoriasHighCountryRouter,
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

  // Persist the last town the user visited so Welcome can offer a return
  // shortcut on next visit. Writes the resolved BaseTown (not just the URL
  // slug) so we can render its display name without re-loading region config.
  useEffect(() => {
    if (!townId) return;
    const resolved = towns.find((t) => t.id === townId);
    if (!resolved) return;
    writeLastTown({
      regionId: region.id,
      townId: resolved.id,
      townName: resolved.name,
      townNameJa: resolved.nameJa,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [townId, region.id, towns]);

  if (!townId || !towns.some((t) => t.id === townId)) {
    return <Redirect to="/" />;
  }

  // Sections with no content for this town are hidden from the nav; guard the
  // routes too so a direct URL / old bookmark redirects home instead of landing
  // on an empty "coming soon" page.
  const gate = (path: string) => townNavHasContent(region, townId, path);

  return (
    <WouterRouter base={`/${townId}`}>
      <Switch>
        <Route path="/" component={TownHome} />
        <Route path="/weather" component={TownWeather} />
        <Route path="/roads">
          {gate("/roads") ? <TownRoads /> : <Redirect to="/" />}
        </Route>
        {/* Cams folded into /roads ("Roads & cams") in May 2026 reset.
            Keep /cams routable so existing bookmarks still land somewhere
            useful instead of 404'ing. */}
        <Route path="/cams">
          <Redirect to="/roads" />
        </Route>
        <Route path="/transport">
          {gate("/transport") ? <TransportPage /> : <Redirect to="/" />}
        </Route>
        <Route path="/stay">
          {gate("/stay") ? <TownStay /> : <Redirect to="/" />}
        </Route>
        <Route path="/eat">
          {gate("/eat") ? <TownEat /> : <Redirect to="/" />}
        </Route>
        <Route path="/explore">
          {gate("/explore") ? <TownExplore /> : <Redirect to="/" />}
        </Route>
        <Route>
          <TownSubpageStub title="Not found" titleJa="ページが見つかりません" />
        </Route>
      </Switch>
    </WouterRouter>
  );
}
