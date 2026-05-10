import React from 'react';
import { ArrowRight } from 'lucide-react';

export function PhotoLed() {
  return (
    <div 
      className="relative w-full h-full min-h-[844px] bg-white text-slate-900 mx-auto sm:w-[390px] sm:border sm:border-slate-200 sm:shadow-xl sm:overflow-hidden"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      {/* Hero Section */}
      <div className="relative h-[460px] w-full bg-slate-900 overflow-hidden">
        <img 
          src="/__mockup/images/mountain-hero.png" 
          alt="Mountains" 
          className="relative w-full h-full object-cover object-center z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60 z-0" />
        
        <div className="absolute inset-0 z-10 pt-16 px-6 flex flex-col items-center text-center">
          <img 
            src="/__mockup/images/feelzlike-logo.png" 
            alt="feelzlike" 
            className="h-12 w-auto mb-3 relative z-20"
            style={{ filter: "brightness(0) invert(1)" }}
            loading="eager"
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 mb-6">
            Resort Town Mountain Weather
          </span>
          
          <div className="w-full text-center">
            <h2 className="text-xl text-white/90 leading-snug font-medium">
              I wonder what it feelzlike in...
            </h2>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="relative -mt-[140px] px-4 space-y-3 z-10">
        
        {/* AU Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none">🇦🇺</span>
              <div>
                <h3 className="text-lg font-bold text-blue-900 tracking-tight">Australia</h3>
                <div className="mt-0.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                    2 regions live
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700"><span className="font-semibold">Snowy Mountains</span> <span className="text-slate-400">·</span> Jindabyne</span>
              <span className="font-bold tabular-nums text-blue-900">6°C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700"><span className="font-semibold">Vic High Country</span> <span className="text-slate-400">·</span> Bright</span>
              <span className="font-bold tabular-nums text-blue-900">12°C</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end text-xs font-semibold text-sky-600">
            Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* JP Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none">🇯🇵</span>
              <div>
                <h3 className="text-lg font-bold text-blue-900 tracking-tight">Japan</h3>
                <div className="mt-0.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                    1 region live
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700"><span className="font-semibold">Yamanouchi</span> <span className="text-slate-400">·</span> Yakebitaiyama</span>
              <span className="font-bold tabular-nums text-blue-900">14°C</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end text-xs font-semibold text-sky-600">
            Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

      </div>

      {/* Trust Line & Footer */}
      <div className="mt-6 flex flex-col items-center text-center px-4 pb-8">
        <p className="text-[11px] text-slate-400 font-medium flex flex-wrap justify-center gap-x-1.5">
          <span>3 regions live</span>
          <span>·</span>
          <span>7 sources</span>
          <span>·</span>
          <span>15 min</span>
          <span>·</span>
          <span>updated 4m ago</span>
        </p>
        <p className="text-[10px] text-slate-300 mt-4">
          © feelzlike
        </p>
      </div>

    </div>
  );
}
