/**
 * Resolve the public URL for the feelzlike web app. Used to build links in
 * outbound emails (sign-in magic links, snow alerts, manage/unsubscribe).
 * Order of precedence:
 * 1. APP_PUBLIC_URL env (explicit override)
 * 2. In a published deployment (REPLIT_DEPLOYMENT set): PUBLIC_ORIGIN, else
 *    the canonical https://feelzlike.com. NEVER the dev domain — Replit also
 *    exposes REPLIT_DEV_DOMAIN inside deployments, and falling through to it
 *    sent real visitors sign-in links pointing at a dead *.replit.dev page.
 * 3. REPLIT_DEV_DOMAIN (workspace dev preview only)
 * 4. http://localhost:5173 (last-resort dev fallback)
 *
 * Always returns a URL with no trailing slash.
 */
export function getAppPublicUrl(): string {
  const explicit = process.env.APP_PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.REPLIT_DEPLOYMENT) {
    return (process.env.PUBLIC_ORIGIN ?? "https://feelzlike.com").replace(/\/$/, "");
  }
  const replit = process.env.REPLIT_DEV_DOMAIN;
  if (replit) return `https://${replit}`.replace(/\/$/, "");
  return "http://localhost:5173";
}
