import { useState } from "react";
import { useConsent } from "@/lib/consent";
import { useJapaneseUi } from "@/hooks/useJapaneseUi";

/**
 * Lightweight GDPR-style consent banner. Shown only until the user makes a
 * choice (Accept all / Reject non-essential / Customise).
 *
 * Design notes:
 *  - Bottom-anchored, full-width, doesn't trap focus or block page reading.
 *  - Honours the "ads" + "analytics" categories independently - required to
 *    pass IAB TCF / Google Funding Choices certification later.
 *  - Copy follows the region's app-wide Japanese UI preference.
 */
export function ConsentBanner() {
  const { hasDecided, acceptAll, rejectAll, setChoices } = useConsent();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);
  const ja = useJapaneseUi();

  if (hasDecided) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={ja ? "クッキーとトラッキングの同意" : "Cookie and tracking consent"}
      // On phones the banner sits ABOVE the fixed bottom nav so navigation
      // stays reachable while consent is pending. AppShell publishes the nav
      // height as --mobile-bottom-nav; pages without the nav (e.g. home) and
      // md+ viewports fall back to the plain bottom edge.
      className="fixed inset-x-0 bottom-[var(--mobile-bottom-nav,0px)] md:bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:px-6 sm:py-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="text-slate-700">
          <p className="text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
            {ja
              ? "必須機能のためにクッキーを使用します。同意いただける場合は、アクセス解析と広告にも使用します。"
              : "We use cookies for essential features and, with your permission, analytics + ads."}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:mt-1 sm:text-xs">
            <span className="hidden sm:inline">
              {ja ? "選択内容はフッターからいつでも変更できます。 " : "You can change your choice any time from the footer. "}
            </span>
            {ja ? "詳しくは" : "See our"}{" "}
            <a href="/legal/privacy" className="underline underline-offset-2 hover:text-sky-700">
              {ja ? "プライバシーポリシー" : "privacy policy"}
            </a>
            {ja ? "をご覧ください。" : "."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-4 sm:text-xs"
            onClick={() => setOpen((v) => !v)}
            data-testid="consent-customise"
          >
            {ja ? "カスタマイズ" : "Customise"}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-4 sm:text-xs"
            onClick={rejectAll}
            data-testid="consent-reject"
          >
            {ja ? "必須以外を拒否" : "Reject non-essential"}
          </button>
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:opacity-95 sm:px-5 sm:text-xs"
            onClick={acceptAll}
            data-testid="consent-accept"
          >
            {ja ? "すべて許可" : "Accept all"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-4 max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {ja ? "収集する項目を選択" : "Choose what we collect"}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex cursor-not-allowed items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 opacity-70">
              <input type="checkbox" checked readOnly className="mt-1" />
              <div>
                <div className="text-sm font-semibold text-slate-800">{ja ? "必須" : "Essential"}</div>
                <div className="text-xs text-slate-500">
                  {ja ? "サイトの動作に必要なため、常に有効です。" : "Required for the site to function. Always on."}
                </div>
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
                <div className="text-sm font-semibold text-slate-800">{ja ? "アクセス解析" : "Analytics"}</div>
                <div className="text-xs text-slate-500">
                  {ja ? "どの予報や地域が役立っているかを把握するために使用します。" : "Helps us understand which forecasts and regions are useful."}
                </div>
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
                <div className="text-sm font-semibold text-slate-800">{ja ? "広告" : "Advertising"}</div>
                <div className="text-xs text-slate-500">
                  {ja
                    ? "予約アフィリエイトのクッキーと、フェイスブック・インスタグラム広告の効果測定に使用します。"
                    : "Affiliate booking cookies + measuring the ads we run on Facebook and Instagram."}
                </div>
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
              {ja ? "設定を保存" : "Save preferences"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
