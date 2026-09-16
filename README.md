# Restaurant Ordering Website

A full-stack restaurant ordering system — menu catalog, cart,
checkout with card and cash-on-delivery payments, order tracking, and an admin
dashboard.

## Stack

**Backend** — NestJS 10, MongoDB (Mongoose), JWT auth in httpOnly cookies with
per-device refresh-token rotation, Paymob card payments, Nodemailer, Zod
validation, Swagger.

**Frontend** — Next.js 16 (App Router, Turbopack), React 19, TanStack Query,
Tailwind CSS v4, shadcn/ui, React Hook Form, Zustand.

## Features

- Catalog with categories, subcategories, search, filtering, and sale pricing
- Server-authoritative cart — prices and stock are always re-read from the
  database, never trusted from the client
- Checkout with stock reservation, idempotent order creation, and coupons
- Paymob card payments with HMAC-verified webhooks, plus cash on delivery
- Accounts: email/password with OTP verification, Google OAuth, password reset,
  addresses, order history, wishlist
- Reviews, newsletter signup, and back-in-stock notifications
- Admin area: dashboard, products, stock movements, orders, categories,
  coupons, customers, reviews, settings, and an audit log

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a connection string to a hosted instance)

## Setup

Install dependencies for each app separately — this is not a monorepo, and there
is no root package manifest.

```bash
cd Backend && npm install
cd ../Frontend && npm install
```

### Backend environment

Copy the example file and fill it in:

```bash
cd Backend && cp .env.example .env
```

`MONGODB_URI` and `JWT_SECRET` are required — `JWT_SECRET` must be at least 32
characters. Generate one with:

```bash
openssl rand -base64 48
```

Email, Google OAuth, and Paymob variables are optional; card checkout stays
disabled unless all four `PAYMOB_*` values are set. The server validates its
environment on boot and refuses to start with an invalid config.

### Frontend environment

Create `Frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3100
NEXT_PUBLIC_SITE_URL=http://localhost:3101
```

### Seed the database

Categories must be seeded before products, since products resolve their category
by slug.

```bash
cd Backend
npm run seed:categories
npm run seed:products
```

Product image URLs are built from `FRONTEND_URL` at seed time, so set that to the
right origin before seeding.

## Running

Start the backend first — the frontend's initial requests will fail until the API
is up.

```bash
cd Backend && npm run start:dev    # http://localhost:3100
```

```bash
cd Frontend && npm run dev         # http://localhost:3101
```

Swagger docs are served at `http://localhost:3100/api` in non-production
environments only.

## Tests

```bash
cd Backend && npm test
```

## Deployment

The two halves deploy to different places, for a reason worth stating: the
backend runs in-process cron jobs (`orders.scheduler.ts` releases stock from
abandoned card checkouts every minute) which need a host that keeps a process
alive. A serverless platform would never run them, and inventory reserved by an
abandoned checkout would never come back.

- **Frontend → Vercel.** Root directory `Frontend`.
- **Backend → Render.** See `render.yaml`; it deploys `Backend` as a web service.
- **Database → MongoDB Atlas.** A cloud backend cannot reach a database on your
  laptop, so local MongoDB is development-only.

### Moving the database to Atlas

Create a free M0 cluster, add a database user, and allow network access. Then
copy the local data up:

```bash
cd Backend
SOURCE_URI="mongodb://localhost:27017/restaurant-ordering" \
TARGET_URI="mongodb+srv://USER:PASS@CLUSTER.mongodb.net/restaurant-ordering" \
node scripts/migrate-database.js
```

Re-running is safe — documents are matched on `_id` and replaced. Pass `--drop`
to make the target mirror the source exactly. Indexes are not copied; the app
builds them from its Mongoose schemas on first start.

### Environment variables

On Render (`render.yaml` lists the rest; these are the ones marked `sync:false`):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | the Atlas connection string |
| `JWT_SECRET` | 32+ chars — `openssl rand -base64 48` |
| `FRONTEND_URL` | the Vercel site URL; comma-separate several to allow preview domains |
| `BREVO_API_KEY` | see *Email in production* below |
| `MAIL_FROM_ADDRESS` | the sender address verified with Brevo |

On Vercel:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | the Render service URL |
| `NEXT_PUBLIC_SITE_URL` | the Vercel site URL |

`FRONTEND_URL` and `NEXT_PUBLIC_API_URL` point at each other. Getting either
wrong shows up as a CORS error in the browser rather than a failed build.

### Email in production

Gmail over SMTP is fine locally and does not work on a managed host: free Render
instances block outbound traffic on ports 25, 465 and 587, so mail silently goes
nowhere while everything looks healthy. `EmailService` therefore has two
transports and picks whichever is configured, preferring Brevo:

| Transport | When | Configured by |
| --- | --- | --- |
| Brevo HTTP API | production | `BREVO_API_KEY`, `MAIL_FROM_ADDRESS` |
| Gmail SMTP | local development | `EMAIL_USER`, `EMAIL_PASSWORD` |

Brevo verifies a **single sender address**, not a whole domain, so this works
before you own a brand domain — verify the address under *Senders* and use it as
`MAIL_FROM_ADDRESS`. The free tier allows 300 messages a day.

Whichever transport is active is logged at startup, along with whether it could
be reached, so "no email arrived" is answerable from the logs rather than by
guesswork.

### Why the cookies change in production

Auth cookies are `SameSite=Lax` in development, where the site and API share
`localhost` and are therefore same-site. Deployed they sit on different domains,
which makes every request cross-site, and a Lax cookie is not sent on those —
login would appear to succeed and every request after it would arrive signed
out. `AuthController` switches to `SameSite=None; Secure` when `NODE_ENV` is
`production`, which browsers only accept over HTTPS. Both hosts serve HTTPS, so
this works, but it does mean the API cannot be tested over plain HTTP in
production mode.

## Notes

Product and category images are served by the frontend itself out of
`Frontend/public/images`, as root-relative paths. Nothing is fetched from another
origin, so `next.config.ts` needs no `remotePatterns` — deployed, Vercel serves
and optimizes these files like any other static asset. Moving the photos to an
image host later means adding that host to `remotePatterns`.

`products_imgs/` at the repo root holds the original source photography and is
not used at runtime.

## Troubleshooting

**Images or pages fail to load after an abrupt shutdown.** If the dev server was
killed rather than stopped, Next.js's build cache can be left locked, producing
`EPERM: operation not permitted` rename errors on the next start. Delete
`Frontend/.next` and start again.

**The site loads but nothing works, and half the homepage is missing.** Check
the address bar: Next serves `/_next/*` only to the origin the dev server was
addressed by, and the API's CORS allowlist is pinned to `FRONTEND_URL`. Opening
the site as `127.0.0.1:3101` rather than `localhost:3101` fails both checks —
the HTML renders, no JavaScript loads, and every API call is blocked. Use
`localhost`.

**Atlas connections hang forever, in Compass and in the app.** A
`mongodb+srv://` string needs two DNS lookups: an SRV record for the server
list and a TXT record for the connection options. Some home routers and ISP
resolvers answer the first and silently drop the second, which surfaces as
`queryTxt ETIMEOUT` or a spinner that never resolves. Either set your DNS
servers to `1.1.1.1` / `8.8.8.8`, or use the non-SRV connection string Atlas
offers under "Connect → Drivers → older version", which lists the hosts
directly and needs no TXT lookup.
