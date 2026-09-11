# Restaurant Ordering Website Rebuild Plan

## Product goal

Turn the copied storefront foundation into an independent restaurant ordering website where a guest can browse a real menu, customize dishes, add them to a cart, place an order, pay by cash or card, and track its progress. The order is created directly in our backend and is never handed off to WhatsApp.

The daily restaurant experience is a separate, phone-first order inbox rather than a conventional desktop admin dashboard or POS. Staff should be able to open it, see new orders, open one, and take the single obvious next action with almost no training. The fuller menu/settings administration remains secondary and can be owner-only.

The working product name is intentionally left open until the restaurant's real brand name, logo, cuisine, content, and photography are supplied. Architecture work should not depend on that decision.

## Current implementation checkpoint

- The public shell and home page now use a temporary restaurant identity, mobile-friendly navigation, warm restaurant design tokens, menu-first content, and an original food hero image. The identity is centralized so it can be replaced without redesigning the page.
- The backend menu model now supports variants, modifier groups, dietary/allergen data, preparation time, availability, display order, and optional top-level inventory while retaining temporary compatibility fields during migration.
- Cart lines now support variants, add-ons, and notes, with server-authoritative customization validation and deterministic line keys so only truly identical dishes merge.
- Order items snapshot the selected variant, add-ons, and note, and the order-confirmation email uses restaurant/delivery language.
- Focused cart-customization tests have been added. Frontend and backend production builds, plus the full inherited backend test suite, pass at this checkpoint.
- The next implementation slice is the canonical restaurant status state machine and the mobile staff order inbox; WhatsApp credentials and final branding are intentionally not required for that work.

## What the current project already provides

### Reuse with small changes

- NestJS application structure, MongoDB connection, validation, error handling, rate limiting, CORS, and health checks.
- Account registration, email verification, login, Google OAuth, secure cookie sessions, roles, password reset, and profile management.
- Saved customer addresses and guest checkout.
- Server-authoritative cart validation and pricing.
- Idempotent checkout, coupon validation/redemption, payment records, Paymob card payments, and cash on delivery.
- Order history, guest order lookup, confirmation emails, admin order management, audit logs, and operational settings.
- Next.js App Router foundation, API client, React Query providers, Zustand cart persistence, form handling, and reusable UI primitives.
- Render backend and Vercel frontend deployment split.

### Adapt substantially

- `products` becomes the restaurant menu catalog. Legacy catalog attributes become dish variants, add-ons, dietary/allergen information, and availability.
- The cart line identity must include the selected variant and modifiers, not a legacy option value.
- Fulfilment language and statuses become delivery/pickup and kitchen/order statuses.
- Stock reservation logic becomes menu availability and optional quantity limits. Restaurant orders should not depend on legacy inventory semantics.
- Categories become menu sections such as starters, mains, sandwiches, sides, desserts, and drinks; the existing nested category support can stay.
- Owner-only product forms become menu-item forms with availability toggles, variants, modifier groups, dietary labels, preparation time, and images.
- Coupons, fees, email templates, search, order tracking, analytics labels, and settings need restaurant wording.

### Remove or defer

- Wishlist, back-in-stock notifications, obsolete option guides, sale pages, color filters, and style-group recommendations.
- Newsletter can remain disabled until the restaurant asks for marketing signup.
- Reviews can be retained for a later phase; ordering does not depend on them.

### Explicit first-version non-goals

- No POS/cashier integration and no dependency on the restaurant's current software.
- No table management, reservations, kitchen display system, ingredient-level inventory, driver dispatch, multi-branch management, or accounting system.
- No order actions from inside WhatsApp. WhatsApp is an alert channel; the dashboard is the source of truth.
- No WebSocket infrastructure, Redis queue, or native mobile app for the first version.
- No requirement for customers to create accounts before ordering.

## Recommended architecture

Keep the current stack and separate it into three deliberately small surfaces:

