---
name: Dependency upgrade compatibility
description: Generator detection and override pitfalls during security updates.
---

Do not trust manifest ranges alone when auditing installed versions, and keep
security overrides in the workspace configuration rather than competing root
package.json rules.

**Why:** a global workspace esbuild pin continued forcing the vulnerable version
even after its direct manifest was upgraded. Earlier root overrides appeared
protective but were not reflected in the installed graph.

**How to apply:** inspect the entire override block, regenerate the lockfile,
check the installed graph, and confirm a frozen install.

Exercise generation as well as compilation when updating Orval in this
catalog-based monorepo. Keep the chosen React Query/Zod targets explicit.

**Why:** catalog version detection selected React Query 4 and Zod 4 despite the
project using Query 5 and Zod 3; generated barrel exports also collided with
the manually maintained Zod entry point.

**How to apply:** generate into a scratch copy containing the real package
entry points and type-check both libraries, not just the generator's exit code.

For narrow contract fixes, separate generator migrations from the requested change.
**Why:** existing checked-in clients may use an older query/request-options shape;
regeneration can silently rewrite thousands of unrelated lines while still compiling.
**How to apply:** inspect the generated diff, preserve unrelated client behavior,
and ensure Orval resolves the workspace tsconfig when detecting customFetch arguments.