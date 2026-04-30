/**
 * Sentry browser SDK init. See artifacts/feelzlike/src/instrument.ts for the
 * full rationale — same shape, only `artifact` tag differs so per-region error
 * filtering works inside the shared Sentry React project.
 */
import * as Sentry from "@sentry/react";

const dsn = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracePropagationTargets: ["localhost", /^\/api\//, /\.replit\.dev$/, /feelzlike\.app$/],
    initialScope: { tags: { artifact: "iiyama" } },
  });
}
