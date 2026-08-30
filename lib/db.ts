import type { Product, ProductCategory, PredictionInput, Listing, TierPrice } from "./types";
import { products as initialProducts } from "./mockProducts";
import { sellers as initialSellers } from "./mockSellers";
import { supabase } from "./supabase";

/** Default 1 / 3+ / 5+ volume ladder for a given standard price. */
export function defaultTiers(price: number): TierPrice[] {
  return [
    { minQty: 1, pricePerUnit: Number(price.toFixed(2)), discountPct: 0 },
    { minQty: 3, pricePerUnit: Number((price * 0.85).toFixed(2)), discountPct: 15 },
    { minQty: 5, pricePerUnit: Number((price * 0.7).toFixed(2)), discountPct: 30 },
  ];
}

/** Estimated shipping weight for a product (kg) — explicit field, else per-category default. */
export function weightForProduct(p: Product): number {
  const anyP = p as Product & { weightKg?: number };
  if (typeof anyP.weightKg === "number") return anyP.weightKg;
  const perUnit =
    p.category === "food" ? 0.5 : p.category === "wellness" ? 0.35 : p.category === "craft" ? 0.9 : 0.6;
  return Number((perUnit * (p.unitsPerPack ?? 1)).toFixed(2));
}

/** Extra island co-ops that also stock certain popular catalog products. */
export const EXTRA_OFFERS: Record<
  string,
  { sellerId: string; sellerName: string; priceMult: number; stock: number; leadTimeDays: number }[]
> = {
  p1: [{ sellerId: "greenroot-coop", sellerName: "GreenRoot Co-op", priceMult: 1.15, stock: 40, leadTimeDays: 4 }],
  p2: [
    { sellerId: "greenroot-coop", sellerName: "GreenRoot Co-op", priceMult: 0.92, stock: 22, leadTimeDays: 6 },
    { sellerId: "mayas-kitchen", sellerName: "Maya's Kitchen", priceMult: 1.08, stock: 15, leadTimeDays: 3 },
  ],
  p4: [{ sellerId: "mayas-kitchen", sellerName: "Maya's Kitchen", priceMult: 0.95, stock: 30, leadTimeDays: 3 }],
  p5: [{ sellerId: "coral-coast-crafts", sellerName: "Coral Coast Crafts", priceMult: 1.1, stock: 8, leadTimeDays: 9 }],
  p11: [{ sellerId: "coral-coast-crafts", sellerName: "Coral Coast Crafts", priceMult: 0.9, stock: 12, leadTimeDays: 7 }],
  p13: [{ sellerId: "greenroot-coop", sellerName: "GreenRoot Co-op", priceMult: 1.05, stock: 25, leadTimeDays: 5 }],
  p17: [{ sellerId: "coral-coast-crafts", sellerName: "Coral Coast Crafts", priceMult: 0.88, stock: 6, leadTimeDays: 10 }],
  p21: [{ sellerId: "lani-weaves", sellerName: "Lani Weaves", priceMult: 1.12, stock: 18, leadTimeDays: 8 }],
  p25: [{ sellerId: "nalini-spice-house", sellerName: "Nalini Spice House", priceMult: 0.97, stock: 20, leadTimeDays: 5 }],
  p28: [{ sellerId: "greenroot-coop", sellerName: "GreenRoot Co-op", priceMult: 1.06, stock: 33, leadTimeDays: 4 }],
};

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "shopkeeper";
  storeName?: string;
  avatar?: string;
  createdAt: string;
}

