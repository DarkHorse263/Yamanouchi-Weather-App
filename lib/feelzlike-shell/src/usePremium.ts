import { useEffect, useState } from "react";

/**
 * Premium subscription state. UI only for now - no payments wired.
 *
 * Demo / preview: set localStorage `feelzlike.premium.preview` to `1` to
 * flip every gated section into the unlocked view. Useful for screenshots
 * and walking the user through what subscribers will see before Stripe is
 * connected.
 *
 * Future: replace `readPreview()` with a real subscription lookup
 * (Stripe customer + active sub OR seasonal-pass entry) and keep the
 * same `{ isPremium }` shape so callers don't change.
 */
const STORAGE_KEY = "feelzlike.premium.preview";

function readPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function usePremium(): { isPremium: boolean } {
  const [isPremium, setIsPremium] = useState<boolean>(() => readPreview());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIsPremium(readPreview());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { isPremium };
}

export function setPremiumPreview(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    /* ignore */
  }
}
