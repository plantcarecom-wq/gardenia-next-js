# Hortist — Task Breakdown (v1.0)

Companion to `requirements.md`. Organized in phases; phases are mostly sequential, tasks within a phase can often run in parallel across two developers. Sizing: **S** = <½ day, **M** = ~1–2 days, **L** = ~3+ days.

Legend: 🔒 = touches the Services/Malli module (build it, but keep it behind the flag from the first commit that introduces it).

---

## Phase 0 — Project Setup & Foundations

- [x] **0.1** (S) Init Next.js (App Router) + TypeScript project; ESLint/Prettier; strict `tsconfig`
- [x] **0.2** (S) Install & configure Tailwind + ShadCN; set up base design tokens
- [x] **0.3** (S) Install Zustand; set up `/shared/store` with an empty root pattern (slices added per-feature later)
- [x] **0.4** (M) `/config/env.ts` — Zod-validated env parsing, fail-fast on boot with a readable error listing missing/invalid vars
- [x] **0.5** (S) `/config/feature-flags.ts` — single typed accessor for `SERVICES_MODULE_ENABLED` (server) and its client mirror; add a boot-time check that warns if server/client values diverge
- [x] **0.6** (M) MongoDB Atlas cluster provisioned (dev + prod), connection module with pooled/cached client for serverless (`/shared/lib/db.ts`)
- [x] **0.7** (S) `.env.example` fully populated per requirements §10, with comments (incl. the "don't use `local` on Vercel" warning)
- [x] **0.8** (S) Repo scaffolding per architecture in requirements §8 (`/modules`, `/shared`, `/config`)
- [x] **0.9** (S) CI basics: type-check + lint on push (GitHub Actions or Vercel checks)
- [x] **0.10** (S) Vercel project connected, preview deployments working end-to-end (even with an empty homepage)

---

## Phase 1 — Identity, Auth & RBAC

- [x] **1.1** (M) `users` Mongoose schema + `IUserRepository` interface + implementation
- [x] **1.2** (M) Auth.js/NextAuth setup — credentials provider, JWT session with role embedded
- [x] **1.3** (S) Password hashing utility (bcrypt/argon2), never store plaintext
- [x] **1.4** (M) Registration endpoint (Customer) + Zod schema + validation tests
- [x] **1.5** (M) Login endpoint + session handling
- [x] **1.6** (M) Route-group middleware guards: `(customer)`, `(malli)` 🔒, `(admin)` — redirect/deny based on role
- [x] **1.7** (M) API-level auth guard helper (`requireRole(...)`) used by every route handler
- [x] **1.8** (S) Admin bootstrap seed script using `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`
- [x] **1.9** (M) Password reset flow (token generation/consumption; delivery mechanism deferred per requirements §11.4 — admin-assisted fallback for now)
- [x] **1.10** (S) `addresses` schema + CRUD for a customer's saved addresses

**Acceptance for Phase 1:** a Customer and a Super Admin can register/login, sessions persist, protected routes correctly reject the wrong role (verified for both UI and raw API calls).

---

## Phase 2 — Category & Category Type Management

- [x] **2.1** (M) `category_types` schema + repository + `categoryTypeCode` normalize/validate util (shared with 2.2)
- [x] **2.2** (M) `categories` schema + repository + `categoryCode` normalize/validate util (requirements §4.2/4.3, unit-tested against edge cases: leading/trailing space, double space, mixed case, symbols)
- [x] **2.3** (M) Admin API: CRUD for CategoryType (`domain` field enforced enum)
- [x] **2.4** (M) Admin API: CRUD for Category (enforce parent CategoryType exists; enforce unique `categoryCode`)
- [x] **2.5** (S) Soft-deactivate flow (isActive toggle) instead of hard delete when a category has products/listings
- [x] **2.6** (L) Admin UI: CategoryType list/create/edit screen
- [x] **2.7** (L) Admin UI: Category list/create/edit screen (nested under a type, code auto-preview as admin types the name)
- [x] **2.8** (S) Seed script: baseline PRODUCT-domain category types/categories (Indoor Plants, Outdoor Plants, Pots & Planters, Fertilizers & Soil, Garden Tools) + 🔒 baseline SERVICE-domain ones (created but inert while flag is off)

**Acceptance for Phase 2:** Admin can create a CategoryType and Category from the UI; typing "lawn mowing" auto-produces `LAWN_MOWING`; duplicate codes are rejected with a clear error; SERVICE-domain categories exist in the DB but are excluded from any public API response while the flag is off.

---

## Phase 3 — Product Catalog

