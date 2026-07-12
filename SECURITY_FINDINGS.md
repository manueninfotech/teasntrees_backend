# Security & correctness findings — 2026-07-12

Backend audit of `teasntrees_backend`. Everything below was **verified against
production**, not inferred from reading code.

Findings are grouped by who owns them. Everything in "Already fixed" is committed,
deployed and re-verified; the **Admin panel** section is the part that needs the
team, because the fixes live outside this repo.

---

## 🔴 Needs the team — admin panel / infrastructure

### 1. `ADMIN_WHITELIST_IPS` is empty in production
Production logs, on every admin request:

```
[warn]: Admin IP whitelist not configured - allowing all IPs
```

`checkAdminIP` only enforces when `NODE_ENV=production` **and** the list is
non-empty. It was cleared during development and never restored, so the admin
panel is reachable from any IP on the internet (still behind JWT + `checkRole`,
but the IP guard is doing nothing).

**Fix:** set `ADMIN_WHITELIST_IPS` on the VM to the office/VPN IPs and restart.
`req.ip` is the true client IP (`trust proxy` + nginx `X-Forwarded-For`), so
entries should be real public IPs.

### 2. Credentials that must be rotated
- **VM admin password** — was pasted into a chat transcript.
- **Google Maps API key** (`AIzaSy…vls`) — a dev key, currently unrestricted.
  Should become **two** keys (one per app), each restricted by package name +
  SHA-1, with only the APIs each app needs enabled.

### 3. No brute-force lockout on accounts
`User.loginAttempts` and `User.lockUntil` exist on the schema but **no code reads
or writes them** — they are dead fields.

Low priority in practice: rider PIN login is rate-limited (`pinLimiter`, 8 per
15 min per IP+mobile), and admin/manager sign in through Firebase so there is no
password to guess. Worth implementing if password login is ever added.

### 4. Backups
Not investigated. Confirm the Atlas cluster (`ix2iee1`) has automated backups and
a tested restore. There is no application-level backup.

---

## ✅ Already fixed, deployed, verified — admin/manager side

Listed so the team knows what changed under them.

### Manager image upload/delete was completely UNAUTHENTICATED (critical)
Verified live, with **no token at all**:

```
DELETE /api/teasntrees/manager/upload/image
→ 200 {"success":true,"message":"Image deleted successfully"}
```

Anyone on the internet could **delete product photos, category art and brand
logos**, and POST arbitrary images into storage.

*Why it hid:* every other manager route is protected inside its own sub-router.
These two were mounted straight onto `routes/manager/index.js`, which only applied
`brandGuard` — so they inherited no authentication. The equivalent *customer*
upload routes had been locked down earlier; this pair was missed **because it
doesn't live in a sub-router with the others**.

Now `authenticate + checkRole(['manager','admin'])`. Re-verified → `401`.

> **Lesson for future audits:** check what is mounted *directly on an index*, not
> just what's inside the sub-routers.

### Manager brand isolation had never worked (critical)
`brandGuard` compares `req.user.brand` against the brand in the URL and 403s on a
mismatch — but it was mounted **before** `authenticate`, which runs inside each
sub-router. So `req.user` was undefined, the guard hit its own
`if (!req.user) return next()`, and waved everything through. It had never blocked
a single request.

The controllers serve data by `req.activeBrand`, taken from the URL. So a **Little H
manager with a legitimate token could call `/api/teasntrees/manager/orders`** and
read *and modify* the other brand's orders, products, categories, customers and
riders. (Login *does* reject a cross-brand login — but that guards logging in, not
what the token reaches afterwards.)

Demonstrated against the middleware directly:

```
brandGuard({ activeBrand: 'teasntrees' })                       → ALLOWED  ✗
brandGuard({ activeBrand: 'teasntrees',
             user: { role: 'manager', brand: 'littleh' } })     → BLOCKED  ✓
```

The logic was always correct; it was wired in before the thing it depends on.
`authenticate` now runs first. **Admin was never affected** (its index applies
`authenticate` before the sub-routes, and admins carry no brand).

### `manager/profileRoutes` had no role check
Authenticated but never checked the role, so any signed-in **customer or rider**
could reach it. It only writes `name`/`email`/`address` against the caller's own
id — not a privilege escalation — but it had no business being reachable. Fixed.

### Payouts
- **The payout amount was never recorded anywhere.** `isPaid` flag + reference +
  a *count* in the activity log. No financial record of money leaving the
  business; reconciliation was impossible from the app's own data. Now sums
  `totalEarning` **before** the update flips `isPaid` (afterwards the filter no
  longer matches and the sum comes back zero) and carries it into the response,
  the activity log, the socket event and the push.
- The rider-facing socket message read
  `Your payout of ₹${result.modifiedCount} deliveries` — **a rupee sign in front
  of a count**. A rider paid ₹2,000 across 5 jobs was told **"₹5"**.
- Both payout handlers filtered by brand by loading the `_id` of **every order in
  the brand** into an `$in`. Fine at 22 deliveries; a multi-megabyte query at
  scale, and it grows forever. `Delivery` carries its own `brand` — verified
  populated on all 22 production deliveries (including all 15 delivered-and-unpaid),
  so nothing is silently skipped and left unpaid.

### `admin.cancelDelivery` existed but was never routed
…and it never cleared `isOnDelivery`, so it would have left the rider flagged as
busy **forever**, silently receiving no further orders. Routed and fixed.

---

## Checked and found clean
- All customer `Order` queries are scoped to `customerId`; rider queries to `riderId`.
- Rider `getDocument` has an ownership check (no fetching another rider's Aadhaar).
- `pickupOtp` is never exposed to customers (only `deliveryOtp`, which is correct).
- Rider delivery status transitions are gated by an explicit `VALID_TRANSITIONS`
  state machine.
- Public image uploads are re-encoded through **sharp**, which rejects anything
  that isn't really an image, and takes the format from sharp's output rather than
  the client's `Content-Type` — so a disguised HTML/JS payload can't be stored.
- Admin routes carry `checkAdminIP` + `authenticate` + `checkRole(['admin'])`.
- Order cancellation is gated to `pending`.
- **No secrets in git history** — only `.env.example` was ever committed.

---

## Not investigated
- The **admin panel frontend** (separate repo, never seen).
- Manager controller internals beyond route authorization.
- `npm audit` / dependency CVEs.
- iOS builds.
- nginx/TLS hardening beyond the existing config.
