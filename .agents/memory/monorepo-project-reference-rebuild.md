---
name: monorepo project-reference rebuild
description: why tsc reports "no exported member" after codegen/schema edits even though the dev server works, and how to fix it
---

# Symptom

After adding an export to a `lib/*` package (new Drizzle table in `lib/db`, new
orval-generated hook in `lib/api-client-react`, new zod in `lib/api-zod`), a
consuming package's `tsc --noEmit` fails with `TS2305: Module '@workspace/X' has
no exported member 'Y'` — but the running dev server (tsx / vite) resolves the
symbol fine.

Related variant: when `lib/api-spec/openapi.yaml` gains new enum values (e.g. new
region ids), the orval-generated client (`lib/api-client-react/src/generated`) can
be STALE — consumers then fail with "X does not exist in type Record<RegionId,...>".
Fix: `pnpm run codegen` in `lib/api-spec`, then `tsc -b` in `lib/api-client-react`.
Also: the dev api-server workflow keeps serving pre-merge code after a task merge —
restart it before trusting 404s from new endpoints/ids.

# Cause

Packages here are TypeScript **project references** (`composite: true`,
`emitDeclarationOnly`, `outDir: dist`). `tsc` resolves `@workspace/*` imports to
the package's **built `dist/*.d.ts`**, not its source. The dev runtime (tsx,
vite) reads source directly, so it sees new exports immediately; `tsc` keeps
seeing the stale declarations until they are rebuilt.

# Fix

Rebuild the changed library's declarations before type-checking consumers:

```
pnpm exec tsc -b lib/db lib/api-zod lib/api-client-react
```

**Why:** dev-server success does NOT mean the build/CI passes. Always rebuild the
edited `lib/*` decls after codegen or schema changes, then re-run the consumer's
`tsc --noEmit`.

**How to apply:** any time you edit a `lib/*` package's public surface and then a
downstream `artifacts/*` or `lib/*` package fails `tsc` with "no exported member",
rebuild refs first instead of hunting for a phantom missing export.
