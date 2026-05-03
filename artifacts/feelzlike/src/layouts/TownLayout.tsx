import { Switch, Route, Router as WouterRouter, useParams, Redirect } from "wouter";
import { useEffect } from "react";
import { useBaseTown } from "@workspace/feelzlike-shell";
import { TownHome } from "@/pages/region/TownHome";
import { TownSubpageStub } from "@/pages/region/TownSubpageStub";

/**
 * Wraps all /:town/* routes in a nested wouter base so children render with
 * town-relative paths (e.g. "/", "/stay"). Also syncs the BaseTown selection
 * to the URL token so useBaseTown() always reflects the visible town.
 */
export function TownLayout() {
  const params = useParams<{ town: string }>();
  const townId = params.town;
  const { towns, town, setTownId } = useBaseTown();

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
        <Route path="/roads">
          <TownSubpageStub
            title="Roads"
            titleJa="道路"
            description="Live conditions on the routes to the mountain."
            descriptionJa="山までのルートの最新状況。"
          />
        </Route>
        <Route path="/cams">
          <TownSubpageStub
            title="Cams"
            titleJa="ライブカメラ"
            description="Town and roadside webcams near you."
            descriptionJa="町と路傍のライブカメラ。"
          />
        </Route>
        <Route path="/transport">
          <TownSubpageStub
            title="Transport"
            titleJa="交通"
            description="Buses, shuttles and trains from town to the mountain."
            descriptionJa="町から山までのバス・送迎・電車。"
          />
        </Route>
        <Route path="/stay">
          <TownSubpageStub
            title="Stay"
            titleJa="宿泊"
            description="Hotels, ryokan and lodges in this town."
            descriptionJa="町内の宿泊施設。"
          />
        </Route>
        <Route path="/eat">
          <TownSubpageStub
            title="Eat"
            titleJa="食事"
            description="Restaurants, izakaya and cafés in town."
            descriptionJa="町内の飲食店。"
          />
        </Route>
        <Route path="/explore">
          <TownSubpageStub
            title="Explore"
            titleJa="観光"
            description="Off-mountain things to do near town."
            descriptionJa="町周辺の観光・アクティビティ。"
          />
        </Route>
        <Route>
          <TownSubpageStub title="Not found" titleJa="ページが見つかりません" />
        </Route>
      </Switch>
    </WouterRouter>
  );
}
