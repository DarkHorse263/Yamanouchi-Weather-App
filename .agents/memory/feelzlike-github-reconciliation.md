---
name: feelzlike GitHub reconciliation
description: Safely reconciling a lagging GitHub main with the newer Replit main when connector and CLI authentication differ.
---

Treat the current Replit main tree as authoritative when GitHub main and stale pull-request branches are far behind. If their semantic work is already present, record branch ancestry without replaying obsolete files.

**Why:** The GitHub connector can manage pull requests through the API, but it does not authenticate command-line `git push` in this Repl. Fetch succeeds while push fails authentication, and the API cannot upload missing local commit objects.

**How to apply:** Verify semantic equivalence first, preserve the current tree while reconciling ancestry, and finish with Replit's authenticated Git Push action. Never force-push or merge stale file trees merely to change pull-request status.