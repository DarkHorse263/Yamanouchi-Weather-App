# Subscriber retention operations

The owner approved this policy in task #193 before implementation. It applies to
app-controlled powder-alert records, not the separate newsletter list or provider
backups. No historical consent is inferred.

| Record | Rule |
| --- | --- |
| Pending, never-verified signup | Delete after 30 days from creation |
| Active subscriber | Keep while subscribed |
| Unsubscribed profile and preferences | Delete after 90 days from unsubscribe |
| Recorded consent | Keep on active profile; on unsubscribe/account deletion retain existing evidence separately for two calendar years from the end date |
| Dispatch details | Delete after 90 days |
| Delivery incident details | Delete after one calendar year |
| Minimal suppression | Retain until authorized clearance |
| Account deletion recovery | See account-deletion-recovery.md; unresolved requests remain durable, completed identifiers are scrubbed after 30 days |

Profile deletion cascades push endpoints and dispatch records. Thus account
deletion removes those immediately even if younger than the normal limits.
Unverified expiry removes its signup evidence with the unverified row.
Active consent remains in the profile until subscription ends; unsubscribed
consent moves to the separate evidence table in the same transaction as expiry.
Existing NULL consent remains NULL/absent. An account deletion preserves only
already-recorded consent, never invented evidence.

## Deployment and activation

1. Apply the additive Drizzle schema through the normal managed development
   post-merge / production Publish process. There is no startup DDL or custom
   production migration. New tables are subscriber_suppressions,
   subscriber_consent_evidence and account_deletions.
2. Preserve the existing persistent ALERT_TOKEN_SECRET (at least 16 characters).
   Retention keys use HMAC-SHA256 with a separate `subscriber-retention:v1` domain.
   There is deliberately no ephemeral fallback. These identifiers are
   pseudonymous personal data, not anonymous data.
3. Run the read-only preview:
   `pnpm --filter @workspace/api-server exec tsx src/scripts/subscriber-retention.ts`.
   It accepts no arguments and prints aggregate counts only. Alternatively,
   authorized admins can GET /api/admin/retention/preview.
4. The owner approved production activation: after Publish deploys the schema
   and new application, NODE_ENV=production enables daily retention by default.
   RUN_SUBSCRIBER_RETENTION=0 explicitly pauses purges in production.
   Development is off by default; RUN_SUBSCRIBER_RETENTION=1 explicitly enables
   it. This task does not manually purge customer records or enable purges in
   development. Account deletion recovery runs independently of the purge flag.
   If schema deployment is incomplete, the transaction fails closed without a
   partial purge and the scheduler retries after the issue is corrected.

The scheduler runs recovery first, then retention at most once per successful UTC
day. A database session lock excludes concurrent replica sweeps; a transaction
lock serializes purges, account cleanup and public signup. Requests wake sleeping
replicas; an awake replica checks each minute. Failed/crashed daily runs retry;
job_runs records success/failure and aggregate counts for operator visibility.
No sleeping application can promise exact wall-clock removal.

All purge writes, evidence preservation and suppression preservation share one
transaction. Dry-run counts are estimates, not a deletion authorization or a
snapshot guaranteed to match a later run.

## Suppression review

An unsubscribed/account-deleted alert address cannot bypass suppression through
public signup after its profile has expired. Retained delivery suppression is
checked by the shared email sender, including non-alert transactional emails.
An unresolved latest delivery incident is preserved before its detail expires.
The existing incident resolution path clears its retained delivery block under
the same per-email lock.

For a minimal block whose incident detail has expired, an authorized admin may
POST /api/admin/retention/suppression/clear with
`{"email":"confirmed-address","scope":"delivery","confirm":true}`.
Use scope `alerts` for alert suppression. This route inherits the admin
allowlist, authenticated identity and pinned-origin guards. Obtain and verify the
recipient's request before clearance. The route logs admin ID, scope and result,
not the email. It does not subscribe anyone or send anything. It refuses to bypass
an existing detailed delivery incident: use the existing incident resolution
route, including explicit complaint confirmation, instead.

Never rotate ALERT_TOKEN_SECRET casually: rotation invalidates permanent alert
links AND changes retained identifiers. A coordinated key-version migration
preserving old-key lookup is required before rotation, otherwise retained
suppression could be bypassed. Protect the key and backups accordingly.

## Provider boundaries

Owner/project review identified Resend's published standard-plan email/log
retention as 30 days and backup retention as 7 days; enterprise terms can differ:
https://resend.com/security/gdpr . The actual account plan/settings are unverified.
Clerk's DPA section 9 describes deletion within 90 days after contract termination:
https://clerk.com/legal/dpa . This is not an individual user-deletion SLA.
Neither statement establishes when all provider-held copies for an individual
are removed. Confirm applicable plans, suppression handling, backup restoration
and individual deletion arrangements with both providers. No worldwide legal
compliance claim is made.

## Tests

`pnpm --filter @workspace/api-server exec tsx --test src/lib/__tests__/subscriberRetention.test.ts`
uses isolated in-memory transaction fixtures (no customer DB writes) to check
key stability/domain separation/fail-closed configuration, real consent-only
preservation, two-year expiry and read-only dry runs.

`RETENTION_PG_TEST=1 pnpm --filter @workspace/api-server exec tsx --test src/lib/__tests__/subscriberRetention.postgres.test.ts`
runs production retention/signup helpers against a unique disposable PostgreSQL
schema in development. Both connections use only that schema and pg_catalog
(never public); fixture DDL derives from Drizzle definitions, not customer
tables. Tests cover exact 30/90-day and calendar-year boundaries, actual consent
preservation without fabrication, incident suppression, transaction rollback
after an injected database failure, and signup waiting for committed account
cleanup then refusing the retained block. The schema is dropped in finally.
The suite refuses NODE_ENV=production and is skipped without explicit opt-in.