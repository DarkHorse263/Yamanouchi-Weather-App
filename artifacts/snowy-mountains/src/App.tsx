import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/Dashboard";
import LocationDetail from "@/pages/LocationDetail";
import BusServices from "@/pages/BusServices";
import Webcams from "@/pages/Webcams";
import RoadConditions from "@/pages/RoadConditions";
import LiftStatus from "@/pages/LiftStatus";
import Radar from "@/pages/Radar";
import NotFound from "@/pages/not-found";

// Create a robust QueryClient with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/location/:id" component={LocationDetail} />
      <Route path="/bus-services" component={BusServices} />
      <Route path="/webcams" component={Webcams} />
      <Route path="/road-conditions" component={RoadConditions} />
      <Route path="/lift-status" component={LiftStatus} />
      <Route path="/radar" component={Radar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
