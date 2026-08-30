"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Compass, Sparkles, ShoppingBag, ArrowRight, Play, Pause, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";

export default function HomePage() {
  const { allProducts } = useCart();
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const featuredProducts = allProducts.slice(0, 6);

  // Respect reduced-motion: pause the ambient hero video for users who opt out.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }

  return (
    <main className="space-y-16 py-8">
      {/* Cinematic hero: full-bleed island → global-shipping globe video */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative isolate flex min-h-[560px] items-center overflow-hidden rounded-3xl border border-slate-800 shadow-[0_8px_30px_rgba(8,43,92,0.12)] text-white lg:min-h-[640px]">
          <video
            ref={videoRef}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="/hero-poster.jpg"
          >
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>

          {/* Legibility washes: vertical + left fade so the copy stays readable */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#04122b] via-[#04122b]/55 to-[#04122b]/35" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#04122b]/90 via-[#04122b]/45 to-transparent" />

          <div className="relative w-full p-6 sm:p-10 lg:p-14">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#55AEB1]/20 text-[#8fe0e2] border border-[#55AEB1]/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Direct-from-island micro-producers · zero-carbon freight</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-tight tracking-tight text-white">
                Handcrafted on the Islands. <br />
                <span className="text-[#8fe0e2] italic font-serif">
                  Shipped Globally.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl font-normal">
                Shopyland connects remote island artisan cooperatives directly with global craft collectors. Every order rides a consolidated maritime freight route on scheduled return-trip vessels, cutting transport emissions while keeping the craft economy rooted at home.
              </p>

              {/* How it works */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 max-w-md">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="text-lg sm:text-xl font-serif font-bold text-[#8fe0e2]">4 signals</span>
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Explainable AI match, no black box</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="text-lg sm:text-xl font-serif font-bold text-emerald-400">Traceable</span>
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Every pick names the signal behind it</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="text-lg sm:text-xl font-serif font-bold text-[#8fe0e2]">−20%</span>
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Freight discount when the ferry fills</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <span className="text-lg sm:text-xl font-serif font-bold text-emerald-400">100%</span>
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Order value paid direct to the artisan</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/discover"
                  className="btn-teal px-8 py-3.5 rounded-full font-medium text-sm flex items-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <Compass className="w-4 h-4 text-white" />
                  <span>Find your island goods</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/browse"
                  className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm backdrop-blur-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#8fe0e2]" />
                  <span>Browse the catalog</span>
                </Link>
              </div>
            </div>
          </div>

          <button
            onClick={togglePlay}
            className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 active:scale-95 transition-all"
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/30 pb-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#082B5C] tracking-tight">Featured Island Crafts</h2>
            <p className="text-xs text-slate-500 font-medium">Authentic goods direct from North Atoll and South Shore cooperatives.</p>
          </div>
          <Link
            href="/browse"
            className="btn-navy px-5 py-2.5 rounded-full font-medium text-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95 transition-all shadow-md"
          >
            <ShoppingBag className="w-4 h-4 text-[#55AEB1]" />
            <span>Explore the Collection</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono text-[#55AEB1] font-bold uppercase tracking-wider">
            Good to know
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#082B5C] tracking-tight">
            Frequently asked
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "What is Shopyland?",
              a: "A marketplace that helps artisan cooperatives on a remote island sell their crafts to buyers worldwide. The hard part of that is shipping, so the store is built around three things: an explainable recommendation engine, cargo-aware pricing, and consolidated shipping routes.",
            },
            {
              q: "How does the AI decide which products to recommend?",
              a: "You answer four questions: what the purchase is for, how often you will use it, your household size, and how much sustainability matters to you. A deterministic model scores every product on weighted matches between those signals and the product's attributes, and records exactly which signal caused each match. An AI model then orders the top few and writes the sentence, but it can only cite the signals the scorer already matched. Every recommendation names the reason behind it.",
            },
            {
              q: "Is the ferry discount real, or just a UI effect?",
              a: "Real. There is one shared ferry container with a weight capacity. The pricing endpoint weighs your cart on the server, checks how full your order would leave the returning ferry, and returns the final price. The closer the ferry is to full, the larger the consolidation discount for everyone. The browser cannot change that number.",
            },
            {
              q: "How is the suggested quantity worked out?",
              a: "A plain formula, not a guess. Household size times a per-person weekly usage rate times a target number of weeks of supply, divided by the pack size. A one-time buy or a gift is treated separately. So a household of four buying something they use regularly gets a suggestion of roughly two weeks of supply.",
            },
            {
              q: "Can island artisans actually use this?",
              a: "The seller side is deliberately minimal. An artisan opens their store page and taps a single button to add stock, which writes straight to the database. No dashboard, no training.",
            },
            {
              q: "What is live versus seeded in this build?",
              a: "The database, the three engines, order persistence, the live cargo meter and the restock flow are all real and running. The product catalog and the six cooperatives are seeded sample data, product images are generated icons rather than photos, and sign-in uses a demo code flow (email delivery is switched on in production).",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-[#082B5C]">
                {item.q}
                <span className="shrink-0 text-[#55AEB1] transition-transform group-open:rotate-45">
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
