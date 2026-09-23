interface RadarSourceLike {
  imageUrl: string | null;
  href: string;
  attribution: string;
}

export function isDuplicateInteractiveSource(source: RadarSourceLike): boolean {
  return (
    source.imageUrl === null &&
    /(?:^|\.)windy\.com$/i.test(safeHostname(source.href)) &&
    source.attribution.toLowerCase().includes("interactive radar")
  );
}

export function officialAgencyLabel(
  source: RadarSourceLike | null,
): string {
  if (!source) return "Official";

  const sourceText = `${source.href} ${source.imageUrl ?? ""} ${source.attribution}`.toLowerCase();
  if (sourceText.includes("bom.gov.au") || sourceText.includes("bureau of meteorology")) {
    return "BOM";
  }
  if (sourceText.includes("jma.go.jp") || sourceText.includes("japan meteorological agency")) {
    return "JMA";
  }
  if (sourceText.includes("metservice.com") || sourceText.includes("metservice")) {
    return "MetService";
  }
  if (sourceText.includes("weather.gc.ca") || sourceText.includes("environment and climate change canada")) {
    return "ECCC";
  }
  if (sourceText.includes("radar.weather.gov") || sourceText.includes("national weather service")) {
    return "NWS";
  }
  return "Official";
}

export function rainViewerDescription(
  hasForecastFrames: boolean,
  latestOnly = false,
): string {
  return hasForecastFrames
    ? "live animated precipitation from rainviewer · past 2h + 30min nowcast."
    : latestOnly
      ? "latest observed precipitation from rainviewer."
      : "animated observed precipitation from rainviewer · past 2h.";
}

export function radarPlaybackNotice({
  dataSaver,
  reducedMotion,
  playing,
  frameCount,
}: {
  dataSaver: boolean;
  reducedMotion: boolean;
  playing: boolean;
  frameCount: number;
}): string | null {
  if (dataSaver) return "latest image · data saver on";
  if (reducedMotion && !playing && frameCount > 1) {
    return "paused for reduced motion · press play to animate";
  }
  return null;
}

function safeHostname(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return "";
  }
}