export interface DbOtpCode {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface DbOrder {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  country: string;
  gpsLat: number;
  gpsLng: number;
  subtotal: number;
  backhaulRebate: number;
  shippingCost: number;
  grandTotal: number;
  ecoBackhaulMode: boolean;
  co2SavedKg?: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
  items: { productId: string; productName: string; quantity: number; pricePerUnit: number }[];
}

export interface DbRecommendationLog {
  id: string;
  signals: PredictionInput;
  recommendedIds: string[];
  engine: string;
  modelUsed: string;
  latencyMs: number;
  createdAt: string;
}

export interface DbActiveCargo {
  id: string;
  label: string;
  currentWeightFilledKg: number;
  capacityMaxKg: number;
  updatedAt: string;
  /** Which ferry is currently loading. Bumps every time a container sails full. */
  voyage: number;
}

/** "Island Ferry Container #003" -> 3 (defaults to 1). */
export function voyageFromLabel(label: string): number {
  const m = /#0*(\d+)/.exec(label || "");
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}

/** 3 -> "Island Ferry Container #003". */
export function labelForVoyage(voyage: number): string {
  return `Island Ferry Container #${String(voyage).padStart(3, "0")}`;
}

export type ProductWithOffers = Product & { offerCount: number; fromPrice: number };

/** Everything the app can ask of the store. All async so Supabase / memory swap freely. */
export interface DbApi {
  getAllProducts(): Promise<Product[]>;
  getAllProductsWithOffers(): Promise<ProductWithOffers[]>;
  getProductById(id: string): Promise<Product | undefined>;
  addProduct(product: Product): Promise<Product>;
  getListingsForProduct(productId: string): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | undefined>;
  getListingsBySeller(sellerId: string): Promise<Listing[]>;
  addListing(listing: Listing): Promise<Listing>;
  updateListing(id: string, patch: Partial<Listing>): Promise<Listing | undefined>;
  getUserByEmail(email: string): Promise<DbUser | undefined>;
  saveUser(user: DbUser): Promise<DbUser>;
  saveOtp(email: string, code: string, expiresAt: number): Promise<void>;
  getOtp(email: string): Promise<DbOtpCode | undefined>;
  deleteOtp(email: string): Promise<void>;
  createOrder(order: Omit<DbOrder, "id" | "createdAt" | "status">): Promise<DbOrder>;
  getOrders(): Promise<DbOrder[]>;
  logRecommendation(log: Omit<DbRecommendationLog, "id" | "createdAt">): Promise<DbRecommendationLog>;
  getRecommendationLogs(): Promise<DbRecommendationLog[]>;
  getCargo(): Promise<DbActiveCargo>;
  addCargoWeight(kg: number): Promise<DbActiveCargo>;
  resetCargo(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Listing seed logic (shared by both stores)
// ---------------------------------------------------------------------------
function seedListingsFor(products: Product[], sellersById: Map<string, any>): Listing[] {
  const out: Listing[] = [];
  for (const p of products) {
    const primary: Listing = {
      id: `lst-${p.id}-primary`,
      productId: p.id,
      sellerId: p.sellerId || "mayas-kitchen",
      sellerName: p.seller || "Island Artisan",
      sellerAvatar: p.sellerAvatar,
      atollHub: p.atollHub,
      price: p.price,
      minPrice: Number((p.price * 0.6).toFixed(2)),
      maxPrice: Number((p.price * 1.4).toFixed(2)),
      stock: 25,
      unit: p.unit,
      unitsPerPack: p.unitsPerPack,
      leadTimeDays: 5,
      ecoTag: p.ecoTag,
      tierPricing: p.tierPricing?.length ? p.tierPricing : defaultTiers(p.price),
      consumptionPerPersonPerWeek:
        p.category === "food" ? 1.2 : p.category === "wellness" ? 0.5 : 0.2,
      bulkAvailable: p.bulkAvailable ?? p.bulkFriendly,
      packaging: p.packaging,
      perishable: p.perishable,
      active: true,
    };
    out.push(primary);
    for (const extra of EXTRA_OFFERS[p.id] ?? []) {
      const price = Number((p.price * extra.priceMult).toFixed(2));
      const seller = sellersById.get(extra.sellerId);
      const slug = extra.sellerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      out.push({
        id: `lst-${p.id}-${extra.sellerId}`,
        productId: p.id,
        sellerId: extra.sellerId,
        sellerName: extra.sellerName,
        sellerAvatar: `/products/seller-${slug}.svg`,
        atollHub: seller?.locationName ?? p.atollHub,
        price,
        minPrice: Number((price * 0.6).toFixed(2)),
        maxPrice: Number((price * 1.4).toFixed(2)),
        stock: extra.stock,
        unit: p.unit,
        unitsPerPack: p.unitsPerPack,
        leadTimeDays: extra.leadTimeDays,
        ecoTag: seller?.sustainabilityFocus?.split(" ").slice(0, 3).join(" "),
        tierPricing: defaultTiers(price),
        consumptionPerPersonPerWeek: primary.consumptionPerPersonPerWeek,
        bulkAvailable: primary.bulkAvailable,
        packaging: primary.packaging,
        perishable: primary.perishable,
        active: true,
      });
    }
  }
  return out;
}

function sortOffers(a: Listing, b: Listing) {
  const aOk = a.stock > 0 ? 0 : 1;
  const bOk = b.stock > 0 ? 0 : 1;
  return aOk - bOk || a.price - b.price;
}

// ---------------------------------------------------------------------------
// In-process store (fallback + local dev + CI)
// ---------------------------------------------------------------------------
class MemoryDb implements DbApi {
  private products = new Map<string, Product>();
  private sellers = new Map<string, any>();
  private users = new Map<string, DbUser>();
  private otpCodes = new Map<string, DbOtpCode>();
  private orders = new Map<string, DbOrder>();
  private recommendationLogs: DbRecommendationLog[] = [];
  private listings = new Map<string, Listing>();
  private cargo: DbActiveCargo = {
    id: "ferry-001",
    label: "Island Ferry Container #001",
    currentWeightFilledKg: 64,
    capacityMaxKg: 80,
    updatedAt: new Date().toISOString(),
    voyage: 1,
  };

  constructor() {
    initialProducts.forEach((p) => this.products.set(p.id, p));
    initialSellers.forEach((s) => this.sellers.set(s.id, s));
    seedListingsFor(initialProducts, this.sellers).forEach((l) => this.listings.set(l.id, l));
    this.users.set("aggigupta30@gmail.com", {
      id: "shopkeeper-maya",
      email: "aggigupta30@gmail.com",
      name: "Maya Lin",
      role: "shopkeeper",
      storeName: "Maya's Kitchen",
      avatar: "/products/seller-maya-s-kitchen.svg",
      createdAt: new Date().toISOString(),
    });
  }

  async getAllProducts() {
    return Array.from(this.products.values());
  }
  async getAllProductsWithOffers() {
    return (await this.getAllProducts()).map((p) => {
      const offers = Array.from(this.listings.values())
        .filter((l) => l.productId === p.id && l.active !== false)
        .sort(sortOffers);
      return { ...p, offerCount: offers.length || 1, fromPrice: offers[0]?.price ?? p.price };
    });
  }
  async getProductById(id: string) {
    return this.products.get(id);
  }
  async addProduct(product: Product) {
    this.products.set(product.id, product);
    return product;
  }
  async getListingsForProduct(productId: string) {
    return Array.from(this.listings.values())
      .filter((l) => l.productId === productId && l.active !== false)
      .sort(sortOffers);
  }
  async getListingById(id: string) {
    return this.listings.get(id);
  }
  async getListingsBySeller(sellerId: string) {
    return Array.from(this.listings.values()).filter((l) => l.sellerId === sellerId);
  }
  async addListing(listing: Listing) {
    this.listings.set(listing.id, listing);
    return listing;
  }
  async updateListing(id: string, patch: Partial<Listing>) {
    const cur = this.listings.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, id: cur.id };
    this.listings.set(id, next);
    return next;
  }
  async getUserByEmail(email: string) {
    return this.users.get(email.toLowerCase());
  }
  async saveUser(user: DbUser) {
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }
  async saveOtp(email: string, code: string, expiresAt: number) {
    const key = email.toLowerCase();
    const existing = this.otpCodes.get(key);
    this.otpCodes.set(key, { email: key, code, expiresAt, attempts: existing ? existing.attempts + 1 : 1 });
  }
  async getOtp(email: string) {
    return this.otpCodes.get(email.toLowerCase());
  }
  async deleteOtp(email: string) {
    this.otpCodes.delete(email.toLowerCase());
  }
  async createOrder(order: Omit<DbOrder, "id" | "createdAt" | "status">) {
    const id = `ISLE-${Math.floor(100000 + Math.random() * 900000)}`;
    const full: DbOrder = { ...order, id, status: "confirmed", createdAt: new Date().toISOString() };
    this.orders.set(id, full);
    return full;
  }
  async getOrders() {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  async logRecommendation(log: Omit<DbRecommendationLog, "id" | "createdAt">) {
    const full: DbRecommendationLog = {
      ...log,
      id: `rec-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.recommendationLogs.unshift(full);
    return full;
  }
  async getRecommendationLogs() {
    return this.recommendationLogs;
  }
  async getCargo() {
    return { ...this.cargo };
  }
  async addCargoWeight(kg: number) {
    let next = this.cargo.currentWeightFilledKg + Math.max(0, kg);
    let voyage = this.cargo.voyage;
    // Container full -> it sails; the next ferry starts loading with the overflow.
    while (next >= this.cargo.capacityMaxKg) {
      next -= this.cargo.capacityMaxKg;
      voyage += 1;
    }
    this.cargo = {
      ...this.cargo,
      currentWeightFilledKg: Number(next.toFixed(1)),
      voyage,
      label: labelForVoyage(voyage),
      updatedAt: new Date().toISOString(),
    };
    return { ...this.cargo };
  }
  async resetCargo() {
    this.cargo = {
      ...this.cargo,
      currentWeightFilledKg: 64,
      voyage: 1,
      label: labelForVoyage(1),
      updatedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Supabase-backed store
// ---------------------------------------------------------------------------
const sb = supabase!;

const rowToProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  category: r.category as ProductCategory,
  price: Number(r.base_price),
  basePrice: Number(r.base_price),
  unit: r.unit ?? undefined,
  unitsPerPack: r.units_per_pack ?? undefined,
  image: r.image ?? undefined,
  ecoTag: r.eco_tag ?? undefined,
  materialIndex: r.material_index ?? undefined,
  replantingImpact: r.replanting_impact ?? undefined,
  courierMilesPerItem: r.courier_miles_per_item ?? undefined,
  description: r.description ?? undefined,
  atollHub: r.atoll_hub ?? undefined,
  packaging: r.packaging ?? undefined,
  consumable: r.consumable ?? undefined,
  bulkAvailable: r.bulk_available ?? undefined,
  bulkFriendly: r.bulk_friendly ?? undefined,
  perishable: r.perishable ?? undefined,
  sizeTier: r.size_tier ?? undefined,
  ...(r.weight_kg != null ? { weightKg: Number(r.weight_kg) } : {}),
});

const productToRow = (p: Product) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  base_price: p.price ?? p.basePrice ?? 0,
  unit: p.unit ?? null,
  units_per_pack: p.unitsPerPack ?? 1,
  image: p.image ?? null,
  eco_tag: p.ecoTag ?? null,
  material_index: p.materialIndex ?? null,
  replanting_impact: p.replantingImpact ?? null,
  description: p.description ?? null,
  atoll_hub: p.atollHub ?? null,
  packaging: p.packaging ?? null,
  consumable: p.consumable ?? p.perishable ?? null,
  bulk_available: p.bulkAvailable ?? p.bulkFriendly ?? null,
  bulk_friendly: p.bulkFriendly ?? null,
  perishable: p.perishable ?? null,
  size_tier: p.sizeTier ?? null,
  weight_kg: (p as any).weightKg ?? null,
  courier_miles_per_item: p.courierMilesPerItem ?? null,
});

const rowToListing = (r: any): Listing => ({
  id: r.id,
  productId: r.product_id,
  sellerId: r.seller_id,
  sellerName: r.seller_name,
  sellerAvatar: r.seller_avatar ?? undefined,
  atollHub: r.atoll_hub ?? undefined,
  price: Number(r.price),
  minPrice: r.min_price != null ? Number(r.min_price) : undefined,
  maxPrice: r.max_price != null ? Number(r.max_price) : undefined,
  stock: r.stock ?? 0,
  unit: r.unit ?? undefined,
  unitsPerPack: r.units_per_pack ?? undefined,
  leadTimeDays: r.lead_time_days ?? undefined,
  ecoTag: r.eco_tag ?? undefined,
  tierPricing: r.tier_pricing ?? [],
  consumptionPerPersonPerWeek:
    r.consumption_per_person_per_week != null ? Number(r.consumption_per_person_per_week) : undefined,
  bulkAvailable: r.bulk_available ?? undefined,
  packaging: r.packaging ?? undefined,
  perishable: r.perishable ?? undefined,
  active: r.active ?? true,
});

const listingToRow = (l: Listing) => ({
  id: l.id,
  product_id: l.productId,
  seller_id: l.sellerId,
  seller_name: l.sellerName,
  seller_avatar: l.sellerAvatar ?? null,
  atoll_hub: l.atollHub ?? null,
  price: l.price,
  min_price: l.minPrice ?? null,
  max_price: l.maxPrice ?? null,
  stock: l.stock ?? 0,
  unit: l.unit ?? null,
  units_per_pack: l.unitsPerPack ?? 1,
  lead_time_days: l.leadTimeDays ?? 5,
  eco_tag: l.ecoTag ?? null,
  tier_pricing: l.tierPricing ?? [],
  consumption_per_person_per_week: l.consumptionPerPersonPerWeek ?? null,
  bulk_available: l.bulkAvailable ?? false,
  packaging: l.packaging ?? null,
  perishable: l.perishable ?? false,
  active: l.active ?? true,
});

const rowToOrder = (r: any, items: any[]): DbOrder => ({
  id: r.id,
  userId: r.user_id ?? undefined,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  address: r.address,
  city: r.city,
  country: r.country,
  gpsLat: Number(r.gps_lat),
  gpsLng: Number(r.gps_lng),
  subtotal: Number(r.subtotal),
  backhaulRebate: Number(r.backhaul_rebate),
  shippingCost: Number(r.shipping_cost),
  grandTotal: Number(r.grand_total),
  ecoBackhaulMode: r.eco_backhaul_mode,
  co2SavedKg: r.co2_saved_kg != null ? Number(r.co2_saved_kg) : undefined,
  status: r.status,
  createdAt: r.created_at,
  items: items.map((i) => ({
    productId: i.product_id,
    productName: i.product_name,
    quantity: i.quantity,
    pricePerUnit: Number(i.price_per_unit),
  })),
});

class SupabaseDb implements DbApi {
  private seeding: Promise<void> | null = null;

  /** Idempotently push the mock catalog + sellers + listings + cargo row. */
  private async ensureSeeded() {
    if (this.seeding) return this.seeding;
    this.seeding = (async () => {
      // Products + listings are upserted every cold start (idempotent, ~2 calls)
      // so schema/attribute changes to the seed self-heal without a manual wipe.
      const sellersById = new Map(initialSellers.map((s) => [s.id, s]));
      await sb.from("products").upsert(initialProducts.map(productToRow));
      await sb.from("listings").upsert(seedListingsFor(initialProducts, sellersById).map(listingToRow));

      const { count: sCount } = await sb
        .from("sellers")
        .select("id", { count: "exact", head: true });
      if ((sCount ?? 0) >= initialSellers.length) return;
      await sb.from("sellers").upsert(
        initialSellers.map((s) => ({
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          location_name: s.locationName,
          lat: s.coordinates?.lat,
          lng: s.coordinates?.lng,
          bio: s.bio,
          story: s.story,
          sustainability_focus: s.sustainabilityFocus,
          avatar: s.avatarIcon,
          banner_gradient: s.bannerGradient,
        })),
      );
      await sb.from("active_cargo").upsert({
        id: "ferry-001",
        label: "Island Ferry Container #001",
        current_weight_filled_kg: 64,
        capacity_max_kg: 80,
        updated_at: new Date().toISOString(),
      });
      await sb.from("users").upsert({
        id: "shopkeeper-maya",
        email: "aggigupta30@gmail.com",
        name: "Maya Lin",
        role: "shopkeeper",
        store_name: "Maya's Kitchen",
        avatar: "/products/seller-maya-s-kitchen.svg",
      });
    })();
    return this.seeding;
  }

  async getAllProducts() {
    await this.ensureSeeded();
    const { data } = await sb.from("products").select("*").order("id");
    return (data ?? []).map(rowToProduct);
  }
  async getAllProductsWithOffers() {
    await this.ensureSeeded();
    const [{ data: prods }, { data: lst }] = await Promise.all([
      sb.from("products").select("*").order("id"),
      sb.from("listings").select("*").eq("active", true),
    ]);
    const byProduct = new Map<string, Listing[]>();
    for (const r of lst ?? []) {
      const l = rowToListing(r);
      (byProduct.get(l.productId) ?? byProduct.set(l.productId, []).get(l.productId)!).push(l);
    }
    return (prods ?? []).map((r) => {
      const p = rowToProduct(r);
      const offers = (byProduct.get(p.id) ?? []).sort(sortOffers);
      return { ...p, offerCount: offers.length || 1, fromPrice: offers[0]?.price ?? p.price };
    });
  }
  async getProductById(id: string) {
    await this.ensureSeeded();
    const { data } = await sb.from("products").select("*").eq("id", id).maybeSingle();
    return data ? rowToProduct(data) : undefined;
  }
  async addProduct(product: Product) {
    await sb.from("products").upsert(productToRow(product));
    return product;
  }
  async getListingsForProduct(productId: string) {
    await this.ensureSeeded();
    const { data } = await sb.from("listings").select("*").eq("product_id", productId).eq("active", true);
    return (data ?? []).map(rowToListing).sort(sortOffers);
  }
  async getListingById(id: string) {
    const { data } = await sb.from("listings").select("*").eq("id", id).maybeSingle();
    return data ? rowToListing(data) : undefined;
  }
  async getListingsBySeller(sellerId: string) {
    const { data } = await sb.from("listings").select("*").eq("seller_id", sellerId);
    return (data ?? []).map(rowToListing);
  }
  async addListing(listing: Listing) {
    await sb.from("listings").upsert(listingToRow(listing));
    return listing;
  }
  async updateListing(id: string, patch: Partial<Listing>) {
    const cur = await this.getListingById(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, id: cur.id };
    await sb.from("listings").upsert(listingToRow(next));
    return next;
  }
  async getUserByEmail(email: string) {
    const { data } = await sb.from("users").select("*").eq("email", email.toLowerCase()).maybeSingle();
    return data
      ? {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          storeName: data.store_name ?? undefined,
          avatar: data.avatar ?? undefined,
          createdAt: data.created_at,
        }
      : undefined;
  }
  async saveUser(user: DbUser) {
    await sb.from("users").upsert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
      store_name: user.storeName ?? null,
      avatar: user.avatar ?? null,
    });
    return user;
  }
  async saveOtp(email: string, code: string, expiresAt: number) {
    const key = email.toLowerCase();
    const { data } = await sb.from("otp_codes").select("attempts").eq("email", key).maybeSingle();
    await sb.from("otp_codes").upsert({
      email: key,
      code,
      expires_at: expiresAt,
      attempts: data ? (data.attempts ?? 0) + 1 : 1,
    });
  }
  async getOtp(email: string) {
    const { data } = await sb.from("otp_codes").select("*").eq("email", email.toLowerCase()).maybeSingle();
    return data
      ? { email: data.email, code: data.code, expiresAt: Number(data.expires_at), attempts: data.attempts }
      : undefined;
  }
  async deleteOtp(email: string) {
    await sb.from("otp_codes").delete().eq("email", email.toLowerCase());
  }
  async createOrder(order: Omit<DbOrder, "id" | "createdAt" | "status">) {
    const id = `ISLE-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAt = new Date().toISOString();
    await sb.from("orders").insert({
      id,
      user_id: order.userId ?? null,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      address: order.address,
      city: order.city,
      country: order.country,
      gps_lat: order.gpsLat,
      gps_lng: order.gpsLng,
      subtotal: order.subtotal,
      backhaul_rebate: order.backhaulRebate,
      shipping_cost: order.shippingCost,
      grand_total: order.grandTotal,
      eco_backhaul_mode: order.ecoBackhaulMode,
      co2_saved_kg: order.co2SavedKg ?? 0,
      status: "confirmed",
      created_at: createdAt,
    });
    if (order.items.length) {
      await sb.from("order_items").insert(
        order.items.map((i) => ({
          order_id: id,
          product_id: i.productId,
          product_name: i.productName,
          quantity: i.quantity,
          price_per_unit: i.pricePerUnit,
        })),
      );
    }
    return { ...order, id, status: "confirmed" as const, createdAt };
  }
  async getOrders() {
    const { data: orders } = await sb
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!orders?.length) return [];
    const { data: items } = await sb
      .from("order_items")
      .select("*")
      .in("order_id", orders.map((o) => o.id));
    const byOrder = new Map<string, any[]>();
    for (const it of items ?? []) (byOrder.get(it.order_id) ?? byOrder.set(it.order_id, []).get(it.order_id)!).push(it);
    return orders.map((o) => rowToOrder(o, byOrder.get(o.id) ?? []));
  }
  async logRecommendation(log: Omit<DbRecommendationLog, "id" | "createdAt">) {
    const full: DbRecommendationLog = {
      ...log,
      id: `rec-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    await sb.from("recommendation_logs").insert({
      id: full.id,
      signals: full.signals,
      recommended_ids: full.recommendedIds,
      engine: full.engine,
      model_used: full.modelUsed,
      latency_ms: full.latencyMs,
      created_at: full.createdAt,
    });
    return full;
  }
  async getRecommendationLogs() {
    const { data } = await sb
      .from("recommendation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      id: r.id,
      signals: r.signals,
      recommendedIds: r.recommended_ids ?? [],
      engine: r.engine,
      modelUsed: r.model_used,
      latencyMs: r.latency_ms,
      createdAt: r.created_at,
    }));
  }
  async getCargo() {
    await this.ensureSeeded();
    const { data } = await sb.from("active_cargo").select("*").eq("id", "ferry-001").maybeSingle();
    if (!data)
      return { id: "ferry-001", label: labelForVoyage(1), currentWeightFilledKg: 64, capacityMaxKg: 80, updatedAt: new Date().toISOString(), voyage: 1 };
    return {
      id: data.id,
      label: data.label,
      currentWeightFilledKg: Number(data.current_weight_filled_kg),
      capacityMaxKg: Number(data.capacity_max_kg),
      updatedAt: data.updated_at,
      voyage: voyageFromLabel(data.label),
    };
  }
  async addCargoWeight(kg: number) {
    const cur = await this.getCargo();
    let next = cur.currentWeightFilledKg + Math.max(0, kg);
    let voyage = cur.voyage;
    // Container full -> it sails; the next ferry starts loading with the overflow.
    while (next >= cur.capacityMaxKg) {
      next -= cur.capacityMaxKg;
      voyage += 1;
    }
    next = Number(next.toFixed(1));
    const label = labelForVoyage(voyage);
    const updatedAt = new Date().toISOString();
    await sb
      .from("active_cargo")
      .update({ current_weight_filled_kg: next, label, updated_at: updatedAt })
      .eq("id", "ferry-001");
    return { ...cur, currentWeightFilledKg: next, voyage, label, updatedAt };
  }
  async resetCargo() {
    await sb
      .from("active_cargo")
      .update({ current_weight_filled_kg: 64, label: labelForVoyage(1), updated_at: new Date().toISOString() })
      .eq("id", "ferry-001");
  }
}

// ---------------------------------------------------------------------------
const globalForDb = globalThis as unknown as { dbInstance?: DbApi };
export const db: DbApi =
  globalForDb.dbInstance ?? (supabase ? new SupabaseDb() : new MemoryDb());
if (process.env.NODE_ENV !== "production") globalForDb.dbInstance = db;
