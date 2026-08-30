"use client";

import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, Leaf, Heart, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BackhaulCard } from "@/components/BackhaulCard";
import { FleetReductionMeter } from "@/components/FleetReductionMeter";
import { CargoMeter } from "@/components/CargoMeter";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    ecoBackhaulMode,
    backhaulRebate,
  } = useCart();

  const isFreeShipping = cartTotal >= 50;
  const shippingCost = isFreeShipping ? 0 : 4.99;
  const subtotalAfterRebate = Math.max(0, cartTotal - backhaulRebate);
  const grandTotal = subtotalAfterRebate + shippingCost;

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white p-12 rounded-[14px] border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="Shopyland" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#082B5C]">Your Cart is Empty</h1>
          <p className="text-xs text-slate-500">
            Explore our handcrafted island goods sourced directly from remote atoll cooperatives.
          </p>
          <Link
            href="/browse"
            className="btn-navy inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#55AEB1]" />
            <span>Browse Island Goods</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#082B5C]">Your Island Order</h1>
          <p className="text-xs text-slate-500">Review items in your consolidated shipping crate.</p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-slate-500 hover:text-rose-600 font-semibold self-start sm:self-auto"
        >
          Clear All Items
        </button>
      </div>

      {/* Live shared ferry container, fills as orders are placed */}
      <CargoMeter variant="bar" />

      {/* Multi-Artisan Hub Micro-Consolidation & Fleet Reduction Meter */}
      <FleetReductionMeter />

      {/* Backhaul Arbitrage Card */}
      <BackhaulCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">
                  {item.product.category === "food"
                    ? "🥥"
                    : item.product.category === "wellness"
                    ? "🌿"
                    : item.product.category === "craft"
                    ? "🧺"
                    : "🌱"}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#55AEB1] font-bold block uppercase">
                    {item.product.atollHub || "North Atoll Co-op"}
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base">{item.product.name}</h3>
                  {item.product.materialIndex && (
                    <span className="text-[11px] text-slate-500 block">
                      Material: {item.product.materialIndex}
                    </span>
                  )}
                  {item.product.replantingImpact && (
                    <span className="text-[11px] text-emerald-700 font-bold block">
                      Direct Replanting: {item.product.replantingImpact}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 text-slate-600 hover:text-slate-900"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-800 text-base">
                    ${(item.quantity * item.pricePerUnit).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">${item.pricePerUnit}/u</span>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-[14px] border border-slate-200 shadow-sm space-y-5 h-fit">
          <h2 className="font-bold text-[#082B5C] text-base border-b border-slate-200 pb-3">Order Summary</h2>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-[#082B5C]">${cartTotal.toFixed(2)}</span>
            </div>

            {ecoBackhaulMode && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Green Backhaul Discount (15% + Rebate)</span>
                <span>-${backhaulRebate.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Consolidated Island Route</span>
              <span className="font-bold text-[#082B5C]">
                {isFreeShipping ? "FREE (Bundled Order)" : `$${shippingCost}`}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Est. delivery 5 to 8 business days
            </div>

            <div className="flex justify-between text-sm font-extrabold text-[#082B5C] pt-3 border-t border-slate-200">
              <span>Total Amount</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="btn-navy w-full py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
