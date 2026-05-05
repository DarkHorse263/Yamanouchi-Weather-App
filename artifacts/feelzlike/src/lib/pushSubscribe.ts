/**
 * Web Push subscription helpers.
 *
 * Browsers expose push via the Service Worker → PushManager APIs. We:
 *   1. register the service worker (idempotent),
 *   2. ask the user for notification permission,
 *   3. subscribe to PushManager with our VAPID public key,
 *   4. POST the subscription JSON to the API along with the management token.
 *
 * iOS Safari: only supports web push when the site is installed to home
 * screen as a PWA (and only on iOS 16.4+). `pushSupportStatus()` surfaces
 * this so the UI can show an Add-to-Home-Screen hint instead of a broken
 * "Enable" button.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushSupportStatus =
  | { supported: true }
  | { supported: false; reason: "ssr" | "no_serviceworker" | "no_pushmanager" | "no_vapid_key" | "ios_needs_pwa" };

export function pushSupportStatus(): PushSupportStatus {
  if (typeof window === "undefined" || typeof navigator === "undefined") return { supported: false, reason: "ssr" };
  if (!VAPID_PUBLIC_KEY) return { supported: false, reason: "no_vapid_key" };
  if (!("serviceWorker" in navigator)) return { supported: false, reason: "no_serviceworker" };
  if (!("PushManager" in window)) {
    // iOS Safari: PushManager exists only when launched as installed PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as unknown as { MSStream?: unknown }).MSStream;
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIOS && !standalone) return { supported: false, reason: "ios_needs_pwa" };
    return { supported: false, reason: "no_pushmanager" };
  }
  return { supported: true };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const swPath = `${import.meta.env.BASE_URL}sw.js`.replace(/\/+/g, "/");
  // Scope the SW to the app's base path so it doesn't try to control siblings
  const scope = import.meta.env.BASE_URL || "/";
  return navigator.serviceWorker.register(swPath, { scope });
}

export async function ensurePushSubscription(manageToken: string): Promise<{
  ok: true; endpoint: string;
} | {
  ok: false; reason: "permission_denied" | "support" | "vapid" | "network";
  message: string;
}> {
  const status = pushSupportStatus();
  if (!status.supported) {
    return { ok: false, reason: status.reason === "no_vapid_key" ? "vapid" : "support", message: explainStatus(status) };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: "vapid", message: "Push isn't configured yet on this server." };
  }

  const reg = await registerServiceWorker();
  // `Notification.requestPermission` returns "granted" | "denied" | "default"
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    return { ok: false, reason: "permission_denied", message: "Notifications were blocked. Enable them in your browser settings." };
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
  const res = await fetch(`${apiBase}/alerts/push/subscribe?token=${encodeURIComponent(manageToken)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent.slice(0, 200),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, reason: "network", message: `Couldn't save subscription (${res.status}). ${body.slice(0, 120)}` };
  }
  return { ok: true, endpoint: sub.endpoint };
}

export async function disablePushSubscription(manageToken: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
  await fetch(`${apiBase}/alerts/push/subscribe?token=${encodeURIComponent(manageToken)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
  return true;
}

export function explainStatus(status: PushSupportStatus): string {
  if (status.supported) return "Push notifications are supported.";
  switch (status.reason) {
    case "ssr": return "Push isn't available in this environment.";
    case "no_serviceworker": return "Your browser doesn't support service workers, which are required for push.";
    case "no_pushmanager": return "Your browser doesn't support web push notifications.";
    case "ios_needs_pwa": return "On iPhone, install FeelZlike to your home screen first (Share → Add to Home Screen). Push notifications work in the installed app on iOS 16.4+.";
    case "no_vapid_key": return "Push isn't configured on this server yet.";
  }
}
