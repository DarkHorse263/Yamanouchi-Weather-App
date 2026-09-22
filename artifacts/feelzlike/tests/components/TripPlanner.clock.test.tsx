import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TripPlanner from "../../src/pages/TripPlanner";
import type { PlannerForecastData } from "../../src/lib/tripForecastData";

// Keep the actual page, cards, day cells, forecast hook and React Query cache.
// Only unrelated chrome, preferences and the large asset-backed catalogue are stubbed.
vi.mock("@/lib/seo/PageMeta", () => ({ PageMeta: () => null }));
vi.mock("@/components/PremiumFeaturePrompt", () => ({ PremiumFeaturePrompt: () => null }));
vi.mock("@/components/auth/UserPrefsProvider", () => ({
  useUnits: () => ({
    temp: (n: number) => String(n), tempUnit: "°C",
    snowVal: (n: number) => String(n), snowUnit: "cm",
  }),
}));
vi.mock("@/regions", () => ({
  REGION_COUNTRY: {}, COUNTRY_META: { AU: { name: "Australia" } },
}));
vi.mock("@/lib/favouriteRegion", () => ({
  readLastTown: () => null, readFavouriteRegion: () => null,
}));
vi.mock("@/lib/tripPlanner", () => {
  const mountain = { id: "clock-mountain", name: "Clock Mountain", regionId: "test", regionName: "Test" };
  return {
    tripPlannerCatalog: () => [mountain],
    readSavedMountains: () => ["test:clock-mountain"],
    findCatalogMountain: () => mountain,
    mountainKey: (region: string, id: string) => `${region}:${id}`,
    plannerCountries: () => ["AU"],
    MAX_TRIP_MOUNTAINS: 6,
    addSavedMountain: vi.fn(), removeSavedMountain: vi.fn(),
  };
});

const QUERY_KEY = ["trip-forecast", "feelzlike-v2", "clock-mountain", null];
// Sydney midnight is 14:00 UTC in July: the viewer's UTC date does NOT change.
const BEFORE_MIDNIGHT = "2026-07-01T13:59:30.000Z";
const AFTER_MIDNIGHT = "2026-07-01T14:00:00.000Z";

function cachedForecast(): PlannerForecastData {
  return {
    timezone: "Australia/Sydney",
    generatedAt: "2026-07-01T13:00:00Z",
    _stale: null,
    days: [1, 2, 3].map((day, i) => ({
      date: `2026-07-0${day}`, snowMean: [11, 7, 3][i],
      tempMaxMean: 1, tempMinMean: -5,
      feelsLikeMaxMean: -2, feelsLikeMinMean: -8,
      feelsLikeSources: [`source-for-july-${day}`],
      precipMean: 0, snowSpread: 0, sourcesCount: 1, confidence: "high",
    })),
  };
}

let container: HTMLDivElement;
let root: Root | undefined;
let client: QueryClient;
let cached: PlannerForecastData;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(BEFORE_MIDNIGHT));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  fetchSpy = vi.fn(() => { throw new Error("Clock coverage must not refetch"); });
  vi.stubGlobal("fetch", fetchSpy);
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false },
    },
  });
  client.setQueryData(QUERY_KEY, cachedForecast());
  cached = client.getQueryData(QUERY_KEY)!;
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  client.clear();
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount(strict = false) {
  root = createRoot(container);
  const page = <QueryClientProvider client={client}><TripPlanner /></QueryClientProvider>;
  act(() => root!.render(strict ? <StrictMode>{page}</StrictMode> : page));
}

function expectSnapshot(days: number[], total: number) {
  const card = container.querySelector("h3")!.parentElement!.parentElement!.parentElement!;
  expect([...card.querySelectorAll('[data-testid^="trip-day-"]')].map((cell) => cell.getAttribute("data-testid")))
    .toEqual(days.map((day) => `trip-day-2026-07-0${day}`));
  expect([...card.querySelectorAll("details li")].map((li) => li.textContent))
    .toEqual(days.map((day) => `${day} july: source-for-july-${day}`));
  // Assert the card headline, not one of the per-day snow readings.
  expect(card.firstElementChild!.lastElementChild!.textContent).toBe(`${total}cm`);
  expect(card.textContent).toContain(`next ${days.length} local days`);
  expect(client.getQueryData(QUERY_KEY)).toBe(cached);
  expect(fetchSpy).not.toHaveBeenCalled();
}

