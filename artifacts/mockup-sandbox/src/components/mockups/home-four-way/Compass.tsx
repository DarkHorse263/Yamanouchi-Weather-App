import { useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Compass as CompassIcon,
  Map,
  MountainSnow,
  Navigation,
  Search,
  Scale,
  Snowflake,
  X,
} from "lucide-react";

type Route = "location" | "peak" | "map" | "compare";

const routes: Array<{
  id: Route;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Navigation;
}> = [
  {
    id: "location",
    eyebrow: "start here",
    title: "where i am",
    description: "your town · right now",
    icon: Navigation,
  },
  {
    id: "peak",
    eyebrow: "go higher",
    title: "snow at peak",
    description: "mountain conditions",
    icon: MountainSnow,
  },
  {
    id: "map",
    eyebrow: "look around",
    title: "browse regions",
    description: "the mountain map",
    icon: Map,
  },
  {
    id: "compare",
    eyebrow: "choose well",
    title: "compare mountains",
    description: "side by side",
    icon: Scale,
  },
];

const routeResponses: Record<Route, string> = {
  location: "location is ready when you are",
  peak: "search for a mountain to see its peak",
  map: "regional browsing opens from the map",
  compare: "pick any two mountains to compare",
};

export default function Compass() {
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const chooseRoute = (route: Route) => {
    setNotice(routeResponses[route]);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const submitSearch = () => {
    const place = search.trim();
    if (place) {
      setNotice(`looking for ${place.toLowerCase()}`);
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(true);
    }
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main
      className="compass-shell"
      style={{ fontFamily: "'DIN Pro', 'DIN Alternate', system-ui, sans-serif" }}
    >
      <style>{styles}</style>

      <div className="compass-sun" aria-hidden="true" />
      <div className="compass-contour contour-a" aria-hidden="true" />
      <div className="compass-contour contour-b" aria-hidden="true" />

      <header className="compass-header">
        <img
          src="/__mockup/images/feelzlike-home-logo-white.png"
          alt="feelzlike"
          className="compass-logo"
        />
        <button className="about-button" type="button" onClick={() => setNotice("mountain travel · made more certain")}>
          about
        </button>
      </header>

      <section className="compass-intro" aria-labelledby="compass-title">
        <p className="compass-kicker"><CompassIcon size={13} strokeWidth={2.2} /> mountain travel · made more certain</p>
        <h1 id="compass-title">where to?</h1>
        <p className="compass-subtitle">four good ways in</p>
      </section>

      <section className="compass-grid" aria-label="Choose how to explore">
        {routes.slice(0, 2).map((route, index) => (
          <RouteCard key={route.id} route={route} index={index} onChoose={chooseRoute} />
        ))}
      </section>

      <form
        className={`compass-search ${isSearchOpen ? "is-active" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <Search size={20} strokeWidth={2.4} aria-hidden="true" />
        <label className="sr-only" htmlFor="mountain-search">Search a town, peak or region</label>
        <input
          id="mountain-search"
          value={search}
          onFocus={() => setIsSearchOpen(true)}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="search a town, peak or region"
          autoComplete="off"
        />
        {search && (
          <button className="clear-button" type="button" aria-label="Clear search" onClick={() => setSearch("")}>
            <X size={16} />
          </button>
        )}
        <button className="search-submit" type="submit" aria-label="Search">
          <ArrowUpRight size={18} strokeWidth={2.6} />
        </button>
      </form>

      <section className="compass-grid lower-grid" aria-label="More ways to explore">
        {routes.slice(2).map((route, index) => (
          <RouteCard key={route.id} route={route} index={index + 2} onChoose={chooseRoute} />
        ))}
      </section>

      <section className="conditions-preview" aria-label="Example local conditions">
        <div className="preview-label"><span /> a nearby read</div>
        <div className="preview-card">
          <div>
            <p>jindabyne</p>
            <small>snowy mountains · town</small>
          </div>
          <div className="preview-temp"><b>6°</b><span>feels 3°</span></div>
          <SunMark />
        </div>
      </section>

      <footer className="compass-footer">
        <span>au · jp · nz</span>
        <span>real conditions · clear choices</span>
      </footer>

      <div className={`compass-toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>
    </main>
  );
}

function RouteCard({ route, index, onChoose }: { route: (typeof routes)[number]; index: number; onChoose: (route: Route) => void }) {
  const Icon = route.icon;
  return (
    <button
      className={`route-card route-${index + 1}`}
      type="button"
      onClick={() => onChoose(route.id)}
    >
      <span className="route-topline"><span>{route.eyebrow}</span><Icon size={19} strokeWidth={2.25} /></span>
      <span className="route-title">{route.title}</span>
      <span className="route-description">{route.description}</span>
      <span className="route-arrow" aria-hidden="true"><ArrowUpRight size={17} strokeWidth={2.6} /></span>
    </button>
  );
}

function SunMark() {
  return (
    <span className="sun-mark" aria-label="clear conditions">
      <Snowflake size={17} strokeWidth={1.7} />
    </span>
  );
}

const styles = `
  .compass-shell {
    --blue: #0755ee;
    --deep-blue: #0648ce;
    --ink: #073a9d;
    --pink: #f60082;
    --snow: #f7faff;
    width: min(100%, 390px);
    min-height: 844px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    color: var(--snow);
    background: var(--blue);
    box-shadow: 0 18px 70px rgba(7, 40, 113, .2);
    isolation: isolate;
    display: flex;
    flex-direction: column;
  }
  .compass-shell * { box-sizing: border-box; }
  .compass-sun {
    position: absolute; z-index: -2; width: 360px; height: 360px; border-radius: 50%;
    top: -234px; right: -96px; background: #4f91ff; opacity: .55;
  }
  .compass-contour {
    position: absolute; z-index: -1; border: 1px solid rgba(255,255,255,.16);
    border-radius: 48% 52% 55% 45% / 58% 44% 56% 42%; transform: rotate(-18deg); pointer-events: none;
  }
  .contour-a { width: 440px; height: 310px; right: -248px; top: 158px; }
  .contour-b { width: 560px; height: 400px; left: -354px; bottom: 136px; border-color: rgba(255,255,255,.13); }
  .compass-header { display: flex; justify-content: space-between; align-items: center; padding: 23px 22px 0; }
  .compass-logo { width: 119px; height: auto; display: block; }
  .about-button { border: 1px solid rgba(255,255,255,.42); border-radius: 999px; color: white; padding: 8px 12px; background: rgba(255,255,255,.08); font: 700 11px/1 inherit; letter-spacing: .04em; text-transform: lowercase; cursor: pointer; transition: background .18s ease, transform .18s ease; }
  .about-button:active { transform: scale(.96); background: rgba(255,255,255,.18); }
  .compass-intro { text-align: center; padding: 38px 20px 22px; }
  .compass-kicker { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 0 0 17px; color: rgba(255,255,255,.7); font-size: 10px; font-weight: 700; letter-spacing: .115em; text-transform: uppercase; }
  .compass-intro h1 { font-size: 46px; line-height: .92; letter-spacing: -.065em; margin: 0; font-weight: 800; }
  .compass-subtitle { margin: 11px 0 0; font-size: 14px; font-weight: 500; opacity: .72; letter-spacing: .01em; }
  .compass-grid { padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .route-card { min-height: 145px; position: relative; overflow: hidden; display: flex; flex-direction: column; text-align: left; border: 1px solid rgba(255,255,255,.3); border-radius: 22px; padding: 15px 15px 14px; color: #fff; cursor: pointer; background: rgba(3, 57, 177, .27); box-shadow: inset 0 1px 0 rgba(255,255,255,.12); transition: transform .18s ease, background .18s ease, border-color .18s ease; }
  .route-card::after { content: ""; position: absolute; width: 115px; height: 115px; right: -65px; bottom: -72px; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; }
  .route-card:active { transform: scale(.975); background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.7); }
  .route-topline { display: flex; align-items: center; justify-content: space-between; color: rgba(255,255,255,.68); font-size: 9px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
  .route-title { margin-top: auto; font-size: 20px; line-height: .96; letter-spacing: -.05em; font-weight: 800; }
  .route-description { margin-top: 7px; color: rgba(255,255,255,.72); font-size: 11px; font-weight: 500; }
  .route-arrow { position: absolute; bottom: 13px; right: 13px; width: 29px; height: 29px; align-items: center; justify-content: center; border-radius: 50%; color: var(--blue); background: white; display: flex; }
  .compass-search { margin: 12px 16px; height: 58px; border-radius: 18px; padding: 0 7px 0 17px; display: flex; align-items: center; gap: 10px; color: var(--ink); background: var(--snow); border: 2px solid transparent; box-shadow: 0 8px 18px rgba(0, 41, 124, .16); transition: transform .2s ease, box-shadow .2s ease; }
  .compass-search.is-active { transform: translateY(-1px); box-shadow: 0 11px 25px rgba(0, 41, 124, .25); }
  .compass-search input { min-width: 0; flex: 1; height: 100%; outline: 0; border: 0; background: transparent; color: var(--ink); font: 700 14px inherit; letter-spacing: -.01em; }
  .compass-search input::placeholder { color: #4375d0; opacity: 1; font-weight: 600; }
  .search-submit { width: 42px; height: 42px; border: 0; border-radius: 13px; color: white; background: var(--blue); display: grid; place-items: center; cursor: pointer; transition: transform .18s ease, background .18s ease; }
  .search-submit:active { transform: scale(.93); background: var(--pink); }
  .clear-button { width: 28px; height: 28px; padding: 0; border: 0; color: #2f67bf; background: transparent; display: grid; place-items: center; cursor: pointer; }
  .lower-grid .route-card { min-height: 135px; }
  .route-3 { background: rgba(255,255,255,.1); }
  .route-4 { border-color: rgba(246,0,130,.75); background: rgba(203, 0, 95, .2); }
  .route-4 .route-arrow { color: var(--pink); }
  .conditions-preview { margin: auto 16px 0; padding-top: 20px; }
  .preview-label { display: flex; align-items: center; gap: 7px; margin: 0 0 8px 3px; color: rgba(255,255,255,.7); font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .preview-label span { width: 7px; height: 7px; border-radius: 50%; background: var(--pink); }
  .preview-card { display: flex; align-items: center; gap: 13px; padding: 13px 14px; border-radius: 17px; background: rgba(0, 45, 153, .32); border: 1px solid rgba(255,255,255,.22); }
  .preview-card p { margin: 0; font-size: 15px; letter-spacing: -.025em; font-weight: 800; }
  .preview-card small { display: block; margin-top: 3px; color: rgba(255,255,255,.7); font-size: 10px; }
  .preview-temp { margin-left: auto; text-align: right; }
  .preview-temp b { display: block; font-size: 24px; line-height: .8; letter-spacing: -.06em; }
  .preview-temp span { display: block; margin-top: 5px; color: rgba(255,255,255,.66); font-size: 10px; }
  .sun-mark { width: 31px; height: 31px; color: var(--pink); display: grid; place-items: center; border: 1px solid rgba(246,0,130,.55); border-radius: 50%; }
  .compass-footer { display: flex; justify-content: space-between; padding: 18px 20px 21px; color: rgba(255,255,255,.56); font-size: 9px; font-weight: 700; letter-spacing: .075em; text-transform: uppercase; }
  .compass-toast { position: absolute; z-index: 3; max-width: calc(100% - 40px); left: 50%; bottom: 18px; transform: translate(-50%, 20px); pointer-events: none; opacity: 0; padding: 10px 15px; color: var(--ink); background: white; border-radius: 999px; box-shadow: 0 10px 30px rgba(0, 33, 104, .3); white-space: nowrap; font-size: 12px; font-weight: 800; transition: opacity .22s ease, transform .22s ease; }
  .compass-toast.show { opacity: 1; transform: translate(-50%, 0); }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  @media (max-width: 360px) {
    .compass-intro { padding-top: 27px; padding-bottom: 17px; }
    .compass-intro h1 { font-size: 42px; }
    .route-card { min-height: 134px; padding: 13px; }
    .lower-grid .route-card { min-height: 127px; }
    .route-title { font-size: 18px; }
    .conditions-preview { padding-top: 13px; }
  }
`;