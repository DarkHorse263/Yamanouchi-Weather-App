// Sentry must initialise before React is touched - see ./instrument.ts.
import "./instrument";
import { createRoot } from "react-dom/client";
import { reactErrorHandler } from "@sentry/react";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import dinProUrl from "@assets/DINPro_1777358240556.ttf";
import dinProBoldUrl from "@assets/DINPro-Bold_1777358240555.ttf";

[
  { weight: "400", url: dinProUrl },
  { weight: "700", url: dinProBoldUrl },
].forEach(({ weight, url }) => {
  const ff = new FontFace("DIN Pro", `url(${url})`, {
    weight,
    style: "normal",
    display: "swap",
  });
  ff.load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => {});
});

createRoot(document.getElementById("root")!, {
  // React 19 surfaces these three callbacks; Sentry handler captures errors
  // from each so we don't lose any caught/uncaught/recoverable failures.
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  // HelmetProvider lets <PageMeta /> set <title>, description, canonical,
  // OG tags and JSON-LD per page. See ./lib/seo/PageMeta.tsx.
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);

// Register the PWA service worker after React mounts. No-op in dev (SW
// would fight HMR and serve stale chunks). See ./lib/registerSW.ts.
registerServiceWorker();
