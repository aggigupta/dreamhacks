# Shopyland / ShopSense AI — the pile

Ordered by rubric weight and how far behind we are. **Backend is the biggest hole**
(Technical Execution is 25 pts and we currently have no database, no real auth, no
tests, no persisted orders).

Legend: 🔴 must-have for a credible demo · 🟡 strong upgrade · 🟢 polish

---

## 0. Stop the bleeding (team process)

- 🔴 Freeze cosmetic iteration on `main` (water backgrounds, font passes). Every
  parallel style commit is churn. One person owns the backend branch below.
- 🔴 Work backend on a branch, PR into main, so the storefront demo never breaks.

---

## 1. MARKETPLACE MODEL — catalog item ⇄ multiple seller listings  🔴

Right now one product = one seller. A real island marketplace has several co-ops
selling the same good at different prices. And the shopkeeper — not a hardcoded
constant — should define everything the customer-facing prediction uses.

### 1a. Split the data model
- `CatalogProduct` (the *what*): id, name, category, description, materialIndex,
  image, atollHub, replantingImpact. Shared.
- `Listing` (the *who / how much*): id, catalogProductId, sellerId, `price`,
  `minPrice` (artisan floor — dynamic pricing never dips below), `maxPrice`
  (ceiling), `stock`, `unit`, `unitsPerPack`, `tierPricing[] {minQty, discountPct}`,
  `consumptionPerPersonPerWeek` (drives the quantity suggestion),
  `bulkAvailable` + case size, `packaging`, `perishable`/shelf-life,
  `leadTimeDays`, `ecoTag`, `active`.
- `lib/db.ts`: add a `listings` map; seed 1–3 listings per catalog product (give
  ~6 products 2–3 competing sellers at different prices).

### 1b. Product page = offers
- Show the catalog item + an **offers list** (each seller: price, stock, lead
  time, eco tag), sorted cheapest-in-stock / same-atoll first.
- A buy-box that selects one offer; switching offer re-runs the quantity + price
  prediction against *that listing's* params.

### 1c. Browse
- Cards show "from $X · N island sellers".

### 1d. Shopkeeper listing studio (`/shopkeeper/add-product` → edit too)
Every field above, editable:
- pick existing catalog product or create new
- base price + **min price** + **max price**
- pack size
- **dynamic pricing tiers** — add/remove `{minQty, discountPct}` rows
- **typical consumption** — "a household goes through ~N per week"
- bulk case toggle + size, packaging footprint, perishable, stock
Persist to `db.listings`. Shopkeeper dashboard lists/edits their own listings.

### 1e. Wire prediction to listing params
- `computeQuantity(input, listing)` uses `listing.consumptionPerPersonPerWeek`
  (fallback: category default) instead of the hardcoded `PER_PERSON_PER_WEEK`.
- The product-page slider's tier discounts come from `listing.tierPricing`, and
  the resulting unit price is **clamped to `listing.minPrice`**.
- `scoreProducts` ranks catalog items using the best/selected listing's
  `bulkAvailable` / `packaging`.

---

## 2. BACKEND — Technical Execution (25 pts, where we're weakest)

### 1a. Real persistence (Postgres via Neon)  🔴
- Add `DATABASE_URL`, a `lib/db.ts` (Neon serverless driver), and a `db/schema.sql`.
- Tables: `sellers`, `products`, `users`, `orders`, `order_items`,
  `recommendation_logs`, `otp_codes`.
- `scripts/seed.ts` — load the 30 items from `lib/mockProducts.ts` into `products`
  and the 6 sellers. Keep the mock file as the seed source + offline fallback.
- Replace `lib/mockProducts` reads in pages/APIs with DB queries.

### 1b. Real auth + sessions  🔴
- Today `POST /api/auth/verify-otp` returns a user object the client stores in
  `localStorage` — anyone can forge it and hit shopkeeper routes.
- On verified OTP: upsert the user in `users`, mint a signed **HttpOnly session
  cookie** (`jose` JWT, `SESSION_SECRET`).
- New routes: `GET /api/auth/session`, `POST /api/auth/logout`.
- `middleware.ts` (or per-route guard) protecting `/shopkeeper/*` and shopkeeper
  APIs server-side.
- Google sign-in (`@react-oauth/google` + `jwt-decode`) is currently decoded
  **client-side only** — verify the Google token server-side before trusting it.

### 1c. Fix the OTP store  🔴
- `lib/otpStore.ts` uses an in-memory `Map` on `globalThis`. On Render/Vercel it
  dies on every cold start and isn't shared across instances → OTP will randomly
  fail live. Move codes to the `otp_codes` table with `expires_at`.
- Rate-limit: max 5 sends/hour/email; max 5 verify attempts then invalidate
  (right now a wrong code leaves the record reusable forever).

### 1d. Orders API  🔴
- `POST /api/orders` — persist a checkout: items, unit prices, tier discount,
  backhaul rebate, CO₂ saved, delivery GPS, status `placed`.
- `GET /api/orders` — the signed-in user's orders.
- Wire `app/checkout/page.tsx` to actually call it (today it just flips a
  `submitted` boolean).
- Shopkeeper dashboard shows **real** incoming orders for that seller.

