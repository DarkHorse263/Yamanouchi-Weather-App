import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DATA_SAVER_CHANGE_EVENT,
  DATA_SAVER_STORAGE_KEY,
  browserDataSaverDefault,
  getSharedDataSaverOverride,
  persistDataSaverOverride,
  readDataSaverOverride,
  setSharedDataSaverOverride,
} from "../../../../../lib/feelzlike-shell/src/hooks/dataSaverPreference";

function replaceGlobal(name: "navigator" | "window", value: unknown): () => void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
  });
  return () => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete (globalThis as Record<string, unknown>)[name];
  };
}

test("uses navigator.connection.saveData as the default signal", () => {
  const restore = replaceGlobal("navigator", {
    connection: { saveData: true },
  });
  try {
    assert.equal(browserDataSaverDefault(), true);
  } finally {
    restore();
  }
});

test("recognises explicit persisted on/off overrides", () => {
  const values = new Map<string, string>();
  const restore = replaceGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
    },
  });
  try {
    values.set("feelzlike:data-saver", "1");
    assert.equal(readDataSaverOverride(), true);
    values.set("feelzlike:data-saver", "0");
    assert.equal(readDataSaverOverride(), false);
    values.set("feelzlike:data-saver", "unexpected");
    assert.equal(readDataSaverOverride(), null);
  } finally {
    restore();
  }
});

test("syncs blocked-storage choices to multiple same-tab consumers", () => {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const storedValue = "0";
  const restore = replaceGlobal("window", {
    localStorage: {
      getItem: (key: string) =>
        key === DATA_SAVER_STORAGE_KEY ? storedValue : null,
      setItem: () => {
        throw new Error("storage blocked");
      },
    },
    addEventListener: (type: string, listener: (event: Event) => void) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  });

  try {
    setSharedDataSaverOverride(null);
    let firstConsumer = false;
    let secondConsumer = false;
    const consume = (setValue: (enabled: boolean) => void) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
        setValue(detail.enabled);
      };
      window.addEventListener(DATA_SAVER_CHANGE_EVENT, listener);
      return listener;
    };
    const firstListener = consume((enabled) => {
      firstConsumer = enabled;
    });
    const secondListener = consume((enabled) => {
      secondConsumer = enabled;
    });

    persistDataSaverOverride(true);

    assert.equal(readDataSaverOverride(), false);
    assert.equal(getSharedDataSaverOverride(), true);
    assert.equal(firstConsumer, true);
    assert.equal(secondConsumer, true);

    window.removeEventListener(DATA_SAVER_CHANGE_EVENT, firstListener);
    window.removeEventListener(DATA_SAVER_CHANGE_EVENT, secondListener);
  } finally {
    setSharedDataSaverOverride(null);
    restore();
  }
});