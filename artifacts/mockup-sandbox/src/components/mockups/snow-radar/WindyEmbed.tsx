export function WindyEmbed() {
  const url =
    "https://embed.windy.com/embed2.html?" +
    new URLSearchParams({
      lat: "-36.42",
      lon: "148.42",
      detailLat: "-36.42",
      detailLon: "148.42",
      width: "650",
      height: "480",
      zoom: "9",
      level: "surface",
      overlay: "snow",
      product: "ecmwf",
      menu: "",
      message: "true",
      marker: "",
      calendar: "now",
      pressure: "",
      type: "map",
      location: "coordinates",
      detail: "",
      metricWind: "default",
      metricTemp: "default",
      radarRange: "-1",
    }).toString();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
            option 2 · rich interactive
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Windy.com · snow + radar + satellite
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Switchable layers · ECMWF model · users can scrub the timeline
            forward 10 days. What most modern resort apps embed.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                Windy embed · snow layer
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              ECMWF · 10 day
            </span>
          </div>
          <iframe
            title="Windy snow map"
            src={url}
            width="100%"
            height={520}
            frameBorder={0}
            style={{ display: "block", border: 0 }}
          />
          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
            Source · windy.com · free embed, no key
          </div>
        </div>

        <ul className="mt-4 text-sm text-slate-700 space-y-1.5">
          <li>· Pros · richest UI · multiple layers in one view · 10-day scrubber</li>
          <li>· Cons · Windy branding visible · less "ours" · heavy iframe</li>
        </ul>
      </div>
    </div>
  );
}

export default WindyEmbed;
