import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import Resorts from "@/pages/resorts";
import MapView from "@/pages/map";
import Outlook from "@/pages/outlook";
import Alerts from "@/pages/alerts";
import Stay from "@/pages/stay";
import Eat from "@/pages/eat";
import Explore from "@/pages/explore";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry on abort errors — they're intentional cancellations
        if ((error as any)?.name === "AbortError") return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/resorts" component={Resorts} />
      <Route path="/map" component={MapView} />
      <Route path="/outlook" component={Outlook} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/stay" component={Stay} />
      <Route path="/eat" component={Eat} />
      <Route path="/explore" component={Explore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
