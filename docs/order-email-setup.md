# Gmail order email setup

## Architecture and pending database review

The website is React/Vite with Vercel API routes. Checkout calls `/api/place-order`,
which calls the existing Supabase `place_order` RPC using the server service-role key.
Gmail SMTP through Nodemailer replaces Resend; no domain purchase or DNS changes are needed.
The customer/admin HTML and plain-text templates, stored order prices and checkout UI
are unchanged.

**Do not apply the migration yet.** Its live `place_order` and trigger compatibility
review is still pending. Nothing has been applied to Supabase. The existing local
queue migration remains at `supabase/migrations/202611060001_order_notifications.sql`;
only its retry comment and provider name in an error message were updated for this SMTP switch. It still
includes permission revocations and a deferred trigger; those require the outstanding
review before deployment. A database trigger error can roll back order creation,
although an email/SMTP failure after order commit cannot.

The queue's table, unique `(order_id, kind)` constraint, row leases, access controls,
and exponential backoff are preserved. No additional database columns or functions
are needed for Gmail. The existing `resend_id` column is deliberately retained to
avoid a schema change; new SMTP sends store their Message-ID there.

## Create a Gmail App Password

1. Sign in to **storefromlondon@gmail.com** in your Google Account.
2. Open [Google Account Security](https://myaccount.google.com/security) and turn on
   **2-Step Verification**.
3. Open [App Passwords](https://myaccount.google.com/apppasswords). Create one named
   `From London Vercel` and copy the generated 16-character password.
4. Add it directly to Vercel as `GMAIL_APP_PASSWORD`. Do not use your regular Gmail
   password, commit it, put it in a `VITE_` variable, or send it in chat.

If App Passwords is unavailable, check Google's account restrictions: security-key-only
2-Step Verification, Advanced Protection, and some managed accounts can hide it.
Changing your Google account password revokes existing App Passwords; generate a new
one and update Vercel if that happens.

References: [Google App Password instructions](https://support.google.com/accounts/answer/185833),
[Nodemailer Gmail guide](https://nodemailer.com/guides/using-gmail).

## Vercel environment variables

In **Project → Settings → Environment Variables**, configure:

| Variable | Value |
| --- | --- |
| `GMAIL_USER` | `storefromlondon@gmail.com` |
| `GMAIL_APP_PASSWORD` | Generated Gmail App Password (spaces are stripped server-side) |
| `EMAIL_FROM` | `From London <storefromlondon@gmail.com>` |
| `ORDER_NOTIFICATION_EMAIL` | `storefromlondon@gmail.com` |
| `CRON_SECRET` | Existing long random retry-endpoint secret, at least 32 characters |
| `SUPABASE_URL` | Existing Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only Supabase service-role key |

Use the authenticated Gmail address for the sender; Gmail may rewrite unapproved sender
addresses. The admin email goes to the same Gmail mailbox. These addresses are
configuration examples only; the executable code does not hardcode the mailbox.
Remove the unused `RESEND_API_KEY`. The old `OWNER_ORDER_EMAIL`/`ORDER_FROM_EMAIL`
variables are also unused.

Keep the storefront's existing `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and
`VITE_USE_SUPABASE=true`. Never prefix Gmail credentials, cron secrets, or service-role
keys with `VITE_`. Use a separate database and controlled recipients for preview tests.
Redeploy after environment changes, once database compatibility is approved.

SMTP uses `smtp.gmail.com:465` with TLS certificate verification enabled, bounded
connection/socket timeouts and no connection pool. The handlers run in Vercel's Node
runtime, not Edge. Keep the Vite build preset and `dist` output directory. Nodemailer
is imported only by the server helper and does not enter the browser bundle.

## Retries and duplicate protection

The protected `/api/order-notifications` GET endpoint and five-minute Vercel Cron
schedule remain unchanged. Each request claims at most two jobs; each SMTP submission
has an 18-second overall application timeout. Jobs that have not started SMTP can be
recovered through their existing five-minute leases. Retries use exponential backoff,
capped at one hour, and the existing 20-hour maximum automatic retry window remains.

The five-minute Vercel Cron schedule requires Pro/Enterprise. On Hobby, remove the
`crons` entry before deployment and use an external scheduler every five minutes:

```text
GET https://your-deployment/api/order-notifications
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron supplies that header automatically when `CRON_SECRET` is configured.
Preview deployments need manual/scheduled calls; Vercel Cron runs in production.
See [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and
[plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

**SMTP has no provider idempotency key or guaranteed exactly-once delivery.** A stable
Message-ID is useful for tracing, but Gmail does not guarantee deduplication by it.
The worker therefore persists `review` immediately before SMTP submission. A successful
Gmail acceptance changes it to `sent`. Definite SMTP rejections and known failures before
submission return it to `pending` for automatic retries. Unknown submission outcomes,
post-acceptance database failures, or a process killed mid-send leave it in `review`.
The cron never automatically resends these records. A crash just before sending can
also leave an unsent record in review; this conservative hold prevents duplicates.

Successful customer/admin notifications are independent. Retrying a rejected admin
notification does not resend a successful customer notification. The exact message,
recipient and sender are persisted before sending; configuration changes do not
redirect previously prepared messages.

For a `review` job, check the Gmail **Sent** folder, Message-ID and function logs. If
accepted, reconcile the record to `sent`; do not resend it. Only after establishing
that it was not accepted may an authorized operator reset `status='pending'`,
`first_attempt_at=null`, `lease_until=null`, and `next_attempt_at=now()`. Preserve
the ID and message. Do not reset a job while its send/lease could still be active.
If delivery cannot be established, leave it held rather than risking a duplicate.

The queue contains customer details and email content. Restrict access, monitor
pending/review jobs, and retain deduplication records while retries remain possible.
Logs contain notification ID, kind and attempt number rather than credentials or
customer payloads. `sent` means SMTP acceptance, not confirmed inbox delivery.

Gmail has sending limits and can block suspicious logins; use this setup for modest
store volume and monitor the mailbox and queue. No domain verification is required.
See [Nodemailer's Gmail guidance](https://nodemailer.com/guides/using-gmail).

## Testing after database review and configuration

1. Review the live RPC and triggers and approve the pending queue migration separately.
   Apply it to staging only after compatibility is verified; this code change does not
   apply it. Without the queue migration, the queue functionality cannot operate.
2. Configure Gmail variables in a staging Vercel deployment. For local full-stack tests
   use `vercel dev`; `npm run dev` starts only the frontend.
3. Place a cash-on-delivery order using a customer inbox you control. Verify checkout
   succeeds, the bag clears, the saved order/items match, and exactly two queue records
   exist. Both should become `sent` with Message-IDs in `resend_id`.
4. Check the customer inbox and the store Gmail inbox (including Spam and All Mail).
   Verify order number, products, quantities, unit prices, total, shipping address and
   status. The admin email also includes contact details, notes and Cairo date/time.
   Delivery fees remain separate, matching checkout. Check Gmail Sent for both emails.
5. Invoke the protected retry endpoint several times. Sent jobs must remain untouched
   and no duplicate emails should arrive. Without authorization it must return 401.
6. In staging, temporarily configure an invalid App Password and place another order.
   The saved order must still succeed while failed SMTP authentication leaves jobs
   pending. Restore the correct password and redeploy; wait until `next_attempt_at`
   and run the worker to verify retries.
7. Test ambiguous sends and partial failures with `npm test`; do not deliberately
   interrupt real customer sends. Held jobs require the reconciliation described above.

```sql
-- Read-only queue monitoring after the migration has separately been approved/applied:
select id, order_id, kind, status, attempts, next_attempt_at,
       resend_id as smtp_message_id, last_error, sent_at
from public.order_notifications
order by created_at desc;
```

Online payments are not implemented; checkout is COD. Future non-COD orders are held
unless their saved payment status is verified as `paid`. Adding prepaid payments needs
a trusted provider webhook and an updated paid snapshot before confirmation.

## Files changed for the Gmail switch

- `api/_utils/order-notifications.js`: Nodemailer transport, SMTP acceptance checks,
  retry classification and persistent submission holds.
- `package.json`, `package-lock.json`: replace Resend with Nodemailer.
- `tests/order-notifications.test.js`: SMTP mocks, retries, TLS configuration and
  ambiguous-outcome duplicate protection.
- `supabase/migrations/202611060001_order_notifications.sql`: comment/error wording only; no schema,
  trigger or permission changes for this switch. Not applied.
- This guide replaces the former Resend/domain instructions.

The templates, checkout endpoint, retry endpoint, cron configuration and frontend
remain unchanged. No credentials were added to local environment files or Vercel,
and no real emails were sent as part of implementation.

Verification: all 11 notification tests passed, production build passed, changed-code
ESLint passed and `git diff --check` passed. Gmail authentication and inbox delivery
still require your App Password and a configured deployment.
