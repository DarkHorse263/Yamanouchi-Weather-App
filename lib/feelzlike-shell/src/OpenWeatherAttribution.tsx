const logo = new URL("./openweather-logo.png", import.meta.url).href;

/** Required OpenWeather attribution: text, link and logo. Keep all three. */
export function OpenWeatherAttribution() {
  return (
    <div className="flex justify-center">
      <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-1 text-[10px] leading-none text-slate-600 hover:text-slate-900">
        <img src={logo} alt="OpenWeather" width={44} className="h-auto w-[44px]" />
        <span>Weather data provided by OpenWeather</span>
      </a>
    </div>
  );
}
