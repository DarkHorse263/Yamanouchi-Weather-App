export function ZoomEarthEmbed() {
  const url = "https://zoom.earth/maps/precipitation/#view=-36.42,148.42,9z/model=icon";

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
            option 3 · satellite-led
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Zoom Earth · live satellite + precip
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cleanest "from space" look. Smooth animation. Best when you want
            the storm system to feel real, not just a coloured blob.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                Zoom Earth · precipitation view
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">ICON · live</span>
          </div>
          <iframe
            title="Zoom Earth precipitation"
            src={url}
            width="100%"
            height={520}
            frameBorder={0}
            style={{ display: "block", border: 0 }}
          />
          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
            Source · zoom.earth · free embed
          </div>
        </div>

        <ul className="mt-4 text-sm text-slate-700 space-y-1.5">
          <li>· Pros · gorgeous satellite background · smooth animation</li>
          <li>· Cons · less precise on local AU radar · Zoom Earth chrome shows</li>
        </ul>
      </div>
    </div>
  );
}

export default ZoomEarthEmbed;
