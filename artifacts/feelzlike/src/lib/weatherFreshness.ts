/** Timestamp from a provider model, not proof of a surface observation. */
export function modelAgeMinutes(instant: string | null | undefined, now = Date.now()): number | null {
  if (!instant) return null;
  const timestamp = Date.parse(instant);
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((now - timestamp) / 60000)) : null;
}

/** Open-Meteo/OWM town current.time is a naive local time. */
export function townCurrentAgeMinutes(
  localTime: string | null | undefined,
  utcOffsetSeconds: number,
  now = Date.now(),
): number | null {
  if (!localTime || !Number.isFinite(utcOffsetSeconds)) return null;
  const localAsUtc = Date.parse(`${localTime}Z`);
  return Number.isFinite(localAsUtc)
    ? Math.max(0, Math.floor((now - (localAsUtc - utcOffsetSeconds * 1000)) / 60000))
    : null;
}