import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/error-boundary";

import GuestMenu from "@/pages/guest-menu";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isAbortError(error)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function GuestRedirect() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="max-w-sm">
        <h1 className="text-4xl font-black mb-2">
          <span className="text-akane">eigomenyu</span>
        </h1>
        <p className="text-lg font-jp text-sumi mb-1">英語メニュー</p>
        <p className="text-sm text-muted-foreground mb-8">
          Bilingual menus for Japan — scan a QR code at your restaurant table to get started.
        </p>
        <div className="space-y-3">
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/menu/yukimi-shokudo`}
            className="block w-full py-3 px-4 rounded-xl bg-akane text-white font-semibold text-sm hover:bg-akane/90 transition-colors text-center"
          >
            View Demo Menu
          </a>
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/login`}
            className="block w-full py-3 px-4 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors text-center"
          >
            Restaurant Owner Login
          </a>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GuestRedirect} />
      <Route path="/menu/:slug" component={GuestMenu} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/:slug">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
