/**
 * Sentry must be initialised BEFORE any other module is imported, so this file
 * exists as the very first import in `index.ts`. Importing app/routes before
 * Sentry.init() means the http/express auto-instrumentation patches miss those
 * modules and you lose request tracing + breadcrumbs.
 */
import * as Sentry from "@sentry/node";

const dsn = process.env["SENTRY_DSN_API"];
const environment = process.env["NODE_ENV"] ?? "development";

if (dsn) {
  Sentry.init({
    dsn,
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
} else {
  // eslint-disable-next-line no-console
  console.log("[sentry] disabled — SENTRY_DSN_API not set");
}
