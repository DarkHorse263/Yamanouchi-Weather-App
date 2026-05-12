export function MeteoblueSnow() {
  const url =
    "https://www.meteoblue.com/en/weather/maps/widget/perisher-valley_australia_2063523?windAnimation=0&gust=0&satellite=0&cloudsAndPrecipitation=0&temperature=0&sunshine=0&extremeForecastIndex=0&geoloc=fixed&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&lengthunit=metric&zoom=8&autowidth=auto";

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
            option 4 · forecast model
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            MeteoBlue · snow accumulation forecast
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Not live radar · this is the model view (where snow will fall, next
            7 days). Closest to what snow-forecast.com shows.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                MeteoBlue · snow map
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">7 day model</span>
          </div>
          <iframe
            title="MeteoBlue snow map"
            src={url}
            width="100%"
            height={520}
            frameBorder={0}
            scrolling="no"
            style={{ display: "block", border: 0 }}
          />
          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
            Source · meteoblue.com · free widget
          </div>
        </div>

        <ul className="mt-4 text-sm text-slate-700 space-y-1.5">
          <li>· Pros · forward-looking · matches snow-forecast.com style · global</li>
          <li>· Cons · forecast not live · MeteoBlue branding · narrower view</li>
        </ul>
      </div>
    </div>
  );
}

export default MeteoblueSnow;
