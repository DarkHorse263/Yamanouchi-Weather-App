import { windSoWhat } from "./soWhat";

export interface MountainPageMetadata {
  title: string;
  description: string;
  path: string;
}

export interface MountainDetailCopy {
  sourceBadge: { en: string; ja: string };
  scrollCue: { en: string; ja: string };
  heroCamAltPrefix: string;
  heroCamBadge: { en: string; ja: string };
}

export function mountainDetailCopy(weatherOnly: boolean): MountainDetailCopy {
  if (weatherOnly) {
    return {
      sourceBadge: { en: "Weather", ja: "天気" },
      scrollCue: { en: "Weather details below", ja: "天気の詳細は下へ" },
      heroCamAltPrefix: "Webcam",
      heroCamBadge: { en: "webcam", ja: "カメラ" },
    };
  }
  return {
    sourceBadge: { en: "Live", ja: "ライブ" },
    scrollCue: { en: "Live conditions below", ja: "詳細は下へ" },
    heroCamAltPrefix: "Live cam",
    heroCamBadge: { en: "live", ja: "ライブ" },
  };
}

export function weatherOnlyWindSummary(
  kmh: number | null | undefined,
): { en: string; ja: string } | null {
  if (kmh == null || !Number.isFinite(kmh)) return null;
  if (kmh < 20) return { en: "light winds", ja: "弱い風" };
  if (kmh < 40) return { en: "moderate winds", ja: "やや強い風" };
  if (kmh < 60) return { en: "strong winds", ja: "強い風" };
  return { en: "very strong winds", ja: "非常に強い風" };
}

export function mountainWindSummary(
  kmh: number | null | undefined,
  weatherOnly: boolean,
): { en: string; ja: string } | null {
  return weatherOnly ? weatherOnlyWindSummary(kmh) : windSoWhat(kmh);
}

export function mountainPageMetadata({
  name,
  regionName,
  regionId,
  mountainId,
  weatherOnly,
}: {
  name: string;
  regionName: string;
  regionId: string;
  mountainId: string;
  weatherOnly: boolean;
}): MountainPageMetadata {
  const path = `/${regionId}/mountain/${mountainId}`;
  if (weatherOnly) {
    return {
      title: `${name} - mountain weather & forecast`,
      description: `Mountain weather forecast for ${name} in ${regionName}: on-mountain temperature, snowfall, wind and elevation forecast.`,
      path,
    };
  }
  return {
    title: `${name} - snow report, weather & lifts`,
    description: `Live mountain weather for ${name} in ${regionName}: on-mountain temperature, snow depth, wind and elevation forecast.`,
    path,
  };
}