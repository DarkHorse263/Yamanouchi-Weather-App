/**
 * Web push wrapper. Lazily configures `web-push` with VAPID details on first
 * use so the api-server boots even when keys are missing (handy in dev).
 *
 * Required env vars:
 *   - VITE_VAPID_PUBLIC_KEY  (shared with client; reused server-side here)
 *   - VAPID_PRIVATE_KEY      (kept server-only)
 *   - ALERT_FROM_EMAIL       (mailto: contact for VAPID — required by the spec)
 */
import webpush from "web-push";

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VITE_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("[pushSender] VAPID keys not set — web push disabled");
    configured = false;
    return false;
  }
  const contact = (process.env.ALERT_FROM_EMAIL ?? "alerts@feelzlike.app").replace(/^.*<|>$/g, "");
  const mailto = contact.startsWith("mailto:") ? contact : `mailto:${contact}`;
  webpush.setVapidDetails(mailto, pub, priv);
  configured = true;
  return true;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export type PushResult =
  | { ok: true }
  | { ok: false; gone: boolean; status?: number; error: string };

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  if (!ensureConfigured()) {
    return { ok: false, gone: false, error: "push_not_configured" };
  }
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6 }, // 6h: alerts are time-sensitive
    );
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    const status = e.statusCode;
    // 404/410 from a push service means the subscription is dead and should be deleted
    const gone = status === 404 || status === 410;
    return { ok: false, gone, status, error: e.message ?? e.body ?? "push_failed" };
  }
}
