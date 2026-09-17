import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WeatherHourly,
  WeatherOutlook,
  WeatherToday,
} from "../WeatherSections";

const daily = {
  date: "2026-08-12",
  weatherCode: 3,
  weatherDescription: "Cloudy",
  tempMax: 4,
  tempMin: -5,
  feelsLikeMax: 1,
  feelsLikeMin: -9,
  sunrise: "2026-08-12T06:10",
  sunset: "2026-08-12T17:42",
  uvIndexMax: null,
  precipitationSum: 0,
  rainSum: 0,
  snowfallSum: 2,
  precipitationProbabilityMax: 20,
  windSpeedMax: 18,
  windGustMax: null,
} as const;

test("daily weather keeps actual and feelzlike extrema visible", () => {
  const html = renderToStaticMarkup(
    <WeatherToday daily={daily} t={(en) => en} />,
  );

  assert.match(html, /High/);
  assert.match(html, /4°C/);
  assert.match(html, /feelzlike high/);
  assert.match(html, /1°C/);
  assert.match(html, /feelzlike low/);
  assert.match(html, /-9°C/);
});

test("daily weather uses an honest dash when feelzlike is unavailable", () => {
  const html = renderToStaticMarkup(
    <WeatherOutlook
      days={[{ ...daily, feelsLikeMax: null, feelsLikeMin: null }]}
      t={(en) => en}
    />,
  );

  assert.match(html, /feelzlike/);
  assert.match(html, /Aug 12/);
  assert.match(html, /-°C \/ -°C/);
});

test("hourly weather labels the feelzlike reading separately", () => {
  const html = renderToStaticMarkup(
    <WeatherHourly
      hourly={[
        {
          time: "2026-08-12T10:00",
          temperature: 2,
          feelsLike: -3,
          precipitationProbability: 0,
          precipitation: 0,
          snowfall: 0,
          snowDepth: null,
          weatherCode: 3,
          windSpeed: 10,
          uvIndex: null,
        },
        {
          time: "2026-08-12T11:00",
          temperature: 3,
          feelsLike: null,
          precipitationProbability: 0,
          precipitation: 0,
          snowfall: 0,
          snowDepth: null,
          weatherCode: 3,
          windSpeed: 10,
          uvIndex: null,
        },
      ]}
      t={(en) => en}
    />,
  );

  assert.match(html, /feelzlike -3°C/);
  assert.match(html, /aria-label="feelzlike unavailable"/);
  assert.match(html, /<span class="block font-medium">-°C<\/span>/);
  assert.match(html, /min-w-\[60px\]/);
});

test("hourly weather does not turn missing actual temperatures into zero-degree bars", () => {
  const html = renderToStaticMarkup(
    <WeatherHourly
      hourly={[
        {
          time: "2026-08-12T10:00",
          temperature: null,
          feelsLike: null,
          precipitationProbability: 0,
          precipitation: 0,
          snowfall: 0,
          snowDepth: null,
          weatherCode: 3,
          windSpeed: 10,
          uvIndex: null,
        },
        {
          time: "2026-08-12T11:00",
          temperature: 5,
          feelsLike: 2,
          precipitationProbability: 0,
          precipitation: 0,
          snowfall: 0,
          snowDepth: null,
          weatherCode: 3,
          windSpeed: 10,
          uvIndex: null,
        },
      ]}
      t={(en) => en}
    />,
  );

  assert.match(html, /5°C to 5°C/);
  assert.doesNotMatch(html, /0°C to/);
  assert.match(html, /temperature unavailable/);
});