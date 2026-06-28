import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react";
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Top-level error boundary. Catches any uncaught render error inside the
 * router, ships it to Sentry, and renders a calm fallback so the user
 * never sees a blank page.
 *
 * Sentry's ErrorBoundary handles capture + scope wiring for us; we just
 * supply the fallback UI and a "reset" button that re-mounts children.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SentryErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Something broke up the mountain.</h1>
            <p className="mt-2 text-sm text-white/70">
              We've logged the error and our team will take a look. You can keep going below.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => resetError()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )}
      showDialog={false}
    >
      {children}
    </SentryErrorBoundary>
  );
}
