import type { ReactElement } from "react";
import { Switch, Route, useParams, useRoute, Redirect, Router as WouterRouter } from "wouter";
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
import { townNavHasContent } from "@/lib/navContent";
import { RegionStay } from "@/pages/region/RegionStay";
import { RegionAlerts } from "@/pages/region/RegionAlerts";
import { RegionSources } from "@/pages/region/RegionSources";
import { MountainDetail as GenericMountainDetail } from "@/pages/region/MountainDetail";
import { snowyMountainsRouter } from "@/regions/snowy-mountains/router";
import { yamanouchiRouter } from "@/regions/yamanouchi/router";
import { victoriasHighCountryRouter } from "@/regions/victorias-high-country/router";
import {
  isCatalogueMountainLinkTown,
  mountainDetailRouteMode,
  publishedMountainBelongsToRegion,
} from "@/regions/japan-catalogue";
import NotFound from "@/pages/not-found";

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
  "victorias-high-country": victoriasHighCountryRouter,
};

function RoutedMountainDetail({
  regionId,
  bespoke,
}: {
  regionId: string;
  bespoke?: RegionRouter["MountainDetail"];
}) {
  const [, mountainParams] = useRoute("/mountain/:id");
  const [, resortParams] = useRoute("/resort/:id");
  const mountainId = mountainParams?.id ?? resortParams?.id ?? "";
  if (!publishedMountainBelongsToRegion(regionId, mountainId)) {
    return <NotFound />;
  }
  const mode = mountainDetailRouteMode({
    regionId,
    mountainId,
    hasBespokeRouter: Boolean(bespoke),
  });

  if (mode === "bespoke" && bespoke) {
    const BespokeMountainDetail = bespoke;
    return <BespokeMountainDetail />;
  }
  return <GenericMountainDetail />;
}

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
    <AppShell
      isTownNavAvailable={(path, townId) => {
        const town = region.baseTowns?.find((candidate) => candidate.id === townId);
        return isCatalogueMountainLinkTown(town)
          ? path === "/"
          : townNavHasContent(region, townId, path);
      }}
    >
      <Switch>
        <Route path="/" component={RegionHome} />
        <Route path="/mountains" component={MountainsList} />
        <Route path="/mountains/lifts">
          {routes.LiftsAll ? <routes.LiftsAll /> : <Redirect to="/" />}
        </Route>
        {/* Custom region routers ship richer authored pages. Published
            weather-only catalogue mountains always bypass them and use the
            capability-aware generic weather detail. */}
        <Route path="/mountain/:id">
          <RoutedMountainDetail regionId={region.id} bespoke={routes.MountainDetail} />
        </Route>
        {/* Legacy URL - keep working during transition */}
        <Route path="/resort/:id">
          <RoutedMountainDetail regionId={region.id} bespoke={routes.MountainDetail} />
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
            <Redirect to="/" />
          )}
        </Route>
        {/* Custom region alerts pages (snowy-mountains, yamanouchi) ship a
            richer subscribe surface; every other region gets the generic
            alerts page (the subscription form is region-agnostic). */}
        <Route path="/alerts">
          {routes.Alerts ? <routes.Alerts /> : <RegionAlerts />}
        </Route>
        <Route path="/stay">
          {routes.Stay ? <routes.Stay /> : <RegionStay />}
        </Route>
        <Route path="/eat">
          {routes.Eat ? <routes.Eat /> : <Redirect to="/" />}
        </Route>
        <Route path="/explore">
          {routes.Explore ? <routes.Explore /> : <Redirect to="/" />}
        </Route>
        <Route path="/sources" component={RegionSources} />
        {/* Town routes: /:town and /:town/* - must come last so reserved slugs match first */}
        <Route path="/:town/:rest*" component={TownLayout} />
        <Route path="/:town" component={TownLayout} />
        <Route>
          <Redirect to="/" />
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
