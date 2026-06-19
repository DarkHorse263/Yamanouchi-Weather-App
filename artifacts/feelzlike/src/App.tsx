import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/Welcome";
import Countries from "@/pages/Countries";
import NotFound from "@/pages/not-found";
import { RegionLayout } from "@/layouts/RegionLayout";
import { ConsentProvider, useConsent, canUseAds } from "@/lib/consent";
import { ConsentBanner } from "@/components/ConsentBanner";
import { loadAwinMasterTag, removeAwinMasterTag } from "@/lib/awin";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PullToRefresh } from "@/components/PullToRefresh";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { identifyAnonUser, track } from "@/lib/analytics";
import { useEffect } from "react";
import { useLocation } from "wouter";
import AlertsVerify from "@/pages/alerts/Verify";
import AlertsManage from "@/pages/alerts/Manage";
import AlertsUnsubscribed from "@/pages/alerts/Unsubscribed";
import NewsletterVerify from "@/pages/newsletter/Verify";
import NewsletterUnsubscribed from "@/pages/newsletter/Unsubscribed";
import CountryHome from "@/pages/CountryHome";
import NearYouWeather from "@/pages/NearYouWeather";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import News from "@/pages/News";
import TripPlanner from "@/pages/TripPlanner";
import AdminStats from "@/pages/admin/AdminStats";
import AdminTraffic from "@/pages/admin/AdminTraffic";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";

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
      <Route path="/newsletter/verify" component={NewsletterVerify} />
      <Route path="/newsletter/unsubscribed" component={NewsletterUnsubscribed} />
      {/* Legal pages · multi-country aware Privacy + Terms. Reachable
          from every footer; mounted before /:region/* so the slugs
          aren't parsed as regions. */}
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/terms" component={Terms} />
      {/* News & updates · curated feed (now populated) + the home strip's
          "see all news" target. */}
      <Route path="/news" component={News} />
      <Route path="/news/" component={News} />
      {/* Premium hidden until traction · the pricing/plans page is taken out
          of service (redirect home) rather than deleted, so old bookmarks and
          shared links land somewhere sensible. Restore
          `<Route path="/premium" component={Premium} />` (and the Premium
          import) to bring the hub back. */}
      <Route path="/premium"><Redirect to="/" /></Route>
      <Route path="/premium/"><Redirect to="/" /></Route>
      {/* Multi-day trip planner · now a free feature (premium hidden), mounted
          before /:region catch-all so /plan isn't parsed as a region slug. */}
      <Route path="/plan" component={TripPlanner} />
      {/* Admin dashboard · auth-gated, mounted before /:region catch-all so
          /admin/* paths aren't parsed as region slugs. */}
      <Route path="/admin" component={AdminStats} />
      <Route path="/admin/traffic" component={AdminTraffic} />
      <Route path="/admin/newsletter" component={AdminNewsletter} />
      {/* Country index pages - must come before the /:region catch-all so
          /au and /jp resolve to a regions-in-country picker, not the region
          layout (which would 404 on the country code). */}
      <Route path="/au"><CountryHome code="AU" /></Route>
      <Route path="/au/"><CountryHome code="AU" /></Route>
      <Route path="/jp"><CountryHome code="JP" /></Route>
      <Route path="/jp/"><CountryHome code="JP" /></Route>
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

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConsentProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AnalyticsBridge />
              <AwinTag />
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
