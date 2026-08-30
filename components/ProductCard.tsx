"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, ShoppingBag, Sparkles, Sprout } from "lucide-react";
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
  const hubShort = product.atollHub?.split(" ")[0];

  return (
    <div className="card card-interactive group flex flex-col overflow-hidden">
      {/* Image */}
      <Link
        href={`/product/${product.id}`}
        className="relative block overflow-hidden bg-slate-100 pt-[62%]"
      >
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-serif text-5xl text-[#0f2b45]/25">
            {product.name.charAt(0)}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.ecoTag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm backdrop-blur">
              <Leaf className="h-3 w-3 text-emerald-600" />
              {product.ecoTag}
            </span>
          )}
          {hubShort && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#0f2b45] shadow-sm backdrop-blur">
              {hubShort} Hub
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {product.seller && (
          <Link
            href={`/seller/${product.sellerId || "mayas-kitchen"}`}
            className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#0f2b45]"
          >
            {product.sellerAvatar ? (
              <img
                src={product.sellerAvatar}
                alt=""
                className="h-5 w-5 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f2b45] text-[9px] font-bold text-white">
                {product.seller.charAt(0)}
              </span>
            )}
            {product.seller}
          </Link>
        )}

        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif text-lg font-semibold leading-snug text-[#0f2b45] transition-colors group-hover:text-[#2f8f92] line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
          {product.description}
        </p>

        {product.replantingImpact && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-900">
            <Sprout className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="line-clamp-1">Funds {product.replantingImpact}</span>
          </div>
        )}

        {reason && (
          <div className="ai-reason-box mt-3 p-2.5">
            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#2f8f92]">
              <Sparkles className="h-3 w-3" />
              Why this pick
            </div>
            <p className="text-[11px] italic leading-snug text-slate-700">{reason}</p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-400">Price</span>
            <span className="font-serif text-lg font-semibold text-[#0f2b45]">
              ${displayPrice}
              {product.unit && (
                <span className="font-sans text-xs font-normal text-slate-500"> /{product.unit}</span>
              )}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
            className="btn-navy flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#8fd6d8]" />
            Add to crate
          </button>
        </div>
      </div>
    </div>
  );
}
