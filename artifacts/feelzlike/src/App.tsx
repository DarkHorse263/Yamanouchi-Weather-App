import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import RegionPicker from "@/pages/RegionPicker";
import NotFound from "@/pages/not-found";
import { RegionLayout } from "@/layouts/RegionLayout";
import { ConsentProvider } from "@/lib/consent";
import { ConsentBanner } from "@/components/ConsentBanner";
import { SentryTestButton } from "@/components/SentryTestButton";
import AlertsVerify from "@/pages/alerts/Verify";
import AlertsManage from "@/pages/alerts/Manage";
import AlertsUnsubscribed from "@/pages/alerts/Unsubscribed";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={RegionPicker} />
      {/* Top-level alert pages — must come BEFORE the /:region catch-all so
          tokenised email links don't get parsed as a region. */}
      <Route path="/alerts/verify" component={AlertsVerify} />
      <Route path="/alerts/manage" component={AlertsManage} />
      <Route path="/alerts/unsubscribed" component={AlertsUnsubscribed} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConsentProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <ConsentBanner />
          <SentryTestButton />
        </ConsentProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
