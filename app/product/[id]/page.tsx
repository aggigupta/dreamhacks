"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Leaf,
  Store,
  Sparkles,
  Plus,
  Minus,
  ShieldCheck,
  Anchor,
  Package,
  Sprout,
  Check,
  Truck,
} from "lucide-react";
import type { Product, QuantityResponse, Listing } from "@/lib/types";
import { priceForQuantity } from "@/lib/prediction";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { allProducts, quizInput, addToCart } = useCart();
  const [imgError, setImgError] = useState(false);

  const product = allProducts.find((p) => p.id === id);

  const [offers, setOffers] = useState<Listing[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [loadingQty, setLoadingQty] = useState(false);
  const [qtyData, setQtyData] = useState<QuantityResponse | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  // Pull the offers (multiple island co-ops sell the same catalog product).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.offers?.length) return;
        setOffers(data.offers as Listing[]);
        setSelectedOfferId((data.offers as Listing[])[0].id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const activeListing = offers.find((o) => o.id === selectedOfferId) ?? offers[0];

  const basePrice = activeListing?.price ?? product?.price ?? product?.basePrice ?? 0;
  const tiers = activeListing?.tierPricing;
  const minPrice = activeListing?.minPrice;
  const sortedTiers = (tiers ?? []).slice().sort((a, b) => a.minQty - b.minQty);

  const { unitPrice: activeUnitPrice, discountPct: savingsPct } = priceForQuantity(
    basePrice,
    quantity,
    tiers,
    minPrice,
  );
  const totalPrice = Number((quantity * activeUnitPrice).toFixed(2));

  const unitLabel = activeListing?.unit || product?.unit || "unit";
  const suggestedQty = qtyData?.suggestedQuantity ?? 1;
  const maxQty = Math.min(24, Math.max(12, suggestedQty + 6));
  const trackPct = (v: number) =>
    `${((Math.min(Math.max(v, 1), maxQty) - 1) / (maxQty - 1)) * 100}%`;
  const atSuggested = quantity === suggestedQty;
  const plural = suggestedQty > 1 ? "s" : "";
  const nextTier = sortedTiers.find(
    (t) => t.minQty > quantity && (t.discountPct ?? 0) > savingsPct,
  );
  const aiLine =
    qtyData?.sustainabilityNote ||
    (qtyData?.weeksOfSupply
      ? `Our read: ${suggestedQty} ${unitLabel}${plural}, about ${qtyData.weeksOfSupply} weeks for a household of ${quizInput.householdSize}. Slide it to your own call.`
      : qtyData?.basis
      ? `Our read: ${suggestedQty} ${unitLabel}${plural}. ${qtyData.basis}. It's your call.`
      : null);

  // Quantity suggestion, recomputed when the shopper switches seller.
  useEffect(() => {
    if (!product) return;
    const listing = activeListing;
    setLoadingQty(true);
    fetch("/api/quantity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: quizInput,
        product: {
          ...product,
          price: listing?.price ?? product.price,
          unitsPerPack: listing?.unitsPerPack ?? product.unitsPerPack,
        },
        listing: listing
          ? {
              consumptionPerPersonPerWeek: listing.consumptionPerPersonPerWeek,
              unitsPerPack: listing.unitsPerPack,
              price: listing.price,
            }
          : undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: QuantityResponse | null) => {
        if (!data) return;
        setQtyData(data);
        if (data.suggestedQuantity && data.suggestedQuantity > 1) {
          setQuantity(data.suggestedQuantity);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingQty(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, quizInput, selectedOfferId, offers.length]);

  if (!product) {
    notFound();
    return null;
  }

  function handleAddToCart() {
    if (!product) return;
    const withSeller: Product = activeListing
      ? {
          ...product,
          price: basePrice,
          seller: activeListing.sellerName,
          sellerId: activeListing.sellerId,
          sellerAvatar: activeListing.sellerAvatar ?? product.sellerAvatar,
        }
      : product;
    addToCart(withSeller, quantity, activeUnitPrice, qtyData?.sustainabilityNote);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  }

  const sameAtollProducts = allProducts
    .filter((p) => p.id !== product.id && p.atollHub === product.atollHub)
    .slice(0, 3);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#082B5C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product image */}
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] relative flex flex-col justify-center items-center">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full object-contain max-h-[480px]"
            />
          ) : (
            <div className="text-8xl p-16">
              {product.category === "food" ? "🥥" : product.category === "wellness" ? "🌿" : product.category === "craft" ? "🧺" : "🌱"}
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-center gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium capitalize">
              {product.category}
            </span>
            {product.ecoTag && (
              <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" />
                {product.ecoTag}
              </span>
            )}
          </div>
        </div>

        {/* Details, offers, pricing */}
        <div className="space-y-6">
          <div>
            {activeListing && (
              <Link
                href={`/seller/${activeListing.sellerId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55AEB1] hover:text-[#082B5C] transition-colors mb-2"
              >
                <Store className="w-4 h-4" />
                <span>Sold by {activeListing.sellerName}</span>
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B5C] leading-tight">
              {product.name}
            </h1>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">{product.description}</p>

          <div className="space-y-2">
            {product.materialIndex && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#082B5C]">
                Material Provenance Index: <strong>{product.materialIndex}</strong>
              </div>
            )}
            {product.replantingImpact && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Sprout className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>Buying this product directly funds {product.replantingImpact} in the artisan's home village.</span>
              </div>
            )}
          </div>

          {/* ---- Offers: multiple island co-ops sell the same catalog product ---- */}
          {offers.length > 0 && (
            <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#082B5C] uppercase tracking-wider">
                  {offers.length === 1
                    ? "1 island seller"
                    : `${offers.length} island co-ops sell this`}
                </span>
                <span className="text-xs text-slate-500">
                  from <strong className="text-[#082B5C]">${Math.min(...offers.map((o) => o.price)).toFixed(2)}</strong>
                </span>
              </div>

              <div className="space-y-2">
                {offers.map((o) => {
                  const selected = o.id === activeListing?.id;
                  const out = o.stock <= 0;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={out}
                      onClick={() => setSelectedOfferId(o.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        selected
                          ? "border-[#55AEB1] bg-[#55AEB1]/10"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      } ${out ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selected ? "border-[#55AEB1] bg-[#55AEB1] text-white" : "border-slate-300"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#082B5C] truncate">{o.sellerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {out ? "Out of stock" : `${o.stock} in stock · ~${o.leadTimeDays ?? 5}d`}
                          </span>
                          {o.ecoTag && <span className="hidden sm:inline text-emerald-600">· {o.ecoTag}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-[#082B5C]">${o.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">/{o.unit || unitLabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Freight hook */}
          <div className="p-3.5 rounded-xl bg-[#082B5C]/10 border border-[#082B5C]/20 flex items-center gap-2.5 text-xs font-bold text-[#082B5C]">
            <Anchor className="w-4 h-4 text-[#55AEB1] shrink-0" />
            <span>Consolidated Island Route: Est. delivery 5 to 8 business days.</span>
          </div>

{/* ---- Interactive quantity: one slider, live price, seller's own tiers ---- */}
          <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#082B5C] uppercase tracking-wider">
                How much should you get?
              </span>
              <button
                type="button"
                onClick={() => setQuantity(suggestedQty)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  atSuggested
                    ? "bg-[#55AEB1]/15 text-[#0d6a6d] border border-[#55AEB1]/30"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#55AEB1]" />
                <span>{loadingQty ? "Reading signals…" : `ShopSense picks ${suggestedQty}`}</span>
              </button>
            </div>

            <div className="pt-6 pb-1">
              <div className="relative">
                <div
                  className="absolute -top-6 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: trackPct(suggestedQty) }}
                >
                  <span className="text-[9px] font-bold text-[#0d6a6d] whitespace-nowrap">AI pick</span>
                  <span className="w-px h-2 bg-[#55AEB1]" />
                </div>
                {sortedTiers
                  .filter((t) => t.minQty > 1 && t.minQty <= maxQty)
                  .map((t) => (
                    <div
                      key={t.minQty}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                      style={{ left: trackPct(t.minQty) }}
                    >
                      <span className="block w-0.5 h-3 bg-slate-300 rounded-full" />
                    </div>
                  ))}
                <input
                  type="range"
                  min={1}
                  max={maxQty}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  aria-label="Quantity"
                  className="relative w-full h-2 rounded-full appearance-none cursor-pointer accent-[#55AEB1] bg-slate-200"
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-slate-400">
                <span>1</span>
                {sortedTiers
                  .filter((t) => t.minQty > 1)
                  .map((t) => (
                    <span key={t.minQty} className="text-emerald-600">
                      {t.minQty}+ · −{t.discountPct}%
                    </span>
                  ))}
                <span>{maxQty}</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-lg font-bold text-[#082B5C]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  {unitLabel}
                  {quantity > 1 ? "s" : ""}
                </span>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {savingsPct > 0 && (
                    <span className="text-xs text-slate-400 line-through">${basePrice.toFixed(2)}</span>
                  )}
                  <span className="text-sm font-bold text-[#082B5C]">
                    ${activeUnitPrice.toFixed(2)}
                    <span className="text-[11px] font-normal text-slate-500">/{unitLabel}</span>
                  </span>
                  {savingsPct > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      −{savingsPct}%
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-[11px] text-slate-400 block leading-none">Order total</span>
                  <span className="text-3xl font-extrabold text-[#082B5C]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {minPrice != null && activeUnitPrice <= minPrice + 0.001 && (
              <p className="text-[11px] text-amber-600 font-semibold">
                At the artisan&apos;s floor price of ${minPrice.toFixed(2)}. Discounts stop here.
              </p>
            )}

            {nextTier && (
              <p className="text-[11px] text-slate-500">
                Add {nextTier.minQty - quantity} more to unlock{" "}
                <span className="font-bold text-emerald-600">−{nextTier.discountPct}%</span> per {unitLabel}.
              </p>
            )}

            {aiLine && (
              <div className="p-3 rounded-xl bg-[#55AEB1]/10 border border-[#55AEB1]/25 text-[#0d5b5e] text-xs leading-relaxed flex gap-2">
                <Sparkles className="w-4 h-4 text-[#55AEB1] shrink-0 mt-0.5" />
                <span>{aiLine}</span>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className="btn-navy w-full py-4 rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-[#55AEB1]" />
<span>Add to Shared Crate  ·  ${totalPrice.toFixed(2)}</span>
            </button>

            {addedToast && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Added to cart from {activeListing?.sellerName ?? "the seller"}.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {sameAtollProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Logistics Layer B: Atoll Bundling</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#082B5C]">
              Ship Together &amp; Save Carbon ({product.atollHub})
            </h2>
            <p className="text-xs text-slate-500">
              These items originate from the exact same island atoll. Combine them into one ferry crate to minimize carbon output.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sameAtollProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
