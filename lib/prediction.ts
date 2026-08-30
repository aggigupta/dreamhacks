/**
 * ShopSense AI — deterministic prediction engine
 * ==============================================
 *
 * This is the defensible core. Every recommendation and every quantity can be
 * traced back to the exact PredictionInput signal that produced it — no black
 * box. The LLM layer (see the route handlers) only re-orders and rephrases what
 * this file already decided, and is validated against these results.
 */
import type { PredictionInput, Product } from "./types";

export function clampSustainability(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export interface ScoredProduct {
  product: Product;
  score: number;
  /** Human-readable signal phrases, each naming the input that fired it. */
  signals: string[];
}

/**
 * Score every product for how well it fits the buyer's signals. Higher = better.
 * `signals` collects the plain-English justification so even the pure-fallback
 * path returns signal-grounded reasons.
 */
export function scoreProducts(input: PredictionInput, products: Product[]): ScoredProduct[] {
  const s = clampSustainability(input.sustainabilityPriority);
  const household = Math.max(1, Math.floor(input.householdSize) || 1);

  const scored = products.map((product): ScoredProduct => {
    let score = 0;
    const signals: string[] = [];
    const packSize = product.unitsPerPack ?? 1;

    // --- purpose ↔ product shape ------------------------------------------------
    if (input.purpose === "community-bulk") {
      if (product.bulkAvailable) {
        score += 3;
        signals.push("matches your community-bulk purpose with case-sized quantities");
      } else {
        score -= 1;
      }
    } else if (input.purpose === "gift") {
      if (product.bulkAvailable && packSize > 6) {
        score -= 2; // a 24-pack is a poor gift
      } else {
        score += 2;
        signals.push("a giftable single item rather than a bulk pack");
      }
    } else {
      score += 1;
      signals.push("sized for personal use");
    }

    // --- usage frequency ↔ category fit --------------------------------------
    if (input.usageFrequency === "regular") {
      if (product.consumable) {
        score += 3;
        signals.push("matches your regular usage as a frequently re-bought item");
      } else {
        score += 0.5;
      }
    } else if (input.usageFrequency === "occasional") {
      score += 1;
      signals.push("fits occasional use");
    } else {
      // one-time
      if (!product.consumable) {
        score += 2;
        signals.push("suitable for a one-time purchase");
      } else {
        score += 0.5;
      }
    }

    // --- household size ------------------------------------------------------
    if (household >= 4 && (product.sizeTier === "large" || product.bulkAvailable)) {
      score += 1;
      signals.push(`scaled to your household of ${household}`);
    } else if (household <= 2 && product.sizeTier === "small") {
      score += 0.5;
      signals.push(`right-sized for your household of ${household}`);
    }

    // --- sustainability priority (1-5) ------------------------------------------
    if (s >= 3) {
      if (product.packaging === "minimal") {
        score += s - 1;
        signals.push(`low-packaging option, in line with your sustainability priority (${s}/5)`);
      }
      if (product.packaging === "heavy") {
        score -= s - 2;
      }
      if (product.bulkAvailable) {
        score += 1;
        signals.push(
          `bulk-friendly, so fewer shipments for your sustainability priority (${s}/5)`,
        );
      }
    }

    return { product, score: Number(score.toFixed(2)), signals };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/** Build a deterministic reason string from a product's fired signals. */
export function reasonFromSignals(signals: string[]): string {
  if (signals.length === 0) return "general fit for the details you gave";
  const joined = signals.join("; ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/** Deterministic fallback: top-N by fit score, with signal-grounded reasons. */
export function fallbackRecommendations(scored: ScoredProduct[], limit = 3) {
  return scored.slice(0, limit).map((sp) => ({
    productId: sp.product.id,
    reason: reasonFromSignals(sp.signals),
  }));
}

export function fallbackSummary(input: PredictionInput, scored: ScoredProduct[]): string {
  const s = clampSustainability(input.sustainabilityPriority);
  const top = scored.slice(0, 3).map((sp) => sp.product.name).join(", ");
  const sustaining =
    s >= 3
      ? ` Ranked with a lean toward bulk / low-packaging options because your sustainability priority is ${s}/5.`
      : "";
  return (
    `Top picks for a ${input.purpose} purchase, household of ${Math.max(
      1,
      Math.floor(input.householdSize) || 1,
    )}, ${input.usageFrequency} usage: ${top}.${sustaining}`
  );
}

// ---------------------------------------------------------------------------
// Quantity — householdSize x usageFrequency is the base driver. Deterministic.
// ---------------------------------------------------------------------------

/** Uses of the product consumed per person per week, by cadence. */
const PER_PERSON_PER_WEEK: Record<PredictionInput["usageFrequency"], number> = {
  "one-time": 0,
  occasional: 0.4,
  regular: 1.2,
};

/** How many weeks of supply a sensible single order should cover. */
const TARGET_WEEKS: Record<PredictionInput["usageFrequency"], number> = {
  "one-time": 0,
  occasional: 3,
  regular: 2,
};

export interface QuantityComputation {
  suggestedQuantity: number;
  pricePerUnit: number;
  totalPrice: number;
  /** Plain-English derivation, always populated. */
  basis: string;
  weeksOfSupply: number;
}

/**
 * Unit price for a given quantity: walk the seller's tier ladder for the best
 * applicable discount, then clamp to the artisan's floor price so a listing can
 * never be sold below what the maker set.
 */
export function priceForQuantity(
  basePrice: number,
  qty: number,
  tiers?: { minQty: number; pricePerUnit?: number; discountPct?: number }[],
  minPrice?: number,
): { unitPrice: number; discountPct: number } {
  let discountPct = 0;
  let unitPrice = basePrice;
  for (const t of (tiers ?? []).slice().sort((a, b) => a.minQty - b.minQty)) {
    if (qty >= t.minQty) {
      discountPct = t.discountPct ?? 0;
      unitPrice = t.pricePerUnit ?? Number((basePrice * (1 - discountPct / 100)).toFixed(2));
    }
  }
  if (typeof minPrice === "number" && unitPrice < minPrice) {
    unitPrice = minPrice;
    discountPct = Math.max(0, Math.round((1 - minPrice / basePrice) * 100));
  }
  return { unitPrice: Number(unitPrice.toFixed(2)), discountPct };
}

export function computeQuantity(
  input: PredictionInput,
  product: Product,
  opts?: { consumptionPerPersonPerWeek?: number; pricePerUnit?: number; unitsPerPack?: number },
): QuantityComputation {
  const household = Math.max(1, Math.floor(input.householdSize) || 1);
  const packSize = opts?.unitsPerPack ?? product.unitsPerPack ?? 1;
  const pricePerUnit = Number(opts?.pricePerUnit ?? product.price) || 0;

  let suggestedQuantity: number;
  let basis: string;
  let weeksOfSupply = 0;

  if (input.purpose === "gift") {
    suggestedQuantity = 1;
    basis = "a single unit — this is a gift, so household size and frequency don't scale it up";
  } else if (input.usageFrequency === "one-time") {
    suggestedQuantity = Math.max(1, Math.ceil(household / 2));
    basis = `one-time use covered for a household of ${household}`;
  } else {
    // A listing's consumption rate is expressed at the "regular" cadence; scale
    // it for lighter cadences by the same ratio the default table uses.
    const cadenceFactor =
      PER_PERSON_PER_WEEK[input.usageFrequency] / PER_PERSON_PER_WEEK.regular;
    const regularRate = opts?.consumptionPerPersonPerWeek ?? PER_PERSON_PER_WEEK.regular;
    const perWeek = household * regularRate * cadenceFactor;
    weeksOfSupply = TARGET_WEEKS[input.usageFrequency];
    let units = Math.ceil(perWeek * weeksOfSupply);
    if (input.purpose === "community-bulk") {
      units = Math.ceil(units * 3);
      basis =
        `household of ${household} x ${input.usageFrequency} usage over ~${weeksOfSupply} weeks, ` +
        `then x3 for community-bulk provisioning`;
    } else {
      basis = `household of ${household} x ${input.usageFrequency} usage ≈ ${weeksOfSupply} weeks of supply`;
    }
    suggestedQuantity = Math.max(1, Math.ceil(units / packSize));
  }

  const totalPrice = Number((suggestedQuantity * pricePerUnit).toFixed(2));
  return { suggestedQuantity, pricePerUnit, totalPrice, basis, weeksOfSupply };
}
