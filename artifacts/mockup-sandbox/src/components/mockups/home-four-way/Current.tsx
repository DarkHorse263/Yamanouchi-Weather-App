import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CloudSun,
  Compass,
  Heart,
  LocateFixed,
  Map,
  Mountain,
  Search,
  Snowflake,
  Wind,
} from "lucide-react";

const blue = "#0055ff";
const pink = "#ec008c";

export default function Current() {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("search a town, peak or region");
  const [locationStatus, setLocationStatus] = useState<"idle" | "checking" | "ready">("idle");
  const [favourited, setFavourited] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(query.trim() ? `showing matches for “${query.trim()}”` : "type a place to begin");
  }

  function checkLocation() {
    setLocationStatus("checking");
    window.setTimeout(() => {
      setLocationStatus("ready");
      setMessage("nearest mountain area · snowy mountains");
    }, 500);
  }

  return (
    <main
      className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-[#0055ff] text-white shadow-[0_18px_50px_rgba(0,49,156,0.22)]"
      style={{ fontFamily: "'DIN Pro', ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 17% 7%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 88% 24%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 38% 55%, #fff 0 1px, transparent 1.5px)",
          backgroundSize: "37px 37px, 53px 53px, 71px 71px",
        }}
      />

      <header className="relative px-5 pb-4 pt-6 text-center">
        <img
          src="/__mockup/images/feelzlike-home-logo-white.png"
          alt="feelzlike"
          className="mx-auto h-[54px] w-auto object-contain"
          draggable={false}
        />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/72">
          real conditions for mountain travel
        </p>
        <button
          type="button"
          onClick={() => setMessage("feelzlike brings mountain weather into one clear view")}
          className="mt-3 rounded-full border border-white/35 px-3 py-1 text-[11px] font-bold lowercase text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
        >
          about · how to use
        </button>
      </header>

      <section className="relative px-4" aria-label="Find mountain conditions">
        <form onSubmit={submitSearch} className="rounded-[22px] bg-white p-1.5 shadow-[0_10px_0_rgba(0,45,180,0.17)]">
          <label className="sr-only" htmlFor="mountain-search">Search for a town, peak or region</label>
          <div className="flex items-center">
            <Search className="ml-3 h-5 w-5 shrink-0 text-[#0055ff]" strokeWidth={2.5} />
            <input
              id="mountain-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search a town, peak or region"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-[#0055ff] text-white transition hover:scale-[1.04] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:ring-offset-2"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </form>
        <p aria-live="polite" className="min-h-5 px-2 pt-2 text-center text-[11px] font-medium text-white/75">
          {message}
        </p>
      </section>

      <section className="relative px-4 pb-4 pt-3" aria-labelledby="near-you-title">
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/68">near you</p>
            <h1 id="near-you-title" className="mt-0.5 text-[22px] font-semibold leading-none tracking-tight">what it feelzlike outside</h1>
          </div>
          <button
            type="button"
            onClick={checkLocation}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 text-[12px] font-bold transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <LocateFixed className={`h-4 w-4 ${locationStatus === "checking" ? "animate-pulse" : ""}`} />
            {locationStatus === "ready" ? "located" : "use location"}
          </button>
        </div>

        <article className="overflow-hidden rounded-[23px] bg-white text-slate-950 shadow-[0_12px_0_rgba(0,45,180,0.16)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-[16px] font-bold leading-none">jindabyne</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">snowy mountains · nsw</p>
            </div>
            <button
              type="button"
              onClick={() => setFavourited(!favourited)}
              aria-pressed={favourited}
              aria-label={favourited ? "Remove Jindabyne from favourites" : "Add Jindabyne to favourites"}
              className={`grid h-10 w-10 place-items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#0055ff] ${favourited ? "bg-[#ffe1f1] text-[#ec008c]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              <Heart className="h-[18px] w-[18px]" fill={favourited ? pink : "none"} strokeWidth={2.3} />
            </button>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center px-4 py-4">
            <div className="flex items-center gap-3">
              <CloudSun className="h-11 w-11 text-[#0055ff]" strokeWidth={1.7} />
              <div>
                <p className="text-[38px] font-bold leading-[0.8] tracking-[-0.07em]">6°</p>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">feels 3°c · clear</p>
              </div>
            </div>
            <div className="border-l border-slate-100 pl-4 text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-slate-700">
                <Wind className="h-3.5 w-3.5 text-slate-400" /> 18 km/h
              </div>
              <p className="mt-1 text-[10px] font-medium text-slate-400">westerly</p>
              <button type="button" onClick={() => setMessage("jindabyne conditions selected")} className="mt-2 inline-flex items-center text-[11px] font-bold text-[#0055ff] hover:underline">
                see conditions <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="relative mx-4 rounded-[23px] border border-white/28 bg-white/10 px-4 py-3.5" aria-label="Member invitation">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white text-[#0055ff]">
            <Bell className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <p className="text-[13px] font-semibold leading-tight">save your places · keep a closer eye on the mountains</p>
          <button type="button" onClick={() => setMessage("sign up is ready when you are")} className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#0055ff] transition hover:bg-[#ffe1f1] focus:outline-none focus:ring-2 focus:ring-white">sign up</button>
        </div>
      </section>

      <section className="relative px-4 pb-5 pt-6" aria-labelledby="regions-title">
        <div className="mb-3 text-center">
          <h2 id="regions-title" className="text-[21px] font-medium leading-none">i wonder what it feelzlike in…</h2>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">choose a region</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMessage("australia regions selected")} className="group min-h-[105px] rounded-[22px] bg-white p-3 text-left text-slate-950 shadow-[0_8px_0_rgba(0,45,180,0.16)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white">
            <Mountain className="h-6 w-6 text-[#0055ff]" strokeWidth={2} />
            <p className="mt-3 text-[15px] font-bold leading-none">australia</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">snowy · high country</p>
          </button>
          <button type="button" onClick={() => setMessage("japan regions selected")} className="group min-h-[105px] rounded-[22px] bg-[#ffe1f1] p-3 text-left text-slate-950 shadow-[0_8px_0_rgba(0,45,180,0.16)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white">
            <Snowflake className="h-6 w-6 text-[#ec008c]" strokeWidth={2} />
            <p className="mt-3 text-[15px] font-bold leading-none">japan</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">hokkaido · nagano</p>
          </button>
        </div>
      </section>

      <section className="relative border-t border-white/20 px-4 py-4">
        <button type="button" onClick={() => setMessage("coverage map preview opened")} className="flex w-full items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0055ff]">
          <div className="relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#083ac6]">
            <Map className="h-7 w-7 text-white/85" strokeWidth={1.7} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ec008c]" />
            <span className="absolute bottom-2 left-3 h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold">where we cover</p>
            <p className="mt-0.5 text-[11px] font-medium text-white/70">browse all mountain regions on the map</p>
          </div>
          <Compass className="h-5 w-5 text-white/75" />
        </button>
      </section>

      <footer className="relative flex items-center justify-between border-t border-white/20 px-5 py-3 text-[10px] font-semibold text-white/65">
        <span>feelzlike · mountain travel weather</span>
        <span>favourites {favourited ? "1" : "0"}</span>
      </footer>
    </main>
  );
}