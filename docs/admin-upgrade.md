# Admin workspace upgrade

## Scope

This upgrade uses the existing React/Vite application, Supabase database, Vercel Edge
admin APIs, and Supabase Auth owner check. No production records or database structures
were changed, and no migration is required for the implemented pages. The existing
notification migration remains separate and unapplied by this work.

Implementation phases are delivered together:

1. Shared branded sidebar, responsive shell, sign-in, loading/error/empty states,
   accessible dialogs, confirmation prompts, and paginated tables.
2. Dashboard, products/editor, and orders.
3. Inventory, order-derived customers, and settings.

The product columns were inspected read-only against live Supabase: `id`, `name`,
`gender`, `price`, `images`, `sizes`, `description`, `in_stock`, `stock_by_size`,
`created_at`, `sku`, `display_order`, `oldPrice`. Orders/items use the previously
confirmed schema. No new category/archive/customer/settings table was assumed.

## Features and definitions

- Dashboard: 7/30/90-day metrics, daily order-value bar chart with accessible data
  values, all-time fulfilment pipeline, recent orders and low-stock alerts. Cairo
  calendar dates are used, including daylight-saving changes.
- Order value sums saved `orders.total` for non-cancelled orders placed in the period.
  Delivered value includes only delivered orders placed in the period; it is not an
  independently verified payment or accounting revenue figure. No statistics are mocked
  in application code. Numeric database strings are converted before addition.
- API list reads explicitly page through Supabase results so the default row limit
  does not silently truncate totals. Client tables show 20 records per page. This is
  suitable for the current store; very large catalogues/order histories should move
  to server-side aggregation and filtered pagination in a later phase.
- Products: search by name/SKU/ID, category/stock filters, sorting, bulk price updates,
  guarded deletion, pricing, SKU/display order, per-size inventory and image uploads,
  removal and cover selection. Bulk operations report partial failures and retain
  failed selections. Product-list stock filters use total units; inventory/dashboard
  alerts inspect individual sizes.
- Order details: saved unit prices and quantities, customer contact/address, notes,
  payment information, print layout, date/search/status filters and confirmed status
  changes. UI Placed maps to stored `pending`; Processing maps to `confirmed`.
  Historical status values are not rewritten. Changing status updates only status:
  no stock restoration, refund, checkout modification or confirmation-email resend.
- Inventory: size-level alerts and quick quantity changes. Product saves compare the
  original `stock_by_size` JSONB with the database in the UPDATE statement. If checkout
  or another admin changed it, the save returns 409 instead of overwriting stock.
  Refresh/reopen the editor to review current stock before resubmitting. `sizes` and
  legacy `in_stock` are derived from the saved size map for compatibility.
- Customers: grouped by normalized email, falling back to normalized phone, then
  order ID when contact details are absent. Histories retain cancelled orders but
  exclude their totals from order value. This is an operational history, not a unique
  customer identity system; shared/changed contact details can merge/split histories.
- Settings: safe credential-configuration presence flags and store information,
  plus a browser-local low-stock threshold. It does not expose secret values or
  modify storefront pricing, payment, shipping or global configuration.

## Security and preservation

All admin reads/writes use JWT validation and the existing authorized owner email
on the server. Missing/invalid sessions return 401; valid non-owner sessions return
403. Client route checks are supplementary. Responses use `Cache-Control: no-store`.
Product updates allowlist fields, validate quantities/prices/URLs, and ignore client
attempts to set IDs/timestamps. Order writes allowlist statuses and compare original
status where supplied.

Images are uploaded through the authenticated server API into the existing
`product-images` bucket. MIME type, file signature and a 2 MB limit are checked.
Removing an image removes the product reference; storage objects are retained to avoid
breaking historical links. Storage bucket policies themselves were not changed.

Products referenced by existing order items are rejected for deletion. Existing
foreign-key constraints remain the final protection against a new order racing a
delete; production deletion should only be used with non-cascading/restrictive
`order_items.product_id` foreign keys. No foreign key was modified automatically.
Do not approve destructive/cascading product deletions if your live FK uses CASCADE.

Checkout, `place_order`, stock decrement logic, order-item prices and Gmail notification
code are untouched. The admin upgrade does not apply the pending email queue migration
or resolve a missing notification table; that remains a separate manual deployment step.

## Validation

- `npm test`: server authorization, validation, pagination beyond database caps,
  historical-order guards, concurrent stock conflicts, customer grouping, Cairo-date
  metrics, plus existing checkout/email regression tests.
- `npm run test:admin`: Playwright browser tests, desktop and 390px mobile. Uses a local
  Vite server and mocked auth/admin responses; never calls production. Requires installed
  Google Chrome (the configured browser channel). Covers chart periods, table filtering,
  product fields, confirmations, stock payloads, customer history and preferences.
- `npm run build`: production bundle.

Before deployment, use an isolated staging project/account to test real image upload,
product creation/editing, stock conflict after a checkout, order-status constraints,
printing, and owner/non-owner authorization. Mocked tests cannot prove live bucket
policies, foreign-key deletion actions, or constraint configuration. No live mutation
or real email was performed during implementation.

Main files: `src/layout/AdminLayout.jsx`, `src/layout/admin.css`,
`src/components/admin/AdminUI.jsx`, `src/hooks/useAdminData.js`, `src/utils/admin.js`,
all admin page modules, `src/services/adminService.js`, `src/App.jsx`,
`api/admin/{products,orders,settings}.js`, `api/_utils/{auth,admin}.js`, and test tooling.

Final results: 22 unit/API/regression tests passed; all 10 desktop/mobile browser
tests passed; production build, changed-code ESLint and whitespace checks passed.
Full-repository lint still reports 12 existing errors outside this upgrade (storefront
contexts/filter code, service worker and an unused checkout-service import).
