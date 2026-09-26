import assert from "node:assert/strict";
import test from "node:test";
import {
  distinctRadarFrames,
  isDuplicateInteractiveSource,
  officialAgencyLabel,
  radarPlaybackNotice,
  rainViewerDescription,
} from "../radarDisplay";

test("radar playback rejects repeated observations or repeated images", () => {
  const frames = [
    { ts: "202607120200", url: "https://example.com/one.png" },
    { ts: "202607120205", url: "https://example.com/one.png" },
    { ts: "202607120200", url: "https://example.com/two.png" },
    { ts: "202607120210", url: "https://example.com/three.png" },
  ];
  assert.deepEqual(distinctRadarFrames(frames), [frames[0], frames[3]]);
  assert.equal(distinctRadarFrames(frames.slice(0, 3)).length, 1);
});

test("labels official radar from its actual source", () => {
  const source = (href: string, attribution: string) => ({
    imageUrl: null,
    href,
    attribution,
  });

  assert.equal(
    officialAgencyLabel(source("https://weather.gc.ca/index_e.html?layers=,radar", "Environment and Climate Change Canada · weather radar")),
    "ECCC",
  );
  assert.equal(
    officialAgencyLabel(source("https://radar.weather.gov/", "National Weather Service · weather radar")),
    "NWS",
  );
  assert.equal(
    officialAgencyLabel(source("https://www.metservice.com/maps-radar/rain/radar/invercargill", "MetService · rain radar")),
    "MetService",
  );
});

test("identifies Austria's duplicate Windy pseudo-official source", () => {
  assert.equal(
    isDuplicateInteractiveSource({
      imageUrl: null,
      href: "https://www.windy.com/",
      attribution: "Interactive radar · user initiated",
    }),
    true,
  );
  assert.equal(
    isDuplicateInteractiveSource({
      imageUrl: null,
      href: "https://radar.weather.gov/",
      attribution: "National Weather Service · weather radar",
    }),
    false,
  );
});

test("mentions nowcast only when forecast frames exist", () => {
  assert.match(rainViewerDescription(true), /nowcast/);
  assert.doesNotMatch(rainViewerDescription(false), /nowcast/);
  assert.match(rainViewerDescription(false), /observed/);
  assert.match(rainViewerDescription(false, true), /latest observed/);
});

test("explains data saver and reduced-motion playback states", () => {
  assert.equal(
    radarPlaybackNotice({
      dataSaver: true,
      reducedMotion: false,
      playing: false,
      frameCount: 1,
    }),
    "latest image · data saver on",
  );
  assert.equal(
    radarPlaybackNotice({
      dataSaver: false,
      reducedMotion: true,
      playing: false,
      frameCount: 6,
    }),
    "paused for reduced motion · press play to animate",
  );
  assert.equal(
    radarPlaybackNotice({
      dataSaver: false,
      reducedMotion: true,
      playing: true,
      frameCount: 6,
    }),
    null,
  );
});