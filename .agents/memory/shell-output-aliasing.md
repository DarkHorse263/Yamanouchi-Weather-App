---
name: shell output token aliasing
description: This environment's bash/rg/cat output silently rewrites some identifiers; trust the read tool instead.
---

# shell output token aliasing

In this Replit environment, output from `bash` tools (rg, cat, grep, head) is
passed through a redaction/aliasing layer that silently rewrites certain
identifier tokens to short placeholders. Observed: `NAV`→`ln`, `Explore`→`ln`,
`RegionStub`→`n`, `getProvidersForRegion`→`l`/`ln`. The rewrite is consistent
within a run but makes grep results misleading and un-greppable.

**Why it matters:** you can misread code structure or conclude a symbol doesn't
exist when it does. It cost real confusion when auditing nav/router code.

**How to apply:** use `rg`/`bash` only to LOCATE files and count matches; for the
actual content of any file, read it with the `read` tool, which returns clean,
untransformed text. Never quote exact identifiers from bash output as ground truth.
