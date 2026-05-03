import { Switch, Route, Router as WouterRouter, useParams, Redirect } from "wouter";
import { useEffect } from "react";
import { useBaseTown } from "@workspace/feelzlike-shell";
import { TownHome } from "@/pages/region/TownHome";
import { TownSubpageStub } from "@/pages/region/TownSubpageStub";
import { TownStay } from "@/pages/town/TownStay";
import { TownPlaces } from "@/pages/town/TownPlaces";

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
