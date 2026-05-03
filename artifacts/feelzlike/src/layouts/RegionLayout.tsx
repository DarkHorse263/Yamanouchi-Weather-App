import type { ReactElement } from "react";
import { Switch, Route, useParams, Redirect, Router as WouterRouter } from "wouter";
import {
  AppShell,
  RegionProvider,
  SeasonProvider,
  LanguageProvider,
  BaseTownProvider,
} from "@workspace/feelzlike-shell";
import { getRegion } from "@/regions";
import { RegionOverview } from "@/pages/region/RegionOverview";
import { MountainsList } from "@/pages/region/MountainsList";
import { TownLayout } from "@/layouts/TownLayout";
import { RegionStub } from "@/pages/region/RegionStub";
import { snowyMountainsRouter } from "@/regions/snowy-mountains/router";
import { yamanouchiRouter } from "@/regions/yamanouchi/router";
import { iiyamaRouter } from "@/regions/iiyama/router";

export interface RegionRouter {
  /** Renders /:region/mountain/:id (and /:region/resort/:id for legacy) */
  MountainDetail?: () => ReactElement | null;
  /** Renders /:region/radar */
  Radar?: () => ReactElement | null;
  /** Renders /:region/alerts */
  Alerts?: () => ReactElement | null;
  /** Renders /:region/mountains/lifts (region-wide lifts roll-up) */
  LiftsAll?: () => ReactElement | null;
}

const REGION_ROUTERS: Record<string, RegionRouter> = {
  "snowy-mountains": snowyMountainsRouter,
  "yamanouchi": yamanouchiRouter,
  "iiyama": iiyamaRouter,
};

export function RegionLayout() {
  const params = useParams<{ region: string }>();
  const regionId = params.region;
  const region = regionId ? getRegion(regionId) : undefined;

  if (!region) return <Redirect to="/" />;

  const hemisphere = region.id === "snowy-mountains" ? "south" : "north";
  const routes: RegionRouter = REGION_ROUTERS[region.id] ?? {};

  const inner = (
    <AppShell>
      <Switch>
        <Route path="/" component={RegionOverview} />
        <Route path="/mountains" component={MountainsList} />
        <Route path="/mountains/lifts">
          {routes.LiftsAll ? <routes.LiftsAll /> : <RegionStub title="Lifts" titleJa="リフト運行" />}
        </Route>
        <Route path="/mountain/:id">
          {routes.MountainDetail ? <routes.MountainDetail /> : <RegionStub title="Mountain" titleJa="スキー場" />}
        </Route>
        {/* Legacy URL — keep working during transition */}
        <Route path="/resort/:id">
          {routes.MountainDetail ? <routes.MountainDetail /> : <RegionStub title="Mountain" titleJa="スキー場" />}
        </Route>
        <Route path="/radar">
          {routes.Radar ? <routes.Radar /> : <RegionStub title="Radar" titleJa="気象レーダー" />}
        </Route>
        <Route path="/alerts">
          {routes.Alerts ? <routes.Alerts /> : <RegionStub title="Alerts" titleJa="警報" />}
        </Route>
        {/* Town routes: /:town and /:town/* — must come last so reserved slugs match first */}
        <Route path="/:town/:rest*" component={TownLayout} />
        <Route path="/:town" component={TownLayout} />
        <Route>
          <RegionStub title="Not found" titleJa="ページが見つかりません" />
        </Route>
      </Switch>
    </AppShell>
  );

  const withLang = region.language ? (
    <LanguageProvider regionId={region.id} locales={region.language.locales}>
      {inner}
    </LanguageProvider>
  ) : (
    inner
  );

  const withSeason = region.seasons ? (
    <SeasonProvider regionId={region.id} hemisphere={hemisphere}>
      {withLang}
    </SeasonProvider>
  ) : (
    withLang
  );

  return (
    <RegionProvider region={region}>
      <BaseTownProvider region={region}>
        <WouterRouter base={`/${region.id}`}>{withSeason}</WouterRouter>
      </BaseTownProvider>
    </RegionProvider>
  );
}
