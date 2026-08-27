import { useState, type FormEvent } from "react";
import {
  ChevronRight,
  Compass,
  Crosshair,
  GitCompareArrows,
  Map,
  MountainSnow,
  Search,
  X,
} from "lucide-react";

type RouteKey = "location" | "snow" | "map" | "compare";

const routes: Record<RouteKey, { eyebrow: string; title: string; detail: string; icon: typeof Crosshair }> = {
  location: {
    eyebrow: "start here",
    title: "where am i?",
    detail: "conditions around your location",
    icon: Crosshair,
  },
  snow: {
    eyebrow: "head uphill",
    title: "snow at peak",
    detail: "mountain conditions by elevation",
    icon: MountainSnow,
  },
  map: {
    eyebrow: "look around",
    title: "browse the map",
    detail: "regions across the mountains",
    icon: Map,
  },
  compare: {
    eyebrow: "choose well",
    title: "compare mountains",
    detail: "put two places side by side",
    icon: GitCompareArrows,
  },
};

export default function Crossroads() {
  const [activeRoute, setActiveRoute] = useState<RouteKey | null>(null);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const active = activeRoute ? routes[activeRoute] : null;

  function chooseRoute(route: RouteKey) {
    setActiveRoute(route);
    setSearched(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) {
      setActiveRoute(null);
      setSearched(true);
    }
  }

  return (
    <main className="crossroads-shell">
      <style>{`
        .crossroads-shell { --blue: #0758ec; --deep-blue: #0445bf; --pink: #ed1389; --ice: #edf5ff; --ink: #08245a; min-height: 100dvh; width:100%; overflow:hidden; color:#fff; background:var(--blue); font-family:"DIN Pro", "DIN Condensed", system-ui, sans-serif; }
        .crossroads-shell * { box-sizing:border-box; }
        .crossroads-shell button, .crossroads-shell input { font:inherit; }
        .crossroads-stage { width:min(100%, 430px); min-height:100dvh; margin:0 auto; padding:18px 18px calc(18px + env(safe-area-inset-bottom)); position:relative; isolation:isolate; display:flex; flex-direction:column; }
        .crossroads-stage:before { content:""; position:absolute; z-index:-2; inset:0; opacity:.32; background-image:linear-gradient(90deg, transparent 49.8%, rgba(255,255,255,.16) 50%, transparent 50.2%),linear-gradient(0deg, transparent 49.8%, rgba(255,255,255,.11) 50%, transparent 50.2%); background-size:100% 100%; }
        .crossroads-stage:after { content:""; z-index:-1; width:250px; height:250px; border:1px solid rgba(255,255,255,.22); border-radius:50%; position:absolute; top:245px; left:50%; transform:translateX(-50%); }
        .crossroads-top { display:flex; justify-content:space-between; align-items:center; min-height:45px; animation:cr-rise .45s both; }
        .crossroads-logo { width:125px; height:auto; display:block; }
        .about { border:1px solid rgba(255,255,255,.5); color:white; background:rgba(0,57,179,.2); border-radius:99px; padding:9px 12px; font-size:11px; font-weight:700; line-height:1; letter-spacing:.02em; text-transform:lowercase; cursor:pointer; transition:background .2s, transform .2s; }
        .about:hover, .about:focus-visible { background:rgba(255,255,255,.15); transform:translateY(-1px); outline:none; }
        .intro { padding:23px 4px 15px; animation:cr-rise .5s .06s both; }
        .kicker { font-size:10px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; color:#bdd8ff; margin:0 0 8px; }
        .intro h1 { max-width:305px; font-size:31px; line-height:.99; letter-spacing:-.045em; margin:0; font-weight:800; text-transform:lowercase; }
        .intro h1 i { color:#ffbadf; font-style:normal; }
        .crossroads-grid { display:grid; grid-template-columns:1fr 1fr; gap:11px; position:relative; margin:2px 0 11px; }
        .route { min-height:117px; border:1px solid rgba(255,255,255,.46); color:white; border-radius:4px; text-align:left; background:rgba(0,49,163,.24); padding:14px 12px 12px; cursor:pointer; position:relative; overflow:hidden; transition:transform .18s ease, background .18s ease, border-color .18s ease; animation:cr-rise .55s both; }
        .route:nth-child(2) { animation-delay:.09s; } .route:nth-child(3) { animation-delay:.18s; } .route:nth-child(4) { animation-delay:.27s; }
        .route:before { content:""; position:absolute; width:38px; height:38px; border:1px solid rgba(255,255,255,.16); border-radius:50%; right:-10px; top:-10px; }
        .route:hover, .route:focus-visible, .route.is-active { transform:translateY(-3px); border-color:white; background:rgba(255,255,255,.14); outline:none; }
        .route.is-active:after { content:""; position:absolute; height:4px; width:4px; border-radius:50%; background:var(--pink); right:12px; bottom:14px; box-shadow:0 0 0 3px rgba(237,19,137,.24); }
        .route-icon { width:21px; height:21px; stroke-width:2.25; margin-bottom:12px; } .route-eyebrow { display:block; color:#bdDaff; font-size:9px; font-weight:800; letter-spacing:.11em; text-transform:uppercase; margin-bottom:3px; } .route strong { display:block; font-size:17px; letter-spacing:-.035em; line-height:1; } .route small { display:block; max-width:122px; margin-top:7px; color:#dceaff; font-size:10px; font-weight:600; line-height:1.12; }
        .search-wrap { grid-column:1 / -1; order:1; position:relative; z-index:2; padding:5px 0 6px; animation:cr-rise .52s .13s both; }
        .search-label { display:flex; align-items:center; justify-content:center; gap:8px; font-size:10px; font-weight:800; letter-spacing:.115em; text-transform:uppercase; margin-bottom:8px; color:#e0edff; }.search-label:before,.search-label:after { content:""; height:1px; flex:1; background:rgba(255,255,255,.28); }
        .search-box { height:58px; border-radius:3px; display:flex; align-items:center; background:#fff; box-shadow:0 10px 0 rgba(0,48,159,.16), 0 18px 28px rgba(0,42,135,.22); border:2px solid white; transition:transform .2s, box-shadow .2s; }.search-box:focus-within { transform:translateY(-2px); box-shadow:0 12px 0 rgba(0,48,159,.14), 0 22px 30px rgba(0,42,135,.3); }
        .search-icon { margin-left:16px; color:var(--blue); width:21px; height:21px; flex:none; }.search-box input { min-width:0; flex:1; padding:0 8px 0 11px; color:var(--ink); border:0; outline:0; font-size:16px; font-weight:700; background:transparent; }.search-box input::placeholder { color:#6e91cd; font-weight:600; }.search-go { height:42px; width:42px; padding:0; margin-right:6px; border:0; cursor:pointer; border-radius:2px; display:grid; place-items:center; background:var(--pink); color:white; transition:transform .17s, background .17s; }.search-go:hover,.search-go:focus-visible { background:#ca0b71; transform:scale(.96); outline:2px solid var(--ink); outline-offset:2px; }
        .bottom-row { grid-column:1 / -1; order:2; display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-top:0; }.bottom-row .route { min-height:116px; }
        .status { min-height:50px; margin-top:auto; padding:11px 13px; border-top:1px solid rgba(255,255,255,.32); border-bottom:1px solid rgba(255,255,255,.2); display:flex; align-items:center; gap:10px; animation:cr-rise .55s .36s both; }.status-symbol { width:26px; height:26px; border:1px solid rgba(255,255,255,.58); border-radius:50%; display:grid; place-items:center; flex:none; }.status-symbol svg { width:14px; height:14px; }.status p { margin:0; color:#dceaff; font-size:11px; line-height:1.2; font-weight:600; }.status b { color:#fff; font-weight:800; }
        .footer-preview { border-radius:4px; margin-top:13px; background:#f6f9ff; color:var(--ink); padding:11px 12px; display:flex; align-items:center; gap:10px; animation:cr-rise .55s .42s both; }.footer-preview img { width:74px; height:auto; }.footer-preview span { font-size:10px; line-height:1.25; font-weight:700; color:#416195; flex:1; }.footer-preview button { border:0; background:transparent; color:var(--blue); padding:5px 0 5px 5px; cursor:pointer; }.footer-preview button:hover { color:var(--pink); }.footer-preview svg { width:16px; height:16px; }
        @keyframes cr-rise { from { opacity:0; transform:translateY(11px); } to { opacity:1; transform:translateY(0); } } @media (prefers-reduced-motion:reduce) { .crossroads-shell * { animation:none !important; transition:none !important; } }
      `}</style>
      <div className="crossroads-stage">
        <header className="crossroads-top">
          <img className="crossroads-logo" src="/__mockup/images/feelzlike-home-logo-white.png" alt="feelzlike" />
          <button className="about" type="button" onClick={() => setActiveRoute(null)}>how it works</button>
        </header>

        <section className="intro" aria-labelledby="crossroads-title">
          <p className="kicker">real conditions for mountain travel</p>
          <h1 id="crossroads-title">which way does it <i>feelzlike?</i></h1>
        </section>

        <div className="crossroads-grid" aria-label="choose how to explore">
          <RouteCard route="location" active={activeRoute === "location"} onChoose={chooseRoute} />
          <RouteCard route="snow" active={activeRoute === "snow"} onChoose={chooseRoute} />
          <form className="search-wrap" onSubmit={submitSearch} role="search">
            <div className="search-label">or find a mountain</div>
            <div className="search-box">
              <Search className="search-icon" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search a place" aria-label="Search for a mountain, town, or region" />
              {query && <button className="search-go" type="button" aria-label="Clear search" onClick={() => { setQuery(""); setSearched(false); }}><X aria-hidden="true" /></button>}
              {!query && <button className="search-go" type="submit" aria-label="Search"><ChevronRight aria-hidden="true" /></button>}
            </div>
          </form>
          <div className="bottom-row">
            <RouteCard route="map" active={activeRoute === "map"} onChoose={chooseRoute} />
            <RouteCard route="compare" active={activeRoute === "compare"} onChoose={chooseRoute} />
          </div>
        </div>

        <section className="status" aria-live="polite">
          <span className="status-symbol">{active ? <active.icon aria-hidden="true" /> : searched ? <Search aria-hidden="true" /> : <Compass aria-hidden="true" />}</span>
          <p>{searched ? <>ready to search for <b>{query}</b></> : active ? <><b>{active.title}</b> · {active.detail}</> : <>four ways in · one clear view of the mountains</>}</p>
        </section>

        <aside className="footer-preview" aria-label="Feelzlike availability">
          <img src="/__mockup/images/feelzlike-home-logo-colour.png" alt="feelzlike" />
          <span>conditions for mountain travel · Australia · Japan · New Zealand</span>
          <button type="button" aria-label="Show coverage"><ChevronRight aria-hidden="true" /></button>
        </aside>
      </div>
    </main>
  );
}

function RouteCard({ route, active, onChoose }: { route: RouteKey; active: boolean; onChoose: (route: RouteKey) => void }) {
  const item = routes[route];
  const Icon = item.icon;
  return (
    <button className={`route ${active ? "is-active" : ""}`} type="button" onClick={() => onChoose(route)} aria-pressed={active}>
      <Icon className="route-icon" aria-hidden="true" />
      <span className="route-eyebrow">{item.eyebrow}</span>
      <strong>{item.title}</strong>
      <small>{item.detail}</small>
    </button>
  );
}