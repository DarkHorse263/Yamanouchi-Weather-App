---
name: feelzlike publish snapshot mid-edit hazard
description: A publish clicked while agent edits are in flight can bake a broken half-saved bundle; how the blank-site failure looks and how to diagnose
---

# Publish can snapshot mid-edit state

**Rule:** A deploy started while multi-step edits are being applied can build from a half-saved codebase even though the final code typechecks. Result: prod-only runtime crash (blank white page) while dev + a fresh local build are fine.

**Why:** July 2026 incident — user hit Publish minutes after a data-file edit sequence; the built bundle contained a bare `snowballLogo` identifier without its import, crashing the whole SPA at module eval. Server/API healthchecks all passed; only the client was dead.

**How to apply:**
- "Site won't load but healthz + assets are 200" → suspect a client bundle crash, not the platform. Diagnose with puppeteer-core (installed) + nix chromium (`--no-sandbox`), capture `pageerror` on the prod URL; compare `grep <identifier>` counts between the prod bundle and a fresh local `dist` build.
- Fix is usually just re-publish from the current (verified) code.
- Background servers from ShellExec die between calls — run a throwaway `python3 -m http.server` and the puppeteer check in the SAME command.
- After telling the user to publish, avoid immediately continuing edits in the same files; batch and finish first.
