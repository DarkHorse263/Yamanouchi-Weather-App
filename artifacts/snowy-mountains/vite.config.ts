import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
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
                ? `snowy-mountains@${process.env.SENTRY_RELEASE}`
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
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      // Replit's outer proxy preserves the artifact base path on the way in,
      // so requests arrive as `/snowy-mountains/api/...`. Strip the prefix
      // before forwarding so the api-server matches its own `/api/*` routes.
      [`${basePath}api`]: {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(new RegExp(`^${basePath}`), "/"),
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
