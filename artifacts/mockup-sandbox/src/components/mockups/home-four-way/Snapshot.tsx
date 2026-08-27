import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  CloudSun,
  Compass,
  Crosshair,
  GitCompareArrows,
  Map,
  MountainSnow,
  Search,
  Sparkles,
  Wind,
} from "lucide-react";

type RouteKey = "here" | "peak" | "map" | "compare";

const routeCopy: Record<RouteKey, { eyebrow: string; title: string; detail: string }> = {
  here: {
    eyebrow: "your place",
    title: "weather where you are",
    detail: "use your location for the town-level view",
  },
  peak: {
    eyebrow: "up high",
    title: "weather at the peak",
    detail: "find the mountain weather before you head up",
  },
  map: {
    eyebrow: "start exploring",
    title: "browse a region",
    detail: "see the places feelzlike covers on the map",
  },
  compare: {
    eyebrow: "make a call",
    title: "compare mountains",
    detail: "put conditions side by side before the drive",
  },
};

export default function Snapshot() {
  const [activeRoute, setActiveRoute] = useState<RouteKey | null>(null);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const chooseRoute = (route: RouteKey) => setActiveRoute(route);
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim()) setSearched(true);
  };

  return (
    <div className="fl-snapshot-shell">
      <style>{`
        .fl-snapshot-shell {
          --blue: #0759df;
          --blue-deep: #0344b7;
          --blue-ink: #063483;
          --sky: #91d7ff;
          --pink: #f3298b;
          --paper: #f7fbff;
          --ink: #09275e;
          --line: rgba(8, 53, 135, .16);
          min-height: 100dvh; width: 100%; display: grid; place-items: center;
          padding: 20px; box-sizing: border-box; background: #dcecff;
          font-family: "DIN Pro", "DIN 2014", "DIN Alternate", system-ui, sans-serif;
          color: var(--ink); -webkit-font-smoothing: antialiased;
        }
        .fl-snapshot-shell * { box-sizing: border-box; }
        .fl-phone {
          position: relative; width: min(100%, 390px); min-height: 844px; overflow: hidden;
          background: var(--blue); box-shadow: 0 24px 64px rgba(3, 46, 125, .25);
          isolation: isolate;
        }
        .fl-phone::before {
          content: ""; position: absolute; z-index: -1; inset: 0;
          background:
            radial-gradient(circle at 91% 7%, rgba(145,215,255,.72) 0 3px, transparent 4px),
            radial-gradient(circle at 75% 16%, rgba(145,215,255,.28) 0 1px, transparent 2px),
            linear-gradient(152deg, transparent 0 42%, rgba(255,255,255,.08) 42.1% 42.6%, transparent 42.7%),
            linear-gradient(30deg, transparent 0 57%, rgba(255,255,255,.07) 57.1% 57.6%, transparent 57.7%);
          background-size: 92px 92px, 60px 60px, auto, auto;
          opacity: .75; pointer-events: none;
        }
        .fl-header { display: flex; align-items: center; justify-content: space-between; padding: 25px 22px 0; }
        .fl-logo { width: 111px; height: auto; display: block; }
        .fl-help {
          appearance: none; border: 1px solid rgba(255,255,255,.44); border-radius: 999px;
          background: rgba(255,255,255,.08); color: #fff; padding: 8px 11px;
          font: 700 10px/1 inherit; letter-spacing: .075em; text-transform: lowercase; cursor: pointer;
          transition: background .2s ease, transform .2s ease;
        }
        .fl-help:hover, .fl-help:focus-visible { background: rgba(255,255,255,.2); transform: translateY(-1px); outline: none; }
        .fl-intro { padding: 29px 22px 13px; color: white; }
        .fl-intro p { margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; color: rgba(255,255,255,.68); }
        .fl-intro h1 { margin: 0; max-width: 310px; font-size: 31px; line-height: .97; letter-spacing: -.055em; font-weight: 800; }
        .fl-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 14px; }
        .fl-action {
          min-height: 100px; border: 1px solid rgba(255,255,255,.36); border-radius: 17px;
          padding: 13px 12px; text-align: left; color: white; cursor: pointer;
          background: rgba(3,62,172,.34); font-family: inherit;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        .fl-action:hover, .fl-action:focus-visible, .fl-action.is-active {
          background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.84); transform: translateY(-2px); outline: none;
        }
        .fl-action-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .fl-action svg { width: 19px; height: 19px; stroke-width: 2.2; }
        .fl-action .fl-arrow { width: 15px; height: 15px; opacity: .75; }
        .fl-action strong { display: block; max-width: 105px; font-size: 16px; line-height: .98; letter-spacing: -.04em; }
        .fl-search-wrap { position: relative; padding: 14px 22px 12px; }
        .fl-search-label { display: block; margin: 0 0 7px 3px; color: rgba(255,255,255,.72); font-size: 10px; letter-spacing: .13em; font-weight: 800; text-transform: uppercase; }
        .fl-search { height: 55px; display: flex; align-items: center; border: 0; border-radius: 15px; background: var(--paper); box-shadow: 0 8px 0 rgba(3,55,149,.13); overflow: hidden; }
        .fl-search:focus-within { outline: 3px solid rgba(255,255,255,.42); outline-offset: 2px; }
        .fl-search svg { flex: none; width: 20px; margin-left: 16px; color: var(--blue); }
        .fl-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); padding: 0 7px 0 11px; font: 700 15px/1 inherit; }
        .fl-search input::placeholder { color: #6078a8; opacity: 1; }
        .fl-search button { align-self: stretch; border: 0; padding: 0 15px; color: #fff; background: var(--pink); cursor: pointer; transition: background .2s ease; }
        .fl-search button:hover, .fl-search button:focus-visible { background: #db1476; outline: none; }
        .fl-search button svg { margin: 2px 0 0; color: inherit; width: 19px; }
        .fl-search-result { position: absolute; z-index: 5; left: 22px; right: 22px; top: 86px; padding: 9px 12px; border-radius: 0 0 12px 12px; background: #fff; color: var(--ink); box-shadow: 0 15px 25px rgba(0,37,108,.23); font-size: 12px; font-weight: 700; }
        .fl-search-result span { color: var(--pink); }
        .fl-snapshot { margin: 12px 14px 0; border-radius: 19px 19px 0 0; background: var(--paper); overflow: hidden; }
        .fl-snapshot-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 15px 10px; }
        .fl-snapshot-kicker { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .fl-pulse { position: relative; display: block; width: 8px; height: 8px; border-radius: 50%; background: var(--pink); }
        .fl-pulse::after { content: ""; position: absolute; inset: -4px; border-radius: inherit; border: 1px solid var(--pink); animation: fl-pulse 2s ease-out infinite; }
        .fl-updated { color: #5570a3; font-size: 10px; font-weight: 700; }
        .fl-place { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 0 15px 12px; }
        .fl-place h2 { margin: 0 0 3px; font-size: 20px; line-height: 1; letter-spacing: -.04em; }
        .fl-place p { margin: 0; color: #5a73a0; font-size: 11px; font-weight: 700; }
        .fl-temperature { display: flex; align-items: center; gap: 6px; color: var(--blue-ink); }
        .fl-temperature svg { width: 24px; height: 24px; }
        .fl-temperature strong { font-size: 29px; line-height: .8; letter-spacing: -.07em; }
        .fl-metrics { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); background: #edf6ff; }
        .fl-metric { min-height: 53px; padding: 9px 11px; border-right: 1px solid var(--line); }
        .fl-metric:last-child { border-right: 0; }
        .fl-metric span { display: block; color: #6079a4; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .fl-metric strong { display: flex; align-items: center; gap: 3px; margin-top: 3px; font-size: 14px; letter-spacing: -.02em; }
        .fl-metric svg { width: 13px; height: 13px; }
        .fl-lower { padding-top: 10px; }
        .fl-lower .fl-action { min-height: 92px; background: rgba(3,62,172,.44); }
        .fl-lower .fl-action-top { margin-bottom: 13px; }
        .fl-lower .fl-action strong { font-size: 15px; }
        .fl-message { min-height: 37px; padding: 11px 23px 0; color: rgba(255,255,255,.88); font-size: 12px; font-weight: 700; }
        .fl-message span { color: #ffc0de; }
        .fl-footer { display: flex; align-items: center; justify-content: space-between; padding: 9px 22px 17px; color: rgba(255,255,255,.62); font-size: 10px; font-weight: 700; }
        .fl-footer div { display: flex; align-items: center; gap: 5px; }
        .fl-footer svg { width: 13px; height: 13px; }
        @keyframes fl-pulse { 0% { transform: scale(.6); opacity: .8; } 70%,100% { transform: scale(1.55); opacity: 0; } }
        @media (max-width: 430px) {
          .fl-snapshot-shell { padding: 0; place-items: start center; background: var(--blue); }
          .fl-phone { width: 100%; box-shadow: none; }
        }
      `}</style>

      <main className="fl-phone" aria-label="feelzlike weather guide home">
        <header className="fl-header">
          <img className="fl-logo" src="/__mockup/images/feelzlike-home-logo-white.png" alt="feelzlike" />
          <button type="button" className="fl-help" onClick={() => setActiveRoute(null)}>how it works</button>
        </header>

        <section className="fl-intro">
          <p>mountain travel weather</p>
          <h1>start with the question you have right now.</h1>
        </section>

        <section className="fl-actions" aria-label="ways to explore weather">
          <button type="button" className={`fl-action ${activeRoute === "here" ? "is-active" : ""}`} onClick={() => chooseRoute("here")}>
            <span className="fl-action-top"><Crosshair /><ArrowUpRight className="fl-arrow" /></span>
            <strong>weather where i am</strong>
          </button>
          <button type="button" className={`fl-action ${activeRoute === "peak" ? "is-active" : ""}`} onClick={() => chooseRoute("peak")}>
            <span className="fl-action-top"><MountainSnow /><ArrowUpRight className="fl-arrow" /></span>
            <strong>snow at the peak</strong>
          </button>
        </section>

        <div className="fl-search-wrap">
          <label className="fl-search-label" htmlFor="fl-place-search">or go straight to a place</label>
          <form className="fl-search" onSubmit={submitSearch}>
            <Search aria-hidden="true" />
            <input id="fl-place-search" value={query} onChange={(event) => { setQuery(event.target.value); setSearched(false); }} placeholder="search town or mountain" />
            <button type="submit" aria-label="Search places"><ChevronRight /></button>
          </form>
          {searched && <div className="fl-search-result"><span>search ready</span> · explore “{query.trim()}”</div>}
        </div>

        <section className="fl-snapshot" aria-label="current weather snapshot">
          <div className="fl-snapshot-head">
            <div className="fl-snapshot-kicker"><span className="fl-pulse" /> a mountain snapshot</div>
            <span className="fl-updated">weather · 10:42</span>
          </div>
          <div className="fl-place">
            <div><h2>Thredbo</h2><p>Snowy Mountains · NSW</p></div>
            <div className="fl-temperature"><CloudSun /><strong>4°</strong></div>
          </div>
          <div className="fl-metrics">
            <div className="fl-metric"><span>feels</span><strong>1°</strong></div>
            <div className="fl-metric"><span>wind</span><strong><Wind /> 22 km/h</strong></div>
            <div className="fl-metric"><span>sky</span><strong>partly cloudy</strong></div>
          </div>
        </section>

        <section className="fl-actions fl-lower" aria-label="more ways to explore">
          <button type="button" className={`fl-action ${activeRoute === "map" ? "is-active" : ""}`} onClick={() => chooseRoute("map")}>
            <span className="fl-action-top"><Map /><ArrowUpRight className="fl-arrow" /></span>
            <strong>browse the region map</strong>
          </button>
          <button type="button" className={`fl-action ${activeRoute === "compare" ? "is-active" : ""}`} onClick={() => chooseRoute("compare")}>
            <span className="fl-action-top"><GitCompareArrows /><ArrowUpRight className="fl-arrow" /></span>
            <strong>compare mountains</strong>
          </button>
        </section>

        <div className="fl-message" aria-live="polite">
          {activeRoute ? <><span>{routeCopy[activeRoute].eyebrow}</span> · {routeCopy[activeRoute].detail}</> : "weather for mountain travel · choose your way in"}
        </div>
        <footer className="fl-footer">
          <div><Compass /> Australia · Japan · New Zealand</div>
          <div><Sparkles /> feelzlike</div>
        </footer>
      </main>
    </div>
  );
}