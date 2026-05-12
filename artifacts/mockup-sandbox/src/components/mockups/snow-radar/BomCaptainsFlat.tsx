export function BomCaptainsFlat() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              option 1 · official source
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              BOM Captain's Flat radar
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Bureau of Meteorology IDR403 · 256 km loop · refreshed every 6 min ·
              the radar that actually covers the Snowies.
            </p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                BOM live · Captain's Flat
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium tabular-nums">
              IDR403 · 256 km
            </span>
          </div>
          <div className="bg-slate-100 grid place-items-center" style={{ minHeight: 480 }}>
            <img
              src="https://www.bom.gov.au/radar/IDR403.gif"
              alt="BOM Captain's Flat radar 256 km loop"
              className="max-w-full h-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
            Source · Bureau of Meteorology · bom.gov.au/products/IDR403.loop.shtml
          </div>
        </div>

        <ul className="mt-4 text-sm text-slate-700 space-y-1.5">
          <li>· Pros · official AU source · highest local resolution · what locals trust</li>
          <li>· Cons · static image · no resort pin overlay · dated visual style</li>
        </ul>
      </div>
    </div>
  );
}

export default BomCaptainsFlat;
