/* FeelZlike powder alert service worker.
 *
 * Runs in the browser background once a user grants notification permission
 * and we POST their PushSubscription to the server. The server-side cron job
 * (alertEvaluator) calls web-push to enqueue a notification with a JSON
 * payload of { title, body, url, tag }.
 *
 * No build step — this file ships as-is from /public.
 */

self.addEventListener("install", (event) => {
  // Activate the new SW immediately on first install so subscribers don't
  // wait until every tab is closed for the next deploy to take effect.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "FeelZlike", body: "Powder incoming.", url: "/", tag: "feelzlike-alert" };
  if (event.data) {
    try { payload = { ...payload, ...event.data.json() }; }
    catch { payload.body = event.data.text() || payload.body; }
  }

  const opts = {
    body: payload.body,
    tag: payload.tag,
    data: { url: payload.url || "/" },
    icon: "/favicon.png",
    badge: "/favicon.png",
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(payload.title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Focus an existing tab if any is already on the same origin
    for (const c of allClients) {
      if ("focus" in c) {
        try { await c.focus(); await c.navigate(url); return; } catch { /* fallthrough */ }
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
