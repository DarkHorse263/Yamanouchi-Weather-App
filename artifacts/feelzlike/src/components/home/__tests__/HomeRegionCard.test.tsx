import { after, test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import helmetAsync from "react-helmet-async";
import { Router } from "wouter";
import react from "@vitejs/plugin-react";
import { createServer, type Plugin } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const { HelmetProvider } = helmetAsync;

const clerkStub: Plugin = {
  name: "clerk-test-stub",
  enforce: "pre",
  resolveId(id) {
    return id === "@clerk/react" ? "\0clerk-test-stub" : null;
  },
  load(id) {
    if (id !== "\0clerk-test-stub") return null;
    return `
      export const useAuth = () => ({ isSignedIn: true });
      export const useUser = () => ({ user: null, isLoaded: true });
      export const useClerk = () => ({ signOut: async () => {} });
    `;
  },
};

const vite = await createServer({
  root,
  configFile: false,
  appType: "custom",
  logLevel: "silent",
  plugins: [clerkStub, react()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@assets": path.resolve(root, "../..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  ssr: { noExternal: ["@clerk/react"] },
  server: { middlewareMode: true },
});

after(() => vite.close());

const [{ default: Welcome }, { AuthAccountProvider }, { UserPrefsProvider }] =
  await Promise.all([
    vite.ssrLoadModule("/src/pages/Welcome.tsx"),
    vite.ssrLoadModule("/src/components/auth/AuthAccountContext.tsx"),
    vite.ssrLoadModule("/src/components/auth/UserPrefsProvider.tsx"),
  ]);

const SAVED_REGION_ID = "snowy-mountains";

function renderWelcome({
  isAuthenticated,
  homeRegionId,
}: {
  isAuthenticated: boolean;
  homeRegionId: string | null;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["account"], {
    ok: true,
    email: "member@example.test",
    profile: { homeRegionId, units: "metric", displayName: null },
    subscription: null,
  });
  queryClient.setQueryData(["regions"], {
    regions: [
      {
        id: SAVED_REGION_ID,
        name: "Snowy Mountains",
        href: `/${SAVED_REGION_ID}/`,
        status: "live",
        headline: { feelsLikeC: -4, tempC: -1 },
      },
    ],
  });

  return renderToStaticMarkup(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath="/">
          <AuthAccountProvider
            value={{
              isAuthenticated,
              isLoading: false,
              email: isAuthenticated ? "member@example.test" : null,
              promptSignUp: () => {},
              refresh: () => {},
            }}
          >
            <UserPrefsProvider>
              <Welcome />
            </UserPrefsProvider>
          </AuthAccountProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

test("signed-in member sees the saved region before generic home actions", () => {
  const html = renderWelcome({ isAuthenticated: true, homeRegionId: SAVED_REGION_ID });

  assert.match(html, /your home region/);
  assert.match(html, /snowy mountains/);
  assert.ok(html.indexOf("your home region") < html.indexOf("browse and compare"));
});

test("saved-region card links to the saved region", () => {
  const html = renderWelcome({ isAuthenticated: true, homeRegionId: SAVED_REGION_ID });
  assert.match(html, /href="\/snowy-mountains\/"/);
});

test("anonymous visitors do not see the saved-region card", () => {
  const html = renderWelcome({ isAuthenticated: false, homeRegionId: SAVED_REGION_ID });
  assert.doesNotMatch(html, /your home region/);
});

test("signed-in members without a saved region do not see the card", () => {
  const html = renderWelcome({ isAuthenticated: true, homeRegionId: null });
  assert.doesNotMatch(html, /your home region/);
});