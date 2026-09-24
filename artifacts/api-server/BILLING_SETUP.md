# Regional Stripe subscription setup

Purchases remain off unless `BILLING_PURCHASES_ENABLED=true` and all existing readiness checks pass. Creating these prices does not enable billing.

Create six separate recurring Stripe Prices for the same premium product, then configure their IDs:

| Environment key | Currency | Amount | Interval | Stripe tax behavior |
|---|---:|---:|---|---|
| `STRIPE_AUD_MONTHLY_PRICE_ID` | AUD | 5.99 | month | inclusive |
| `STRIPE_AUD_ANNUAL_PRICE_ID` | AUD | 60.00 | year | inclusive |
| `STRIPE_USD_MONTHLY_PRICE_ID` | USD | 5.99 | month | exclusive |
| `STRIPE_USD_ANNUAL_PRICE_ID` | USD | 60.00 | year | exclusive |
| `STRIPE_EUR_MONTHLY_PRICE_ID` | EUR | 5.99 | month | inclusive |
| `STRIPE_EUR_ANNUAL_PRICE_ID` | EUR | 60.00 | year | inclusive |

Each Price must be active, licensed, recurring once per stated interval, and match `STRIPE_MODE`. All six IDs must be distinct. Automatic Stripe Tax must be active: AUD and EUR displayed totals include applicable indirect tax; applicable US tax is added and shown by Stripe Checkout before payment.

The customer explicitly chooses the ISO billing country before Checkout. US selects USD; eurozone countries select EUR; Australia and every other country use AUD. The choice is stored in server-created subscription metadata and determines the subscription currency. Checkout separately collects the actual billing address for Stripe Tax. Address differences do not withhold paid service or later revoke access, and an existing subscription keeps its original currency after a customer moves. Signed webhook fulfillment still requires the owned customer, configured Price ID, matching mode, and internally consistent server-created country/currency metadata.

`STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` are optional legacy AUD, tax-exclusive Price IDs used only to preserve existing subscription access. Do not reuse either legacy ID for a new regional Price. Existing subscriptions are not migrated automatically.

Do not set `BILLING_PURCHASES_ENABLED=true` until the six test/live Prices, automatic tax, webhook delivery, checkout totals, refunds, customer support path, and legal display requirements have been verified in the matching Stripe mode. This repository does not create or claim that any Stripe Price exists.