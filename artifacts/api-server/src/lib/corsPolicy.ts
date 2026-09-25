/** Exact production origins only; preview hosts are development-only. */
export function isOriginAllowed(origin: string, production: boolean, appUrl = ""): boolean {
  if (origin === "https://feelzlike.com" || origin === "https://www.feelzlike.com") return true;
  if (appUrl && origin === appUrl.replace(/\/$/, "")) return true;
  if (production) return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) return false;
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" ||
      /\.(replit\.app|replit\.dev|repl\.co)$/.test(url.hostname);
  } catch { return false; }
}