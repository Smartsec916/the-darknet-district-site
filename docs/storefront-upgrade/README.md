# Storefront visual upgrade — 2026-10-29

## Scope and design
Seven storefront pages and their static mirrors use shared storefront.css and storefront.js. Original CSS frames use chamfered corners, restrained magenta category accents, violet/blue product frames and green purchase controls. The approved cyan navigation remains unchanged. Native category anchors preserve all destinations and support keyboard activation. Apparel filters expose their selected state through aria-pressed.

The Shopify adapter changes presentation styles only. Product identifiers, prices, variants, catalog contents, callbacks, checkout configuration and purchase destinations remain unchanged. Titles and prices inside Shopify frames now have readable contrast. A scoped fixed-position correction restores the Shopify cart frame positioning overridden by the existing HUD rule; this eliminates mobile document overflow without hiding content. The immersive game and equipment market are unchanged; the store entry linking to that market receives the new framing.

## Verification
Four focused Node regressions pass; the full branch Node suite previously passed 413 tests. Playwright exercises all seven pages at 1440px and 390px using the real Shopify SDK, verifies product titles/prices, Apparel filters, document widths, native keyboard category navigation and no JavaScript page errors. No purchase, cart submission, checkout or payment was performed. Screenshots cover all seven pages before and after, desktop and mobile. The mobile Apparel card and desktop layouts were visually inspected. CSS includes visible focus, 44px controls, reduced-motion and forced-colors handling.

## Review and dependencies
This branch is stacked on Stage 2 PR #113; it does not duplicate or alter the approved navigation implementation. No paid service or runtime dependency was introduced. Third-party Shopify availability remains a dependency. Physical touchscreen/ROG Ally testing and completed checkout transactions were not performed.

Evidence: before/ and after/ contain page screenshots; after/results.json records browser observations. New companion assets and private editor storage are outside this change.