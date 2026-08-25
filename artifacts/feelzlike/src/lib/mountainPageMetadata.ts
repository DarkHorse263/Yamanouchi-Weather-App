export interface MountainPageMetadata {
  title: string;
  description: string;
  path: string;
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