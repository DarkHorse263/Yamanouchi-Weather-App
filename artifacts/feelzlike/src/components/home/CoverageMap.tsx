import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@sentry/react";
import { Loader2, Map as MapIcon, RotateCcw } from "lucide-react";
import { track } from "@/lib/analytics";
import { REGIONS } from "@/regions";

const CoverageMapInner = lazy(() => import("./CoverageMap.inner"));

export function CoverageMap() {
  const regionCount = REGIONS.length;

  return (
    <section className="px-4 pb-12 md:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.06)]">
        <div className="border-b border-sky-50 bg-[#0055FF] px-5 py-4 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
            <MapIcon className="h-4 w-4" />
            world coverage
          </div>
          <p className="mt-1.5 text-lg font-medium leading-snug">
            {regionCount} regions and growing
          </p>
          <p className="mt-1 text-sm text-white/80">
            every major resort and mountain town across australia, new zealand, japan, and canada.
          </p>
        </div>
        
        <div className="relative">
          <CoverageErrorBoundary>
            <Suspense
              fallback={
                <div className="flex h-[400px] flex-col items-center justify-center bg-slate-50 md:h-[480px]">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                  <span className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    loading map
                  </span>
                </div>
              }
            >
              <CoverageMapInner />
            </Suspense>
          </CoverageErrorBoundary>
        </div>
      </div>
    </section>
  );
}

class CoverageErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[coverage map] failed to load", error, info);
    captureException(error, { tags: { area: "coverage_map" }, extra: { componentStack: info.componentStack } });
  }
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-[400px] flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-500 md:h-[480px]">
          <p className="text-sm">map unavailable &middot; connection failed</p>
          <button
            type="button"
            onClick={() => {
              track("coverage_map_reload", { category: "navigation" });
              window.location.reload();
            }}
            className="mt-3 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            reload to try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
