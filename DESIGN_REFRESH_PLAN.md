# Design refresh plan — staff dashboard first, storefront polish second

This is a handoff document. It was written after reading the code and looking at
every screen in a browser (desktop, phone, English and Arabic). The person
implementing it has not seen any of that, so the findings are spelled out, the
design decisions are already made, and each phase ends with a way to check it.

Everything is in `Frontend/`. **No backend changes, no API contract changes, no
new npm dependencies.**

---

## 1. What this is for

Restaurant staff use `/admin/orders` standing up, mid-service, mostly on a phone
or a counter tablet. The job is three things: notice a new order, read what to
make, press Confirm. The owner uses the rest of `/admin` about once a week.

The goal is a staff dashboard that is **simpler to read and harder to get
wrong**, in one consistent visual style, and a storefront whose remaining
old-style pages are brought up to the standard of the home and menu pages.

The order workflow does not change: an order waits until staff press **Confirm
order**, and that is the only step. Do not add statuses, steps or screens.

## 2. What is wrong today

Ordered by how much it hurts staff. File references are where the cause lives.

### Orders board — `src/app/admin/orders/page.tsx`, `src/components/admin/order-card.tsx`

1. **Add-ons and notes get cut off.** On a phone the item name and the note are
   both `shrink-0`, so the variant/add-on text ("Double · Extra cheese ·
   Jalapeños") gets zero width and disappears completely, and the note is
   clipped by the card edge. On desktop both are truncated with `…`. This is
   the information the kitchen cooks from. It must never be truncated.
2. **The customer website's header and footer wrap the dashboard.**
   `src/app/layout.tsx` renders `SiteHeader`, `SiteFooter` and `BrowseCartBar`
   around every route, so staff see "Menu / Track order / Contact", a cart
   button, and the marketing footer. On a phone that header takes 104px of the
   screen before the first order.
3. **Type is too small.** Labels and status pills are 9–10px
   (`text-[0.58rem]`, `text-[0.62rem]`, `text-[0.64rem]`). The card has three
   columns of small text and section labels ("CUSTOMER", "ORDER ITEMS",
   "TOTAL") that take space without adding meaning.
4. **Colour does not mean anything.** Every waiting order gets the same red
   rail, including an unpaid card order staff can do nothing about. Urgency is
   only a small pill.
5. **Orders staff cannot act on sit in the queue.** An unpaid card order takes
   a "#n in queue" slot and a full card, with a disabled-looking "Waiting for
   payment" box where the button would be.
6. **No sign when the board stops updating.** If the API is unreachable the
   board silently keeps showing old orders. There is no error state at all.
7. **The sound and notification controls are unlabelled icons**, and the chime
   can be silent: `use-new-order-alert.ts` creates a new `AudioContext` per
   chime, which browsers leave suspended until the page has had a tap or click.
8. **The InstaPay check uses `window.confirm`** (`use-confirm-order.ts`), a
   browser dialog with small text and OK/Cancel buttons, for the one decision
   that involves money.
9. Search only looks inside the selected tab. A customer on the phone could be
   in any tab.
10. Small bug: the "existing backlog should not ring" guard in
    `use-new-order-alert.ts` is defeated. The effect first runs with an empty
    list (data not loaded), which sets `primedRef` true; the real first page of
    orders then counts as new. Result: "4 new" and a chime on first open.

### Order page — `src/app/admin/orders/[orderNumber]/page.tsx`

11. On a phone the Confirm button is at the very bottom of a long page. The
    code comment says it "sits in a bar fixed to the bottom"; it does not.
12. The phone number is truncated ("010123456…") because the WhatsApp button
    takes the room.
13. The quantity badge on each item is clipped by the thumbnail's
    `overflow-hidden`.
14. The status badge is the old square, uppercase style
    (`components/orders/order-status-badge.tsx`).
15. A missing order shows a loading skeleton forever (`isLoading || !order`).

### Rest of the admin

16. **Two visual styles.** Orders, settings and alerts use the newer rounded
    style. Products, customers, coupons, reviews, sections, audit log and both
    forms still use the clothing-store template this project grew out of:
    square corners, 11–13px uppercase type, `text-headline-sm`, underlined
    "Previous / Next".
17. Opening `/admin` logs a React hydration mismatch from
    `src/app/admin/layout.tsx` (it returns `null` on the server and content on
    the first client render when the profile query is already resolved).
18. The dashboard repeats full order cards (unsorted, so not oldest-first) and
    its headline number is all-time revenue.
19. In Arabic, "#1 in queue" and "last checked …" stay in English (see the i18n
    rule in section 4 for why).

### Storefront

The home page, menu, dish page, cart, checkout and sign-in are in good shape
and should **not** be redesigned. The problems are leftovers:

20. About twenty customer pages still use the old template's classes
    (`text-headline-md`, `text-body-md`, `text-button`, `px-margin-mobile`,
    square uppercase buttons): `not-found.tsx`, `error.tsx`, `faq`, `privacy`,
    `terms`, `shipping-returns`, `track-order`, `account/*`,
    `order-confirmation`, `checkout/result`, `checkout/payment-callback`,
    `components/products/*`.
21. Mixed capitalisation ("Track Your Order", "Find Order", "Page Not Found"
    beside sentence case everywhere else).
22. Arbitrary one-off radii (`rounded-[1.35rem]`, `rounded-[1.5rem]`,
    `rounded-[2rem]`) and text under 12px.
23. The phone header is 104px tall and stays that tall while scrolling.

---

## 3. Before starting

1. Read `Frontend/AGENTS.md`. This Next.js version (16) differs from older
   ones; read the relevant guide in `Frontend/node_modules/next/dist/docs/`
   before changing any layout file.
2. Install and run against the mock API. It signs you in as an admin and
   serves made-up orders in every state, so no production login is needed:

   ```bash
   npm ci --prefix Frontend
   ```

   Create `Frontend/.env.local` (git-ignored) containing:

   ```
   API_ORIGIN=http://localhost:3199
   NEXT_PUBLIC_SITE_URL=http://localhost:3101
   ```

   Then start `node Frontend/scripts/mock-admin-api.mjs` and
   `npm run dev --prefix Frontend`, and open `http://localhost:3101/admin/orders`.
   The header of the mock script lists three URLs that add a new order, take
   the API down, and empty the queue. Use them to check the alert, the
   "not updating" banner and the empty state.
3. One commit per phase. Match the existing commit style: one plain sentence
   saying what changed for the person using it (see `git log`).

## 4. Rules that apply to every phase

**Language (this one is easy to break).** Arabic is applied by walking the DOM
and replacing whole text nodes that match a key in
`src/i18n/translations.ts` — an exact-match dictionary (`arabic`) plus regex
patterns (`dynamicArabic`).

- Every new visible English string needs an entry in `arabic`, or a pattern in
  `dynamicArabic` if it contains a number or a name.
- A string with a variable in it must be **one** JS string so it renders as one
  text node: write `` {`${count} waiting`} ``, not `{count} waiting`. The second
  form produces separate text nodes and no pattern can match it. This is why
  "#1 in queue" is untranslated today.
- If you change the wording of an existing English string, rename its key in
  the dictionary in the same commit, or the Arabic silently disappears.
- Customer data (names, phone numbers, addresses, order numbers, notes,
  payment references) gets `data-i18n-ignore`. Phone numbers also get
  `dir="ltr"`.
- For strings used in JavaScript (toasts, `aria-label`, `document.title`) use
  `t()` from `useLanguage()`, as the existing code does.

**Right-to-left.** Use logical utilities only: `ps-/pe-`, `ms-/me-`,
`start-/end-`, `border-s/border-e`, `text-start/text-end`. Never `left/right`,
`pl/pr`, `ml/mr`. Directional icons (chevrons, arrows) need `rtl:rotate-180`
unless they are one of the lucide icons already flipped in `globals.css`.

**Sizes.** In `/admin`: no text under 12px (`text-xs`). Anything staff read to
do the job (dish names, quantities, phone number, total) is at least 16px.
Every tappable thing is at least 44px tall (`min-h-11`); the primary action is
48px (`min-h-12`).

**Shape.** Cards `rounded-2xl`, inputs and buttons `rounded-xl`, pills and icon
buttons `rounded-full`. No arbitrary radius values in new code.

**Colour.** Use the tokens from Phase 1, not raw Tailwind colours
(`bg-amber-100`, `text-red-700`, `bg-emerald-500`). Colour always comes with a
word or an icon; it is never the only signal.

**No dark mode work.** `.dark` tokens exist but nothing ever switches the theme
on. Do not add `dark:` variants to new code and do not add a theme switch.

**Do not change:** polling intervals (10s board, 20s order page — the API is on
a free tier), `canConfirm` / `confirmWarning` rules in `lib/staff-orders.ts`,
the phone/WhatsApp link logic in `lib/contact-links.ts`, the "seen orders"
storage in `use-new-order-alert.ts`, anything under `Backend/`.

---

## Phase 1 — Tokens and shared staff components

### 1a. Status colours in `src/app/globals.css`

Add to `:root` (and map each into `@theme inline` as `--color-…` so
`bg-success-soft`, `text-warning-strong` etc. work as utilities):

| Token | Value | Used for |
| --- | --- | --- |
| `--success-soft` | `oklch(0.95 0.045 150)` | paid / confirmed backgrounds |
| `--success-strong` | `oklch(0.40 0.10 150)` | text and icons on it |
| `--warning-soft` | `oklch(0.95 0.06 85)` | getting old / needs a check |
| `--warning-strong` | `oklch(0.42 0.09 65)` | text and icons on it |
| `--danger-soft` | `oklch(0.95 0.03 25)` | late / failed backgrounds |
| `--danger-strong` | `oklch(0.45 0.18 27)` | text and icons on it |

Keep the existing `--success` (the alerts page uses it). Check each
strong-on-soft pair reaches 4.5:1 contrast and adjust lightness if it does not.

### 1b. `src/components/admin/ui/` — small building blocks

Create these once and use them on every admin screen. Keep each one small; no
variants nobody uses.

- `page-header.tsx` — `AdminPageHeader({ title, description?, children? })`.
  `h1` is `font-heading text-2xl sm:text-3xl`; `children` are the page's
  actions, laid out at the end of the row and wrapping under the title on a
  phone.
- `panel.tsx` — `Panel`: `rounded-2xl border border-border bg-card p-4 sm:p-5`,
  optional `title`.
- `status-pill.tsx` — `StatusPill({ tone, icon?, children })`, tones
  `neutral | success | warning | danger | danger-solid`. `text-xs font-bold`,
  `rounded-full px-2.5 py-1`. Sentence case, not uppercase.
- `empty-state.tsx` — icon, title, one line of help, optional action.
- `segmented.tsx` — `Segmented({ options, value, onChange })`, the tab control
  used by the orders board and the reviews filter. One rounded track, each
  option a 44px button with an optional count; the selected one is
  `bg-foreground text-background` and has `aria-pressed="true"`.
- `pagination.tsx` — Previous / "Page 2 of 5" / Next as real 44px buttons.
  ("Page 2 of 5" already has a `dynamicArabic` pattern.)
- `field.tsx` — `Field({ label, hint?, htmlFor, children })` and an exported
  `inputClass`. Label `text-sm font-bold`, input `min-h-12 rounded-xl`,
  16px text (smaller makes iOS zoom the page).
- `confirm-dialog.tsx` — `ConfirmDialog({ open, onOpenChange, title, children,
  confirmLabel, cancelLabel, tone, pending, onConfirm })`. Build it on the same
  `Dialog` from `@base-ui/react/dialog` that `components/ui/sheet.tsx` wraps
  (read that file first). Centred card from `sm` up; anchored to the bottom
  edge with a rounded top on a phone. Two full-width 48px buttons, confirm
  first. Focus moves to the confirm button on open.

### 1c. `src/lib/staff-orders.ts` — the decisions, out of the components

Move the logic that is currently inside `order-card.tsx` here so the board, the
order page and the overview all agree:

- `AGING_AFTER_MINUTES = 10` beside the existing `OVERDUE_AFTER_MINUTES = 15`.
- `orderUrgency(order): "fresh" | "aging" | "late"` — under 10 minutes, 10–15,
  15 and over. Only for orders that are waiting.
- `staffOrderState(order)` → `{ kind, tone, label }` where `kind` is
  `"to_confirm" | "awaiting_payment" | "confirmed" | "cancelled"`. This is the
  current `orderState()` moved, with the labels "Needs confirmation",
  "Waiting too long", "Awaiting card payment", "Confirmed", "Cancelled"
  (all already in the dictionary).
- `paymentInstruction(order)` → `{ label, tone }`, what staff need to know
  about the money in one phrase. Extend `lib/payment-label.ts` rather than
  duplicating its method names:

  | Method / status | Label | Tone |
  | --- | --- | --- |
  | cash, not yet paid | `Cash — collect on delivery` | neutral |
  | cash, paid | `Cash — collected` | success |
  | card, paid | `Paid by card` | success |
  | card, pending or failed | `Card payment not completed` | warning |
  | InstaPay, pending | `InstaPay — check the transfer` | warning |
  | InstaPay, paid | `Paid by InstaPay` | success |
  | any, refunded | `Refunded` | neutral |

- `formatElapsed(createdAt)` — the timer text without "ago": `just now`,
  `8 min`, `1h 05m`, `2d`.
- `splitWaiting(orders)` → `{ toConfirm, awaitingPayment }`, each oldest first.
- `groupByDay(orders)` → `[{ label: "Today" | "Yesterday" | "12 Nov", orders }]`.

**Done when:** `npm run lint --prefix Frontend` and the build pass, and nothing
looks different yet.

---

## Phase 2 — A shell of its own for staff

### 2a. Take the storefront chrome off `/admin`

Add `src/components/layout/storefront-only.tsx`, a client component:

```tsx
"use client";
import { usePathname } from "next/navigation";

export function StorefrontOnly({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : children;
}
```

In `src/app/layout.tsx` wrap `<SiteHeader />` in one `StorefrontOnly` and
`<SiteFooter />` + `<BrowseCartBar />` in another. Leave `Providers`, the skip
link and `<main id="main-content">` where they are.

Do **not** do this with a `(storefront)` route group. That means moving every
customer route, and the root `not-found.tsx` / `error.tsx` would lose the site
header. The wrapper is ten lines and changes nothing for customers.

### 2b. Rebuild `src/app/admin/layout.tsx` and `src/components/admin/admin-nav.tsx`

```
≥ 1024px                                  < 1024px (phones, tablets upright)
┌────────────┬─────────────────────────┐  ┌──────────────────────────────┐
│ 🔥 Fire    │                         │  │ 🔥  Orders             عربي  │ 56px top bar
│   House    │   page content          │  ├──────────────────────────────┤
│   Staff    │   max-width 1400px      │  │                              │
│            │                         │  │   page content               │
│ Orders  ④  │                         │  │                              │
│            │                         │  ├──────────────────────────────┤
│ RESTAURANT │                         │  │ Orders④ Overview Menu Alerts ⋯│ bottom tabs
│ Overview   │                         │  └──────────────────────────────┘
│ Menu       │                         │
│ Sections   │                         │
│ Coupons    │                         │
│ Reviews    │                         │
│ Customers  │                         │
│            │                         │
│ SYSTEM     │                         │
│ Alerts     │                         │
│ Settings   │                         │
│ Audit log  │                         │
│ ────────── │                         │
│ عربي       │                         │
│ View site ↗│                         │
│ Name · Sign out                      │
└────────────┴─────────────────────────┘
```

- Sidebar: `w-60`, `sticky top-0 h-dvh`, `bg-card`, `border-e`, scrolls on its
  own if short. Shown from `lg` (today it appears at `md`, which leaves a
  tablet held upright with 500px for orders).
- Nav groups exactly as drawn. "Dashboard" is renamed **Overview** everywhere.
  Orders stands alone at the top, visually heavier than the rest.
- **Waiting count badge** on Orders in the sidebar and in the bottom tabs: a
  `danger-solid` circle with the number; hidden at zero.
- Sidebar foot: the language toggle (`components/layout/language-toggle.tsx`
  is styled for the dark announcement bar — give it a `className` prop rather
  than copying it), a "View website" link to `/` in a new tab, the signed-in
  first name and a Sign out button (reuse `logoutUser` the way
  `components/layout/account-menu.tsx` does).
- Top bar below `lg`: brand mark, the current section's name, language toggle.
  `h-14`, sticky.
- Bottom tabs: keep the existing five and the "More" sheet; add Sign out,
  View website and the language toggle to the bottom of that sheet. Add
  `pb-[env(safe-area-inset-bottom)]` to the bar.
- Content area: `px-4 sm:px-6 py-5 lg:py-8`, bottom padding that clears the
  tab bar below `lg`.
- **Fix the hydration mismatch:** render the shell frame with a skeleton in the
  content area until `useHydrated()` (`src/hooks/use-hydrated.ts`) is true and
  the profile has loaded, instead of returning `null`. The redirect logic for
  signed-out and non-admin users stays as it is.

### 2c. One watcher for new orders, on every admin screen

Today the chime only works while the Orders page is open. Staff editing the
menu hear nothing.

- New `src/hooks/use-waiting-orders.ts`: one `useQuery` with key
  `["admin", "orders", "waiting", ""]` calling `getAdminOrders({ limit: 50,
  fulfillmentStatus: "unfulfilled,processing" })`, `refetchInterval: 10_000`,
  `refetchIntervalInBackground: true`, `placeholderData` keeping the previous
  page. The key is the one the board already uses, so the two share one
  request.
- New `src/components/admin/new-order-watcher.tsx`, rendered once in the admin
  layout. It calls `useWaitingOrders()` and `useNewOrderAlert()`, sets
  `document.title` (keep the existing `(n) Orders · Admin` format — it has
  translation patterns), and exposes through a small context: `waitingCount`,
  `unseenCount`, `freshNumbers` (order numbers that arrived since the page
  opened), `clearUnseen`, `soundOn`, `toggleSound`, `soundBlocked`,
  `notificationPermission`, `requestPermission`.
- Changes inside `use-new-order-alert.ts`:
  - Only count confirmable orders as new (`canConfirm`), not unpaid card ones.
  - Take a `ready` flag and do nothing until the first page has loaded; that
    fixes finding 10.
  - Keep **one** `AudioContext` for the page instead of one per chime. On the
    first `pointerdown` or `keydown` anywhere, call `resume()` on it. Expose
    `soundBlocked` = sound is on but the context is still `suspended`.
  - Remember the sound on/off choice in `localStorage`
    (`firehouse-admin-sound`), with the same try/catch pattern the file already
    uses for the seen list.
  - Return `freshNumbers`.

**Done when:** `/admin/*` shows no customer header, footer or cart bar at any
width; the customer site is unchanged; the console is clean on load; with the
mock running, `curl http://localhost:3199/__mock/new` while on
`/admin/settings` rings and raises the badge within ten seconds.

---

## Phase 3 — The orders board

Rewrite `src/app/admin/orders/page.tsx`. Replace
`src/components/admin/order-card.tsx` with the components below (delete the old
file once nothing imports it).

### 3a. Page frame

```
Orders                                        ● Live · 11:27   🔊 Sound on   ↻
┌──────────────────────────────────────────┐  ┌─────────────────────────────┐
│  Waiting 4  │  Confirmed  │  Cancelled   │  │ 🔍 Order number, name, phone│
└──────────────────────────────────────────┘  └─────────────────────────────┘
```

- Remove the "Live service queue" eyebrow and the "Updates by itself every 10
  seconds" sentence.
- **Live indicator:** a small green dot and `Live · 11:27` (time of the last
  successful fetch). If the query is in error, or the last success is more than
  30 seconds old, replace it with a full-width `danger-soft` banner above the
  board: **"Not updating — check the internet connection."** with the time of
  the last update and a **Try again** button. The old orders stay visible
  underneath.
- **Sound:** a labelled button, `Sound on` / `Sound off` (icon only below `sm`,
  with an `aria-label`). When `soundBlocked` is true, show a one-line banner:
  **"Tap anywhere to switch the order sound on."**
- **Alerts permission:** delete the bell icon. When the permission is
  `"default"`, show a dismissible banner under the header: **"Get an alert on
  this device when an order arrives, even with this tab in the background."**
  with **Turn on alerts** and **Not now**. Remember "Not now" in
  `localStorage`. Show nothing when granted, denied or unsupported.
- **Tabs:** `Segmented` from Phase 1, full width on a phone. The Waiting count is always shown (from the watcher), not only when the tab
  is active.
- **Search:** when the box has text, search **all** statuses (leave
  `fulfillmentStatus` out of the request), stop polling for that query, show
  the results as compact rows (3d) under a `Results for “…”` heading, and show
  no tab as selected. Clearing the box returns to the tab.
- The "n new" pill stays, but tapping it scrolls to the first new ticket as
  well as clearing the count.

### 3b. Waiting tab layout

Use `splitWaiting()`:

1. **To confirm** — tickets (3c) in a grid, oldest first:
   `grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3`.
2. **Waiting for card payment · n** — only if there are any. A quiet section
   below the tickets with compact rows (3d) and one line of explanation:
   **"These customers have not finished paying. Nothing to do yet — they move
   up by themselves when the payment goes through."**

Empty state when both are empty: a check icon, **"All caught up"**, and
**"New orders appear here by themselves and ring this device."**

Loading: three ticket-shaped skeletons.

Drop the "#n in queue" label. Oldest-first order plus the timer already says it.

### 3c. `src/components/admin/order-ticket.tsx`

One order staff can act on. Read top to bottom: when, what to make, who for,
money, button. No column layout at any width.

```
┌────────────────────────────────────────────┐
│ FH-1041                         ⏱ 23 min   │
│ 11:03 AM · ⚠ Waiting too long              │
├────────────────────────────────────────────┤
│ 2×  Classic Smash Burger                   │
│     Double · Extra cheese · Jalapeños      │
│     ┌────────────────────────────────────┐ │
│     │ ✎ No onions please, and cut in half│ │
│     └────────────────────────────────────┘ │
│ 1×  Cheese Fries                           │
│ 2×  Pepsi                                  │
├────────────────────────────────────────────┤
│ Omar Hassan                      (📞) (🟢) │
│ 010 1234 5678                              │
│ 12 El Tahrir St, Apt 4, Dokki, Cairo       │
├────────────────────────────────────────────┤
│ EGP 545            Cash — collect on delivery
│ ┌────────────────────────────────────────┐ │
│ │            ✓  Confirm order            │ │
│ └────────────────────────────────────────┘ │
│                View details ›              │
└────────────────────────────────────────────┘
```

- **Head.** Order number `text-lg font-extrabold`, linking to the order page.
  Timer chip at the end using `formatElapsed` and `orderUrgency`: `fresh` →
  neutral chip; `aging` → `warning` chip; `late` → `danger-solid` chip, plus the
  whole ticket gets a 2px `danger-strong` border. No coloured rail, no tinted
  card backgrounds. Second line: clock time, then the `staffOrderState` pill.
- **Items** — use the shared `OrderItemLines` (3e). This is the largest block
  on the ticket.
- **Customer.** Name `text-base font-bold`. Phone on its own line,
  `text-base`, `dir="ltr"`, a `tel:` link when `telLink()` returns one,
  otherwise plain muted text. Address `text-sm text-muted-foreground
  line-clamp-2`. At the end of the name row: two 44px round icon buttons, Call
  (only with a valid `tel:` link) and WhatsApp (only when `whatsAppLink()`
  returns one; keep the green `#25D366` and the pre-filled confirmation
  message the old card builds).
- **Money.** Total `text-xl font-extrabold` at the start, the
  `paymentInstruction` pill at the end. For InstaPay, the customer's reference
  on the next line: `Ref IP-88213` (`data-i18n-ignore` on the value).
- **Action.** `ConfirmOrderButton` (3f), full width, 48px. Under it a centred
  44px text link "View details".
- **New arrivals.** If the order number is in `freshNumbers`, add
  `ring-2 ring-primary` and a small **New** pill beside the order number until
  the ticket is tapped or "n new" is cleared. No pulsing or flashing.
- Semantics: `<article aria-labelledby>` with the order number as its heading.

### 3d. `src/components/admin/order-row.tsx`

A compact, read-only line for history, search results, unpaid-card orders and
the overview. The whole row is one link to the order page, at least 64px tall.

```
FH-1045   Mariam Samir · 010 9876 5432          EGP 480   ● Confirmed   ›
12:31 PM  2× Fried Chicken Meal, 2× Mirinda               Cash — collected
```

On a phone it stacks into three lines: number + status pill; name + total;
items summary. The items summary is the first two lines of the order, then
`+2 more`. It may truncate — the full list is one tap away, and nobody cooks
from this row.

**Confirmed** and **Cancelled** tabs: rows grouped with `groupByDay()` under
small day headings, newest first. Replace the "Showing the 50 most recent…"
sentence with a **Show more** button that raises `limit` from 50 to 100 (the
API's maximum); after that, show "Search to find older orders."

### 3e. `src/components/admin/order-item-lines.tsx`

Shared by the ticket and the order page, so the kitchen reads the same thing in
both places. Props: `items`, `showPrices?`.

Per item:

- Row 1: quantity chip (`2×`, `min-w-9 h-7`, `bg-foreground text-background`,
  `text-sm font-extrabold tabular-nums`) and the dish name
  (`text-base font-bold`, wraps). With `showPrices`, the line total at the end.
- Row 2, only if there is a variant or add-ons: `variant · add-on · add-on`,
  `text-sm text-muted-foreground`, indented under the name. **Wraps. Never
  `truncate`, never `line-clamp`.**
- Row 3, only if there is a note: a full-width block, `rounded-xl
  bg-warning-soft text-warning-strong px-3 py-2 text-sm font-semibold`, note
  icon, the text wrapping freely, `data-i18n-ignore`.
- A quantity above 1 should stand out from a quantity of 1: give the `1×` chip
  the muted style (`bg-muted text-foreground`) and keep the solid style for 2
  and up. Doubles are the most common kitchen mistake.

No thumbnails in this component.

### 3f. `src/components/admin/confirm-order-button.tsx`

Wraps `useConfirmOrder` and owns the InstaPay check, so the ticket and the
order page behave identically. Remove `window.confirm` from
`use-confirm-order.ts`; the hook becomes just the mutation.

- Cash, or a card already paid: one tap confirms. While pending the button
  shows a spinner and "Confirming…" and is disabled.
- InstaPay not yet marked paid (`confirmWarning(order)` is non-null): open
  `ConfirmDialog`:
  - Title: **"Did the InstaPay transfer arrive?"**
  - Body: the total in large type, `Reference IP-88213`, the customer's name,
    and **"Check your bank app first. Confirming marks this order as paid."**
  - Buttons: **"Yes, it arrived — confirm"** and **"Not yet"**.
- Errors keep the existing toast.

**Done when** (mock running, checked at 375px, 768px and 1366px, in English and
Arabic):

- Order FH-1041 shows "Double · Extra cheese · Jalapeños" and the whole note,
  at every width.
- The unpaid card order (FH-1044) is in the quiet section, not among the
  tickets, and has no Confirm button.
- Confirming the InstaPay order opens the dialog; "Not yet" changes nothing.
- `…/__mock/new` → ring, "1 new", ringed ticket with a New pill.
- `…/__mock/down` → the red banner within 30 seconds, orders still visible;
  calling it again clears the banner.
- `…/__mock/clear` → the "All caught up" state.
- Searching `Mariam` finds the confirmed order while the Waiting tab was open.
- No horizontal scrolling at 375px.

---

## Phase 4 — The order page

Rewrite `src/app/admin/orders/[orderNumber]/page.tsx`.

```
≥ 1024px                                          < 1024px
‹ All orders                                      ‹ All orders
FH-1041   ⚠ Waiting too long                      FH-1041  ⚠ Waiting too long
Placed 11:03 AM · 23 min ago                      Placed 11:03 AM · 23 min ago
┌───────────────────────────┐ ┌───────────────┐   ┌──────────────────────────┐
│ 5 items                   │ │ Confirm order │   │ 5 items … totals         │
│ (OrderItemLines + prices) │ └───────────────┘   ├──────────────────────────┤
│ ───────────────────────── │ ┌───────────────┐   │ Customer                 │
│ Subtotal          EGP 515 │ │ Customer      │   ├──────────────────────────┤
│ Delivery           EGP 30 │ │ Omar Hassan   │   │ Payment                  │
│ Total             EGP 545 │ │ 010 1234 5678 │   └──────────────────────────┘
└───────────────────────────┘ │ [Call][WhatsApp]  ┌──────────────────────────┐
                              │ address       │   │ (📞)(🟢) [ Confirm order ]│ fixed bar
                              │ Open in Maps  │   └──────────────────────────┘
                              └───────────────┘   bottom tabs
                              ┌───────────────┐
                              │ Payment       │
                              └───────────────┘
```

- Grid: `lg:grid-cols-[minmax(0,1fr)_22rem]`, right column `lg:sticky lg:top-6`.
- **Header:** order number as `h1`, the `staffOrderState` pill beside it (drop
  `OrderStatusBadge` here), then `Placed 11:03 AM · 23 min ago`.
- **Items panel:** `OrderItemLines` with `showPrices`, then the existing
  totals list (subtotal, delivery, discount with coupon code, total).
- **Action panel** (right column on desktop): `ConfirmOrderButton` when
  `canConfirm`; otherwise one sentence — the three existing sentences are fine.
- **Customer panel:** name; the phone number at `text-lg font-bold`,
  `dir="ltr"`, on its own line and **never truncated**; under it two equal
  48px buttons side by side, **Call** and **WhatsApp**; the "Not a valid number
  — dial it by hand" hint when there is no `tel:` link; email if present; the
  address in full; **Open in Maps** as a 44px secondary button.
- **Payment panel:** the `paymentInstruction` pill, method, InstaPay reference,
  tracking number if any. At the bottom, separated by a rule, **Mark as
  refunded** as a quiet `danger-strong` text button, only when the order is
  paid. It opens `ConfirmDialog` with the existing warning sentence ("This only
  records the status — send the money back through Paymob or InstaPay
  separately.") instead of `window.confirm`.
- **Phone action bar:** below `lg`, when the order can be confirmed, a bar
  fixed above the bottom tabs (`bottom-16` plus the safe-area inset,
  `bg-background/95 backdrop-blur border-t`) holding the Call and WhatsApp icon
  buttons and a full-width `ConfirmOrderButton`. Hide the in-page action panel
  below `lg` so the button is not shown twice. Pad the page so the last panel
  clears both bars.
- **States:** skeleton while loading; on a 404 or other error, an `EmptyState`
  — **"We couldn't find that order"** — with a link back to the board.

**Done when:** at 375px the Confirm button is visible without scrolling on
FH-1041 and the full phone number shows; a made-up order number shows the
not-found state, not a skeleton; refund asks through the in-app dialog.

---

## Phase 5 — Overview and the rest of the admin

Restyle only. Same data, same requests, same form fields and validation.

### 5a. Overview — `src/app/admin/page.tsx`

- Title **Overview**.
- Four tiles, `grid-cols-2 lg:grid-cols-4`: **Waiting now** (the whole tile
  links to `/admin/orders`; filled dark when above zero, as today), **Orders**,
  **Confirmed**, **Revenue** with the hint "Paid orders, all time".
- **Waiting now** list: up to five `OrderRow`s from `useWaitingOrders()`
  (confirmable first, oldest first) and an **Open orders** button. No full
  tickets here.
- **Best sellers:** a ranked list — position number, dish name, `148 sold`,
  revenue — with a thin bar under each name whose width is that dish's
  quantity as a share of the top seller's. Plain CSS, no chart library.

### 5b. Pages still in the old template

Bring each onto `AdminPageHeader`, `Panel`, `Field`, `StatusPill`,
`EmptyState`, `Pagination`, and the `.action-primary` / `.action-secondary`
button classes from `globals.css`. Replace every `text-headline-*`,
`text-body-*`, `text-button`, `text-[11px]`–`text-[13px]`, square corner and
uppercase-tracked button.

| File | Notes |
| --- | --- |
| `app/admin/products/page.tsx` | Title **Menu**, button **New dish**. Rows inside a `Panel`: 48px square rounded photo (it is `aspect-3/4` today — a clothing shape), name, section name, price, and a pill: `Hidden` when `!isActive`, `Sold out` when `!isAvailable`. Remove the `{product.color} ·` text and the "n in stock" column. |
| `app/admin/products/new/page.tsx`, `[id]/page.tsx` | Headers and back links only. Titles **New dish** / **Edit dish**. |
| `components/admin/product-form.tsx` | Group the existing fields into panels (Details, Price, Photos, Visibility) using `Field`. **Keep every field and the submit payload exactly as they are** — see section 6. |
| `app/admin/categories/page.tsx` | Title **Menu sections**. Each section is a row in a `Panel`; the move/edit/delete icon buttons become 44px with `aria-label`s. |
| `app/admin/coupons/page.tsx`, `coupons/new`, `coupons/[id]`, `components/admin/coupon-form.tsx` | Same treatment. Active / expired as `StatusPill`. |
| `app/admin/reviews/page.tsx` | Filter tabs become `Segmented`, the same control as the orders tabs. Approve / Reject as real buttons. |
| `app/admin/customers/page.tsx` | Rows in a `Panel`; "Admin", "Google", "Unverified" as pills. |
| `app/admin/audit-log/page.tsx` | Rows in a `Panel`; action name in `font-mono text-sm`. |
| `app/admin/notifications/page.tsx`, `app/admin/settings/page.tsx` | Already in the new style. Swap in `AdminPageHeader`, `Panel`, `StatusPill`, `Field` so they match exactly. |

Add Arabic entries for every label these pages show; most have none today.

**Done when:** `grep -rn "text-headline\|text-body-\|text-button\|text-label-caps" Frontend/src/app/admin Frontend/src/components/admin`
returns nothing, and every admin page looks like the same product at 375px and
1366px.

---

## Phase 6 — Storefront polish

Do not redesign the home page, menu, dish page, cart, checkout or sign-in. They
are the reference for what "right" looks like here: `.page-shell`, `.eyebrow`,
`.surface`, `.action-primary`, `.action-secondary`, `.form-field`,
`font-heading`, rounded cards.

1. **Bring the leftover pages onto that style.** For each file below, replace
   the old template classes (`text-headline-*`, `text-body-*`, `text-button`,
   `text-label-caps`, `px-margin-*`, `py-stack-*`, `max-w-(--spacing-container-max)`,
   square uppercase buttons) with the reference classes above. Layout and
   content stay.
   `app/not-found.tsx`, `app/error.tsx`, `app/faq/page.tsx`,
   `app/privacy/page.tsx`, `app/terms/page.tsx`,
   `app/shipping-returns/page.tsx`, `app/track-order/page.tsx`,
   `app/account/orders/page.tsx`, `app/account/orders/[orderNumber]/page.tsx`,
   `app/account/settings/page.tsx`,
   `app/order-confirmation/[orderNumber]/page.tsx`,
   `app/checkout/result/result-content.tsx`,
   `app/checkout/payment-callback/payment-callback-content.tsx`,
   `components/products/recently-viewed.tsx`,
   `components/products/related-products.tsx`,
   `components/products/reviews-section.tsx`.
   The long text pages (FAQ, privacy, terms, delivery information) share one
   pattern: `.page-shell`, a `max-w-2xl` column, `.eyebrow` + `font-heading`
   title, `text-base leading-7` body, `font-heading text-xl` section headings.
2. **`components/orders/order-status-badge.tsx`:** rounded pill, sentence case,
   using the Phase 1 tokens (cancelled and failed → danger, paid / delivered →
   success, the rest neutral). It is used on the account and tracking pages.
3. **Sentence case** in customer copy: "Track your order", "Find order",
   "Order number", "Page not found", "Back to home". Rename the matching
   dictionary keys (section 4).
4. **Shorter phone header:** in `components/layout/site-header.tsx` make the
   main bar `h-14` below `sm` (it is 72px), and change `--header-height` in
   `globals.css` to match (32 + 56 = 88px below `lg`). `scroll-padding-top` and
   the sticky menu section bar read that variable, so check on `/menu` that the
   section pills sit flush under the header and that tapping a section lands on
   its heading.
5. **Home, "What are you craving?":** turn the row of text pills into tiles —
   `grid grid-cols-2 gap-3 sm:grid-cols-4`, each a `rounded-2xl` link with the
   section's `image` filling a 4:3 area and the name beneath. A section without
   an image gets a `bg-secondary` area with the `UtensilsCrossed` icon. No new
   API call; `getCategoryTreeServer()` already returns `image`.
6. **Tidy the one-offs:** replace `rounded-[1.35rem]`, `rounded-[1.5rem]` with
   `rounded-2xl` and `rounded-[2rem]` with `rounded-3xl`; raise customer-facing
   text under 12px to `text-xs` (find it with
   `grep -rnE "text-\[(9|10|11)px\]|text-\[0\.[56]" Frontend/src`). The brand
   tagline and the announcement bar may stay at 10–11px.
7. **Remove dead tokens** from `globals.css` once nothing uses them: the
   "Stitch" spacing and type tokens, and the `--sidebar-*` / `--chart-*` sets.
   Grep before deleting each one.

**Done when:** `grep -rn "text-headline\|text-body-\|text-button\|text-label-caps\|margin-mobile\|stack-xl" Frontend/src`
returns nothing; `/menu` section navigation still lands correctly on a phone;
the 404 page and the FAQ look like the menu page's siblings.

---

## Phase 7 — Final check

1. `npm run lint --prefix Frontend` clean.
2. `npm run build --prefix Frontend` passes (keep the mock API running; the
   build reads the menu from `API_ORIGIN`).
3. Walk every route at 375px, 768px and 1366px, in English and then Arabic:
   all `/admin/*` pages with the mock, then home, menu, a dish, cart, track
   order, sign-in, FAQ, a made-up URL for the 404.
4. In Arabic: no English left on the staff screens except customer data; the
   layout mirrors; phone numbers still read left to right.
5. Keyboard only: tab through the board, confirm an order, open and cancel the
   InstaPay dialog (Escape closes it, focus returns to the button).
6. Browser console clean on every page.
7. `git status` shows no `.env.local` and nothing under `.claude/`.

---

## 6. Left out on purpose — needs the owner's decision

These came up in the review. They are not design work, so they are not in the
phases above. Do not start them without being asked.

- **The dish editor is still a clothing-store form.** It has Color, Style
  group and S–2XL stock fields, its category picker assumes two levels
  ("Men > Hoodies"), and it cannot edit what the menu actually uses: variants,
  add-on groups, dietary tags, availability, preparation time. Phase 5 only
  restyles it. Replacing it is a feature of its own.
- **Staff cannot reject or cancel an order.** Only the customer can cancel. A
  "Can't fulfil this order" action needs a backend endpoint.
- **"Today" numbers on the Overview** (orders and revenue today) need the
  `/admin/dashboard` endpoint to return them; it only has all-time totals.
- **Out for delivery / Delivered steps.** The backend still accepts them, the
  staff flow deliberately stops at Confirm, and the customer tracking page
  shows four steps. Worth deciding whether tracking should show fewer steps or
  staff should get more buttons.