- [x] **3.1** (M) `products` schema + repository, indexed on `categoryId`, `isActive`, unique `slug`
- [x] **3.2** (M) Admin API: create/update/deactivate product; Zod validation (price ≥ 0, stock ≥ 0, etc.)
- [x] **3.3** (M) Public API: list/search/filter products (by category, price range, attributes, text search on name)
- [x] **3.4** (S) Public API: product detail by slug
- [x] **3.5** (L) Admin UI: product list (table, filter, pagination) + create/edit form (multi-image upload via media abstraction — see Phase 8)
- [x] **3.6** (L) Storefront UI: category browse page, filter/sort sidebar, product grid, pagination
- [x] **3.7** (M) Storefront UI: product detail page (gallery, price, stock, attributes, reviews section placeholder)
- [x] **3.8** (S) Featured products section on homepage

**Acceptance for Phase 3:** Admin creates a product under a category; it appears correctly filtered/searchable on the storefront; deactivating it removes it from public listing without deleting historical order references (tested once Phase 4 exists).

---

## Phase 4 — Cart, Checkout & Orders (COD)

- [x] **4.1** (M) `carts` schema + repository; add/update/remove item endpoints; price snapshot on add
- [x] **4.2** (S) Zustand cart slice mirroring server cart for snappy UI, reconciled on load
- [x] **4.3** (L) `PaymentProvider` interface + `CodProvider` implementation (requirements §9.3) — checkout flow calls the interface, not COD logic directly
- [x] **4.4** (M) `orders` schema + repository; `orderNumber` generator; `statusHistory` append logic
- [x] **4.5** (M) Checkout API: address selection → order creation → cart clear, wrapped in a DB transaction where the driver/tier supports it
- [x] **4.6** (M) Cart UI (drawer or page): quantity edit, remove, subtotal
- [x] **4.7** (M) Checkout UI: address pick/add, order summary, COD confirmation
- [x] **4.8** (M) Customer order history list + order detail page (static view first; live tracking in Phase 6)
- [x] **4.9** (L) Admin order management: list/filter by status, detail view, status-advance action with note
- [x] **4.10** (S) `site_settings`-driven delivery fee calculation stub (flat-rate default; see requirements §11.2 open item)

**Acceptance for Phase 4:** Customer completes a full checkout via COD; order appears in both customer history and Admin order list with correct status; Admin can advance status and it's reflected server-side with a recorded history entry.

---

## Phase 5 — Notification System (foundation, in-app)

- [ ] **5.1** (M) `notifications` schema + repository + TTL index (requirements §9.1)
- [ ] **5.2** (M) `NotificationChannel` interface + `InAppChannel` implementation; a `NotificationService` that other modules call (e.g. `notify(userId, type, payload)`) — never write directly to the collection from unrelated modules
- [ ] **5.3** (S) Wire order-status transitions (Phase 4) to emit notifications via the service
- [ ] **5.4** (M) `GET /notifications/poll?since=` long-poll endpoint (baseline, reliable path per §9.4)
- [ ] **5.5** (M) `GET /notifications/stream` SSE endpoint layered on the same change-detection source
- [ ] **5.6** (S) Mark-as-read / mark-all-as-read endpoints
- [ ] **5.7** (M) Zustand notifications slice + client hook that prefers SSE, falls back to polling on failure/unsupported environments, auto-reconnects
- [ ] **5.8** (M) Bell icon + dropdown/panel UI with unread badge, pagination, mark-read interactions

**Acceptance for Phase 5:** placing/advancing an order produces an in-app notification that appears live (within the polling/stream interval) without a page refresh, and reappears correctly on reload.

---

## Phase 6 — Order Tracking (Realtime)

- [ ] **6.1** (M) `GET /orders/:id/track/poll?since=` — long-poll, authorized to owner/Admin only
- [ ] **6.2** (M) `GET /orders/:id/track/stream` — SSE, same authorization, self-closing/reconnecting per §9.4
- [ ] **6.3** (M) Client tracking hook (SSE-preferred, polling-fallback) reusable for Phase 9's service-request tracking
- [ ] **6.4** (M) Order tracking timeline UI component (status steps, timestamps, notes)
- [ ] **6.5** (S) Wire timeline into the order detail page from Phase 4

**Acceptance for Phase 6:** opening an order detail page and having Admin advance its status in another session updates the customer's timeline live, without a manual refresh, using SSE where available and polling otherwise.

---

## Phase 7 — Reviews & Ratings

