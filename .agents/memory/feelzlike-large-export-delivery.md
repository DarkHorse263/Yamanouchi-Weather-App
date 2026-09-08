---
name: feelzlike large export delivery
description: Reliable delivery of owner-only generated archives that exceed the asset-library upload ceiling.
---

Asset-library cards reject files over 100 MB. For a large owner-only export, expose a regular file through `artifacts/feelzlike/public/downloads` and use the root URL `/downloads/<filename>`.

**Why:** A symlink from the public directory to an export outside that tree returned the SPA HTML fallback instead of the archive. A regular file (or same-filesystem hard link during a live workspace session) was served correctly as `application/zip`. The artifact preview prefix `/feelzlike` also returned the SPA; the static public route was mounted at root.

**How to apply:** Verify the public URL with a HEAD request for the expected content type and byte length, then range-read the first four bytes and require the ZIP signature `50 4b 03 04`. Treat the public copy as temporary owner-delivery material rather than an in-app download.