### 1e. Products API + real shopkeeper writes  🔴
- `GET /api/products` (query: category, seller, search, pagination).
- `GET /api/products/:id`.
- `POST /api/products` (shopkeeper session required) — persists. Today
  `add-product` only pushes to client state / localStorage.

### 1f. Make the prediction engine judge-legible  🟡
- Add `engine` (`"llm" | "deterministic" | "deterministic-fallback"`),
  `latencyMs`, and `modelUsed` to the **response body** of `/api/recommend` and
  `/api/quantity` (currently only in a header — the UI can't show it).
- `POST /api/recommend` and `/api/quantity`: log every call to
  `recommendation_logs` (input signals, returned ids, engine, latency, whether
  the LLM was used). This becomes a judge-facing "AI decision log" view and is
  hard proof the engine is real.
- Rate-limit both endpoints (in-memory token bucket per IP is fine).

### 1g. Tests + CI  🔴 (rubric literally says "evidence of testing/iteration")
- Vitest. Minimum set:
  - `lib/prediction.test.ts` — scoring monotonicity (higher sustainability →
    bulk/minimal ranks up), quantity math (`household 4 × regular ≈ 2 weeks`),
    clamps, gift = 1.
  - `lib/validation.test.ts` — rejects out-of-range / wrong-type input.
  - `app/api/recommend` route test with a fixture catalog (mock the OpenAI call).
- `.github/workflows/ci.yml` — `npm run lint && tsc --noEmit && npm test` on push.
- Keep `npm run calibrate` in CI too (it already produces real metrics).

### 1h. Deploy for real  🔴
- Confirm `render.yaml` builds, or deploy to Vercel (Vercel MCP is available).
- Env: `OPENAI_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `SMTP_*`.
- `GET /api/health` — checks DB connectivity + OpenAI reachability.
- Verify the deployed URL does the full flow: quiz → recommend → add → checkout →
  order shows in shopkeeper dashboard.

---

## 2. FRONTEND / UX — Design & UX (15 pts), supports Technical Execution

- 🔴 Repoint `discover`, `recommendations`, `checkout`, `shopkeeper` to the new
  APIs. Keep `localStorage` only for the **guest cart**, nothing else.
- 🟡 Surface the AI reasoning: signal-cited `reason` on every rec card, an
  `engine: LLM / deterministic` badge, the latency. This is our differentiator —
  don't hide it.
- 🔴 Loading skeletons + error toasts on every `fetch` (right now failures are
  silent or crash).
- 🟡 Empty states: empty cart, no recommendations yet, seller with no products.
- 🟡 Accessibility pass: contrast on teal-on-navy and white-on-video, visible
  focus rings, `alt` text, keyboard nav through the quiz, real `<label>`s.
- 🟢 First-run: one line explaining the 4 signals on the quiz intro.
- 🔴 Ground or delete fabricated stats. "94% match accuracy" / "80% less CO₂" /
  "−22% transport" need a stated basis (link the calibration doc / a named
  assumption) or judges read it as dishonest.
- 🟢 Mobile QA every page.

---

## 3. PRESENTATION & DEMO — 15 pts

- 🔴 `/demo` must be a scripted 90s path that never dead-ends: seeded demo user,
  seeded cart, working "Reset Demo".
- 🔴 2-min pitch script: problem → who it's for → solution → **live demo** →
  impact → what's next.
- 🔴 Q&A prep, answered honestly:
  - "Is the AI real?" → yes; show `docs/METHODOLOGY.md`, the `recommendation_logs`,
    the deterministic fallback when OpenAI is off.
  - "Where's the data?" → Postgres; show the schema + a live order row.
  - "What's mocked?" → say it plainly (see README honesty section).
- 🟡 One architecture slide: client → API routes → prediction engine + OpenAI +
  Postgres.

---

## 4. PROBLEM & IMPACT (20 pts) + CHALLENGE TRACK ALIGNMENT

- 🔴 Write the problem statement: remote-island micro-producers, logistics
  cost/emissions as the real barrier, target users (global buyers + island
  co-ops), why now.
- 🟡 Impact model — rough but defensible: state the assumption behind the
  consolidation / backhaul savings instead of a bare percentage.
- 🟡 Ethics/constraints paragraph: email-only PII, no artisan lock-in, stated
  limits of the AI.
- 🔴 **Get the exact challenge track wording** and map each feature to its stated
  goals — "goes beyond surface-level relevance" is scored.

---

## 5. README / DOCS  🟡

- Quickstart, env var table, architecture diagram, and a **"Real vs mocked"**
  section (honesty scores points and pre-empts the hardest judge question).
- Link `docs/METHODOLOGY.md` from the pitch.

---

## Suggested order for the next work session

1. `lib/db.ts` + schema + seed (1a)
2. Session cookies + `/api/auth/session` + shopkeeper guard (1b) and OTP → DB (1c)
3. Products API + Orders API + wire checkout/shopkeeper (1d, 1e, 2)
4. `engine`/`latencyMs` in response bodies + `recommendation_logs` (1f)
5. Vitest set + CI (1g)
6. Deploy + `/api/health` + full-flow smoke (1h)
7. Everything in §3–§5 in parallel (non-code teammates)
