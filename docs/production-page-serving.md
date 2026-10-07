# Production page serving

The web artifact runs a dedicated Node page server. The API remains on its
existing `/api` service; no API handlers, authentication settings, database
schema, or scheduled jobs were moved.

The owner approved this topology change. Static edge serving previously
bypassed Express's headers and returned HTTP 200 for unknown SPA URLs.

## Guarantees and deliberate exceptions

- The page server adds `X-Content-Type-Options: nosniff`, a
  `strict-origin-when-cross-origin` referrer policy, and a permissions policy
  denying camera/microphone while retaining same-origin geolocation.
- CSP and frame restrictions are deliberately unchanged. They require a
  separate policy design for the app's embed use case, authentication and maps.
- Exact destination identities come from the shared SEO/catalogue registry.
  Unknown pages serve the app shell with HTTP 404 and `X-Robots-Tag: noindex`.
  Missing assets return a plain 404, never HTML masquerading as JavaScript.
- Known pages keep prerendered HTML. Trailing-slash and legacy redirects retain
  query parameters. Clerk callback paths retain the SPA shell, without caching.
- Hashed assets can be cached; HTML/service workers revalidate. Downloads and
  media support single byte ranges. Hidden paths, escaping symlinks and
  sourcemaps are not served.
- Development still uses Vite. A successful preview alone does not prove the
  production server's behavior.

## Checks

Run the production build and `pnpm --filter @workspace/feelzlike test:pageServer`.
Coverage and legacy-route tests assert against the page-route manifest instead
of the retired edge rewrite table.

After the owner publishes, verify the live homepage and a destination HTML
response carry all three headers, an invented path returns 404, a real asset
has the correct content type, `/api/healthz` still succeeds, and authentication
callback pages load. This local change is not a claim of live verification.

Do not reintroduce `serve = "static"` or the `/* -> /index.html` edge rewrite:
both would bypass the new protections.
