# Resend delivery webhook setup

The API accepts signed Resend delivery events at:

`https://feelzlike.com/api/webhooks/resend`

This endpoint covers email sent directly by the API, including powder-alert
verification and alert messages. Authentication email is sent by Clerk, not
Resend. Clerk records `bounce`, `spam_report`, and `dropped` authentication
events in its production **Email Logs** and automatically suppresses repeat
authentication sends to affected addresses. Use the Clerk dashboard's
Development/Production environment switcher and check **Email Logs** when a
visitor reports that a sign-in or sign-up message never arrived.

To investigate an authentication email:

1. Open this Repl's **Auth** pane, then open its managed Clerk dashboard.
2. Switch to **Production** for incidents reported on the published site.
3. Open **Email Logs** and filter by the visitor's address.
4. Inspect `bounce`, `spam_report`, or `dropped` entries and their provider
   reason. Clerk automatically suppresses repeat sends after a qualifying
   bounce or complaint.
5. Remove an address from Clerk's suppression list only after confirming the
   mailbox exists, the address is correct, and the visitor expects the email.

No Resend webhook can receive Clerk authentication delivery events because
Clerk, not this API's Resend account, is the sender.

To enable bounce and complaint tracking:

1. Apply the current `@workspace/db` schema to the production database so the
   `email_delivery_incidents` table exists.
2. In the Resend dashboard, open **Webhooks** and create an endpoint using the URL above.
3. Subscribe it to **email.bounced** and **email.complained**.
4. Copy the endpoint signing secret, including its `whsec_` prefix.
5. Add it to the API Server's production secrets as `RESEND_WEBHOOK_SECRET`.
6. Republish the API Server.
7. Use Resend's webhook test action and confirm the endpoint returns HTTP 200. A real bounce or complaint will then appear in the email delivery incidents data and future sends to that address will be suppressed.

The endpoint returns HTTP 503 when the signing secret is absent and HTTP 401
for invalid or expired signatures. Never paste the signing secret into source
code or logs.