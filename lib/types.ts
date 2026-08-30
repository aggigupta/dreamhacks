export type ProductCategory =
  | "food"
  | "wellness"
  | "craft"
  | "sustainable-goods"
  | "pantry"
  | "home-care"
  | "gifting"
  | "accessories";

export interface TierPrice {
  minQty: number;
  pricePerUnit: number;
  discountPct: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  basePrice?: number;
  unit?: string;
  unitsPerPack?: number;
  image?: string;
  ecoTag?: string;
  materialIndex?: string;
  replantingImpact?: string;
  courierMilesPerItem?: number;
  description?: string;
  bulkFriendly?: boolean;
  bulkAvailable?: boolean;
  perishable?: boolean;
  consumable?: boolean;
  seller?: string;
  sellerId?: string;
  sellerAvatar?: string;
  atollHub?: string;
  packaging?: string;
  sizeTier?: "small" | "medium" | "large" | "bulk-case";
  tierPricing?: TierPrice[];
  _local?: boolean;
  _fragile?: boolean;
}

/**
 * A single seller's offer on a catalog product. Multiple islands sell the same
 * good; each Listing carries that seller's own price, stock, and — crucially —
 * the parameters that drive the customer-facing prediction (tiers, floor/ceiling
 * price, typical weekly consumption).
 */
export interface Listing {
  id: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  atollHub?: string;
  /** Standard (qty 1) price per unit. */
  price: number;
  /** Artisan floor — the dynamic price never drops below this. */
  minPrice?: number;
  /** Ceiling — a listing can't be shown above this. */
  maxPrice?: number;
  stock: number;
  unit?: string;
  unitsPerPack?: number;
  leadTimeDays?: number;
  ecoTag?: string;
  /** Editable volume-discount ladder, best-first is not required. */
  tierPricing?: TierPrice[];
  /** Units one person gets through per week — feeds the quantity suggestion. */
  consumptionPerPersonPerWeek?: number;
  bulkAvailable?: boolean;
  packaging?: string;
  perishable?: boolean;
  active?: boolean;
}

export interface PredictionInput {
  purpose: "personal" | "gift" | "community-bulk";
  householdSize: number;
  usageFrequency: "one-time" | "occasional" | "regular";
  sustainabilityPriority: number;
}

export interface Recommendation {
  productId: string;
  reason: string;
  sameAtollGroup?: string;
}

export interface RecommendResponse {
  recommendations: Recommendation[];
  summary: string;
  co2SavingsKg?: number;
}

export interface QuantityResponse {
  suggestedQuantity: number;
  pricePerUnit: number;
  totalPrice: number;
  sustainabilityNote?: string | null;
  tieredSavingsPct?: number;
  /** Weeks of supply the suggested quantity covers (0 for gift / one-time). */
  weeksOfSupply?: number;
  /** Plain-English derivation of the suggested quantity. */
  basis?: string;
}
