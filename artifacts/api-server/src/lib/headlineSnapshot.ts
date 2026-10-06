/** Merge partial replicas without extending the lifetime of old observations. */
export function mergeHeadlineEntries<T extends { freshUntil: number; staleUntil: number }>(
  previous: Array<[string, T]>, incoming: Array<[string, T]>, now: number,
): Array<[string, T]> {
  const merged = new Map<string, T>();
  for (const [id, entry] of [...previous, ...incoming]) {
    if (entry.staleUntil <= now) continue;
    const existing = merged.get(id);
    if (!existing || entry.freshUntil > existing.freshUntil) merged.set(id, entry);
  }
  return [...merged];
}
