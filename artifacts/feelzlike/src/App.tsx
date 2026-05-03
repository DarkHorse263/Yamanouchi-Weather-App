import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import RegionPicker from "@/pages/RegionPicker";
import NotFound from "@/pages/not-found";
import { RegionLayout } from "@/layouts/RegionLayout";
import { ConsentProvider } from "@/lib/consent";
import { ConsentBanner } from "@/components/ConsentBanner";
import { SentryTestButton } from "@/components/SentryTestButton";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={RegionPicker} />
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
