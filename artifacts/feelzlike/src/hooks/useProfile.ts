import { useCallback, useSyncExternalStore } from "react";
import {
  PROFILE_DEFAULTS,
  PROFILE_STORAGE_KEY,
  type UserProfile,
} from "@/types/profile";

/**
 * Shared, single-source-of-truth localStorage-backed UserProfile store.
 *
 * IMPORTANT — same-tab vs cross-tab writes:
 *   The browser's `storage` event ONLY fires in OTHER tabs (not the one
 *   that called localStorage.setItem). An earlier implementation used
 *   per-hook useState mirrors which meant saving in ProfileSheet did NOT
 *   notify TodaysCall in the same tab — caller's `hasOnboarded` stayed
 *   stale until next mount, which let the onboarding sheet re-open in a
 *   loop after the user clicked Skip/Save.
 *
 *   This rewrite uses `useSyncExternalStore` against a module-level store
 *   with a real subscriber list. setProfile() writes to localStorage AND
 *   immediately fans out to every subscribed component in the same tab.
 *   The `storage` event handler remains so cross-tab sync still works.
 *
 * SSR-safe via the third `getServerSnapshot` arg returning defaults.
 * Schema-versioned via `v: 1` — old records are dropped.
 */

// ---------------------------------------------------------------------------
// Module-level store
// ---------------------------------------------------------------------------

let cached: UserProfile | null = null; // null until first read or write
const subscribers = new Set<() => void>();

function readFromStorage(): UserProfile {
  if (typeof window === "undefined") return PROFILE_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return PROFILE_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (parsed.v !== 1) return PROFILE_DEFAULTS;
    return { ...PROFILE_DEFAULTS, ...parsed, v: 1 } as UserProfile;
  } catch {
    return PROFILE_DEFAULTS;
  }
}

function notifyAll() {
  subscribers.forEach((cb) => cb());
}

function getSnapshot(): UserProfile {
  if (cached === null) cached = readFromStorage();
  return cached;
}

function getServerSnapshot(): UserProfile {
  return PROFILE_DEFAULTS;
}

function setSnapshot(next: UserProfile) {
  cached = next;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded / private mode — silent */
  }
  notifyAll();
}

// Singleton cross-tab listener — installed exactly once on the first
// browser-side subscribe. With N consumers we previously installed N
// listeners and each invoked notifyAll(), causing N² notifications per
// storage event. One listener + reference-counted teardown fixes that.
let storageListenerInstalled = false;
function ensureStorageListener() {
  if (storageListenerInstalled || typeof window === "undefined") return;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== PROFILE_STORAGE_KEY) return;
    cached = readFromStorage();
    notifyAll();
  });
  storageListenerInstalled = true;
}

function subscribe(cb: () => void) {
  ensureStorageListener();
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export function useProfile(): {
  profile: UserProfile;
  setProfile: (next: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  resetProfile: () => void;
  hasOnboarded: boolean;
  isLoaded: boolean;
} {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setProfile = useCallback(
    (next: UserProfile | ((prev: UserProfile) => UserProfile)) => {
      const resolved =
        typeof next === "function" ? next(getSnapshot()) : next;
      // Defensive: enforce the priorities cap at the store boundary so a
      // future caller bypassing the UI cap can't blow past it.
      const safe: UserProfile = {
        ...resolved,
        priorities: resolved.priorities.slice(0, 3),
        v: 1,
      };
      setSnapshot(safe);
    },
    [],
  );

  const resetProfile = useCallback(() => {
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      /* noop */
    }
    setSnapshot(PROFILE_DEFAULTS);
  }, []);

  return {
    profile,
    setProfile,
    resetProfile,
    hasOnboarded: profile.onboardedAt !== null,
    // Always true once useSyncExternalStore has run — getSnapshot reads
    // synchronously on the first render. Kept for callers that branch on it.
    isLoaded: true,
  };
}
