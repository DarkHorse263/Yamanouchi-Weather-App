import { useState } from "react";
import { useConsent } from "@/lib/consent";

/**
 * Lightweight GDPR-style consent banner. Shown only until the user makes a
 * choice (Accept all / Reject non-essential / Customise).
 *
 * Design notes:
 *  - Bottom-anchored, full-width, doesn't trap focus or block page reading.
 *  - Honours the "ads" + "analytics" categories independently — required to
 *    pass IAB TCF / Google Funding Choices certification later.
 *  - All copy is plain English; replace with localised copy when i18n lands.
 */
export function ConsentBanner() {
  const { hasDecided, acceptAll, rejectAll, setChoices } = useConsent();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  if (hasDecided) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and tracking consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-700">
          <p className="font-semibold text-slate-900">We use cookies for essential features and (with your permission) analytics + ads.</p>
          <p className="mt-1 text-xs text-slate-500">
            You can change your choice any time from the footer. See our{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-sky-700">
              privacy policy
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            data-testid="consent-customise"
          >
            Customise
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={rejectAll}
            data-testid="consent-reject"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-sky-500 to-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
            onClick={acceptAll}
            data-testid="consent-accept"
          >
            Accept all
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-4 max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Choose what we collect</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex cursor-not-allowed items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 opacity-70">
              <input type="checkbox" checked readOnly className="mt-1" />
              <div>
                <div className="text-sm font-semibold text-slate-800">Essential</div>
                <div className="text-xs text-slate-500">Required for the site to function. Always on.</div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-sky-300">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1"
                data-testid="consent-toggle-analytics"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800">Analytics</div>
                <div className="text-xs text-slate-500">Helps us understand which forecasts and regions are useful.</div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-sky-300">
              <input
                type="checkbox"
                checked={ads}
                onChange={(e) => setAds(e.target.checked)}
                className="mt-1"
                data-testid="consent-toggle-ads"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800">Advertising</div>
                <div className="text-xs text-slate-500">Lets advertisers personalise the ads we show.</div>
              </div>
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              onClick={() => {
                setChoices({ analytics, ads });
                setOpen(false);
              }}
              data-testid="consent-save"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
