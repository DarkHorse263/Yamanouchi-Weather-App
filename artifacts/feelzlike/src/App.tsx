import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/Welcome";
import Countries from "@/pages/Countries";
import NotFound from "@/pages/not-found";
import { RegionLayout } from "@/layouts/RegionLayout";
import { ConsentProvider, useConsent, canUseAds, canUseAnalytics } from "@/lib/consent";
import { ConsentBanner } from "@/components/ConsentBanner";
import { loadAwinMasterTag, removeAwinMasterTag } from "@/lib/awin";
import { loadGa, gaConsentUpdate, gaPageView } from "@/lib/ga";
import { loadMetaPixel, disableMetaPixel, metaPixelPageView } from "@/lib/metaPixel";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PullToRefresh } from "@/components/PullToRefresh";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SignUpProvider } from "@/components/auth/SignUpProvider";
import { UserPrefsProvider } from "@/components/auth/UserPrefsProvider";
import { identifyAnonUser, track } from "@/lib/analytics";
import { pingPageView, pingPwaEvent } from "@/lib/engagement";
import { isStandaloneMode } from "@/lib/registerSW";
import { useEffect, useRef } from "react";
import AlertsVerify from "@/pages/alerts/Verify";
import AlertsManage from "@/pages/alerts/Manage";
import AlertsUnsubscribed from "@/pages/alerts/Unsubscribed";
import CountryHome from "@/pages/CountryHome";
import NearYouWeather from "@/pages/NearYouWeather";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import TripPlanner from "@/pages/TripPlanner";
import Premium from "@/pages/Premium";
import Account from "@/pages/Account";
import AdminStats from "@/pages/admin/AdminStats";
import CanadaDirectory from "@/pages/CanadaDirectory";
import About from "@/pages/About";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import {
  ClerkProvider,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so
// the same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly),
// auto-set in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// Module-level once-guard so pwa_launch fires at most once per page load.
const pwaLaunchTracked = { tracked: false };

/**
 * Invalidates the QueryClient cache when the signed-in user changes so stale
 * user-scoped data isn't shown after sign-out or user switch.
 */
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

/**
 * Bridges the ConsentProvider into the analytics layer + records page-view
 * breadcrumbs.
 */
function AnalyticsBridge() {
  const consent = useConsent();
  const [location] = useLocation();

  useEffect(() => {
    identifyAnonUser({ analyticsConsent: !!consent.choices?.analytics });
  }, [consent.choices?.analytics]);

  useEffect(() => {
    if (pwaLaunchTracked.tracked) return;
    pwaLaunchTracked.tracked = true;

    if (isStandaloneMode()) {
      track("pwa_launch", { category: "install", data: { mode: "standalone" } });
      pingPwaEvent("pwa_launch");
    }

    const onInstalled = () => {
      track("pwa_installed", { category: "install" });
      pingPwaEvent("pwa_install");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    const safePath = location.split(/[?#]/)[0] || "/";
    track("page_view", { category: "navigation", data: { path: safePath } });
    pingPageView(safePath);
  }, [location]);

  return null;
}

/**
 * Scrolls to the top on forward navigation; leaves popstate (back/forward)
 * untouched so the browser can restore scroll position.
 */
function ScrollToTop() {
  const [location] = useLocation();
  const wasPopRef = useRef(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const onPop = (e: Event) => {
      if (e instanceof PopStateEvent) wasPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const path = location.split(/[?#]/)[0] || "/";
    const wasPop = wasPopRef.current;
    wasPopRef.current = false;

    if (prevPathRef.current === null) {
      prevPathRef.current = path;
      return;
    }
    if (prevPathRef.current === path) return;
    prevPathRef.current = path;

    if (wasPop) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

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

function GoogleAnalyticsTag() {
  const consent = useConsent();
  const [location] = useLocation();
  const analyticsGranted = canUseAnalytics(consent.choices);
  const adsGranted = canUseAds(consent.choices);

  useEffect(() => { loadGa(); }, []);
  useEffect(() => { gaConsentUpdate({ analytics: analyticsGranted, ads: adsGranted }); }, [analyticsGranted, adsGranted]);
  useEffect(() => {
    const safePath = location.split(/[?#]/)[0] || "/";
    gaPageView(safePath);
  }, [location]);

  return null;
}

function MetaPixelTag() {
  const consent = useConsent();
  const [location] = useLocation();
  const enabled = canUseAds(consent.choices);

  useEffect(() => {
    if (enabled) { loadMetaPixel(); } else { disableMetaPixel(); }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    metaPixelPageView();
  }, [enabled, location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/countries" component={Countries} />
      <Route path="/countries/" component={Countries} />
      <Route path="/about" component={About} />
      <Route path="/about/" component={About} />
      {/* Sign-in / sign-up — REQUIRED paths with /*? optional wildcard so
          Clerk's OAuth sub-paths (/sign-in/sso-callback etc.) also match. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/near-you" component={NearYouWeather} />
      <Route path="/near-you/" component={NearYouWeather} />
      <Route path="/alerts/verify" component={AlertsVerify} />
      <Route path="/alerts/manage" component={AlertsManage} />
      <Route path="/alerts/unsubscribed" component={AlertsUnsubscribed} />
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/terms" component={Terms} />
      <Route path="/premium" component={Premium} />
      <Route path="/premium/" component={Premium} />
      <Route path="/account" component={Account} />
      <Route path="/account/" component={Account} />
      <Route path="/plan" component={TripPlanner} />
      <Route path="/admin" component={AdminStats} />
      <Route path="/au"><CountryHome code="AU" /></Route>
      <Route path="/au/"><CountryHome code="AU" /></Route>
      <Route path="/jp"><CountryHome code="JP" /></Route>
      <Route path="/jp/"><CountryHome code="JP" /></Route>
      <Route path="/nz"><CountryHome code="NZ" /></Route>
      <Route path="/nz/"><CountryHome code="NZ" /></Route>
      <Route path="/ca"><CountryHome code="CA" /></Route>
      <Route path="/ca/"><CountryHome code="CA" /></Route>
      <Route path="/ca/all-ski-areas" component={CanadaDirectory} />
      <Route path="/ca/all-ski-areas/" component={CanadaDirectory} />
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  const clerkAppearance = {
    cssLayerName: "clerk",
    variables: {
      colorPrimary: "#0055FF",
      colorForeground: "#0f172a",
      colorMutedForeground: "#64748b",
      colorDanger: "#dc2626",
      colorBackground: "#ffffff",
      colorInput: "#f8fafc",
      colorInputForeground: "#0f172a",
      colorNeutral: "#e2e8f0",
      fontFamily: "'DIN Pro', system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-100",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-slate-900 font-bold",
      headerSubtitle: "text-slate-500",
      socialButtonsBlockButtonText: "text-slate-700",
      formFieldLabel: "text-slate-700 font-medium",
      footerActionLink: "text-[#0055FF] font-semibold",
      footerActionText: "text-slate-500",
      dividerText: "text-slate-400",
      identityPreviewEditButton: "text-[#0055FF]",
      formFieldSuccessText: "text-emerald-600",
      alertText: "text-slate-700",
      logoBox: "flex justify-center",
      logoImage: "h-8 w-auto",
      socialButtonsBlockButton: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
      formButtonPrimary: "bg-[#0055FF] hover:bg-[#0044cc] text-white font-semibold",
      formFieldInput: "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-[#0055FF]/30",
      footerAction: "bg-slate-50 border-t border-slate-100",
      dividerLine: "bg-slate-200",
      alert: "border border-rose-200 bg-rose-50",
      otpCodeFieldInput: "border border-slate-200 bg-white text-slate-900",
      formFieldRow: "",
      main: "",
    },
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "welcome back",
            subtitle: "sign in to your feelzlike account",
          },
        },
        signUp: {
          start: {
            title: "create your account",
            subtitle: "free · no card needed",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <ConsentProvider>
            <AnalyticsBridge />
            <ScrollToTop />
            <AwinTag />
            <GoogleAnalyticsTag />
            <MetaPixelTag />
            {/* Soft member gate · wires account state + the free sign-up
                sheet into PremiumGate. Never prompts on page load. */}
            <SignUpProvider>
              {/* Member prefs (home region + units) · metric defaults for
                  anonymous visitors, account-backed for members. */}
              <UserPrefsProvider>
                <Router />
              </UserPrefsProvider>
            </SignUpProvider>
            <ConsentBanner />
            <InstallPrompt />
            <OfflineBanner />
            <PullToRefresh />
          </ConsentProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </AppErrorBoundary>
  );
}

export default App;
