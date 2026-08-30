"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Compass, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import type { Product, RecommendResponse } from "@/lib/types";

export default function RecommendationsPage() {
  const { allProducts, quizInput, recommendationsResponse, setRecommendationsResponse, cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: quizInput, cartHubs: [...new Set(cart.map((i) => i.product.atollHub).filter(Boolean))] }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI recommendations.");
      }

      const data: RecommendResponse = await res.json();
      setRecommendationsResponse(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Unable to load recommendations. Showing featured island picks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!recommendationsResponse) {
      fetchRecommendations();
    }
  }, []);

  const recommendedItems = recommendationsResponse?.recommendations || [];
  const recoMap = new Map(recommendedItems.map((r) => [r.productId, r.reason]));

  const displayProducts = recommendedItems.length > 0
    ? recommendedItems
        .map((r) => allProducts.find((p) => p.id === r.productId))
        .filter((p): p is Product => p !== undefined)
    : allProducts.slice(0, 6);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgba(8,43,92,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#55AEB1]/10 text-[#082B5C] border border-[#55AEB1]/30 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>ShopSense AI Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#082B5C] tracking-tight">
            Your Personalized Island Recommendations
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Self-explaining recommendations calculated from your purpose, usage frequency, household size, and sustainability priority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="px-5 py-3 rounded-full bg-slate-100 border border-slate-200 text-[#082B5C] font-medium text-xs hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-[#55AEB1] ${loading ? "animate-spin" : ""}`} />
            <span>Recalculate Picks</span>
          </button>

          <Link
            href="/discover"
            className="btn-navy px-5 py-3 rounded-full font-medium text-xs flex items-center gap-2 active:scale-95 transition-all shadow-xs"
          >
            <Compass className="w-4 h-4 text-[#55AEB1]" />
            <span>Retake Quiz</span>
          </Link>
        </div>
      </div>

      {/* How the ranking works. The proof is the reasons right below it */}
      <div className="bg-[#082B5C] text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
            🧭
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#55AEB1]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Explainable by design</span>
            </div>
            <h3 className="font-serif font-bold text-base text-white">
              A deterministic model scores every product; the AI only rephrases
            </h3>
            <p className="text-xs text-slate-200 font-normal">
              Each product is scored on weighted matches between your four signals and its
              attributes. Every reason below names the signal that produced the pick, not a
              black box.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-[#55AEB1] text-[#082B5C] rounded-full font-bold text-xs shrink-0">
          4 signals
        </div>
      </div>

      {/* Prominent Explainability Signals Bar */}
      <div className="p-6 rounded-2xl bg-[#55AEB1]/10 border border-[#55AEB1]/30 space-y-3">
        <div className="flex items-center gap-2 text-[#082B5C] font-serif font-bold text-base">
          <Sparkles className="w-4 h-4 text-[#55AEB1]" />
          <span>Active Recommendation Drivers (Self-Explaining AI)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#082B5C] capitalize">
            Purpose: {quizInput.purpose.replace("-", " ")}
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#082B5C] capitalize">
            Usage: {quizInput.usageFrequency.replace("-", " ")}
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#082B5C]">
            Household Size: {quizInput.householdSize} {quizInput.householdSize === 1 ? "person" : "people"}
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#082B5C]">
            Sustainability Priority: {quizInput.sustainabilityPriority}/5
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 space-y-4">
          <RefreshCw className="w-8 h-8 text-[#55AEB1] animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">Calculating non-linear signal scores across 30 products...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} reason={recoMap.get(p.id)} rank={idx + 1} />
          ))}
        </div>
      )}
    </main>
  );
}
