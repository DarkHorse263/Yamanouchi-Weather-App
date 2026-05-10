import { Cloud, CloudSun, Sun, Wind, ArrowRight } from "lucide-react";

export function LiveDataHero() {
  return (
    <div 
      className="flex flex-col bg-white min-h-[844px] w-[390px] mx-auto border border-slate-200 overflow-hidden relative shadow-sm"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      {/* 1. Compact top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <img 
          src="/__mockup/images/feelzlike-logo.png" 
          alt="feelzlike" 
          className="h-6 w-auto object-contain"
        />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Resort Town Mountain Weather
        </span>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-5 pb-6">
        {/* 2. Live-data strip / hero */}
        <section className="mb-4 relative">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              The Mountains Right Now
            </h1>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            {/* Jindabyne */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-tight">Jindabyne</span>
                <span className="text-[10px] text-slate-500 leading-tight">Snowy Mountains <span className="text-emerald-600 font-semibold">· off-snow</span></span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="flex items-center gap-1.5 tabular-nums">
                  <CloudSun className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                  <span className="text-lg font-bold text-slate-900">6°</span>
                </div>
                <div className="flex flex-col items-end text-[10px] tabular-nums">
                  <span className="text-slate-500">feels 3°c</span>
                  <div className="flex items-center gap-0.5 text-slate-600">
                    <Wind className="w-3 h-3" />
                    <span>18km/h W</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bright */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-tight">Bright</span>
                <span className="text-[10px] text-slate-500 leading-tight">Vic High Country <span className="text-emerald-600 font-semibold">· off-snow</span></span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="flex items-center gap-1.5 tabular-nums">
                  <Sun className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
                  <span className="text-lg font-bold text-slate-900">12°</span>
                </div>
                <div className="flex flex-col items-end text-[10px] tabular-nums">
                  <span className="text-slate-500">feels 11°c</span>
                  <div className="flex items-center gap-0.5 text-slate-600">
                    <Wind className="w-3 h-3" />
                    <span>8km/h NW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Yakebitaiyama */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-tight">Yakebitaiyama</span>
                <span className="text-[10px] text-slate-500 leading-tight">Yamanouchi <span className="text-emerald-600 font-semibold">· off-snow</span></span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="flex items-center gap-1.5 tabular-nums">
                  <Cloud className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                  <span className="text-lg font-bold text-slate-900">14°</span>
                </div>
                <div className="flex flex-col items-end text-[10px] tabular-nums">
                  <span className="text-slate-500">feels 12°c</span>
                  <div className="flex items-center gap-0.5 text-slate-600">
                    <Wind className="w-3 h-3" />
                    <span>12km/h SW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Trust line */}
        <div className="flex justify-center mb-6">
          <p className="text-[10px] font-medium text-slate-400 tracking-wide">
            3 regions live <span className="mx-1">·</span> 7 sources <span className="mx-1">·</span> 15 min <span className="mx-1">·</span> updated 4m ago
          </p>
        </div>

        {/* 4. Cue */}
        <div className="mb-3 text-center">
          <p className="text-sm italic text-sky-700 font-medium">I wonder what it feelzlike in...</p>
        </div>

        {/* 5. Country tiles */}
        <div className="grid grid-cols-2 gap-3 mb-auto">
          <a href="#" className="group flex flex-col rounded-xl border border-emerald-200 bg-white hover:border-emerald-400 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="flex-1 p-3 flex flex-col items-center text-center">
              <span className="text-3xl mb-1" aria-hidden="true" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>🇦🇺</span>
              <h3 className="text-sm font-bold text-emerald-900">Australia</h3>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                </span>
                2 regions live
              </p>
            </div>
            <div className="bg-emerald-50/50 border-t border-emerald-100 px-3 py-1.5 flex justify-end items-center text-[10px] font-bold text-emerald-700">
              Explore <ArrowRight className="w-3 h-3 ml-0.5" />
            </div>
          </a>

          <a href="#" className="group flex flex-col rounded-xl border border-emerald-200 bg-white hover:border-emerald-400 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="flex-1 p-3 flex flex-col items-center text-center">
              <span className="text-3xl mb-1" aria-hidden="true" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>🇯🇵</span>
              <h3 className="text-sm font-bold text-emerald-900">Japan</h3>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                </span>
                1 region live
              </p>
            </div>
            <div className="bg-emerald-50/50 border-t border-emerald-100 px-3 py-1.5 flex justify-end items-center text-[10px] font-bold text-emerald-700">
              Explore <ArrowRight className="w-3 h-3 ml-0.5" />
            </div>
          </a>
        </div>
      </main>

      {/* 6. Footer line */}
      <footer className="py-4 text-center border-t border-slate-100 mt-auto">
        <p className="text-[10px] font-medium text-slate-400">© feelzlike</p>
      </footer>
    </div>
  );
}
