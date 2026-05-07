/**
 * Sentry must be initialised BEFORE any other module is imported, so this file
 * exists as the very first import in `index.ts`. Importing app/routes before
 * Sentry.init() means the http/express auto-instrumentation patches miss those
 * modules and you lose request tracing + breadcrumbs.
 */
import * as Sentry from "@sentry/node";

const rawDsn = process.env["SENTRY_DSN_API"];
const environment = process.env["NODE_ENV"] ?? "development";

// Validate that the DSN looks like a Sentry URL before handing it to the SDK.
// A bad value (e.g. someone pasted code into the secret) would otherwise be
// silently rejected by Sentry's internal validator while still triggering our
// "initialised" log - leaving us with no error reporting and no warning.
function isValidSentryDsn(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      /^[a-f0-9]+$/i.test(u.username) &&
      u.pathname.length > 1
    );
  } catch {
    return false;
  }
}

if (isValidSentryDsn(rawDsn)) {
  Sentry.init({
    dsn: rawDsn,
    environment,
    // 100% of traces in dev (cheap, useful), 10% in prod to stay within free quota.
    // Bump prod to 1.0 temporarily if you're hunting a specific issue.
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Default ignores noisy stack traces from health probes and rate-limit hits.
    ignoreErrors: ["RATE_LIMITED"],
    initialScope: { tags: { service: "feelzlike-api" } },
  });
  // eslint-disable-next-line no-console
  console.log(`[sentry] initialised (env=${environment})`);
} else if (rawDsn) {
  // eslint-disable-next-line no-console
  console.warn(
    `[sentry] SENTRY_DSN_API is set but does not look like a valid DSN URL ` +
      `(length=${rawDsn.length}, first8="${rawDsn.slice(0, 8)}"). ` +
      `Skipping init. Expected format: https://<key>@o<orgid>.ingest.<region>.sentry.io/<projectid>`,
  );
} else {
  // eslint-disable-next-line no-console
  console.log("[sentry] disabled - SENTRY_DSN_API not set");
}
