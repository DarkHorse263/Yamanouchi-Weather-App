import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/Welcome";
import Countries from "@/pages/Countries";
import NotFound from "@/pages/not-found";
import { RegionLayout } from "@/layouts/RegionLayout";
import { ConsentProvider, useConsent, canUseAds, canUseAnalytics } from "@/lib/consent";
import { ConsentBanner } from "@/components/ConsentBanner";
import { loadAwinMasterTag, removeAwinMasterTag } from "@/lib/awin";
import { loadGa, disableGa, gaPageView } from "@/lib/ga";
import { loadMetaPixel, disableMetaPixel, metaPixelPageView } from "@/lib/metaPixel";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PullToRefresh } from "@/components/PullToRefresh";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { identifyAnonUser, track } from "@/lib/analytics";
import { isStandaloneMode } from "@/lib/registerSW";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AlertsVerify from "@/pages/alerts/Verify";
import AlertsManage from "@/pages/alerts/Manage";
import AlertsUnsubscribed from "@/pages/alerts/Unsubscribed";
import CountryHome from "@/pages/CountryHome";
import NearYouWeather from "@/pages/NearYouWeather";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import TripPlanner from "@/pages/TripPlanner";
import Premium from "@/pages/Premium";
import AdminStats from "@/pages/admin/AdminStats";
import AdminTraffic from "@/pages/admin/AdminTraffic";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/countries" component={Countries} />
      <Route path="/countries/" component={Countries} />
      {/* Visitor's own local weather + radar · mounted before the /:region
          catch-all so /near-you isn't parsed as a region slug. */}
      <Route path="/near-you" component={NearYouWeather} />
      <Route path="/near-you/" component={NearYouWeather} />
      {/* Top-level alert pages - must come BEFORE the /:region catch-all so
          tokenised email links don't get parsed as a region. */}
      <Route path="/alerts/verify" component={AlertsVerify} />
      <Route path="/alerts/manage" component={AlertsManage} />
      <Route path="/alerts/unsubscribed" component={AlertsUnsubscribed} />
      {/* Legal pages · multi-country aware Privacy + Terms. Reachable
          from every footer; mounted before /:region/* so the slugs
          aren't parsed as regions. */}
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/terms" component={Terms} />
      {/* Premium hub · what's premium and (during the launch promo) that it's
          free for subscribers until 31 december 2026, with monthly & yearly
          pricing shown for after. Mounted before /:region so /premium isn't
          parsed as a region slug. */}
      <Route path="/premium" component={Premium} />
      <Route path="/premium/" component={Premium} />
      {/* Multi-day trip planner · now a free feature (premium hidden), mounted
          before /:region catch-all so /plan isn't parsed as a region slug. */}
      <Route path="/plan" component={TripPlanner} />
      {/* Admin dashboard · auth-gated, mounted before /:region catch-all so
          /admin/* paths aren't parsed as region slugs. */}
      <Route path="/admin" component={AdminStats} />
      <Route path="/admin/traffic" component={AdminTraffic} />
      {/* Country index pages - must come before the /:region catch-all so
          /au and /jp resolve to a regions-in-country picker, not the region
          layout (which would 404 on the country code). */}
      <Route path="/au"><CountryHome code="AU" /></Route>
      <Route path="/au/"><CountryHome code="AU" /></Route>
      <Route path="/jp"><CountryHome code="JP" /></Route>
      <Route path="/jp/"><CountryHome code="JP" /></Route>
      <Route path="/nz"><CountryHome code="NZ" /></Route>
      <Route path="/nz/"><CountryHome code="NZ" /></Route>
      <Route path="/:region/*?">
        <RegionLayout />
      </Route>
      <Route path="/:region">
        <RegionLayout />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Module-level once-guard so pwa_launch fires at most once per page load,
// even if AnalyticsBridge remounts (e.g. React StrictMode in dev).
const pwaLaunchTracked = { tracked: false };

/**
 * Bridges the ConsentProvider into the analytics layer + records page-view
 * breadcrumbs. Mounted inside ConsentProvider so it can read the choice and
 * inside WouterRouter so `useLocation` stays bound to the right base path.
 */
