# Shopyland: DreamHacks 2026 submission pack

**Track 1: Smart Sales, Marketing & E-Commerce**
> *Prompt: Build a dynamic pricing or recommendation engine that helps local businesses
> on a remote island sell unique crafts to global online customers while optimizing
> shipping routes.*

Shopyland is a marketplace for remote-island artisan cooperatives. It has all three
pieces the prompt asks for: a **recommendation engine**, a **dynamic pricing engine**,
and **shipping-route optimization**, wired to a live database.

**Live:** https://shopyland-storefront.onrender.com

---

## Devpost description (paste this)

**What it does**

Shopyland connects remote-island craft cooperatives with global buyers. Three engines
run the store.

1. **ShopSense recommendation engine.** A shopper answers four questions: purpose
   (gift / personal / community-bulk), usage frequency, household size and
   sustainability priority. A deterministic scoring model ranks the catalog and
   records which signal caused each pick. An LLM then re-orders the top few and
   rewrites the reasons, but is constrained to cite those same signals. Every
   recommendation is traceable, with no black box. If the cart already holds items
   from one artisan hub, the engine prefers products from that same hub so the order
   ships in one crate.

2. **Cargo-aware dynamic pricing.** There is one shared island ferry container with a
   real weight capacity. `POST /api/pricing` weighs the cart, checks how full this
   order would leave the returning ferry, and grants a consolidation discount: 10 percent
   at 60 percent full, 20 percent at 85 percent, plus a five-unit volume floor. The
   server returns the final price; the client cannot forge it. On the product page a
   single quantity slider shows the ShopSense-suggested amount, the seller's own volume
   tiers, and clamps to the artisan's floor price so a discount never pushes a maker
   below their minimum.

3. **Shipping-route optimizer.** `GET /api/logistics/route` returns the Artisan,
   Harbor Hub, Regional Port and Buyer waypoints with real haversine distances and
   per-leg CO2 figures; the storefront draws it from the buyer's location.

Multiple cooperatives can list the same craft; buyers compare price, stock and lead
time. Artisans restock with one tap on their store page, which writes straight to
Postgres. Place an order and the ferry meter fills in real time and the discount tier
flips, visible to every viewer and as a row in the database.

**How we built it**

Next.js (App Router) + TypeScript, Supabase Postgres (9 tables, RLS), OpenAI
`gpt-4o-mini` for the recommendation copy (optional; the app runs fully without a
key). Scoring weights reflect known purchasing-behaviour directions (gift to single
item, high sustainability to low packaging, and so on); a synthetic calibration
harness (`npm run calibrate`) exercises the engine against a generated shopper
population. Vitest unit tests on the prediction math; `GET /api/health` checks the
database and model.

**Challenges and what's next**

Real OTP email (SMTP is wired, needs a provider key), a fuller shopkeeper listing
studio for the pricing tiers, and moving cargo capacity to per-route ferries.

---

## Four-minute video script

**Problem (0:00 to 0:20).** "A palm weaver on a remote atoll can make world-class
baskets, but a single parcel by air costs more than the basket and dumps carbon. The
barrier isn't the craft, it's the shipping."

**Recommendation engine (0:20 to 1:10).** Take the quiz: purpose, then usage, then
household and sustainability. Land on AI Picks. Point at a recommendation's reason
line. "Notice it says why: 'a giftable single item, suitable for a one-time purchase,
bulk-friendly for your sustainability priority.' Those are the exact signals we
matched. A deterministic model scores all 30 products on the four signals; the AI only
re-orders the top few and writes the sentence. Not a black box, and every call is
logged in our database."

**Marketplace and dynamic pricing (1:10 to 2:00).** Open a product. "Three island
cooperatives sell this, at different price, stock and lead time." Pick one. Drag the
quantity slider. "The ShopSense pick is marked; the price walks the seller's own
volume tiers and stops at the artisan's floor price, so a discount can't push a maker
into a loss."

**The ferry, the money shot (2:00 to 3:00).** Add to cart, go to checkout. Show the
route map drawn from your location. Show the "Ferry consolidation, server-verified,
ferry X percent full" line. Place the order. Cut to the navbar chip: the ferry meter
just climbed. Open Supabase in the other tab: there is the order row and the updated
cargo weight. "Every order anyone places fills the same ferry. The fuller it gets, the
bigger the discount for everyone. That is the incentive to consolidate shipments."

**Artisan side (3:00 to 3:30).** Go to the shopkeeper page, tap the plus button on a
product, watch the stock update live in Postgres. "No dashboard. One tap on their
phone."

**Close (3:30 to 4:00).** "Recommendation engine, dynamic pricing, route optimization.
All live, all explainable, backed by a real database. Built in one day for DreamHacks."

---

## Judge Q&A (answer honestly)

- **"Is the AI real?"** Yes. A deterministic scoring model ranks the catalog on the
  four signals; the LLM only re-orders the top six and writes the reasons, constrained
  to cite the signals the model matched. Every call is logged to `recommendation_logs`;
  I can show the table.
- **"What if OpenAI is down or there's no key?"** The whole app runs without it, on the
  deterministic engine and templated copy. The response says which path ran.
- **"Where is the data?"** Supabase Postgres, nine tables. Orders, cargo state and
  stock changes all persist and are shared across every viewer.
- **"Can the client fake a discount?"** No. `POST /api/pricing` is the source of truth
  for the checkout total; it reads the cargo weight server-side.
- **"What is mocked?"** The catalog and the six cooperatives are seeded sample data,
  product images are generated icons, and sign-in uses a demo code flow (email
  delivery turns on with an SMTP key in production). Everything else is live.

---

## Pre-submit checklist

- [x] Deploy env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY` on Render
- [ ] Hit the live URL, run the full flow once (quiz, product, cart, checkout, order,
      cargo meter moves, shopkeeper sees the order)
- [ ] Reset demo data right before recording:
      `update active_cargo set current_weight_filled_kg=40; delete from order_items;
      delete from orders; delete from recommendation_logs;`
- [ ] Devpost: description above, public repo link, four-minute video
- [ ] Bonus: ArgosX scan, code `DREAMH-2026` at getargosx.com, attach the VibeScore
