/**
 * Resolve the public URL for the feelzlike web app. Used to build links in
 * outbound emails. Order of precedence:
 * 1. APP_PUBLIC_URL env (set this in production)
 * 2. REPLIT_DEV_DOMAIN (Replit-managed dev preview)
 * 3. http://localhost:5173 (last-resort dev fallback)
 *
 * Always returns a URL with no trailing slash.
 */
export function getAppPublicUrl(): string {
  const explicit = process.env.APP_PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const replit = process.env.REPLIT_DEV_DOMAIN;
  if (replit) return `https://${replit}`.replace(/\/$/, "");
  return "http://localhost:5173";
}
