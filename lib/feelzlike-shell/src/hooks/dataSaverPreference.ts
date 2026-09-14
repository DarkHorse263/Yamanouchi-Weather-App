export const DATA_SAVER_STORAGE_KEY = "feelzlike:data-saver";
export const DATA_SAVER_CHANGE_EVENT = "feelzlike:data-saver-change";

export interface DataSaverChangeDetail {
  enabled: boolean;
}

interface ConnectionLike extends EventTarget {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: ConnectionLike;
}

export function dataSaverConnection(): ConnectionLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as NavigatorWithConnection).connection;
}

/**
 * Returns the browser's data-saver signal. It is only a default: an explicit
 * visitor choice is persisted separately and takes precedence.
 */
export function browserDataSaverDefault(): boolean {
  return dataSaverConnection()?.saveData === true;
}

export function parseDataSaverValue(saved: string | null): boolean | null {
  if (saved === "1" || saved === "true") return true;
  if (saved === "0" || saved === "false") return false;
  return null;
}

/**
 * `null` means that no explicit user choice exists.
 */
export function readDataSaverOverride(): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    return parseDataSaverValue(
      window.localStorage.getItem(DATA_SAVER_STORAGE_KEY),
    );
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
    return null;
  }
}

// A storage write can fail in private/restricted contexts. Keep an explicit
// choice in this module so every hook consumer in the tab sees the same
// choice even when localStorage still contains an older value (or no value).
let sharedOverride: boolean | undefined;

export function getSharedDataSaverOverride(): boolean | null {
  if (sharedOverride !== undefined) return sharedOverride;

  const saved = readDataSaverOverride();
  if (saved !== null) sharedOverride = saved;
  return saved;
}

export function setSharedDataSaverOverride(value: boolean | null): void {
  sharedOverride = value === null ? undefined : value;
}

/**
 * Notify other consumers in this document with the value that was chosen.
 * `storage` intentionally remains the cross-tab transport; this event only
 * fills the same-tab gap (including when storage is blocked).
 */
export function dispatchDataSaverChange(enabled: boolean): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<DataSaverChangeDetail>(DATA_SAVER_CHANGE_EVENT, {
      detail: { enabled },
    }),
  );
}

export function persistDataSaverOverride(enabled: boolean): void {
  setSharedDataSaverOverride(enabled);

  try {
    window.localStorage.setItem(
      DATA_SAVER_STORAGE_KEY,
      enabled ? "1" : "0",
    );
  } catch {
    // Keep the explicit choice in shared memory when storage is blocked.
  }

  dispatchDataSaverChange(enabled);
}