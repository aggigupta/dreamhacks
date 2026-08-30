# How ShopSense AI works

ShopSense predicts **which products a shopper should buy** and **how much of the
top pick to order**, from four structured signals instead of a vague "what are
you looking for?" text box.

The design rule: **every output must be traceable to the input signal that
caused it.** A recommendation the team can't explain on stage isn't a
prediction, it's a guess with a confidence bar.

---

## 1. The input model

We reject free-text intent ("I want something nice") because a recommender
can't reason over it and can't defend a choice made from it. Instead we collect
four signals, each chosen because it maps to a **known consumer-behaviour
effect** and each independently movable:

| Signal | Type | Why it predicts buying behaviour |
|---|---|---|
| `purpose` | `gift \| personal \| community-bulk` | Self-vs-other framing. Gift buyers are single-unit and quality-led; community-bulk buyers deliberately over-provision. |
| `householdSize` | int 1–50 | The consumption denominator — the base driver of quantity. |
| `usageFrequency` | `one-time \| occasional \| regular` | Replenishment cadence → how many "uses" of supply one order should cover. |
| `sustainabilityPriority` | int 1–5 | Willingness to trade convenience for fewer shipments / less packaging. Gates bulk & low-packaging surfacing and the shipping-bundling nudge. |

---

## 2. The prediction engine (deterministic core)

`lib/prediction.ts` is a **transparent additive scoring model** — the same
family as a linear model, kept interpretable on purpose.

### 2.1 Recommendation ranking — `scoreProducts()`

For each product it accumulates a fit score from weighted signal→attribute
matches, and **records which matches fired** (`signals[]`). Examples:

- `purpose = community-bulk` × `product.bulkAvailable` → **+3**, signal
  *"matches your community-bulk purpose with case-sized quantities"*
- `usageFrequency = regular` × `product.consumable` → **+3**, signal
  *"matches your regular usage as a frequently re-bought item"*
- `sustainabilityPriority ≥ 3` × `packaging = minimal` → **+(priority − 1)**,
  signal *"low-packaging option, in line with your sustainability priority (n/5)"*
- `sustainabilityPriority ≥ 3` × `packaging = heavy` → **−(priority − 2)**

Weight **directions and relative magnitudes** come from consumer-research effect
directions (gift → single-unit, sustainability → packaging-sensitive, larger
household → larger sizes). Magnitudes were then **validated on synthetic data**
(section 4) — we kept the set that best recovered ground-truth rankings.

The `reason` string a shopper sees is built **directly from the fired signals**,
so even with no LLM in the loop every recommendation is self-explaining.

### 2.2 Quantity prediction — `computeQuantity()`

Quantity is **not** LLM-guessed. It's a deterministic supply-coverage formula:

```
gift                       → 1 unit (household & frequency do not scale a gift)
one-time                   → ceil(householdSize / 2) units
occasional / regular       → householdSize × ratePerPersonPerWeek × targetWeeks
    ratePerPersonPerWeek:  regular 1.2,  occasional 0.4
    targetWeeks:           regular 2,    occasional 3
community-bulk             → the above × 3
```

then divided by the product's pack size and floored at 1. So *"regular usage,
household of 4"* → `4 × 1.2 × 2 = 9.6` → **10 units ≈ two weeks of supply**, and
the UI can state exactly that.

---

## 3. The LLM layer (assist only — never load-bearing)

Model: `gpt-4o-mini` via the OpenAI-compatible chat API (`lib/openai.ts`).
Swappable to any compatible host (Groq, Ollama, OpenRouter) with one env var.

We do **not** ask the model "what should they buy?". The deterministic engine
has already ranked and justified everything. The model gets:

- the shopper's signals,
- the **scored shortlist with each product's matched signals**,

and is constrained to:

1. reorder **only** within that shortlist,
2. write each `reason` citing **at least one of that product's matched
   signals** in plain language,
3. never use generic AI phrasing.

Its output is then **validated in code**: unknown product IDs are dropped, empty
or generic reasons are replaced with the deterministic signal string, and if
nothing valid comes back we return the deterministic result. Same pattern for
the quantity endpoint's one-line sustainability nudge — it's generated only when
`sustainabilityPriority ≥ 3`, and any failure returns the quantity with
`sustainabilityNote: null`.

**Net effect:** the LLM can improve phrasing and ordering, and can never break a
demo or produce an unexplainable result. With no API key the whole product still
runs.

---

## 4. Calibration — how we validated it without users

A recommender has no real data before launch, so we validate the way demand /
portion models do when data is scarce: **build a generative model of the
shopper, sample a synthetic population, and check the engine recovers the
choices that model considers correct.**

`scripts/calibrate.ts` (`npm run calibrate`, fixed PRNG seed → reproducible):

1. Samples **5,000 synthetic shoppers** (random signal combinations) and a
   fresh 12-product catalog each.
2. A **ground-truth utility function** scores every product for that shopper.
   It shares the engine's main-effect directions but adds **interaction terms
   the additive scorer structurally cannot see**:
   - `gift × fragile` (fragile reads as premium gift) → +1.5
   - `sustainabilityPriority ≥ 4 × locally-sourced` → +2
   - `regular × pantry-staple` → +1.2
   - `householdSize ≥ 6 × bulk consumable` → +1.5
   - plus Gaussian taste noise (σ = 0.8, deliberately large)
3. Compares the engine's ranking and quantity against that ground truth.

### Results (seed 20260830, 5,000 shoppers)

| Metric | Value | Notes |
|---|---|---|
| Top-1 agreement | **44.8%** | vs. ~8% random over 12 products; ceiling is suppressed by the large taste-noise term |
| Top-3 recall | **68.4%** | of the true best 3, we surface ~2 |
| Spearman rank correlation | **0.791** | strong monotonic agreement across the full list |
| Quantity mean abs error | **0.45 packs** | against the generative ideal |
| Quantity within ±1 pack | **87.9%** | |

Interpretation: the additive model tracks a noisier, non-linear ground truth
closely (ρ ≈ 0.79) and quantity is near-exact. The gap to a perfect top-1 is
mostly the injected taste noise and hidden interaction effects — i.e. the parts
no explainable model *should* claim to nail. Re-run `npm run calibrate` after
any weight change to confirm you didn't regress.

---

## 5. What would make it stronger with real data

- Log `{signals, shown, clicked, purchased, returned}` and refit the weights by
  logistic regression on real click/purchase outcomes.
- Learn `ratePerPersonPerWeek` per category from reorder intervals instead of
  the two hand-set constants.
- Add a confidence score from prediction-interval width and flag low-confidence
  picks for a human merchandiser.