1. **Customer storefront — Next.js:** menu, dish customization, cart, guest-first checkout, confirmation, and tracking.
2. **Staff order inbox — Next.js:** a protected mobile-first route that opens directly on orders and exposes only the operational actions staff need.
3. **Application API — NestJS + MongoDB:** owns menu data, pricing, order creation, status transitions, payment state, audit history, and WhatsApp notification attempts.

The existing backend process already supports scheduled jobs. Use that rather than adding Redis or a separate queue: order creation writes the order and a notification-outbox record, then a short scheduled worker sends pending WhatsApp notifications and retries temporary failures. A WhatsApp failure must never roll back or delay the customer's order.

For the staff order inbox, start with a lightweight refresh every 10–15 seconds and an immediate refresh whenever the page becomes visible again. This is easier to operate than WebSockets and is fast enough for a first-version restaurant workflow. Real-time sockets can be added later only if actual usage shows that polling is not sufficient.

Staff authenticate with owner-created staff accounts and secure persistent cookies. Public signup never grants staff access. A staff member who has already signed in should land directly on the order inbox; menu, customer, coupon, and system settings do not appear in their primary navigation.

## Target customer journey

1. The home page opens directly onto a recognizable restaurant experience with current menu sections and popular dishes.
2. The customer browses or searches the menu, opens a dish, chooses a required variant where applicable, selects add-ons, adds a note, and adds it to the cart.
3. A persistent cart surface shows item customizations, quantities, fees, discounts, and the order total.
4. At checkout the customer chooses delivery or pickup, supplies contact details, selects cash or card, and places the order as a guest or signed-in customer.
5. The confirmation and tracking view shows restaurant-specific progress in customer language.

## Staff order-inbox UX

The staff home screen is `/staff/orders`, not an analytics dashboard. Its first viewport contains:

- A clear ordering-open/closed indicator.
- Four large tabs with counts: **New**, **Active**, **Completed**, and **Cancelled**.
- Newest orders first, with an age indicator so an old unconfirmed order is hard to miss.
- Compact cards showing order number, customer name, delivery/pickup, item count, total, payment badge, and current status.

Opening an order shows the operational information in this order:

1. Order number, age, and status.
2. Customer name and tap-to-call phone number.
3. Address/delivery area, with a map link when possible.
4. Items, quantities, variants/add-ons, and item notes.
5. General order notes.
6. Total, payment method, and a simple **Paid** or **Unpaid** badge.
7. One large primary action fixed near the bottom of the screen.

The primary action is derived from the current state; staff never choose a technical status from a dropdown:

- **New** → `Confirm order`
- **Confirmed** → `Start preparing`
- **Preparing + delivery** → `Mark delivered`
- **Preparing + pickup** → `Mark collected`

Cancellation is a less prominent secondary action with a confirmation step and a short reason choice such as out of stock, cannot deliver, customer requested, or other. Destructive actions should never sit beside the main action with equal visual weight.

Touch targets should be at least 44px high, important text should be 16px or larger, and essential actions should not depend on hover, swiping, or tiny menus. Desktop can show the same order list and detail side by side, but mobile determines the interaction model.

## Backend domain model

### Menu item

- Name, slug, description, category, base price, images, active/available flags, featured/popular flag.
- Preparation time in minutes.
- Dietary tags such as vegetarian, vegan, spicy, and gluten-free.
- Allergen list.
- Optional variants such as regular/large, with a stable key and price adjustment.
- Modifier groups such as sauce, cheese, toppings, or sides. Each group defines required/min/max selection rules and options with price adjustments.
- Optional quantity tracking for genuinely limited items; ordinary dishes use an availability toggle.

### Cart line

- Menu item ID, quantity, selected variant key, selected modifier option keys, and an optional customer note.
- A deterministic line key derived from item + variant + modifiers + note so only identical customizations merge.
- The server revalidates availability and recalculates every price from live menu data.

### Order

