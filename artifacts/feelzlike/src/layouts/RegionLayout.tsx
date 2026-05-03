import { Switch, Route, useParams, Redirect } from "wouter";
import {
  AppShell,
  RegionProvider,
  SeasonProvider,
  LanguageProvider,
} from "@workspace/feelzlike-shell";
import { getRegion } from "@/regions";
import { RegionStub } from "@/pages/region/RegionStub";
import { SnowyMountainsRoutes } from "@/regions/snowy-mountains/router";
import { YamanouchiRoutes } from "@/regions/yamanouchi/router";
import { IiyamaRoutes } from "@/regions/iiyama/router";

const ROUTES: Array<{ path: string; title: string; titleJa?: string }> = [
  { path: "/",          title: "Today",     titleJa: "今日" },
  { path: "/mountains", title: "Mountains", titleJa: "スキー場" },
  { path: "/cams",      title: "Cams",      titleJa: "ライブカメラ" },
  { path: "/roads",     title: "Roads",     titleJa: "道路" },
  { path: "/lifts",     title: "Lifts",     titleJa: "リフト運行" },
  { path: "/radar",     title: "Radar",     titleJa: "気象レーダー" },
  { path: "/transport", title: "Transport", titleJa: "交通" },
  { path: "/stay",      title: "Stay",      titleJa: "宿泊" },
  { path: "/eat",       title: "Eat",       titleJa: "食事" },
  { path: "/explore",   title: "Explore",   titleJa: "観光" },
  { path: "/alerts",    title: "Alerts",    titleJa: "警報" },
  { path: "/resort/:id",title: "Resort",    titleJa: "スキー場" },
];

export function RegionLayout() {
  const params = useParams<{ region: string }>();
  const regionId = params.region;
  const region = regionId ? getRegion(regionId) : undefined;

  if (!region) return <Redirect to="/" />;

  const hemisphere = region.id === "snowy-mountains" ? "south" : "north";

  const inner = (
    <AppShell>
      {region.id === "snowy-mountains" ? (
        <SnowyMountainsRoutes />
      ) : region.id === "yamanouchi" ? (
        <YamanouchiRoutes />
      ) : region.id === "iiyama" ? (
        <IiyamaRoutes />
      ) : (
        <Switch>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path}>
              {(routeParams: Record<string, string> | null) => (
                <RegionStub
                  title={r.title}
                  titleJa={r.titleJa}
                  params={routeParams ?? undefined}
                />
              )}
            </Route>
          ))}
          <Route>
            <RegionStub title="Not found" titleJa="ページが見つかりません" />
          </Route>
        </Switch>
      )}
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
      <WouterBase base={`/${region.id}`}>{withSeason}</WouterBase>
    </RegionProvider>
  );
}

// Local wrapper so the AppShell's region-relative routes resolve correctly.
import { Router as WouterRouter } from "wouter";
function WouterBase({ base, children }: { base: string; children: React.ReactNode }) {
  return <WouterRouter base={base}>{children}</WouterRouter>;
}
