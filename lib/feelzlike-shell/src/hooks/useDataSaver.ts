import { useCallback, useEffect, useRef, useState } from "react";
import {
  DATA_SAVER_CHANGE_EVENT,
  DATA_SAVER_STORAGE_KEY,
  browserDataSaverDefault,
  dataSaverConnection,
  getSharedDataSaverOverride,
  parseDataSaverValue,
  persistDataSaverOverride,
  readDataSaverOverride,
  setSharedDataSaverOverride,
} from "./dataSaverPreference";

export {
  DATA_SAVER_CHANGE_EVENT,
  DATA_SAVER_STORAGE_KEY,
  browserDataSaverDefault,
  readDataSaverOverride,
} from "./dataSaverPreference";

export interface DataSaverState {
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
}

/**
 * Shared persisted data-saving preference.
 *
 * Until the visitor toggles the control, this follows
 * `navigator.connection.saveData` when that API is available.  An explicit
 * toggle is persisted and wins over future browser/network signal changes.
 */
export function useDataSaver(): DataSaverState {
  const overrideRef = useRef<boolean | null>(getSharedDataSaverOverride());
  const [dataSaver, setDataSaverState] = useState(
    () => overrideRef.current ?? browserDataSaverDefault(),
  );

  const setDataSaver = useCallback((enabled: boolean) => {
    persistDataSaverOverride(enabled);
    overrideRef.current = enabled;
    setDataSaverState(enabled);
  }, []);

  useEffect(() => {
    const sync = (event?: Event) => {
      const detail = (event as CustomEvent<{ enabled?: unknown }> | undefined)
        ?.detail;
      const eventValue =
        detail && typeof detail.enabled === "boolean" ? detail.enabled : null;
      if (eventValue !== null) {
        setSharedDataSaverOverride(eventValue);
      }

      // Preserve an explicit in-memory choice if this browser exposes no
      // writable localStorage. In normal browsers this also picks up an
      // override written by another consumer in this tab. A custom event's
      // detail is applied above before this read, so a blocked write cannot
      // make other consumers reread stale storage.
      if (
        eventValue === null &&
        getSharedDataSaverOverride() === null
      ) {
        const saved = readDataSaverOverride();
        if (saved !== null) setSharedDataSaverOverride(saved);
      }
      overrideRef.current = getSharedDataSaverOverride();
      setDataSaverState(overrideRef.current ?? browserDataSaverDefault());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DATA_SAVER_STORAGE_KEY) return;
      const next = parseDataSaverValue(event.newValue);
      setSharedDataSaverOverride(next);
      overrideRef.current = next;
      setDataSaverState(overrideRef.current ?? browserDataSaverDefault());
    };
    const network = dataSaverConnection();

    window.addEventListener("storage", onStorage);
    window.addEventListener(DATA_SAVER_CHANGE_EVENT, sync);
    network?.addEventListener?.("change", sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(DATA_SAVER_CHANGE_EVENT, sync);
      network?.removeEventListener?.("change", sync);
    };
  }, []);

  return { dataSaver, setDataSaver };
}