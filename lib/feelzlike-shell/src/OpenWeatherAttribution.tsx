const logo = new URL("./openweather-logo.png", import.meta.url).href;

/** Shown on weather surfaces, including when OpenWeather is the fallback. */
export function OpenWeatherAttribution() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
      <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-center gap-2 underline underline-offset-2">
        <img src={logo} alt="OpenWeather" width={88} className="h-auto w-[88px]" />
        <span>Weather data provided by OpenWeather</span>
      </a>
      <span>(weather fallback and selected map layers)</span>
    </div>
  );
}
