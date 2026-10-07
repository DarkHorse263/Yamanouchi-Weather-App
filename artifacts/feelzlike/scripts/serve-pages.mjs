import { createServer } from "node:http";
import { createReadStream, readFileSync, realpathSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm",
  ".webmanifest": "application/manifest+json",
};

export function createPageServer({ root, routes, redirects = {} }) {
  root = realpathSync(root);
  const known = new Set(routes);
  const file = (path) => {
    try {
      const full = realpathSync(resolve(root, `.${path}`));
      if (!full.startsWith(`${root}${sep}`)) return null;
      const stat = statSync(full);
      return stat.isFile() ? { full, stat } : null;
    } catch { return null; }
  };
  // Fail startup rather than publish a server without the built application.
  if (!file("/index.html")) throw new Error("Built index.html is missing");
  return createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    // Framing and CSP remain unchanged: the app supports embedding, Clerk,
    // third-party maps and consent-gated scripts.
    res.setHeader("Cache-Control", "no-cache");
    const finish = (status, message) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      if (status >= 400) res.setHeader("X-Robots-Tag", "noindex");
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      return finish(405, "Method not allowed");
    }
    let pathname, query;
    try {
      const raw = req.url.split("?")[0];
      pathname = decodeURIComponent(raw);
      query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      if (!pathname.startsWith("/") || pathname.startsWith("//") ||
          /[\\\x00-\x1f\x7f]/.test(pathname) ||
          pathname.split("/").some(p => p === "." || p === ".." || p.startsWith("."))) {
        return finish(400, "Invalid path");
      }
    } catch { return finish(400, "Invalid path"); }
    const clean = pathname.replace(/\/+$/, "") || "/";
    const redirect = (target) => {
      res.statusCode = 301;
      res.setHeader("Location", target + query);
      res.end();
    };
    if (Object.hasOwn(redirects, clean)) return redirect(redirects[clean]);
    const auth = /^\/sign-(?:in|up)(?:\/|$)/.test(pathname);
    let selected = file(pathname);
    // Public sourcemaps must never be downloadable, even if accidentally built.
    if (pathname.endsWith(".map")) return finish(404, "Not found");
    if (!selected && (known.has(clean) || auth)) {
      if (known.has(clean) && clean !== "/" && !pathname.endsWith("/")) return redirect(`${clean}/`);
      selected = file(`${clean === "/" ? "" : clean}/index.html`) || file("/index.html");
    }
    if (!selected) {
      // Render the real app's not-found screen, with a real HTTP 404.
      if (extname(pathname)) return finish(404, "Not found");
      selected = file("/index.html");
      res.statusCode = 404;
      res.setHeader("X-Robots-Tag", "noindex");
    }
    const type = MIME[extname(selected.full)] || "application/octet-stream";
    res.setHeader("Content-Type", type);
    if (auth || ["/account", "/admin", "/alerts/manage", "/alerts/verify"].includes(clean)) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Robots-Tag", "noindex");
    } else if (pathname.startsWith("/assets/") && !type.startsWith("text/html")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    let range;
    if (req.headers.range && res.statusCode !== 404) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && (match[1] || match[2])) {
        const size = selected.stat.size;
        const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
        const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
          res.setHeader("Content-Range", `bytes */${size}`);
          return finish(416, "Range not satisfiable");
        }
        range = { start, end };
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      }
    }
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", range ? range.end - range.start + 1 : selected.stat.size);
    if (req.method === "HEAD") return res.end();
    const stream = createReadStream(selected.full, range);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../dist/public", import.meta.url));
  const manifest = JSON.parse(readFileSync(new URL("../dist/page-routes.json", import.meta.url), "utf8"));
  createPageServer({ root, ...manifest }).listen(Number(process.env.PORT || 23968), "0.0.0.0",
    () => console.log("Production page server listening"));
}