- Immutable snapshots of dish name, selected variant, modifiers, note, unit price, quantity, and line total.
- Order type: delivery or pickup.
- Customer contact snapshot, with address required only for delivery.
- Canonical operational statuses: `new`, `confirmed`, `preparing`, `completed`, and `cancelled`.
- Valid transitions are enforced by the backend: new → confirmed → preparing → completed; cancellation is allowed only from appropriate unfinished states.
- Every transition stores who changed it, when it changed, and an optional cancellation reason. The audit trail is available to the owner without cluttering the employee workflow.
- Payment status remains independent from order status. Internally the payment integration can retain pending/paid/failed/refunded detail, while the employee UI normally collapses that to **Paid** or **Unpaid**.
- Subtotal, delivery fee, discount, tax/service fee if enabled, and total remain integer minor units.
- Requested/as-soon-as-possible fulfillment time, kitchen note, and cancellation reason where applicable.

The four staff groups are projections rather than additional states:

- **New:** `new`
- **Active:** `confirmed` or `preparing`
- **Completed:** `completed`
- **Cancelled:** `cancelled`

### Restaurant settings

- Restaurant name and contact details.
- Whether ordering is currently open.
- Delivery and pickup availability.
- Minimum order, delivery fee, free-delivery threshold, and estimated preparation time.
- Opening hours and service area rules in a later operational slice.

## Frontend information architecture

- `/` — restaurant home and featured menu sections.
- `/menu` — full menu with section navigation and search.
- `/menu/[slug]` — dish detail/customization, or a sheet/modal from the menu on larger screens if that is more fluid.
- `/cart` — editable cart and server validation.
- `/checkout` — delivery/pickup and payment.
- `/order-confirmation/[orderNumber]` and `/track-order` — confirmation and live status.
- `/login`, `/signup`, `/account/orders`, `/account/settings` — retained and rebranded.
- `/staff/orders` and `/staff/orders/[orderNumber]` — the mobile-first daily workflow.
- `/admin/menu`, `/admin/categories`, `/admin/coupons`, `/admin/settings` — secondary owner tools.

## WhatsApp notification plan

### First-version role

Use the official Meta WhatsApp Cloud API directly unless onboarding or support requirements later justify a Business Solution Provider. WhatsApp does not create or own orders and does not replace the dashboard. It receives concise alerts such as:

```text
New order #125 🍽️
Ahmed · 3 items
450 EGP · Cash
Open order: https://restaurant.example/staff/orders/125
```

Recommended first-version events are **new order** and **cancelled order**. Confirmation notifications can be enabled for the owner if useful, but sending every internal state change to the same working staff number is likely to create noise.

### Integration design

- Add a `NotificationOutbox` collection with event type, order ID, recipient, template name/version, attempt count, next attempt time, provider message ID, and sent/delivered/failed status.
- Write the outbox entry as part of the order event; send asynchronously after the order has been safely stored.
- Use an idempotency key such as `orderId:eventType:recipient` so retries cannot create duplicate alerts.
- Retry temporary network/provider failures with bounded backoff; preserve the final failure for the owner to inspect.
- Accept Meta webhook callbacks to record whether a message was sent, delivered, read, or failed. These delivery states are notification metadata, never order states.
- Keep access tokens, phone-number IDs, webhook secrets, and recipient numbers in environment configuration or protected settings, never in source control.
- The message links to the authenticated staff order detail. It must not contain a token that bypasses staff login.

Meta's Cloud API sends to individual recipients, so a WhatsApp group should not be assumed as the destination. The production setup needs a Meta business portfolio, WhatsApp Business Account, registered sending number, approved template(s), and one or more opted-in staff/owner destination numbers. We must verify during onboarding whether the restaurant's existing WhatsApp Business App number is eligible for the current coexistence flow; until that is confirmed, plan for a dedicated API sending number and the staff's normal numbers as recipients.

Do not add inbound WhatsApp commands such as “CONFIRM 125” in the first version. That would make WhatsApp another order-control interface, require inbound-message authorization and conflict handling, and weaken the intentionally simple single source of truth.

### Provider seam

