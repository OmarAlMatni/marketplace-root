# Marketplace Admin Portal

A standalone React (Vite) app for staff only — separate codebase, separate
dev server (port 5174), separate login/session storage from the storefront
frontend. It talks to the *same* backend API as the storefront.

## Pages

- **Dashboard** (`/`) — KPI cards (today's sales, total revenue, total users,
  total products, pending-review count, paid orders), a 14-day revenue trend
  chart, a most-popular-products chart, and a best-selling-accounts table.
- **Listing Moderation** (`/moderation`) — approve pending listings or reject
  them with required feedback the seller sees on their own dashboard.
- **Users** (`/users`) — search, ban/unban, or delete regular user accounts.
- **Admin Accounts** (`/accounts`, super_admin only) — create or delete
  `admin` accounts.

## Access control

- The login screen calls the same `/api/auth/login` endpoint the storefront
  uses, then **rejects** the login client-side if the returned account isn't
  `admin` or `super_admin` — a regular buyer/seller account can authenticate
  against the API but will never get past this screen.
- Every route except `/login` is wrapped in `RequireStaff`; `/accounts` has
  an additional `RequireSuperAdmin` layer.
- The auth token is stored under a different localStorage key
  (`marketplace_admin_auth`) than the storefront's (`marketplace_auth`), so
  you can be logged into both apps in the same browser at once without
  either one clobbering the other's session.
- `requireAuth` on the backend re-checks the account's role/status on every
  request, so if a super_admin demotes/deletes an admin, that admin's
  current session stops working immediately — not just after their token
  expires.

## Getting started

```bash
cd admin-frontend
cp .env.example .env       # VITE_API_BASE_URL should point at your backend
npm install
npm run dev                # starts on http://localhost:5174
```

You'll need at least one `admin` or `super_admin` account to sign in with —
see the backend README for `npm run create-super-admin`.

## Backend change required

The backend's CORS config only allowed one origin by default. It needs to
also allow `http://localhost:5174` (or wherever you deploy this app) —
see the updated `backend/server.js` / `backend/.env.example` provided
alongside this project. Set `ADMIN_CLIENT_ORIGIN` in the backend's `.env` to
this app's URL.

## Notes

- Product images come back from the API as relative paths like
  `/uploads/xyz.jpg`. Since this app runs on a different origin than the
  API, `src/utils/media.js` prefixes those with `VITE_API_BASE_URL` before
  rendering an `<img>`.
- This app intentionally has no cart, checkout, or chat — it's staff-only
  tooling, not a second storefront.
