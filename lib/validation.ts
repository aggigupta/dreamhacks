/**
 * Request validation. No free text reaches the LLM prompts — every field is a
 * bounded enum or a clamped integer, so the prompt surface stays injection-safe.
 */
import type { PredictionInput, Product, ProductCategory } from "./types";

const PURPOSES = ["gift", "personal", "community-bulk"] as const;
const FREQUENCIES = ["one-time", "occasional", "regular"] as const;

export function parsePredictionInput(raw: unknown): PredictionInput | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "`input` must be an object." };
  const r = raw as Record<string, unknown>;

  if (!PURPOSES.includes(r.purpose as (typeof PURPOSES)[number])) {
    return { error: `\`input.purpose\` must be one of ${PURPOSES.join(", ")}.` };
  }
  if (!FREQUENCIES.includes(r.usageFrequency as (typeof FREQUENCIES)[number])) {
    return { error: `\`input.usageFrequency\` must be one of ${FREQUENCIES.join(", ")}.` };
  }

  const householdSize = Number(r.householdSize);
  if (!Number.isFinite(householdSize) || householdSize < 1 || householdSize > 50) {
    return { error: "`input.householdSize` must be a number between 1 and 50." };
  }

  const sustainabilityPriority = Number(r.sustainabilityPriority);
  if (
    !Number.isFinite(sustainabilityPriority) ||
    sustainabilityPriority < 1 ||
    sustainabilityPriority > 5
  ) {
    return { error: "`input.sustainabilityPriority` must be a number between 1 and 5." };
  }

  return {
    purpose: r.purpose as PredictionInput["purpose"],
    usageFrequency: r.usageFrequency as PredictionInput["usageFrequency"],
    householdSize: Math.floor(householdSize),
    sustainabilityPriority: Math.round(sustainabilityPriority),
  };
}

export function parseProduct(raw: unknown): Product | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "`product` must be an object." };
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id.trim()) return { error: "`product.id` is required." };
  if (typeof r.name !== "string" || !r.name.trim()) return { error: "`product.name` is required." };

  const price = Number(r.price ?? r.basePrice);
  if (!Number.isFinite(price) || price < 0) return { error: "`product.price` must be >= 0." };

  const bulkAvailable =
    typeof r.bulkAvailable === "boolean"
      ? r.bulkAvailable
      : typeof r.bulkFriendly === "boolean"
      ? r.bulkFriendly
      : undefined;

  const consumable =
    typeof r.consumable === "boolean"
      ? r.consumable
      : typeof r.perishable === "boolean"
      ? r.perishable
      : undefined;

  return {
    id: r.id,
    name: r.name,
    category: (typeof r.category === "string" ? r.category : "food") as ProductCategory,
    price,
    basePrice: price,
    unit: typeof r.unit === "string" ? r.unit : undefined,
    unitsPerPack: Number.isFinite(Number(r.unitsPerPack)) ? Number(r.unitsPerPack) : undefined,
    packaging: ["minimal", "standard", "heavy"].includes(r.packaging as string)
      ? (r.packaging as Product["packaging"])
      : undefined,
    bulkAvailable,
    bulkFriendly: bulkAvailable,
    consumable,
    perishable: consumable,
    sizeTier: ["small", "medium", "large"].includes(r.sizeTier as string)
      ? (r.sizeTier as Product["sizeTier"])
      : undefined,
    seller: typeof r.seller === "string" ? r.seller : undefined,
    sellerId: typeof r.sellerId === "string" ? r.sellerId : undefined,
    ecoTag: typeof r.ecoTag === "string" ? r.ecoTag : undefined,
    description: typeof r.description === "string" ? r.description : undefined,
  };
}

export function parseProducts(raw: unknown): Product[] | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "`products` must be a non-empty array." };
  }
  if (raw.length > 200) return { error: "`products` is capped at 200 items." };
  const out: Product[] = [];
  for (const item of raw) {
    const parsed = parseProduct(item);
    if ("error" in parsed) return parsed;
    out.push(parsed);
  }
  return out;
}
