---
name: dev to prod DB schema sync
description: How Drizzle schema changes reach the production DB in this repo, and the forbidden shortcuts that look tempting but break things.
---

# Dev -> prod database schema sync

The `.replit` `[deployment]` build only builds the frontend + api-server bundle and runs `node dist/index.cjs`. It does NOT (and must NOT) run `drizzle push`/`push-force`. So a new column added in dev is not pushed to prod by the deploy build itself.

**The supported path is Replit's Publish flow**, which auto-diffs the dev schema against production and applies it at publish time (it surfaces renames/destructive alters for user confirmation in the Publish UI). There are exactly two automatic application points: task-merge -> dev DB (post-merge setup), and Publish -> prod DB.

**So when you add/change a Drizzle column:**
1. Edit the schema source of truth (`lib/db/src/schema/*`).
2. Apply to the DEV DB only (`pnpm --filter @workspace/db push`), rebuild lib decls (`tsc -b lib/db`), verify the feature in dev.
3. Tell the user to **re-publish** — that is what syncs the column to prod.

**Never** (per the database skill): run DDL on prod, `executeSql({environment:"production"})` DDL (prod is read-only), write a migrate-prod script, add `migrations/*.sql` for Drizzle, or add db:push / startup-time `ALTER TABLE`/`CREATE TABLE IF NOT EXISTS` to the deploy build or app entrypoint. If prod is "missing a column", the answer is always: re-publish.
