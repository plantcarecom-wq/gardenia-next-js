# Hortist — Requirements Document (v1.0)

> Rebuild of plant.pk's concept (online plant marketplace + gardening services) as a clean, storage-optimized, role-based web app. Working name: **Hortist**. English locale only for v1; architecture kept locale-ready for the future.

**Locked decisions (from stakeholder input):**
| Decision | Choice |
|---|---|
| Frontend stack | **Next.js + React + TypeScript + Zustand + ShadCN (Tailwind)** |
| Malli ↔ Customer matching | **Both** — customer may pick a specific Malli, or submit a request and let Admin assign one |
| Payment (v1) | **Cash on Delivery (COD) only** — architecture must allow adding a gateway later without refactoring core checkout |
| Database | MongoDB, deployed as a **cluster** (MongoDB Atlas) |
| Hosting | Vercel |
| Media | Cloudinary (default) **or** local disk upload, switchable via env var |
| Realtime | In-app notifications + order/service tracking via **SSE with long-polling fallback** |
| Malli monetization | Flat % commission for non-subscribers; Admin-defined **subscription packages** give a reduced commission + bigger platform-item discount. No payment gateway yet → tracked and **settled offline** in v1 |
| Malli response SLA | **Auto-escalate to Admin** after a configurable timeout if an assigned Malli doesn't respond |

---

## 1. Vision & Scope

Hortist is a plant e-commerce marketplace (browse/buy indoor & outdoor plants, pots, fertilizers, tools) with an optional, currently-hidden **gardening-services marketplace** where independent service providers ("**Malli**" — gardener) can register and offer bookable services (lawn mowing, landscaping, pest control, garden design, etc.), matched to customers either by self-selection or Admin assignment.

**v1 launch scope:** plant/product e-commerce is fully live. The entire Malli/services vertical is built but **hidden behind a single environment flag**, so it ships in the codebase but is invisible to real users until the business is ready, and can be switched on with zero redeploy-time code changes (just an env var + restart).

### 1.1 Out of scope for v1 (explicitly deferred)
- Online payment gateways (Stripe/JazzCash/EasyPaisa) — COD only, but code must not hard-block adding this later (see §9.3 Payment abstraction)
- Multi-vendor product catalog (only Admin manages the plant/product catalog — Malli only sells *services*, never products)
- Multi-language / i18n (English only, but no hardcoded English strings in business logic — copy lives in a single dictionary file so i18n is a future drop-in)
- Native mobile apps
- Email/SMS/push notifications (in-app only for v1; the Notification system is built with a channel abstraction so email/push/WhatsApp can be added later)
- Refunds/returns workflow beyond a basic order-status "Cancelled/Returned" state

---

## 2. Roles & Personas

| Role (internal key) | Display Label | Summary |
|---|---|---|
| `customer` | Customer | Browses/buys plants & products; (when unlocked) requests gardening services and rates Mallis |
| `malli` | Malli (Gardener) | Registers, gets verified by Admin, lists services, accepts/manages service requests. **Entire role is hidden in v1.** |
| `super_admin` | Super Admin | Manages everything: catalog, categories, users, Malli verification, orders, service requests, site settings, feature flags-facing config |

Role is a first-class, lowercase, underscore-style enum (`customer`, `malli`, `super_admin`) — same "internal code + human label" pattern used for category codes (§6), for consistency and future i18n.

### 2.1 Role Permission Matrix (high level)

| Capability | Customer | Malli (flagged) | Super Admin |
|---|:---:|:---:|:---:|
| Browse/search products | ✅ | ✅ | ✅ |
| Place product order (COD) | ✅ | — | ✅ (on behalf, support use) |
| Track own orders | ✅ | — | ✅ (all orders) |
| Register as Malli | — | ✅ (self) | ✅ (approves) |
| Create/manage service offerings | — | ✅ (own) | ✅ (any) |
| Request a service | ✅ | — | ✅ (on behalf) |
| Accept/manage assigned service requests | — | ✅ (own) | ✅ (any) |
| Assign a Malli to a request | — | — | ✅ |
| Manage Category / Category Type | — | — | ✅ |
| Manage Products | — | — | ✅ |
| Approve/suspend Malli accounts | — | — | ✅ |
| Manage users (customers/mallis) | — | — | ✅ |
| View analytics/reports | — | — | ✅ |
| Toggle site settings (non-env) | — | — | ✅ |
| Manage subscription packages & commission/discount settings | — | — | ✅ |
| Subscribe to / request a package | — | ✅ (self) | ✅ (activates on behalf) |
| Leave reviews (product/Malli) | ✅ | — | — |
| Receive in-app notifications | ✅ | ✅ | ✅ |

