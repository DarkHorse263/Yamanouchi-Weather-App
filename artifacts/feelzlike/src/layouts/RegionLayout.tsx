import type { ReactElement } from "react";
import { Switch, Route, useParams, Redirect, Router as WouterRouter } from "wouter";
import { RegionHome } from "@/pages/region/RegionHome";
import {
  AppShell,
  RegionProvider,
  SeasonProvider,
  LanguageProvider,
  BaseTownProvider,
} from "@workspace/feelzlike-shell";
import { getRegion } from "@/regions";
import { MountainsList } from "@/pages/region/MountainsList";
import { TownLayout } from "@/layouts/TownLayout";
import { RegionStub } from "@/pages/region/RegionStub";
import { RegionStay } from "@/pages/region/RegionStay";
import { RegionSources } from "@/pages/region/RegionSources";
import { MountainDetail as GenericMountainDetail } from "@/pages/region/MountainDetail";
import { snowyMountainsRouter } from "@/regions/snowy-mountains/router";
import { yamanouchiRouter } from "@/regions/yamanouchi/router";

export interface RegionRouter {
  /** Renders /:region/mountain/:id (and /:region/resort/:id for legacy) */
  MountainDetail?: () => ReactElement | null;
  /** Renders /:region/radar */
  Radar?: () => ReactElement | null;
  /** Renders /:region/alerts */
  Alerts?: () => ReactElement | null;
  /** Renders /:region/mountains/lifts (region-wide lifts roll-up) */
  LiftsAll?: () => ReactElement | null;
  /** Renders /:region/stay (region-wide accommodation) */
  Stay?: () => ReactElement | null;
  /** Renders /:region/eat */
  Eat?: () => ReactElement | null;
  /** Renders /:region/explore */
  Explore?: () => ReactElement | null;
  /**
   * Renders /:region/:town/transport when set; otherwise the generic
   * region-isolated providers list (TownTransport) is shown.
   */
  Transport?: () => ReactElement | null;
}

const REGION_ROUTERS: Record<string, RegionRouter> = {
  "snowy-mountains": snowyMountainsRouter,
  "yamanouchi": yamanouchiRouter,
};

export function RegionLayout() {
  const params = useParams<{ region: string }>();
  const regionId = params.region;
  const region = regionId ? getRegion(regionId) : undefined;

  if (!region) return <Redirect to="/" />;

  const hemisphere = region.hemisphere ?? "north";
  const routes: RegionRouter = REGION_ROUTERS[region.id] ?? {};
  // Region home is a base-town picker (Country > Region > Town flow).
  // Towns-first IA hard rule, see RegionConfig comment. Older versions
  // auto-redirected `/` to the first base town; that shortcut hid the
  // region landing for single-town-as-default users (e.g. JP went straight
  // to Yudanaka, skipping Yamanouchi). The town picker is now always shown.
  const defaultTown = region.baseTowns?.[0]?.id;

  const inner = (
    <AppShell>
      <Switch>
        <Route path="/" component={RegionHome} />
        <Route path="/mountains" component={MountainsList} />
        <Route path="/mountains/lifts">
          {routes.LiftsAll ? <routes.LiftsAll /> : <RegionStub title="Lifts" titleJa="リフト運行" />}
        </Route>
        {/* Custom region routers (snowy-mountains, yamanouchi) ship richer
            mountain pages with lifts/cams/etc. Regions without one (e.g.
            VHC) fall back to the generic mountain weather page so tapping
            a mountain row from a town's "Weather in mountains" panel always
            lands on real conditions instead of a stub. */}
        <Route path="/mountain/:id">
          {routes.MountainDetail ? <routes.MountainDetail /> : <GenericMountainDetail />}
        </Route>
        {/* Legacy URL - keep working during transition */}
        <Route path="/resort/:id">
          {routes.MountainDetail ? <routes.MountainDetail /> : <GenericMountainDetail />}
        </Route>
        {/* /radar folded into /:town/weather (May 2026 v2 reset). Keep the
            URL alive as a redirect so existing bookmarks land on the new
            home for the radar (embedded inside Weather forecast). */}
        <Route path="/radar">
          {defaultTown ? (
            <Redirect to={`/${defaultTown}/weather`} />
          ) : routes.Radar ? (
            <routes.Radar />
          ) : (
            <RegionStub title="Radar" titleJa="気象レーダー" />
          )}
        </Route>
        <Route path="/alerts">
          {routes.Alerts ? <routes.Alerts /> : <RegionStub title="Alerts" titleJa="警報" />}
        </Route>
        <Route path="/stay">
          {routes.Stay ? <routes.Stay /> : <RegionStay />}
        </Route>
        <Route path="/eat">
          {routes.Eat ? <routes.Eat /> : <RegionStub title="Eat" titleJa="食事" />}
        </Route>
        <Route path="/explore">
          {routes.Explore ? <routes.Explore /> : <RegionStub title="Explore" titleJa="観光" />}
        </Route>
        <Route path="/sources" component={RegionSources} />
        {/* Town routes: /:town and /:town/* - must come last so reserved slugs match first */}
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