Define a small backend notification interface (`sendOrderEvent`) and implement Meta Cloud API behind it. This keeps the application independent of one provider without building a general notification platform. A BSP can replace the adapter later without changing order creation or dashboard behavior.

## Visual direction

Use a confident contemporary neighborhood-restaurant identity rather than an e-commerce template: bold editorial food photography, deep charcoal and tomato-red accents, warm white reading surfaces, a characterful display face paired with a highly legible sans serif, compact menu cards, and a persistent cart affordance. The menu—not a large marketing hero—should be usable in the first viewport. Final colors, fonts, copy, and imagery will be tuned to the real cuisine and brand.

## Delivery phases

### Phase 0 — Audit and safety baseline (complete)

- Inventory the existing frontend, backend, deployment, and data model.
- Record the reuse/replace boundary.
- Run the inherited test and build baseline.

### Phase 1 — Restaurant backend foundation

- Replace legacy product fields with menu variants, modifier groups, dietary/allergen data, preparation time, and availability.
- Refactor cart validation and line identity for variants/modifiers/notes.
- Refactor orders and checkout for delivery/pickup and restaurant statuses.
- Add server-enforced status transitions, staff role authorization, and order transition history.
- Replace the inherited seed data with realistic menu categories and dishes.
- Disable obsolete wishlist and back-in-stock modules.
- Add focused tests for modifier validation, authoritative pricing, duplicate cart lines, and checkout totals.

### Phase 2 — Rebranded customer ordering flow

- Establish restaurant design tokens, typography, responsive header, and navigation.
- Build the menu-first home page, full menu, dish customization, cart, checkout, confirmation, and tracking.
- Reuse the current auth/account flows with restaurant copy and styling.
- Add food imagery only from supplied assets, licensed search results, or generated originals.

### Phase 3 — Mobile staff order inbox

- Build the New/Active/Completed/Cancelled order groups and phone-first order detail.
- Add the single-next-action transition flow, cancellation reasons, tap-to-call, address/map link, and Paid/Unpaid presentation.
- Add polling/visibility refresh, loading/offline/retry states, overdue-new-order emphasis, and staff authentication.

### Phase 4 — WhatsApp notifications

- Add the notification outbox, Meta Cloud API adapter, approved order-alert template, delivery-status webhook, idempotency, and bounded retries.
- Test order creation with WhatsApp available, slow, rejected, and unavailable to prove it cannot affect order reliability.
- Verify the actual restaurant phone-number onboarding/coexistence path before production activation.

### Phase 5 — Owner administration

- Convert product management to menu-item management.
- Add category ordering, item availability controls, modifier editing, and restaurant order-state actions.
- Keep owner navigation small; add only menu, categories, coupons, staff access, notification health, and restaurant settings required for launch.

### Phase 6 — Quality and launch

- Exercise guest and signed-in ordering, coupon, COD/card, stock/availability, cancellation, and admin flows.
- Verify responsive-to-breakpoint layouts, keyboard access, error/empty/loading states, metadata, emails, and security boundaries.
- Refresh README, environment examples, database migration/seed instructions, and deployment names.
- Deploy only after production values, brand assets, menu content, payment credentials, and service rules are confirmed.

## Decisions still needed before final branding and launch

- Restaurant name, logo, cuisine, tone, and preferred language(s).
- Real menu, prices, variants, add-ons, dietary/allergen data, and food photography.
- Delivery area, fee/minimum-order rules, pickup policy, operating hours, currency, tax/service charges, and expected preparation times.
- Accepted payments and whether Paymob remains the card provider.
- Whether pickup is part of the first version or delivery only.
- Which staff/owner phone numbers receive new-order and cancellation alerts.
- Whether the restaurant's existing WhatsApp Business number can use Meta's current coexistence onboarding, or whether a dedicated Cloud API sending number will be used.

These decisions do not block Phase 1. Until they are supplied, implementation should use clearly replaceable sample menu data and configuration rather than burying assumptions in application logic.
