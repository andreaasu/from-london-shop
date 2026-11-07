# Analytics

Vercel builds read `VITE_GA_MEASUREMENT_ID` and `VITE_CLARITY_PROJECT_ID`. Redeploy after changing either value. No SDK or database changes are needed.

Both scripts are blocked until the visitor accepts optional analytics. The choice expires after 180 days. The fixed Privacy settings button allows rejection later; withdrawal reloads the page to unload tracking listeners. Cart storage remains intact. Rejected activity is never replayed after consent.

GA4 automatically measures users and sessions after consent. The app sends SPA `page_view`, `view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, and `purchase` events. Ecommerce items contain only product ID, numeric price and quantity; currency is EGP. Quantity changes send only the added/removed quantity. Purchases run exclusively after the existing order API returns a confirmed Supabase order ID, using its total (delivery is collected separately). Item prices reflect the cart snapshot. Confirmation-page refreshes never send purchases. A browser-local order-ID ledger and GA4 transaction IDs provide duplicate protection. This is browser tracking: denied consent, blockers, cleared storage, or interrupted network delivery can affect reporting; it is not an order accounting system.

## Dashboard setup

- GA4: Admin → Data streams → your web stream → Enhanced measurement. Disable automatic page views/history-based page views because the React router sends them. Disable form interactions, site search, and other automatic enhanced events so arbitrary form/link/query values cannot enter reports. Do not enable user-provided data collection. These are property settings and cannot be changed by the website code.
- Clarity: Settings → Masking → Strict is recommended as additional protection. The application root already has `data-clarity-mask="true"`, covering checkout, confirmation and customer content regardless of dashboard masking defaults. No identify API or customer fields are sent. Admin navigation stops recording; URL parameters/hashes prevent starting recordings and stop an active recorder. Never put customer details in URLs (DOM masking does not mask URLs). Configure any needed URL parameter masking in Clarity too.
- Do not add duplicate GA/Clarity tags through Vercel integrations, Tag Manager, or HTML snippets.

## Quick live verification

1. Open an incognito session with DevTools Network. Before accepting, and after rejecting, there should be no Google Analytics or Clarity script/collection requests. Accept via Privacy settings; configured scripts should load once. Missing IDs simply leave that tool disabled.
2. In GA4 Realtime (or DebugView using Google Analytics Debugger), navigate between pages, view a product, add it, change quantity, remove it and enter checkout. Confirm event names, product IDs, quantities, prices and EGP. Inspect requests to confirm URLs exclude query/hash and no email, phone, address, name or notes are included.
3. Place one test order and check one `purchase` with its Supabase order ID as `transaction_id` and its confirmed total. Refresh the confirmation page: no extra purchase. A failed order must not emit a purchase. Existing test orders create real orders and invoke the existing email flow.
4. In Clarity, check the new recording and heatmap after processing. Verify checkout inputs and confirmation/customer content are masked; admin pages should not be recorded. Then reject analytics through Privacy settings and confirm the reload stops collection.

References: [GA4 ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce), [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [Clarity consent](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-management), [Clarity masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking).