- [ ] **7.1** (M) `reviews` schema + repository (polymorphic `targetType`/`targetId`)
- [ ] **7.2** (M) Submit-review API: enforce one review per customer per target; enforce eligibility (product must be in a `DELIVERED` order)
- [ ] **7.3** (S) Rating aggregation update on write (denormalized `ratingAverage`/`ratingCount` on Product; §9.1 tradeoff documented in code)
- [ ] **7.4** (M) Review UI on product detail page (list + submit form, gated by eligibility)

**Acceptance for Phase 7:** a customer with a delivered order can leave exactly one review for that product; the product's average rating updates immediately.

---

## Phase 8 — Media Storage Abstraction

- [ ] **8.1** (M) `MediaStorageProvider` interface; `CloudinaryProvider` implementation (upload, delete, transformation URL helper)
- [ ] **8.2** (M) `LocalStorageProvider` implementation, with a boot-time loud warning if selected while `VERCEL` env is detected (§9.5)
- [ ] **8.3** (S) Provider factory keyed off `MEDIA_STORAGE_PROVIDER`
- [ ] **8.4** (M) `media` collection + upload API endpoint (auth required, size/type validated)
- [ ] **8.5** (S) Client-side image compression/resize before upload (product/profile images)
- [ ] **8.6** (S) Reusable `<ImageUploader>` UI component wired to the endpoint, used by Product form (Phase 3) and later Malli/service forms (Phase 9)

**Acceptance for Phase 8:** switching `MEDIA_STORAGE_PROVIDER` between `cloudinary` and `local` in dev requires no code change, only env + restart; Cloudinary is confirmed working from a live Vercel preview deploy.

---

## Phase 9 — 🔒 Services Module (Malli) — build fully, ship hidden

> Every task in this phase must be verified twice: once with `SERVICES_MODULE_ENABLED=true` (functions correctly) and once with it `=false` (API returns 404, UI shows no trace — nav items, routes, and CTAs all absent).

- [ ] **9.1** (M) `malli_profiles` schema + repository (exists regardless of flag; only *access* is gated)
- [ ] **9.2** (L) Malli self-registration flow: profile form (bio, service areas, experience, verification documents via Phase 8 uploader) → status `pending`
- [ ] **9.3** (M) Admin verification screen: approve/reject Malli, view documents, set `verificationStatus`
- [ ] **9.4** (M) `service_offerings` schema + repository, categoryId constrained to `domain=SERVICE` categories
- [ ] **9.5** (L) Malli dashboard: create/edit/deactivate own service offerings
- [ ] **9.6** (M) Storefront: browse services by category (only rendered/reachable when flag on); Malli public profile page (bio, rating, offerings)
- [ ] **9.7** (L) `service_requests` schema + repository; support both `assignmentMode` values (requirements §5.6)
- [ ] **9.8** (M) Customer flow A: pick a specific Malli → create request with `status=ASSIGNED`
- [ ] **9.9** (M) Customer flow B: submit an open request → `status=PENDING_ASSIGNMENT`
- [ ] **9.10** (M) Admin assignment screen: list `PENDING_ASSIGNMENT` requests, assign a Malli
- [ ] **9.11** (M) Malli inbox: accept/reject assigned requests; reject → falls back to `PENDING_ASSIGNMENT`
- [ ] **9.12** (M) Status-advance API for Malli/Admin (`ACCEPTED → IN_PROGRESS → COMPLETED`, plus `CANCELLED`)
- [ ] **9.13** (S) Wire service-request status transitions into the Notification service (Phase 5) — new request, assignment, status changes
- [ ] **9.14** (M) Reuse Phase 6's realtime tracking pattern for `/service-requests/:id/track/*`
- [ ] **9.15** (M) Malli review flow reusing Phase 7's `reviews` collection (`targetType=MALLI`)
- [ ] **9.16** (S) Nav/CTA visibility audit: "Become a Malli", "Request a Service" links only render when `NEXT_PUBLIC_SERVICES_MODULE_ENABLED=true`
- [ ] **9.17** (S) API 404 audit: every Malli/service-request/service-offering route returns 404 when the server flag is off — written as an automated test, not a manual check

### Phase 9 (cont.) — Monetization, Subscription Packages & SLA (requirements §5.11–5.12)

