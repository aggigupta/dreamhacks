"use client";

import { useState } from "react";
import { Store, Search, Filter, PlusCircle } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "food", label: "Food & Pantry" },
  { id: "wellness", label: "Wellness & Care" },
  { id: "craft", label: "Handcrafted Art" },
  { id: "sustainable-goods", label: "Sustainable Goods" },
];

export default function BrowsePage() {
  const { allProducts } = useCart();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      (product.description ?? "").toLowerCase().includes(q) ||
      (product.seller ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#082B5C]/80 border border-white/20 text-[#55AEB1] text-xs font-medium mb-2 backdrop-blur-md">
            <Store className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>Complete Island Co-op Catalog ({allProducts.length} Items)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#082B5C] tracking-tight">
            Shopyland Artisan Goods
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Explore products sourced directly from registered micro-producers and local artisans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "shopkeeper" && (
            <Link
              href="/shopkeeper/add-product"
              className="btn-navy px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#55AEB1]" />
              <span>+ List New Product</span>
            </Link>
          )}

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products or artisans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#082B5C] transition-colors shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1 hidden sm:block" />
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#082B5C] text-white shadow-sm border border-white/20"
                  : "bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 space-y-3">
          <p className="text-base font-bold text-[#082B5C]">No products found</p>
          <p className="text-xs text-slate-500">
            Try adjusting your search filter or selecting another category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="btn-navy px-4 py-2 rounded-full text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}
    </main>
  );
}
