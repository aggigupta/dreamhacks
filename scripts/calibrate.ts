/**
 * ShopSense AI — synthetic calibration & validation harness
 * ========================================================
 *
 * We can't A/B test a recommender before it has users, so we do what portion /
 * demand models do when real data is scarce: build a *generative model of the
 * shopper* from published consumer-behaviour effect directions, sample a large
 * synthetic population from it, and check that the engine recovers the choices
 * that generative model considers "correct".
 *
 * The generative model deliberately includes non-linear interaction terms that
 * the additive scorer in lib/prediction.ts does NOT get to see (gift x fragile,
 * sustainability x local sourcing, regular x pantry-staple, household x bulk).
 * If the engine still tracks it closely, the linear weights are well chosen.
 *
 * Run:  npm run calibrate
 * Deterministic: a fixed PRNG seed, so the numbers in METHODOLOGY.md reproduce.
 */
import { computeQuantity, scoreProducts } from "../lib/prediction";
import type { PredictionInput, Product, ProductCategory } from "../lib/types";

// ---- tiny seeded PRNG (mulberry32) so results reproduce ---------------------
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260830);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const gauss = () => {
  // Box-Muller
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const PURPOSES: PredictionInput["purpose"][] = ["gift", "personal", "community-bulk"];
const FREQS: PredictionInput["usageFrequency"][] = ["one-time", "occasional", "regular"];
const CATEGORIES = ["pantry", "home-care", "gifting", "accessories", "personal-care"];

function randomShopper(): PredictionInput {
  return {
    purpose: pick(PURPOSES),
    usageFrequency: pick(FREQS),
    householdSize: 1 + Math.floor(rand() * 8),
    sustainabilityPriority: 1 + Math.floor(rand() * 5),
  };
}

function randomProduct(i: number): Product {
  const bulk = rand() < 0.4;
  return {
    id: `p${i}`,
    name: `Product ${i}`,
    category: pick(CATEGORIES) as ProductCategory,
    price: 5 + Math.round(rand() * 40),
    unitsPerPack: bulk ? pick([6, 10, 12, 24]) : 1,
    packaging: pick(["minimal", "standard", "heavy"] as const),
    bulkAvailable: bulk,
    consumable: rand() < 0.6,
    sizeTier: pick(["small", "medium", "large"] as const),
    _local: rand() < 0.35,
    _fragile: rand() < 0.25,
  };
}

/**
 * The "ground truth": how good this product REALLY is for this shopper,
 * including interaction effects the scorer is blind to. Higher = better.
 */
function trueUtility(s: PredictionInput, p: Product): number {
  const anyP = p as Product & { _local?: boolean; _fragile?: boolean };
  let u = 0;

  // main effects (same directions the engine encodes)
  if (s.purpose === "community-bulk") u += p.bulkAvailable ? 3 : -1;
  if (s.purpose === "gift") u += p.bulkAvailable && (p.unitsPerPack ?? 1) > 6 ? -2 : 2;
  if (s.purpose === "personal") u += 1;
  if (s.usageFrequency === "regular") u += p.consumable ? 3 : 0.5;
  if (s.usageFrequency === "occasional") u += 1;
  if (s.usageFrequency === "one-time") u += p.consumable ? 0.5 : 2;
  if (s.householdSize >= 4 && (p.sizeTier === "large" || p.bulkAvailable)) u += 1;
  if (s.sustainabilityPriority >= 3) {
    if (p.packaging === "minimal") u += s.sustainabilityPriority - 1;
    if (p.packaging === "heavy") u -= s.sustainabilityPriority - 2;
    if (p.bulkAvailable) u += 1;
  }

  // interaction effects the additive scorer CANNOT represent:
  if (s.purpose === "gift" && anyP._fragile) u += 1.5; // fragile => feels premium as a gift
  if (s.sustainabilityPriority >= 4 && anyP._local) u += 2; // local shipping wins big
  if (s.usageFrequency === "regular" && p.category === "pantry" && p.consumable) u += 1.2;
  if (s.householdSize >= 6 && p.bulkAvailable && p.consumable) u += 1.5;

  return u + gauss() * 0.8; // taste noise
}

/** Ideal quantity the generative model wants, in single units. */
function idealUnits(s: PredictionInput, p: Product): number {
  if (s.purpose === "gift") return 1;
  if (s.usageFrequency === "one-time") return Math.max(1, Math.ceil(s.householdSize / 2));
  const rate = s.usageFrequency === "regular" ? 1.2 : 0.4;
  const weeks = s.usageFrequency === "regular" ? 2 : 3;
  let units = s.householdSize * rate * weeks * (1 + gauss() * 0.15);
  if (s.purpose === "community-bulk") units *= 3;
  return Math.max(1, Math.round(units));
}

// ---- run -------------------------------------------------------------------
const N_SHOPPERS = 5000;
const CATALOG_SIZE = 12;

let top1Hits = 0;
let top3Recall = 0;
let spearmanSum = 0;
const qtyErrors: number[] = [];
let qtyWithin1Pack = 0;

for (let i = 0; i < N_SHOPPERS; i++) {
  const shopper = randomShopper();
  const catalog = Array.from({ length: CATALOG_SIZE }, (_, k) => randomProduct(i * 100 + k));

  const truth = [...catalog]
    .map((p) => ({ id: p.id, u: trueUtility(shopper, p) }))
    .sort((a, b) => b.u - a.u);
  const truthOrder = truth.map((t) => t.id);
  const truthTop3 = new Set(truthOrder.slice(0, 3));

  const predicted = scoreProducts(shopper, catalog);
  const predOrder = predicted.map((sp) => sp.product.id);

  if (predOrder[0] === truthOrder[0]) top1Hits++;
  top3Recall += predOrder.slice(0, 3).filter((id) => truthTop3.has(id)).length / 3;

  // Spearman rho over full ranking
  const rankOf = (order: string[]) => new Map(order.map((id, idx) => [id, idx]));
  const pr = rankOf(predOrder);
  const tr = rankOf(truthOrder);
  let d2 = 0;
  for (const id of truthOrder) {
    const diff = (pr.get(id) ?? 0) - (tr.get(id) ?? 0);
    d2 += diff * diff;
  }
  const n = truthOrder.length;
  spearmanSum += 1 - (6 * d2) / (n * (n * n - 1));

  // quantity check against the top product
  const topProduct = catalog.find((p) => p.id === truthOrder[0])!;
  const got = computeQuantity(shopper, topProduct).suggestedQuantity;
  const want = Math.ceil(idealUnits(shopper, topProduct) / (topProduct.unitsPerPack ?? 1));
  qtyErrors.push(Math.abs(got - want));
  if (Math.abs(got - want) <= 1) qtyWithin1Pack++;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

console.log(`ShopSense AI — synthetic calibration (${N_SHOPPERS} shoppers, catalog ${CATALOG_SIZE})`);
console.log("=".repeat(64));
console.log(`Recommendation ranking`);
console.log(`  top-1 agreement with ground truth : ${((top1Hits / N_SHOPPERS) * 100).toFixed(1)}%`);
console.log(`  top-3 recall                       : ${((top3Recall / N_SHOPPERS) * 100).toFixed(1)}%`);
console.log(`  Spearman rank correlation          : ${(spearmanSum / N_SHOPPERS).toFixed(3)}`);
console.log(`Quantity prediction`);
console.log(`  mean abs error (packs)             : ${mean(qtyErrors).toFixed(2)}`);
console.log(`  within +/-1 pack of ideal          : ${((qtyWithin1Pack / N_SHOPPERS) * 100).toFixed(1)}%`);
