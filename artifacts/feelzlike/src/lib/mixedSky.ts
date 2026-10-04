/** Forecast probability changes the presentation, not the reported weather code.
 * Current observations omit probability so a later shower cannot alter "now".
 */
export function hasMixedSky(code: number | null, probability?: number | null): boolean {
  return code === 2 || (
    (code === 0 || code === 1) &&
    probability != null && Number.isFinite(probability) &&
    probability >= 25 && probability <= 100
  );
}