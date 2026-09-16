const VALIDATION_ORIGIN = "https://internal.invalid";
const UNSAFE_CHARACTERS = /[\\\u0000-\u001f\u007f-\u009f]/u;

/**
 * Preserve ordinary internal destinations, but check every decoding layer:
 * the legacy link and downstream sign-in each parse URL-encoded values.
 * Unsafe/ambiguous destinations keep the existing home-page fallback.
 */
export function safeAuthEmailReturnTo(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) return "/";
  let candidate = value;
  for (let depth = 0; depth < 8; depth++) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") ||
        UNSAFE_CHARACTERS.test(candidate)) return "/";
    try {
      const normalized = new URL(candidate, VALIDATION_ORIGIN);
      if (normalized.origin !== VALIDATION_ORIGIN ||
          normalized.pathname.startsWith("//")) return "/";
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return value;
      candidate = decoded;
    } catch {
      return "/";
    }
  }
  return "/";
}

/**
 * The configured app origin is an operator trust boundary, never a request
 * Host/Origin header. Reject malformed configuration rather than redirecting
 * via credentials, a path prefix, query, fragment, or a non-web scheme.
 * HTTP remains supported for local development.
 */
export function authEmailSignInUrl(
  configuredOrigin: string,
  options: { returnTo?: unknown; notice?: "expired" | "invalid" | "error" } = {},
): string {
  const origin = new URL(configuredOrigin);
  if (UNSAFE_CHARACTERS.test(configuredOrigin) ||
      !/^https?:\/\/[^/?#]+\/?$/.test(configuredOrigin) ||
      !["http:", "https:"].includes(origin.protocol) ||
      origin.username || origin.password || origin.pathname !== "/" ||
      origin.search || origin.hash) {
    throw new Error("Legacy sign-in requires a trusted HTTP(S) app origin");
  }
  const url = new URL("/sign-in", origin);
  if (options.notice) url.searchParams.set("notice", options.notice);
  const returnTo = safeAuthEmailReturnTo(options.returnTo);
  if (returnTo !== "/") url.searchParams.set("redirect_url", returnTo);
  return url.href;
}