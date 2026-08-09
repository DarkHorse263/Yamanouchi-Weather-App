/**
 * Sentry browser SDK init. Loaded as the very first import in main.tsx so
 * router/breadcrumb auto-instrumentation patches React + fetch before any
 * other code touches them.
 *
 * If VITE_SENTRY_DSN is empty (e.g. local dev without the secret), Sentry
 * no-ops silently - nothing is sent and no console noise is produced.
 *
 * One Sentry React project is shared across the four SPAs (feelzlike,
 * snowy-mountains, victorias-high-country, yamanouchi). The `artifact` tag below lets you
 * filter / split error budgets per region inside Sentry without paying for
 * four separate projects.
 */
import * as Sentry from "@sentry/react";

const dsn = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Conservative defaults: in prod we capture 10% of transactions and 5% of
    // sessions to stay inside the free tier; on errors we always capture the
    // full session so debugging is intact.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      // Privacy-safe replay defaults: mask all text content and block media
      // so session replay carries DOM structure + interactions only, never
      // user-visible text, email inputs, or images. Aligns with the Privacy
      // Policy claim that crash diagnostics are PII-redacted.
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    // Distribute trace headers to our own API so backend Sentry events link to
    // the originating browser transaction. Loose regex covers the dev proxy URL
    // and the future production domain.
    tracePropagationTargets: ["localhost", /^\/api\//, /\.replit\.dev$/, /feelzlike\.com$/],
    initialScope: { tags: { artifact: "feelzlike" } },
  });
}
