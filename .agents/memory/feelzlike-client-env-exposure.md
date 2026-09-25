---
name: Client environment exposure
description: Dynamic Vite environment reads can expose unused prefixed secrets.
---
Do not infer that a VITE-prefixed provider secret is safe merely because no frontend module names it.

**Why:** Dynamic `import.meta.env` reads caused Vite to include the whole allowed environment object, including a weather key used only by the server. Removing a direct frontend reference was not sufficient.

**How to apply:** Keep the client environment prefix allowlist limited to intentionally public values. Verify rebuilt assets for secret presence using boolean-only checks, never print values. Previously published copies remain compromised and require provider-side rotation; rebuilding cannot revoke them.