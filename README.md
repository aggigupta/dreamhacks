# Shopyland

**A marketplace that helps remote-island artisan cooperatives sell their crafts
worldwide, built around the part that actually costs them money: shipping.**

Built for **DreamHacks 2026, Track 1 (Smart Sales, Marketing & E-Commerce)**.
The prompt: *"a dynamic pricing or recommendation engine that helps local
businesses on a remote island sell unique crafts to global customers while
optimizing shipping routes."* Shopyland ships all three: a recommendation
engine, a dynamic pricing engine, and a consolidated-shipping model, wired to a
live database.

**Live:** https://shopyland-storefront.onrender.com

---

## What it does

### 1. Explainable recommendation engine

A shopper answers four questions: **purpose** (gift / personal / community-bulk),
**usage frequency**, **household size**, and **sustainability priority (1 to 5)**.

- A **deterministic scoring model** rates every product in the catalog on
  weighted matches between those signals and the product's attributes, and
  records which signal caused each match.
- If an OpenAI key is present, `gpt-4o-mini` re-orders the top six and writes each
  reason, but is constrained to cite only the signals the scorer already matched.
  Its output is validated in code.
- Every call falls back to the deterministic result and is logged to Postgres.

The point: you can always trace a recommendation back to the rule that produced
it. No black box.

### 2. Cargo-aware dynamic pricing

There is one shared **island ferry container** with a real weight capacity.
`POST /api/pricing` weighs the cart on the server, checks how full this order
would leave the returning ferry, and grants a **consolidation discount**:

| Ferry fill after this order | Discount |
|---|---|
| below 60% | none |
| 60% or more | 10% |
| 85% or more | 20% |
| 5 or more units | at least 10% |

The server returns the final price. On the product page, a single quantity
slider shows the ShopSense-suggested amount, the seller's own volume tiers, and
**clamps to the artisan's floor price** so a discount can never push a maker
below their minimum.

### 3. Consolidated shipping

`GET /api/logistics/route` returns the Artisan to Harbor Hub to Regional Port to
Buyer waypoints with real haversine distances and per-leg CO2 figures; the
storefront draws it from the buyer's location. Recommendations also prefer
products from the **same artisan hub** as items already in the cart, so the whole
order sails in one crate.

### 4. Marketplace + artisan tools

Multiple cooperatives can list the same craft; buyers compare price, stock and
lead time. An artisan restocks by tapping one button on their store page, which
writes straight to Postgres. Place an order and the ferry meter fills for every
viewer in real time.

---

## Quantity model

`computeQuantity` is a formula, not an LLM call:

```
gift                  -> 1
one-time              -> ceil(householdSize / 2)
occasional / regular  -> householdSize * ratePerPersonPerWeek * targetWeeks / packSize
      regular:     1.2 units/person/week, 2-week target
      occasional:  0.4 units/person/week, 3-week target
community-bulk        -> the above x3
```

A household of four buying something used regularly gets a suggestion of about
two weeks of supply. The per-person rate can be overridden per listing by the
seller.

---

## Tech

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router), TypeScript, Tailwind |
| Database | Supabase Postgres, 9 tables, RLS |
| AI | OpenAI `gpt-4o-mini` for recommendation copy (optional) |
| Deploy | Render |
| Tests | Vitest on the prediction math |

The app degrades gracefully: with no database env vars it runs on an in-process
store; with no OpenAI key it runs the deterministic engine only.

---

## Run locally

```bash
npm install
cp .env.example .env.local     # optional; the app runs without any keys
npm run dev                    # http://localhost:3000
```

`.env.local` (all optional):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

Other scripts:

```bash
npm run build          # production build
npm test               # unit tests
npm run calibrate      # synthetic calibration harness for the scoring engine
```

---

## Project layout

```
app/
  api/
    recommend/        two-stage recommendation (deterministic + LLM)
    quantity/         deterministic quantity + optional sustainability note
    pricing/          cargo-aware, server-authoritative pricing
    cargo/            live ferry fill
    logistics/route/  shipping waypoints
    vendor/update/    one-tap restock
    orders/           persist an order, add its weight to the ferry
    products/         catalog + per-product seller offers
    auth/             OTP send/verify, signed session cookie
    health/           DB + model check
  discover/           the 4-signal quiz
  recommendations/    AI Picks, with the reason on every card
  product/[id]/       offers, the quantity slider, add to crate
  cart/  checkout/    cargo meter, route map, place order
  shopkeeper/         orders table + one-tap restock
lib/
  prediction.ts       scoreProducts, computeQuantity, priceForQuantity
  db.ts               DbApi with Supabase and in-process implementations
  openai.ts           client + JSON/sentence salvage helpers
  supabase.ts         server client
scripts/
  calibrate.ts        synthetic calibration harness
  generate-product-art.mjs per-product SVG generator
docs/METHODOLOGY.md   how the scoring model was designed and checked
```

---

## What is live vs. seeded

**Live:** the database, all three engines, order persistence, the cargo meter,
the restock flow, signed sessions.

**Seeded:** the 30-product catalog and the 6 cooperatives are sample data;
product images are generated icons, not photos; sign-in uses a demo code flow
(email delivery is enabled with an SMTP key in production).