- [ ] **9.18** (M) `site_settings` keys + Admin UI fields: `defaultServiceCommissionPercent`, `defaultMalliItemDiscountPercent`, `malliResponseSlaMinutes`
- [ ] **9.19** (M) `subscription_packages` schema + repository; `packageCode` normalize/validate (reuse the §4.2 code utility as-is)
- [ ] **9.20** (L) Admin API + UI: create/edit/deactivate packages (price, billing cycle, `commissionPercent`, `platformItemDiscountPercent`, perks[])
- [ ] **9.21** (M) `malli_subscriptions` schema + repository
- [ ] **9.22** (M) Malli-facing UI: browse available packages, "request to subscribe"
- [ ] **9.23** (M) Admin UI: activate/renew/cancel a Malli's subscription (manual, offline-payment-confirmed for v1)
- [ ] **9.24** (M) Pure, unit-testable resolver functions: `resolveMalliCommissionRate(malliId)` and `resolveMalliItemDiscount(malliId)` — active subscription first, else site-wide default
- [ ] **9.25** (M) Wire commission resolution + snapshot into service-request completion (`platformCommissionPercent`, `platformCommissionAmount`, `commissionSettlementStatus=PENDING`)
- [ ] **9.26** (M) Wire discount resolution + snapshot into checkout (Phase 4) whenever the purchasing account's role is `malli` — server-side only, never trust a client-sent discount
- [ ] **9.27** (M) Admin "Commission Ledger" report: per-Malli pending/settled totals, mark-settled action
- [ ] **9.28** (L) Vercel Cron config (`vercel.json`) + `CRON_SECRET`-protected sweep endpoint: find `ASSIGNED` requests past `malliResponseSlaMinutes`, auto-transition to `PENDING_ASSIGNMENT`, notify Malli + Admin
- [ ] **9.29** (S) Unit tests: rate-resolution functions (subscriber vs. non-subscriber vs. no-Malli-role edge case), SLA sweep transition logic

**Acceptance for Phase 9:** with the flag on, the full Malli lifecycle works end-to-end (register → verify → list a service → get requested via both matching modes → accept → complete → get reviewed) with live tracking and notifications; a completed job correctly snapshots the resolved commission rate for both a subscriber and non-subscriber Malli, and a Malli's own product purchase correctly applies their resolved discount; an ignored assigned request auto-escalates to Admin after the configured SLA. With the flag off, a determined user probing the raw API surface finds nothing — no 403s revealing the module exists, only 404s.

---

## Phase 10 — Admin Dashboard & Reports

- [ ] **10.1** (M) Dashboard metrics API: order counts by status, revenue (COD-collected), new signups (date-ranged)
- [ ] **10.2** (S) 🔒 Dashboard metrics: pending Malli approvals, open service requests (rendered only if flag on)
- [ ] **10.3** (M) Dashboard UI: metric cards + simple charts
- [ ] **10.4** (S) `site_settings` UI: delivery fee, min order amount (non-secret, DB-backed settings only — not feature flags)

---

## Phase 11 — Hardening, Testing, Deployment

- [ ] **11.1** (M) Unit tests for `categoryCode`/`categoryTypeCode` normalization (the highest-risk validation logic in the app)
- [ ] **11.2** (M) Unit tests for order/service-request status-transition guards (no illegal transitions)
- [ ] **11.3** (M) API auth tests: every protected route rejects wrong-role and unauthenticated calls
- [ ] **11.4** (M) Flag-off integration test suite for the entire Services module (Phase 9.17 formalized into CI)
- [ ] **11.5** (S) Rate limiting on auth + write-heavy endpoints
- [ ] **11.6** (S) Error boundary + consistent API error envelope across all routes
- [ ] **11.7** (M) Load-check the SSE/long-poll endpoints against Vercel function timeout behavior in a staging deploy (§9.4) — confirm graceful reconnect under a forced disconnect
- [ ] **11.8** (S) Production env checklist: Atlas cluster, Cloudinary creds, `AUTH_SECRET`, `CRON_SECRET`, flags both `false`, seed Super Admin only (no seed customers/products in prod)
- [ ] **11.9** (S) Final Vercel production deploy + smoke test (register → browse → checkout → track → notification received)
- [ ] **11.10** (S) Verify the Vercel Cron job (SLA sweep, task 9.28) actually fires on the deployed environment — it does **not** run under `next dev`, so this can only be confirmed post-deploy

---

## Suggested Sequencing Summary

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
                                                                                    │
                                                                                    ▼
                                                                    Phase 9 (🔒 parallelizable
                                                                    with 7/8/10 once Phase 5/6
                                                                    patterns exist to reuse)
                                                                                    │
                                                                                    ▼
                                                                    Phase 10 → Phase 11
```

Phase 8 (media) can actually start as early as Phase 3, since Product images need it — sequenced later here only for narrative clarity. Two-developer split suggestion: Dev A owns Phases 1–4 → 10–11; Dev B owns Phases 5–6 (realtime pattern) → 7–8 → then leads Phase 9 reusing Dev A/B's established patterns.
