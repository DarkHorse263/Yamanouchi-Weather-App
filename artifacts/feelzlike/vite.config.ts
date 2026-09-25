import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// PORT + BASE_PATH are only required for the dev/preview server. `vite
// build` produces static assets and shouldn't fail just because these
// runtime env vars aren't set (the deployment build container doesn't
// allocate a PORT until the server actually runs). We therefore only
// enforce them when serving, and fall back to safe placeholders during
// `vite build`.
const isBuild = process.argv.includes("build");

const rawPort = process.env.PORT;

if (!isBuild && !rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = rawPort ? Number(rawPort) : 5173;

if (!isBuild && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

if (!isBuild && !process.env.BASE_PATH) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  // Dynamic import.meta.env reads in the affiliate/analytics clients cause
  // Vite to embed *every* exposed VITE_ variable in the browser bundle.
  // The existing OWM provider credential still has a VITE_ name but belongs
  // only to api-server; publish only these explicitly client-facing values.
  envPrefix: [
    "VITE_CLERK_PUBLISHABLE_KEY",
    "VITE_CLERK_PROXY_URL",
    "VITE_SENTRY_DSN",
    "VITE_VAPID_PUBLIC_KEY",
    "VITE_API_BASE_URL",
    "VITE_MAPBOX_TOKEN",
    "VITE_PUBLIC_ORIGIN",
    "VITE_GA_MEASUREMENT_ID",
    "VITE_AWIN_PUBLISHER_ID",
    "VITE_CJ_PUBLISHER_ID",
    "VITE_META_PIXEL_ID",
    "VITE_BOOKING_AFFILIATE_ID",
    "VITE_AGODA_AFFILIATE_ID",
    "VITE_EXPEDIA_AFFILIATE_ID",
    "VITE_HOTELS_AFFILIATE_ID",
    "VITE_TRIP_AFFILIATE_ID",
    "VITE_AIRBNB_AFFILIATE_ID",
    "VITE_JALAN_AFFILIATE_ID",
    "VITE_RAKUTEN_AFFILIATE_ID",
    "VITE_TRIPADVISOR_AFFILIATE_ID",
  ],
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
    // Sentry plugin must come AFTER all other plugins so it sees the final
    // bundle output. Only active during production builds when the auth token
    // is provided — dev builds and PRs without the token simply skip upload.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: "navigate-work-digital",
            project: "javascript-react",
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              filesToDeleteAfterUpload: ["**/*.map"],
            },
            release: {
              name: process.env.SENTRY_RELEASE
                ? `feelzlike@${process.env.SENTRY_RELEASE}`
                : undefined,
              setCommits: { auto: true, ignoreMissing: true },
            },
            telemetry: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // "hidden" emits .map files (so the Sentry plugin can upload them) but
    // omits the //# sourceMappingURL comment from the shipped JS — clients
    // don't fetch maps, only Sentry uses them for symbolication.
    sourcemap: "hidden",
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
