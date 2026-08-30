"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { PredictionInput } from "@/lib/types";

export default function DiscoverQuizPage() {
  const router = useRouter();
  const { quizInput, setQuizInput, setRecommendationsResponse, cart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionInput>(quizInput);

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setQuizInput(formData);
    setRecommendationsResponse(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: formData, cartHubs: [...new Set(cart.map((i) => i.product.atollHub).filter(Boolean))] }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendationsResponse(data);
      }
    } catch (err) {
      console.error("Failed to generate recommendations:", err);
    } finally {
      setLoading(false);
      router.push("/recommendations");
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#082B5C]/80 border border-white/20 text-[#55AEB1] text-xs font-medium backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#55AEB1]" />
          <span>ShopSense Signal Matcher</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-[#082B5C] tracking-tight">
          Tell us how you shop
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto font-medium">
          Three questions about purpose, usage, and household. ShopSense matches
          those signals to island goods, and every choice is explained.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden backdrop-blur-md">
        <div
          className="bg-[#55AEB1] h-full transition-all duration-500 shadow-sm"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/60 shadow-2xl space-y-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono text-[#55AEB1] font-bold uppercase tracking-wider block mb-1">
                Question 1 of 3
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#082B5C]">
                What brings you to Shopyland today?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "personal", label: "Personal Shopping", desc: "Goods for your own kitchen, home, or body" },
                { id: "gift", label: "Gifting an Island Craft", desc: "Handmade gifts with direct artisan stories" },
                { id: "community-bulk", label: "Community Crate Order", desc: "Bulk orders shipped together to save freight" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, purpose: opt.id as any })}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    formData.purpose === opt.id
                      ? "bg-[#082B5C] text-white border-[#082B5C] shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-serif font-bold text-base mb-1">{opt.label}</div>
                  <div className="text-xs opacity-80 leading-relaxed font-normal">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono text-[#55AEB1] font-bold uppercase tracking-wider block mb-1">
                Question 2 of 3
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#082B5C]">
                How often will you reach for these?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                This drives how much we suggest you buy and how we bundle the shipment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "one-time", label: "One-time buy", desc: "A single occasion: a gift, a trip, trying something once" },
                { id: "occasional", label: "Every so often", desc: "You'll reorder now and then, no fixed rhythm" },
                { id: "regular", label: "Part of my routine", desc: "A staple you go through and replace regularly" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, usageFrequency: opt.id as any })}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    formData.usageFrequency === opt.id
                      ? "bg-[#082B5C] text-white border-[#082B5C] shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-serif font-bold text-base mb-1">{opt.label}</div>
                  <div className="text-xs opacity-80 leading-relaxed font-normal">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono text-[#55AEB1] font-bold uppercase tracking-wider block mb-1">
                Question 3 of 3
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#082B5C]">
                Household size and sustainability priority
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Household Members: <strong className="text-[#082B5C]">{formData.householdSize}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={formData.householdSize}
                  onChange={(e) => setFormData({ ...formData, householdSize: Number(e.target.value) })}
                  className="w-full accent-[#082B5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Sustainability Importance (1 to 5): <strong className="text-[#55AEB1]">Level {formData.sustainabilityPriority}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={formData.sustainabilityPriority}
                  onChange={(e) => setFormData({ ...formData, sustainabilityPriority: Number(e.target.value) })}
                  className="w-full accent-[#55AEB1]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-600 hover:text-[#082B5C] transition-colors"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="btn-navy px-8 py-3.5 rounded-full font-medium text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 text-[#55AEB1] animate-spin" />
                <span>Matching Signals...</span>
              </>
            ) : step === 3 ? (
              <>
                <span>Calculate Recommendations</span>
                <CheckCircle2 className="w-4 h-4 text-[#55AEB1]" />
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
