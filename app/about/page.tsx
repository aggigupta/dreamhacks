import Link from "next/link";
import { Leaf, Truck, Sparkles, Heart, Compass, Store } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <section className="bg-white p-8 sm:p-12 rounded-[14px] border border-slate-200 shadow-sm text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Our Island Community & Co-Op Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#082B5C] leading-tight">
          Connecting Remote Island Artisans on Shopyland
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Shopyland is a cooperative commerce platform for micro-producers, palm weavers, wild bee keepers, and coastal crafters across our remote island territory.
        </p>
      </section>

      {/* Impact Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-light p-6 rounded-[14px] bg-white border border-slate-200 space-y-2 text-center">
          <div className="text-3xl font-black text-[#082B5C]">6 co-ops</div>
          <div className="text-xs font-bold text-[#082B5C] uppercase tracking-wider">Island artisan sellers</div>
          <p className="text-[11px] text-slate-500">Multiple co-ops can list the same craft. Buyers compare price, stock and lead time.</p>
        </div>

        <div className="card-light p-6 rounded-[14px] bg-white border border-slate-200 space-y-2 text-center">
          <div className="text-3xl font-black text-[#55AEB1]">4 signals</div>
          <div className="text-xs font-bold text-[#082B5C] uppercase tracking-wider">Explainable AI match</div>
          <p className="text-[11px] text-slate-500">Ranked on purpose, usage frequency, household size and sustainability priority. Each pick is explained.</p>
        </div>

        <div className="card-light p-6 rounded-[14px] bg-white border border-slate-200 space-y-2 text-center">
          <div className="text-3xl font-black text-emerald-600">100%</div>
          <div className="text-xs font-bold text-[#082B5C] uppercase tracking-wider">Direct Fair-Trade Payout</div>
          <p className="text-[11px] text-slate-500">Fair-trade pricing paid direct to island artisans with zero middlemen markup.</p>
        </div>

        <div className="card-light p-6 rounded-[14px] bg-white border border-slate-200 space-y-2 text-center">
          <div className="text-3xl font-black text-[#082B5C]">Low-Carbon</div>
          <div className="text-xs font-bold text-[#082B5C] uppercase tracking-wider">Consolidated Freight</div>
          <p className="text-[11px] text-slate-500">Multi-item orders are consolidated into shared crates to cut shipping trips.</p>
        </div>
      </section>

      {/* Sustainability & AI Framework Section */}
      <section className="bg-white p-8 sm:p-10 rounded-[14px] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#082B5C] flex items-center justify-center text-white font-bold">
            <Sparkles className="w-5 h-5 text-[#55AEB1]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#082B5C]">How ShopSense AI Drives Impact</h2>
            <p className="text-xs text-slate-500">Structured, psychology-grounded signals instead of black-box algorithms.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h3 className="font-bold text-[#082B5C] text-sm flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#55AEB1]" />
              <span>1. Signal Matching</span>
            </h3>
            <p>
              By asking 4 clear signals (purchasing purpose, household size, usage frequency, and sustainability priority), our engine scores product fit deterministically without hallucination.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#082B5C] text-sm flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>2. Quantity Optimization</span>
            </h3>
            <p>
              `computeQuantity` converts household size and usage frequency into weeks of supply. This prevents under-ordering and over-shipping.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#082B5C] text-sm flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#082B5C]" />
              <span>3. Shipping Bundling</span>
            </h3>
            <p>
              Nearby orders and multi-item carts trigger consolidated shipping, saving transport carbon emissions between remote island hubs and global freight ports.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-4 pt-4">
        <h2 className="text-2xl font-bold text-[#082B5C]">Experience Shopyland Island Shopping</h2>
        <div className="flex items-center justify-center gap-4">
          <Link href="/discover" className="btn-navy px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#55AEB1]" />
            <span>Take Discovery Quiz</span>
          </Link>
          <Link href="/browse" className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-[#082B5C] text-xs font-semibold flex items-center gap-2 hover:bg-slate-50">
            <Store className="w-4 h-4 text-slate-600" />
            <span>Explore the Collection</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
