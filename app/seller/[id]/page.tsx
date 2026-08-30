"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Store, Leaf, Heart, ShieldCheck } from "lucide-react";
import { sellers } from "@/lib/mockSellers";
import { products } from "@/lib/mockProducts";
import { ProductCard } from "@/components/ProductCard";

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const seller = sellers.find(
    (s) => s.id === id || s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id
  );

  if (!seller) {
    notFound();
  }

  // Find products by this seller
  const sellerProducts = products.filter(
    (p) =>
      p.sellerId === seller.id ||
      (p.seller && p.seller.toLowerCase() === seller.name.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#082B5C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      {/* Seller Hero Card */}
      <section className="bg-white p-8 sm:p-12 rounded-[14px] border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#082B5C] border border-slate-300 flex items-center justify-center text-4xl shadow-md text-white">
              {seller.avatarIcon}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-extrabold text-[#55AEB1] uppercase tracking-wider mb-1">
                <Store className="w-3.5 h-3.5 text-[#082B5C]" />
                <span>Island Micro-Producer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#082B5C]">{seller.name}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{seller.specialty}</p>
            </div>
          </div>

          {/* Island Location Badge */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#082B5C] font-bold">
              <MapPin className="w-4 h-4 text-[#55AEB1]" />
              <span>{seller.locationName}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              GPS: {seller.coordinates.lat}, {seller.coordinates.lng}
            </div>
          </div>
        </div>

        {/* Bio & Story */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-bold text-base text-[#082B5C] flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Our Island Story</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {seller.story}
            </p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-xs text-[#082B5C] uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#55AEB1]" />
              <span>Sustainability Focus</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {seller.sustainabilityFocus}
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#55AEB1]" />
              <span>100% Verified Local Co-op Member</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seller's Products Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#082B5C]">
            Goods by {seller.name} ({sellerProducts.length})
          </h2>
          <p className="text-xs text-slate-500">
            Small-batch items harvested or crafted on site at {seller.locationName}.
          </p>
        </div>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sellerProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No active listings found for this artisan.
          </div>
        )}
      </section>
    </main>
  );
}
