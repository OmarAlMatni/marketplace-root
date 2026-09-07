# P2P Marketplace — Full-Stack Reference Build

A decoupled marketplace: an Express/PostgreSQL API server and a React/Zustand/Tailwind storefront, in one repo.

```
marketplace-root/
├── backend/     Express API + Socket.io + Stripe + PostgreSQL
└── frontend/    React (Vite) + Zustand + Tailwind CSS
```

## Roles & admin system

Three roles: `user` (default, can buy and sell), `admin` (moderates listings, manages user accounts), `super_admin` (everything admin can do, plus creates/deletes admin accounts). Public registration can only ever create `user` accounts.

- **Admin dashboard** (`/admin`) — KPI cards (today's sales, total revenue, total users, total products, pending-review count, paid order count), a 14-day revenue trend chart, a most-popular-products chart, and a best-selling-accounts table. All figures are computed from real aggregate SQL queries (`repositories/analyticsRepository.js`) over `status = 'paid'` orders — nothing is mocked.
- **Product moderation** (`/admin/products`) — every new or edited listing from a regular seller goes to `status: 'pending'`. Only `'approved'` listings show in the public catalog. Admins approve or reject with required feedback the seller sees on their own dashboard (`/sell`).
- **User management** — admins view/search users, ban (blocks login immediately — see below) or delete accounts at `/admin/users`. Staff accounts are managed separately and can't be banned/deleted from this screen.
- **Admin accounts** — only a `super_admin` can create or delete `admin` accounts, at `/admin/accounts`.
- **Bootstrapping the first super admin** — since nothing can create one through the UI, run:
  ```bash
  cd backend
  npm run create-super-admin -- owner@example.com "a-strong-password" "Site Owner"
  ```
- **Immediate ban enforcement** — `requireAuth` re-checks the user's status in the database on every request (not just at login), so a ban or account deletion takes effect on the user's very next request, not just after their JWT expires.

## What's implemented

**Backend**
- Layered architecture: `routes → controllers → services → repositories`
- JWT auth (`/api/auth/register`, `/login`, `/me`) with bcrypt password hashing
- Product CRUD with deep filtering (category, price range, search, sort, pagination, moderation status) — `repositories/productRepository.js`
- **Image uploads** — `config/upload.js` (multer) accepts a real image file (`multipart/form-data`, field `image`) on listing create/update, validates type (JPEG/PNG/WEBP/GIF) and 5MB size limit, stores it under `backend/uploads/`, served at `/uploads/<file>`. Replacing or deleting a listing's image cleans up the old file from disk.
- **Flash-sale-safe checkout** — `services/checkoutService.js` wraps the whole cart in one DB transaction and takes `SELECT ... FOR UPDATE` locks on every product row before decrementing stock, so concurrent buyers can never oversell the same item. Products are locked in a fixed sorted order to avoid deadlocks.
- **Stripe webhook pipeline** — `routes/webhookRoutes.js` mounts `express.raw()` *before* the global `express.json()` so `stripe.webhooks.constructEvent()` can verify the signature; `payment_intent.succeeded` flips the matching order to `paid`.
- **P2P live chat** — `sockets/chatSocket.js`: JWT-authenticated Socket.io connections, `join_room` / `send_message` events, messages broadcast instantly via `io.to(room_id).emit()` and persisted to Postgres asynchronously. Every user also auto-joins a personal `user:<id>` room for cross-page `new_notification` events.
- **Fail-safe boot** — `config/env.js` crashes on startup with a clear message if `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `JWT_SECRET` are missing.
- Hardening: `helmet`, `express-rate-limit` (general + tight limiters on auth/checkout), centralized error handler.

**Frontend**
- Views: catalog, product detail, cart, checkout, live chat, seller dashboard, login/register
- `useCartStore` — Zustand cart backed by the native `BroadcastChannel` API, so adding/removing items syncs instantly across every open tab, no reload
- `useURLFilters` — catalog filters (category, price, search, sort, page) live in `URLSearchParams`, so the catalog view is bookmarkable/shareable
- `useWebSockets` — one Socket.io connection per session; wires up `new_message` and `new_notification`
- Tailwind skeleton loaders on the catalog grid and product page while data loads

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, STRIPE keys, JWT_SECRET
npm install
npm run migrate                                                    # applies db/schema.sql (safe to re-run on an existing DB — adds new columns)
npm run create-super-admin -- you@example.com "a-strong-password"  # bootstraps the first super_admin
npm run dev                                                        # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

### 3. Stripe webhooks locally

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```
Copy the `whsec_...` value it prints into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

## Applying this update to an existing checkout

If you already had the earlier version of this project:

1. Delete `frontend/src/views/AdminDashboard.jsx` — it's replaced by `frontend/src/views/SellerDashboard.jsx` (same "manage my own listings" purpose, now with real image upload and status/feedback).
2. Re-run `npm run migrate` in `backend/` — `db/schema.sql` now uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run again against a database that already has the old tables.
3. Run `npm run create-super-admin -- ...` once to get your first super_admin login.
4. `npm install` again in `backend/` to pick up the new `multer` dependency.

## Notes / next steps for a production deploy

- The checkout endpoint returns a Stripe `clientSecret`; wire it into Stripe.js/Elements on `CheckoutView.jsx` to actually collect a card and trigger the `payment_intent.succeeded` webhook.
- `payment_intent.payment_failed` currently only logs — extend `checkoutService.handleStripeEvent` to restock inventory and mark the order `cancelled`.
- Add image uploads (S3/Cloudinary) instead of raw `imageUrl` strings.
- Add refresh tokens / shorter JWT expiry + rotation for production auth hardening.
- Add integration tests around the checkout transaction (concurrent-request test is the important one, given the row-locking logic).