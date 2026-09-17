import assert from "node:assert/strict";
import test from "node:test";
import { GetWeatherResponse } from "@workspace/api-zod";
import {
  buildDailyForecast,
  fetchOpenMeteo,
  type LocationConfig,
} from "../../routes/weather.js";
import { fetchOpenWeatherMapAsOpenMeteo } from "../openweathermap.js";

const location: LocationConfig = {
  id: "test-japan",
  name: "Test Japan",
  latitude: 36.7,
  longitude: 138.5,
  elevation: 1200,
  description: "test",
  bomStation: "",
  bomStationId: "",
  bomWmoId: 0,
  timezone: "Asia/Tokyo",
  region: "JP",
};

test("Open-Meteo requests synchronized daily apparent extrema", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return {
      ok: true,
      json: async () => ({}),
    } as Response;
  }) as typeof fetch;

  try {
    await fetchOpenMeteo(location);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(requestedUrl);
  const daily = url.searchParams.get("daily") ?? "";
  assert.match(daily, /(?:^|,)apparent_temperature_max(?:,|$)/);
  assert.match(daily, /(?:^|,)apparent_temperature_min(?:,|$)/);
  assert.equal(url.searchParams.get("elevation"), "1200");
  assert.equal(url.searchParams.get("timezone"), "Asia/Tokyo");
});

test("standard daily mapping keeps provider apparent extrema independent and null-safe", () => {
  const daily = buildDailyForecast({
    daily: {
      time: ["2026-07-01", "2026-07-02"],
      temperature_2m_max: [4, 5],
      temperature_2m_min: [-6, -7],
      apparent_temperature_max: [1.5, Number.NaN],
      apparent_temperature_min: [-9.5, undefined],
      weather_code: [71, 0],
      precipitation_sum: [3, 0],
      rain_sum: [0, 0],
      snowfall_sum: [3, 0],
      wind_speed_10m_max: [40, 2],
      uv_index_max: [1, 2],
      sunrise: ["2026-07-01T05:00", "2026-07-02T05:00"],
      sunset: ["2026-07-01T19:00", "2026-07-02T19:00"],
    },
  });

  assert.equal(daily[0]?.feelsLikeMax, 1.5);
  assert.equal(daily[0]?.feelsLikeMin, -9.5);
  assert.equal(daily[1]?.feelsLikeMax, null);
  assert.equal(daily[1]?.feelsLikeMin, null);

  const parsed = GetWeatherResponse.parse({
    locations: [{
      location: {
        id: "test-japan",
        name: "Test Japan",
        elevation: 1200,
        latitude: 36.7,
        longitude: 138.5,
        description: "test",
      },
      current: {
        temperature: 0,
        feelsLike: -4,
        humidity: 80,
        windSpeed: 10,
        windDirection: 0,
        weatherCode: 71,
        weatherDescription: "Snow",
        isDay: true,
        precipitation: 0,
        cloudCover: 50,
      },
      daily,
      hourly: [{
        time: "2026-07-01T00:00",
        temperature: 0,
        weatherCode: 71,
        weatherDescription: "Snow",
        precipitation: 0,
        windSpeed: 10,
        humidity: 80,
        feelsLike: null,
      }],
      lastUpdated: "2026-07-01T00:00:00.000Z",
    }],
    lastUpdated: "2026-07-01T00:00:00.000Z",
  });
  assert.equal(parsed.locations[0]?.daily[1]?.feelsLikeMax, null);
});

test("OpenWeatherMap fallback leaves daily feels-like extrema null for sparse 3-hour coverage", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OWM_API_KEY;
  process.env.OWM_API_KEY = "test-key";
  const entries = [
    {
      dt: 1_783_000_000,
      main: { temp: 0, temp_min: 0, temp_max: 0, feels_like: -8, humidity: 80 },
      weather: [{ id: 600, icon: "13d" }],
      wind: { speed: 2, deg: 180 },
      clouds: { all: 80 },
    },
    {
      dt: 1_783_010_800,
      main: { temp: 10, temp_min: 10, temp_max: 10, feels_like: 3, humidity: 70 },
      weather: [{ id: 800, icon: "01d" }],
      wind: { speed: 10, deg: 180 },
      clouds: { all: 10 },
    },
    {
      dt: 1_783_021_600,
      main: { temp: 5, temp_min: 5, temp_max: 5, humidity: 60 },
      weather: [{ id: 801, icon: "02d" }],
      wind: { speed: 3, deg: 180 },
      clouds: { all: 30 },
    },
    {
      dt: 1_783_032_400,
      main: { temp_min: 4, temp_max: 4, feels_like: 1, humidity: 60 },
      weather: [{ id: 801, icon: "02d" }],
      wind: { speed: 3, deg: 180 },
      clouds: { all: 30 },
    },
  ];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/weather?")) {
      return {
        ok: true,
        json: async () => ({
          timezone: 32_400,
          main: { temp: 1, feels_like: -2, humidity: 80 },
          weather: [{ id: 800, icon: "01d" }],
          wind: { speed: 2, deg: 180 },
          clouds: { all: 20 },
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({ city: { timezone: 32_400 }, list: entries }),
    } as Response;
  }) as typeof fetch;

  try {
    const reshaped = await fetchOpenWeatherMapAsOpenMeteo(location);
    assert.ok(reshaped);
    assert.ok(reshaped.daily.apparent_temperature_max.every((value: unknown) => value === null));
    assert.ok(reshaped.daily.apparent_temperature_min.every((value: unknown) => value === null));
    assert.ok(reshaped.daily.temperature_2m_max.includes(10));
    assert.ok(reshaped.daily.temperature_2m_min.includes(0));
    assert.ok(reshaped.daily.wind_speed_10m_max.includes(36));
    assert.ok(reshaped.hourly.apparent_temperature.includes(null));
    // Three valid temperature buckets expand to nine hours; the bucket with
    // no actual temperature is skipped instead of becoming a false 0°C row.
    assert.equal(reshaped.hourly.temperature_2m.length, 9);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OWM_API_KEY;
    else process.env.OWM_API_KEY = originalKey;
  }
});