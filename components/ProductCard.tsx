"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, ShoppingBag, Sparkles, MapPin, Sprout } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  reason?: string;
  rank?: number;
}

export function ProductCard({ product, reason }: ProductCardProps) {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const displayPrice = product.price ?? product.basePrice ?? 0;

  return (
    <div className="card-light flex flex-col justify-between overflow-hidden group relative transition-all duration-500 hover:scale-[1.03] shadow-[0_8px_30px_rgba(8,43,92,0.04)] bg-white rounded-2xl border border-slate-200">
      {/* Overlapping Eco Badge on Top Left */}
      {product.ecoTag && (
        <div className="absolute top-3 left-3 z-20">
          <span className="px-3 py-1 rounded-full bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-sm">
            <Leaf className="w-3 h-3" />
            {product.ecoTag}
          </span>
        </div>
      )}

      {/* Atoll Hub Badge on Top Right */}
      {product.atollHub && (
        <div className="absolute top-3 right-3 z-20">
          <span className="px-3 py-1 rounded-full bg-[#082B5C] text-white text-[10px] font-mono font-medium flex items-center gap-1 shadow-sm">
            <MapPin className="w-3 h-3 text-[#55AEB1]" />
            {product.atollHub.split(" ")[0]} Hub
          </span>
        </div>
      )}

      {/* Product Image Container */}
      <Link href={`/product/${product.id}`} className="block relative bg-slate-100 overflow-hidden pt-[65%]">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-serif text-[#082B5C]/30">
            {product.name.charAt(0)}
          </div>
        )}
      </Link>

      {/* Body Content */}
      <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          {/* Artisan Avatar & Name */}
          {product.seller && (
            <div className="flex items-center gap-2">
              {product.sellerAvatar ? (
                <img
                  src={product.sellerAvatar}
                  alt={product.seller}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#082B5C] text-white flex items-center justify-center text-[10px] font-bold">
                  {product.seller.charAt(0)}
                </div>
              )}
              <Link
                href={`/seller/${product.sellerId || "mayas-kitchen"}`}
                className="text-xs font-medium text-slate-600 hover:text-[#082B5C] transition-colors"
              >
                {product.seller}
              </Link>
            </div>
          )}

          <Link href={`/product/${product.id}`} className="block group-hover:text-[#55AEB1] transition-colors">
            <h3 className="font-serif font-bold text-xl text-[#082B5C] leading-snug tracking-tight line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Material Transparency Index Badge */}
          {product.materialIndex && (
            <div className="text-[11px] font-mono text-[#082B5C] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
              Material: {product.materialIndex}
            </div>
          )}

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Micro-Replanting Impact Badge */}
          {product.replantingImpact && (
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Funds {product.replantingImpact} in artisan village.</span>
            </div>
          )}
        </div>

        {/* AI Reason Callout */}
        {reason && (
          <div className="ai-reason-box p-3 text-xs text-[#082B5C] mt-2">
            <div className="font-semibold flex items-center gap-1 text-[#55AEB1] text-[11px] mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Signal Fit Reason</span>
            </div>
            <p className="text-slate-700 italic text-[11px] leading-snug font-normal">
              "{reason}"
            </p>
          </div>
        )}

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">Price</span>
            <span className="text-lg font-serif font-bold text-[#082B5C]">
              ${displayPrice}
              {product.unit && <span className="text-xs text-slate-500 font-normal font-sans"> /{product.unit}</span>}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
            className="btn-navy px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>Add to Shared Crate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