function AnalyticsBridge() {
  const consent = useConsent();
  const [location] = useLocation();

  // Identify (anon profile token) on mount and whenever consent flips.
  useEffect(() => {
    identifyAnonUser({ analyticsConsent: !!consent.choices?.analytics });
  }, [consent.choices?.analytics]);

  // PWA adoption measurement (consent-gated like every other event):
  //  - pwa_launch: fired once per app load when running from the home screen
  //    (display-mode standalone). Works on iOS too, which has no install
  //    event - unique users on this event = the active installed base.
  //  - pwa_installed: the browser's `appinstalled` event, fired the moment
  //    the user actually installs (Android / desktop Chrome & Edge only;
  //    iOS Safari never fires it).
  useEffect(() => {
    if (pwaLaunchTracked.tracked) return;
    pwaLaunchTracked.tracked = true;

    if (isStandaloneMode()) {
      track("pwa_launch", { category: "install", data: { mode: "standalone" } });
    }

    const onInstalled = () => {
      track("pwa_installed", { category: "install" });
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // Page-view breadcrumb on every route change. Cheap & always-on; helps
  // crash reports show what the user was looking at when things broke.
  // SECURITY: strip querystring + hash before logging - alert links carry
  // HMAC tokens (?token=...) that must never reach Sentry breadcrumbs.
  useEffect(() => {
    const safePath = location.split(/[?#]/)[0] || "/";
    track("page_view", { category: "navigation", data: { path: safePath } });
  }, [location]);

  return null;
}

/**
 * Scrolls back to the top of the page whenever the user navigates FORWARD to a
 * new route (e.g. tapping "Transport" in the bottom nav). Without this, wouter
 * keeps the previous scroll offset, so tapping a nav item from halfway down the
 * Today page would land you halfway down the next page.
 *
 * Back / forward navigations (popstate · including the in-app Back bar's
 * `history.back()`) are intentionally left alone so the browser can restore the
 * scroll position the user was at before.
 */
function ScrollToTop() {
  const [location] = useLocation();
  const wasPopRef = useRef(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const onPop = (e: Event) => {
      // Only genuine browser back/forward (a real PopStateEvent) should suppress
      // the scroll reset. Our URL-state / filter helpers dispatch a *synthetic*
      // `new Event("popstate")` for query-only updates · because wouter's
      // useLocation tracks the pathname only, those never run the effect below,
      // so the flag would never be consumed and would leak into the next real
      // forward navigation, wrongly skipping scroll-to-top.
      if (e instanceof PopStateEvent) wasPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const path = location.split(/[?#]/)[0] || "/";
    // Consume the popstate flag for this navigation so a stale value can't
    // leak into a later forward nav.
    const wasPop = wasPopRef.current;
    wasPopRef.current = false;

    // Skip the very first run (initial load / reload / deep link) so the
    // browser's own scroll restoration isn't clobbered.
    if (prevPathRef.current === null) {
      prevPathRef.current = path;
      return;
    }
    // Only a real path change should reset scroll · ignore query/hash-only
    // changes (e.g. tokenised alert links, filter params).
    if (prevPathRef.current === path) return;
    prevPathRef.current = path;

    // Back/forward navigation · let the browser restore the prior position.
    if (wasPop) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

/**
 * Loads the Awin affiliate MasterTag once the visitor grants `ads` consent,
 * and tears it down if they later revoke it. Mounted inside ConsentProvider so
 * it can read the choice. No-op until VITE_AWIN_PUBLISHER_ID is configured.
 */
function AwinTag() {
  const consent = useConsent();

  useEffect(() => {
    if (canUseAds(consent.choices)) {
      loadAwinMasterTag();
    } else {
      removeAwinMasterTag();
    }
  }, [consent.choices]);

  return null;
}

/**
 * Loads Google Analytics (gtag.js) once the visitor grants `analytics` consent,
 * and disables it (opt-out flag + script removal) if they later revoke it.
 * While enabled it sends a GA4 page_view on every route change · gtag's own
 * auto page_view is off (see lib/ga) so this is the single source of pageviews.
 * SECURITY: strip querystring + hash before sending · alert links carry HMAC
 * tokens (?token=...) that must never reach GA. Mounted inside WouterRouter so
 * `useLocation` stays bound to the right base path.
 */
function GoogleAnalyticsTag() {
  const consent = useConsent();
  const [location] = useLocation();
  const enabled = canUseAnalytics(consent.choices);

  useEffect(() => {
    if (enabled) {
      loadGa();
    } else {
      disableGa();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const safePath = location.split(/[?#]/)[0] || "/";
    gaPageView(safePath);
  }, [enabled, location]);

  return null;
}

/**
 * Loads the Meta (Facebook) Pixel once the visitor grants `ads` consent - it
 * is advertising tech (ad measurement + retargeting), so it rides the same
 * consent category as the Awin MasterTag, NOT `analytics`. While enabled it
 * sends a PageView on every route change; automatic collection is off (see
 * lib/metaPixel) so those explicit PageViews are the pixel's only hits, and
 * they are skipped entirely on tokened URLs (?token=...) because fbevents
 * reports the raw href and cannot be overridden.
 */
function MetaPixelTag() {
  const consent = useConsent();
  const [location] = useLocation();
  const enabled = canUseAds(consent.choices);

  useEffect(() => {
    if (enabled) {
      loadMetaPixel();
    } else {
      disableMetaPixel();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    metaPixelPageView();
  }, [enabled, location]);

  return null;
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConsentProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AnalyticsBridge />
              <ScrollToTop />
              <AwinTag />
              <GoogleAnalyticsTag />
              <MetaPixelTag />
              <Router />
            </WouterRouter>
            <ConsentBanner />
            <InstallPrompt />
            <OfflineBanner />
            <PullToRefresh />
          </ConsentProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