---

## 3. Feature Flag: Services (Malli) Module

This is a **hard functional requirement**, not cosmetic hiding.

- **Server-side flag:** `SERVICES_MODULE_ENABLED` (boolean, default `false`). Every API route touching Malli registration, service offerings, service requests, Malli-domain categories, and Malli-related notifications **must check this flag server-side** and return `404 Not Found` when disabled — never rely on UI hiding alone (defense in depth; someone hitting the raw API must see the module as if it doesn't exist).
- **Client-side mirror:** `NEXT_PUBLIC_SERVICES_MODULE_ENABLED` (must match the server value; a startup check warns/fails loudly if they diverge). Drives: hiding nav items, hiding the "Become a Malli" CTA, hiding "Request a Service" CTA, hiding all Malli admin screens.
- **Unhiding:** flipping both env vars to `true` and restarting the app fully activates the module — no code changes, no migrations required (schema is present from day one; see §6).
- Feature-flag reads go through a single typed config module (`/config/feature-flags.ts`), never `process.env` scattered across the codebase (Single Responsibility / testability).

---

## 4. Category & Category Type Management

This is the taxonomy backbone for **both** products and (future) services, and it is explicitly called out as needing careful, developer-friendly design.

### 4.1 Concepts
- **CategoryType** — the top-level grouping, and the mechanism that separates the *product* catalog from the *service* catalog.
  - `domain`: `"PRODUCT" | "SERVICE"` — categories under a `SERVICE` type only ever surface when the Services module is enabled.
  - Examples (domain=PRODUCT): Indoor Plants, Outdoor Plants, Pots & Planters, Fertilizers & Soil, Garden Tools.
  - Examples (domain=SERVICE, hidden in v1): Garden Care, Landscaping, Lawn Mowing & Restoration, Garden Design.
- **Category** — a child of exactly one CategoryType (e.g. "Air-Purifying Plants" under "Indoor Plants"). Schema supports optional self-nesting (`parentCategoryId`) for future sub-sub-categories, though v1 UI only surfaces one level.

### 4.2 `categoryCode` rule (hard requirement)
- **Mandatory**, unique (globally, across all categories — it's a developer-facing key referenced in business logic, promotions, filters, etc.)
- Free text as typed by the Admin (spaces allowed while typing), but the system **auto-normalizes**: trimmed → uppercased → internal spaces replaced with `_` → validated against `^[A-Z0-9]+(_[A-Z0-9]+)*$`.
  - `"Indoor Plants"` → `INDOOR_PLANTS`
  - `"lawn mowing"` → `LAWN_MOWING`
- Rejected if it produces an empty string, starts/ends with `_`, or has repeated `_`.
- Length: 2–64 characters.
- **Immutability guard:** once a `categoryCode` is referenced by any Product/ServiceOffering, editing it requires an explicit "I understand this may break references" confirmation (soft-protect, not a hard block — Admin is trusted, but shouldn't do it by accident).
- `CategoryType` gets the same discipline via `categoryTypeCode` (same regex/normalization), for consistency, even though the original ask focused on Category — this keeps both taxonomy levels equally dev-referenceable.

### 4.3 Zod schema (representative)
```ts
const codePattern = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;

const categoryCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .transform((v) => v.toUpperCase().replace(/\s+/g, "_"))
  .refine((v) => codePattern.test(v), {
    message: "Code must be letters/numbers separated by single underscores, no spaces.",
  });

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  categoryCode: categoryCodeSchema,
  categoryTypeId: z.string().min(1),
  description: z.string().max(500).optional(),
  imageMediaId: z.string().optional(),
  parentCategoryId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
```

### 4.4 Admin capabilities
- CRUD CategoryType (name, `categoryTypeCode`, domain, icon, sort order, active/inactive)
- CRUD Category (name, `categoryCode`, parent type, optional parent category, image, sort order, active/inactive)
- Reorder via drag-and-drop (sortOrder) — nice-to-have, not blocking v1
- Deactivate (soft) a category with existing products → category hidden from storefront but historical orders/products keep referencing it intact (never hard-delete taxonomy that's in use)

---

## 5. Functional Requirements by Area

### 5.1 Authentication & Authorization
- Email + password registration/login (bcrypt-hashed passwords, never stored in plain text)
- Session via NextAuth.js/Auth.js, JWT-based session, role embedded in token
- Route-level guards: middleware checks role per route group (`(customer)`, `(malli)`, `(admin)`); API guards re-check role server-side per handler (never trust the client)
- Password reset flow (token-based, expiring link) — in-app for v1 (no email dispatch yet — see §11 open item)
- Account states: `pending` (Malli awaiting Admin verification), `active`, `suspended`
- Single Super Admin bootstrap via a seed script reading `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` (never a public "become admin" endpoint)

### 5.2 Customer
- Register/login/manage profile & multiple saved addresses
- Browse products by CategoryType → Category, filter (price range, availability, attributes like light/water needs), sort, search
- Product detail page: images, price, stock, care attributes, ratings/reviews
- Cart (persisted per logged-in customer in DB; guest browsing allowed, but checkout requires login)
- Checkout: address selection, order summary, COD confirmation → creates Order
- Order history + live order tracking (status timeline, real-time updates)
- Leave a product review (rating 1–5 + comment) after delivery
- In-app notification center (order status changes, promos)
- *(Flagged)* Browse Malli services by Category, view a Malli's public profile/rating, either (a) select a specific Malli and submit a request directly to them, or (b) submit a general service request and let Admin assign a Malli
- *(Flagged)* Track service request status; rate the Malli after completion

### 5.3 Malli (entire section hidden until flag enabled)
- Self-registration with profile (bio, service-area cities, experience, verification documents) → status `pending` until Admin approves
- Create/manage own Service Offerings (title, category, description, price/price-type, images, active toggle)
- Receive service requests: either (a) directly targeted requests from customers who picked them, or (b) requests assigned by Admin
- Accept/reject a request; update its status through the lifecycle (§5.6)
- View own rating/reviews
- In-app notifications for new/assigned requests

### 5.4 Super Admin
- Full CategoryType/Category CRUD (§4)
- Full Product CRUD (create/edit/deactivate; stock management)
- Order management: view all orders, update status, add notes, cancel
- User management: view/suspend customers; approve/reject/suspend Mallis; view Malli verification documents
- *(Flagged)* Service request oversight: view all requests, manually assign a Malli, override status, mediate disputes
- *(Flagged)* Service Offering moderation (deactivate inappropriate listings)
- Dashboard: order counts by status, revenue (COD-collected totals), top categories/products, new user signups, *(flagged)* pending Malli approvals & open service requests
- Site settings screen exposing **non-secret**, DB-backed settings only (e.g. delivery fee, min order amount) — **not** a UI to flip the `SERVICES_MODULE_ENABLED` env flag itself, which must remain an actual deployment-level env var change (deliberate friction so "hidden" stays truly hidden and isn't one admin click away from a support-desk mistake)

### 5.5 Product Order Lifecycle
`PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`
Side branches: `CANCELLED` (from `PLACED`/`CONFIRMED` only), `RETURNED` (from `DELIVERED`).
Every transition is appended to `statusHistory` with actor + timestamp + optional note, and triggers an in-app notification + a realtime tracking event to the customer.

### 5.6 Service Request Lifecycle *(flagged)*
`REQUESTED → (PENDING_ASSIGNMENT | ASSIGNED) → ACCEPTED → IN_PROGRESS → COMPLETED`
Side branches: `REJECTED` (Malli declines an assigned request → falls back to `PENDING_ASSIGNMENT` for Admin to reassign), `CANCELLED` (by customer, before `IN_PROGRESS`).
- If the customer selected a specific Malli at request time → status starts `ASSIGNED` directly to that Malli.
- If the customer left it open → status starts `PENDING_ASSIGNMENT`, visible on the Admin dashboard until an Admin assigns a Malli.

### 5.7 Notifications
- In-app only for v1, backed by a `Notification` collection (recipient, type, title, body, polymorphic reference, read/unread, createdAt)
- Delivered to the client via **SSE stream** (`/api/v1/notifications/stream`) with automatic client reconnect; **long-polling** (`/api/v1/notifications/poll?since=`) as an automatic fallback when SSE isn't available/reliable (see §9.4 for the Vercel-specific caveat)
- `NotificationChannel` is an interface (`InAppChannel` implemented now; `EmailChannel`/`PushChannel` are future implementations of the same interface — Open/Closed Principle)
- Bell icon with unread count, mark-as-read, mark-all-as-read, notification list with pagination
- Storage optimization: notifications store **reference IDs** (e.g. `orderId`) and a short rendered message, never a duplicated snapshot of the full Order/ServiceRequest object; a TTL index auto-purges *read* notifications older than a configurable window (default 90 days) to keep the collection lean

### 5.8 Order / Service Tracking (Realtime)
- Dedicated per-resource stream: `/api/v1/orders/:id/track/stream` (SSE) and `/api/v1/orders/:id/track/poll` (long-poll fallback); same pattern for `/api/v1/service-requests/:id/track/*` *(flagged)*
- Only the owning customer, the assigned Malli (flagged), or an Admin may subscribe (authorization check per connection)
- Emits an event on every status/history change; client renders a timeline component

### 5.9 Media
- All uploads go through a single `MediaStorageProvider` interface with two implementations selected by `MEDIA_STORAGE_PROVIDER` env var:
  - `cloudinary` (default, recommended for Vercel — see §9.3 why "local" is risky on serverless)
  - `local` (writes to disk — intended for local dev / self-hosted non-serverless deployments only)
- Client-side image compression/resizing before upload where practical, to cut bandwidth and storage
- DB never stores binary data — only `{ provider, publicId/path, url, mimeType, size, width, height }`
- Cloudinary's on-the-fly transformation URLs used for responsive images (no need to store multiple resolutions ourselves)

### 5.10 Reviews & Ratings
- Product reviews: 1–5 stars + comment, one review per customer per product (editable, not stackable), only after a `DELIVERED` order containing that product
- *(Flagged)* Malli reviews: 1–5 stars + comment, one per customer per completed service request
- Aggregate `ratingAverage`/`ratingCount` denormalized onto Product/MalliProfile (recomputed on write) to avoid an aggregation query on every listing render — deliberate storage/performance tradeoff, documented as such

### 5.11 Platform Settings, Malli Commission & Incentive Model *(flagged)*
All monetization/incentive rules live in Admin-managed settings, never hardcoded, so the business can tune them (a standard gig-marketplace retention lever — keep Mallis transacting on-platform instead of going around it) without a redeploy.

- **Two-tier Malli monetization:**
  - **Non-subscribers:** pay a flat commission percentage (`defaultServiceCommissionPercent`, in `site_settings`) on the value of each *completed* service job.
  - **Subscribers:** Admin creates one or more **Subscription Packages** (`subscription_packages` — e.g. "Silver"/"Gold") each with its own recurring price, billing cycle, and a **package-specific commission percentage** that overrides the default flat rate for that Malli while the subscription is active.
- **Platform-item discounts for Mallis:** when a Malli buys from the Hortist product catalog (e.g. sourcing fertilizer/pots for a job) under their own account, they get a discount off list price, applied automatically at checkout (not advertised as a public storefront promo):
  - A baseline discount (`defaultMalliItemDiscountPercent`, in `site_settings`) applies to every active/verified Malli.
  - Each subscription package can set its **own**, higher `platformItemDiscountPercent` as a subscriber perk. The package rate *replaces* the baseline (not stacked/additive) for that Malli while active — keeps the resolution logic simple and auditable.
- **Rate resolution happens once, at the moment of use, and is snapshotted** (never a live lookup baked retroactively into history):
  - On service-request completion → resolve the Malli's active subscription (if any) → its `commissionPercent`, else the site-wide default → write `platformCommissionPercent` + `platformCommissionAmount` onto that `service_requests` document, so later settings changes never rewrite past jobs.
  - On checkout, if the purchasing account's role is `malli` → resolve their active-subscription discount (if any) else the baseline → write `discountPercent` / `discountAmount` / `discountReason` onto that `orders` document, server-side only (never trust a client-sent discount).
- **Settlement in v1 (no payment gateway yet):** commission owed is tracked via `commissionSettlementStatus: PENDING | SETTLED | WAIVED` on each completed `service_request`. Admin gets a **Commission Ledger** report (per-Malli pending vs. settled totals) and manually marks entries settled once collected offline — the same "offline settlement" pattern already used for COD, just applied to commission instead of product payment.
- **Subscriptions are also manually activated in v1**, for the same reason: `malli_subscriptions` (`malliId`, `packageId`, `status`, `startDate`, `nextRenewalDate`, `autoRenew`) — a Malli requests a package, Admin confirms offline payment and activates it. Built against the same `PaymentProvider` abstraction (§9.3), so automated recurring billing later is a new implementation, not a redesign.
- `subscription_packages` gets a `packageCode` field following the **exact same** free-text-with-underscore, unique, dev-facing convention as `categoryCode` (§4.2) — consistent taxonomy discipline across the app.

### 5.12 Malli Response SLA *(flagged)*
- `site_settings.malliResponseSlaMinutes` (Admin-configurable, e.g. default 60) governs how long a Malli has to accept/reject a request sitting in `ASSIGNED` status — whether customer-selected or Admin-assigned — before it's escalated.
- Implemented as a **Vercel Cron Job** (not an in-request timer — serverless functions can't run persistent background timers) that periodically calls an internal, secret-protected sweep endpoint. It finds requests past the SLA still `ASSIGNED`, auto-transitions them back to `PENDING_ASSIGNMENT`, and fires notifications to both the non-responsive Malli (missed-request notice) and Admin (needs manual reassignment).
- The sweep endpoint is protected by a `CRON_SECRET` header check so it can't be triggered by anyone outside Vercel's scheduler.

---

## 6. Data Model (MongoDB collections)

> Mongoose schemas as the source of truth for persistence shape; Zod schemas (shared where possible with the client) as the source of truth for input validation. Every collection has `createdAt`/`updatedAt` timestamps.

| Collection | Key Fields | Notes |
|---|---|---|
| `users` | name, email (unique, indexed), phone, passwordHash, role, status, avatarMediaId | Base identity for all roles |
| `malli_profiles` | userId (unique, indexed), bio, serviceAreaCities[], experienceYears, verificationStatus, documentMediaIds[], ratingAverage, ratingCount, approvedBy, approvedAt | 1:1 with `users` where role=malli. Collection exists regardless of flag state |
| `subscription_packages` | name, packageCode (unique, indexed), price, billingCycle, commissionPercent, platformItemDiscountPercent, perks[], isActive | Admin-defined. Only relevant when module enabled |
| `malli_subscriptions` | malliId (indexed), packageId (indexed), status (indexed), startDate, nextRenewalDate, autoRenew | Manually activated/renewed in v1 (no payment gateway) |
| `addresses` | userId (indexed), label, line1, line2, city, region, postalCode, country, lat, lng, isDefault | |
| `category_types` | name, categoryTypeCode (unique, indexed), domain (`PRODUCT`\|`SERVICE`), iconMediaId, sortOrder, isActive | |
| `categories` | categoryTypeId (indexed), name, categoryCode (unique, indexed), parentCategoryId, imageMediaId, sortOrder, isActive | |
| `products` | name, slug (unique, indexed), sku, categoryId (indexed), description, imageMediaIds[], price, discountPrice, stockQty, unit, attributes{}, isActive, isFeatured, ratingAverage, ratingCount | |
| `service_offerings` | malliId (indexed), categoryId (indexed, domain=SERVICE), title, description, priceType, price, imageMediaIds[], serviceAreaCities[], isActive | Only relevant when module enabled |
| `carts` | customerId (unique, indexed), items[{productId, qty, priceSnapshot}] | |
| `orders` | orderNumber (unique, indexed), customerId (indexed), items[], shippingAddress{}, subtotal, deliveryFee, discountPercent, discountAmount, discountReason, total, paymentMethod, status (indexed), statusHistory[] | `discount*` fields set only when purchaser role=malli |
| `service_requests` | requestNumber (unique, indexed), customerId (indexed), categoryId, description, preferredDate, address{}, assignmentMode, selectedMalliId, assignedMalliId (indexed), assignedAt, status (indexed), statusHistory[], quotedPrice, completedAmount, platformCommissionPercent, platformCommissionAmount, commissionSettlementStatus | Only relevant when module enabled. `assignedAt` feeds the SLA sweep (§5.12) |
| `reviews` | targetType (`PRODUCT`\|`MALLI`), targetId (indexed), customerId, rating, comment, imageMediaIds[] | |
| `notifications` | userId (indexed), type, title, body, referenceType, referenceId, isRead (indexed), readAt, createdAt (TTL-indexed for purge) | |
| `media` | provider, publicId, path, url, mimeType, size, width, height, uploadedBy | |
| `site_settings` | key (unique), value, updatedBy | DB-backed, non-secret settings only. Holds `defaultServiceCommissionPercent`, `defaultMalliItemDiscountPercent`, `malliResponseSlaMinutes`, `deliveryFee`, `minOrderAmount`, etc. |

### 6.1 Indexing strategy (storage/perf)
- Unique indexes: `users.email`, `categories.categoryCode`, `category_types.categoryTypeCode`, `products.slug`, `orders.orderNumber`, `service_requests.requestNumber`, `malli_profiles.userId`, `subscription_packages.packageCode`
- Compound indexes for common queries: `products{categoryId, isActive}`, `orders{customerId, status}`, `notifications{userId, isRead, createdAt}`, `service_requests{assignedMalliId, status}`, `service_requests{status, assignedAt}` (for the SLA sweep query), `malli_subscriptions{malliId, status}`
- TTL index on `notifications.createdAt` scoped to read notifications past retention window
- All list queries use cursor/keyset pagination (not `skip()`, which degrades on large collections) and `.lean()` reads with explicit field projection

---

## 7. API Design (representative — Next.js Route Handlers, `/app/api/v1/...`)

| Method & Path | Purpose | Roles |
|---|---|---|
| `POST /api/v1/auth/register` | Customer or Malli self-registration (Malli only if flag on) | Public |
| `POST /api/v1/auth/login` | Login | Public |
| `GET /api/v1/category-types` | List category types (filterable by domain) | Public/Admin |
| `POST /api/v1/category-types` | Create | Admin |
| `PATCH /api/v1/category-types/:id` | Update | Admin |
| `GET /api/v1/categories` | List (filterable by type) | Public/Admin |
| `POST /api/v1/categories` | Create (categoryCode normalization/validation) | Admin |
| `PATCH /api/v1/categories/:id` | Update | Admin |
| `GET /api/v1/products` | List/search/filter (public catalog) | Public |
| `POST /api/v1/products` | Create | Admin |
| `PATCH /api/v1/products/:id` | Update | Admin |
| `POST /api/v1/cart/items` | Add/update cart item | Customer |
| `POST /api/v1/orders` | Checkout → create order (COD) | Customer |
| `GET /api/v1/orders/:id` | Order detail | Owner/Admin |
| `PATCH /api/v1/orders/:id/status` | Advance status | Admin |
| `GET /api/v1/orders/:id/track/stream` | SSE order tracking | Owner/Admin |
| `GET /api/v1/orders/:id/track/poll?since=` | Long-poll fallback | Owner/Admin |
| `GET /api/v1/notifications/stream` | SSE notification feed | Any authenticated |
| `GET /api/v1/notifications/poll?since=` | Long-poll fallback | Any authenticated |
| `PATCH /api/v1/notifications/:id/read` | Mark read | Owner |
| `POST /api/v1/malli/register` | Malli onboarding | Public *(404 if flag off)* |
| `PATCH /api/v1/malli/:id/verify` | Approve/reject Malli | Admin *(404 if flag off)* |
| `POST /api/v1/service-offerings` | Create listing | Malli *(404 if flag off)* |
| `POST /api/v1/service-requests` | Create request (targeted or open) | Customer *(404 if flag off)* |
| `PATCH /api/v1/service-requests/:id/assign` | Assign a Malli | Admin *(404 if flag off)* |
| `PATCH /api/v1/service-requests/:id/status` | Advance status (includes completion → commission snapshot) | Malli(own)/Admin *(404 if flag off)* |
| `GET /api/v1/subscription-packages` | List active packages | Public/Malli *(404 if flag off)* |
| `POST /api/v1/subscription-packages` | Create package (`packageCode` normalization) | Admin *(404 if flag off)* |
| `PATCH /api/v1/subscription-packages/:id` | Update package | Admin *(404 if flag off)* |
| `POST /api/v1/malli-subscriptions/request` | Malli requests a package | Malli *(404 if flag off)* |
| `PATCH /api/v1/malli-subscriptions/:id/activate` | Admin confirms offline payment, activates | Admin *(404 if flag off)* |
| `PATCH /api/v1/malli-subscriptions/:id/cancel` | Cancel a subscription | Admin *(404 if flag off)* |
| `GET /api/v1/admin/commission-ledger` | Per-Malli pending/settled commission report | Admin *(404 if flag off)* |
| `PATCH /api/v1/admin/commission-ledger/:requestId/settle` | Mark a commission entry settled | Admin *(404 if flag off)* |
| `POST /api/v1/internal/service-requests/sweep-sla` | Vercel Cron target — auto-escalate SLA-expired requests | `CRON_SECRET`-protected *(404 if flag off)* |
| `POST /api/v1/reviews` | Submit review | Customer |
| `POST /api/v1/media/upload` | Upload via active provider | Authenticated |

Every handler: Zod-validates input → delegates to an application-layer service (never touches Mongoose models directly) → returns a typed response envelope `{ success, data | error }`.

---

## 8. Architecture: SOLID in a Next.js/Serverless Context

Layered, feature-first structure so each module is independently testable and swappable:

```
/src
  /app                      # thin route handlers & pages only — no business logic
    /(public)/...
    /(customer)/...
    /(malli)/...            # rendered only if NEXT_PUBLIC_SERVICES_MODULE_ENABLED
    /(admin)/...
    /api/v1/...
  /modules
    /catalog                # CategoryType, Category, Product
      /domain                # entities, value-objects, interfaces (ICategoryRepository...)
      /application           # use-cases (CreateCategoryService, ListProductsService...)
      /infrastructure        # Mongoose schemas + repository implementations
    /orders
    /services               # Malli domain — present regardless of flag, gated at the edges
    /users
    /notifications
    /media
    /reviews
  /shared
    /lib                     # db connection, auth, sse.ts, long-poll.ts, di-container.ts
    /components              # ShadCN-based UI, presentational only
    /store                   # Zustand slices (cart, auth-mirror, notifications, ui-filters)
    /schemas                 # Zod, shared client+server where safe
    /types
  /config
    feature-flags.ts         # single typed read of all env-based flags
    env.ts                   # Zod-validated process.env parsing (fail fast on missing/invalid)
```

- **SRP** — route handlers stay thin; validation, business rules, and persistence each live in their own layer.
- **OCP** — `PaymentProvider`, `MediaStorageProvider`, `NotificationChannel` are interfaces with one concrete implementation today (COD / Cloudinary-or-local / in-app) and are extended by adding new implementations, never by editing existing ones.
- **LSP** — any implementation of a given interface must be a drop-in replacement (e.g. `CloudinaryProvider` and `LocalStorageProvider` are interchangeable behind `MediaStorageProvider`).
- **ISP** — narrow, per-aggregate repository interfaces (`IProductRepository`, `IOrderRepository`, …) instead of one god-repository.
- **DIP** — application services depend on interfaces/tokens, not concrete classes; a lightweight factory/DI module wires the concrete implementation at startup based on env config (no heavyweight DI framework needed at this scale).

---

## 9. Non-Functional Requirements

### 9.1 Storage optimization
- Media stored externally (Cloudinary URL/publicId only) — DB never holds binaries
- Denormalize only where it removes a hot-path aggregation (product/Malli rating averages), document every such denormalization in code comments
- Cursor-based pagination everywhere; no unbounded `find()`
- TTL-purge read notifications past retention window
- `.lean()` + field projection on all read-heavy queries
- Soft-delete (`isActive`) for taxonomy/products/listings in use; hard-delete only for genuinely orphaned draft records

### 9.2 Security
- Server-side authorization on every route (never trust client-sent role)
- Zod validation on every input, client **and** server (never trust client validation alone)
- Rate limiting on auth and write endpoints
- Password hashing (bcrypt/argon2), secrets only in env vars, never committed
- The Services module's server-side 404-when-disabled behavior is itself a security requirement, not just a UX one (§3)

### 9.3 Payment abstraction (v1 = COD only)
Even though only Cash-on-Delivery ships in v1, checkout is built against a `PaymentProvider` interface (`CodProvider` as the only implementation). This means adding Stripe/JazzCash/EasyPaisa later is a new class + config entry, not a checkout rewrite.

### 9.4 Realtime on Vercel — important constraint
Vercel serverless (and Edge) functions have execution-time limits, so a naive "hold the connection open forever" SSE stream is risky in production. Mitigation built into the design:
- SSE streams self-close and instruct the client to reconnect every few minutes (native `EventSource` reconnect handles this transparently)
- Long-polling is the **reliable baseline** (short server-side wait window, e.g. 20–25s, well under typical function limits), with SSE layered on top as a progressive enhancement where the runtime/network supports long-lived connections
- Both paths read from the same underlying change-detection mechanism (Mongo change streams where available on the Atlas tier in use, or a lightweight polling-the-DB interval as a portable fallback) so behavior is consistent regardless of transport

### 9.5 Media storage on Vercel — important constraint
Vercel's filesystem is ephemeral and mostly read-only at runtime. **`MEDIA_STORAGE_PROVIDER=local` is only viable for local development or a non-serverless self-hosted deployment** — it must not be used in the Vercel production environment, since uploaded files would not persist. This is documented in `.env.example` and the provider factory logs a loud warning if `local` is selected while `VERCEL=1` is detected.

### 9.6 Deployment
- Vercel (Next.js), MongoDB Atlas cluster, Cloudinary (default media)
- Environment-driven config throughout (`/config/env.ts`, Zod-validated at boot — the app fails fast with a clear error if a required var is missing, rather than failing confusingly at runtime)

### 9.7 Scheduled jobs (Vercel Cron)
The Malli response SLA (§5.12) needs a recurring sweep, configured in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/v1/internal/service-requests/sweep-sla", "schedule": "*/10 * * * *" }
  ]
}
```
**Note:** Vercel Cron only fires on a deployed environment — it does **not** run under `next dev`. Local testing means invoking the sweep endpoint manually.

---

## 10. Environment Variables (reference)

| Variable | Purpose | Example |
|---|---|---|
| `MONGODB_URI` | Atlas cluster connection string | `mongodb+srv://...` |
| `AUTH_SECRET` | Session/JWT signing secret | random 32+ byte string |
| `APP_NAME` | Display name | `Hortist` |
| `APP_BASE_CURRENCY` | Currency code | `PKR` |
| `SERVICES_MODULE_ENABLED` | Server-side Malli module gate | `false` |
| `NEXT_PUBLIC_SERVICES_MODULE_ENABLED` | Client-side mirror | `false` |
| `MEDIA_STORAGE_PROVIDER` | `cloudinary` \| `local` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary creds | — |
| `LOCAL_UPLOAD_DIR` | Dev-only local path | `./public/uploads` |
| `MAX_UPLOAD_SIZE_MB` | Upload cap | `5` |
| `NOTIFICATION_RETENTION_DAYS` | TTL purge window (read notifications) | `90` |
| `LONG_POLL_TIMEOUT_MS` | Server hold time for polling endpoints | `20000` |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Bootstrap Super Admin | — |
| `CRON_SECRET` | Protects the SLA-sweep endpoint from non-Vercel triggers | random secret string |

---

## 11. Assumptions & Open Items for Follow-up

1. **Currency/locale:** assumed PKR + Pakistan addresses for v1 (matching plant.pk's actual market), but address schema and currency are config-driven, not hardcoded, so expanding later is a config change, not a schema migration.
2. **Delivery fee logic** (flat rate vs. city-based vs. free-over-threshold) — not specified yet; `site_settings` collection is designed to hold this so it doesn't require a code change either way. Needs a decision before checkout is finalized.
3. **Malli monetization model** — decided (§5.11): flat commission for non-subscribers, Admin-defined packages with reduced commission + bigger product discount for subscribers, both settled offline in v1. **Exact percentages/prices are not decided** — schema and settings screen are ready for whatever numbers the business picks; nothing is hardcoded.
4. **Password reset delivery** — v1 has the token/flow built, but with no email/SMS channel wired up yet (matches "in-app only" scope), an admin-assisted reset path is the practical fallback until a channel is chosen.
5. **List of serviceable cities** for delivery and Malli service areas — not provided; modeled as free-text/array for now, upgradeable to a managed list later.
6. **Commission enforcement** — v1 tracks commission owed and lets Admin mark it settled, but has no automated way to *compel* payment (e.g. suspend a Malli with overdue commission) since that's a policy call, not an engineering one; the settlement-status field is there if/when such a rule is wanted.

---

## 12. Success Criteria (v1)

- A Customer can register, browse categorized products, check out via COD, and track an order in real time through in-app notifications and a live status timeline.
- A Super Admin can fully manage CategoryTypes, Categories (with enforced `categoryCode`), Products, Orders, and Users.
- The entire Malli/services vertical exists in the codebase, is fully hidden (UI **and** API return not-found) when `SERVICES_MODULE_ENABLED=false`, and becomes fully functional by flipping that one flag — no code changes, no data migration.
- Malli commission/discount rates and subscription packages are fully Admin-configurable; a completed service job correctly snapshots the resolved commission, and a Malli's order correctly snapshots their resolved product discount, for both a subscriber and a non-subscriber.
- An unanswered assigned service request auto-escalates to Admin after the configured SLA, without a manual sweep.
- No binary media in the database; all uploads flow through the storage abstraction.
- Codebase organized so payment, media storage, and notification channels are each swappable via a single interface implementation, per SOLID/OCP.
