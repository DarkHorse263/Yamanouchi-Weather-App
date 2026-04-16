import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { SeasonProvider } from "@/hooks/use-season";
import { Layout } from "@/components/layout";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Resorts from "@/pages/resorts";
import MapView from "@/pages/map";

import Alerts from "@/pages/alerts";
import Guide from "@/pages/guide";
import Cams from "@/pages/cams";
import Transport from "@/pages/transport";
import Stay from "@/pages/stay";
import Eat from "@/pages/eat";
import Explore from "@/pages/explore";
import Activities from "@/pages/activities";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as any)?.name === "AbortError") return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  const [location] = useLocation();

  if (location === "/welcome") {
    return <Landing />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/resorts" component={Resorts} />
        <Route path="/map" component={MapView} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/guide" component={Guide} />
        <Route path="/cams" component={Cams} />
        <Route path="/transport" component={Transport} />
        <Route path="/stay" component={Stay} />
        <Route path="/eat" component={Eat} />
        <Route path="/explore" component={Explore} />
        <Route path="/activities" component={Activities} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SeasonProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </SeasonProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