describe("comparison page clock lifecycle", () => {
  it("removes yesterday from cells, sources and total at the next mountain-local midnight", () => {
    mount();
    expectSnapshot([1, 2, 3], 21);
    const firstCell = container.querySelector('[data-testid="trip-day-2026-07-02"]');
    act(() => vi.advanceTimersByTime(29_999));
    expectSnapshot([1, 2, 3], 21);
    act(() => vi.advanceTimersByTime(1));
    expect(new Date().toISOString()).toBe(AFTER_MIDNIGHT);
    expectSnapshot([2, 3], 10);
    expect(container.querySelector('[data-testid="trip-day-2026-07-02"]')).toBe(firstCell);
    // Prove the timer recurs rather than only scheduling one update.
    act(() => vi.setSystemTime(new Date("2026-07-02T13:59:00Z")));
    act(() => vi.advanceTimersByTime(60_000));
    expectSnapshot([3], 3);
  });

  it.each(["visibilitychange", "focus"] as const)(
    "catches up on %s after background suspension without a timer or new forecast",
    (event) => {
      mount();
      expectSnapshot([1, 2, 3], 21);
      vi.spyOn(document, "hidden", "get").mockReturnValue(true);
      // Jump the wall clock without firing timers, as in a suspended tab.
      vi.setSystemTime(new Date("2026-07-02T14:00:17Z"));
      const target = event === "focus" ? window : document;
      act(() => target.dispatchEvent(new Event(event)));
      expectSnapshot([1, 2, 3], 21); // Hidden events must not update the page.
      vi.spyOn(document, "hidden", "get").mockReturnValue(false);
      act(() => target.dispatchEvent(new Event(event)));
      expectSnapshot([3], 3);
    },
  );

  it("cleans up its recurring timeout and both listeners, including StrictMode remounts", () => {
    const addWindow = vi.spyOn(window, "addEventListener");
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const addDocument = vi.spyOn(document, "addEventListener");
    const removeDocument = vi.spyOn(document, "removeEventListener");
    const schedule = vi.spyOn(globalThis, "setTimeout");
    const cancel = vi.spyOn(globalThis, "clearTimeout");
    mount(true);
    act(() => vi.advanceTimersByTime(30_000)); // Clean up the rescheduled timer too.
    expectSnapshot([2, 3], 10);
    const clockTimers = schedule.mock.calls.flatMap((call, i) =>
      call[1] === 30_000 || call[1] === 60_000 ? [schedule.mock.results[i].value] : []);
    expect(clockTimers.length).toBeGreaterThanOrEqual(3);
    act(() => root!.unmount());
    root = undefined;
    for (const [add, remove, event] of [
      [addWindow, removeWindow, "focus"],
      [addDocument, removeDocument, "visibilitychange"],
    ] as const) {
      const registrations = add.mock.calls.filter(([type]) => type === event);
      expect(registrations).toHaveLength(2);
      for (const [, handler] of registrations) {
        expect(remove.mock.calls.filter(([type, fn]) => type === event && fn === handler)).toHaveLength(1);
      }
    }
    // Initial StrictMode timeout and the final recurring timeout were cancelled;
    // the intermediate timeout fired normally.
    expect(cancel).toHaveBeenCalledWith(clockTimers[0]);
    expect(cancel).toHaveBeenCalledWith(clockTimers.at(-1));
    client.clear();
    expect(vi.getTimerCount()).toBe(0);
    const scheduledBefore = schedule.mock.calls.length;
    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(120_000);
    });
    expect(schedule.mock.calls).toHaveLength(scheduledBefore);
    expect(container.innerHTML).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});