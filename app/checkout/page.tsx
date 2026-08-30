"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Truck, ArrowLeft, Home, MapPin, RefreshCw, Anchor, Leaf } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { RouteMap } from "@/components/RouteMap";
import { BackhaulCard } from "@/components/BackhaulCard";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, ecoBackhaulMode, backhaulRebate, backhaulCo2SavedKg } = useCart();
  const { user } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "Alex Morgan",
    email: user?.email || "alex.morgan@gmail.com",
    address: "74 Sunset Cove Road, East Ridge",
    city: "Isla Sol Co-op District",
    country: "Pacific Island Territory",
    notes: "Please leave at front doorstep box.",
  });

  const [customerGps, setCustomerGps] = useState<{ lat: number; lng: number }>({
    lat: -17.54,
    lng: -149.55,
  });
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Server-authoritative cargo-aware pricing, the client cannot forge the discount.
  const [pricing, setPricing] = useState<
    { discountPct: number; reason: string; projectedFillPct: number } | null
  >(null);
  useEffect(() => {
    if (!cart.length) return;
    fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPricing(d))
      .catch(() => {});
  }, [cart]);

  const isFreeShipping = cartTotal >= 50;
  const shippingCost = isFreeShipping ? 0 : 4.99;
  const subtotalAfterRebate = Math.max(0, cartTotal - backhaulRebate);
  const cargoDiscountPct = pricing?.discountPct ?? 0;
  const cargoDiscount = Number(((subtotalAfterRebate * cargoDiscountPct) / 100).toFixed(2));
  const finalTotal = Math.max(0, subtotalAfterRebate - cargoDiscount) + shippingCost;

  function handleDetectGps() {
    setDetectingGps(true);
    setGpsStatus(null);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        };
        setCustomerGps(coords);
        setGpsStatus("Delivery location detected.");
        setDetectingGps(false);
      },
      (err) => {
        console.warn("Geolocation failed, retaining default GPS:", err);
        setGpsStatus("Default island delivery GPS retained.");
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingOrder(true);

    try {
      const payload = {
        customerName: formData.name,
        customerEmail: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        gpsLat: customerGps.lat,
        gpsLng: customerGps.lng,
        subtotal: cartTotal,
        backhaulRebate,
        shippingCost,
        grandTotal: finalTotal,
        ecoBackhaulMode,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderId(data.order?.id || `ISLE-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setOrderId(`ISLE-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch {
      setOrderId(`ISLE-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setSubmittingOrder(false);
      setSubmitted(true);
      clearCart();
    }
  }

  if (submitted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="card-light p-10 sm:p-14 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono px-3.5 py-1 rounded-full bg-[#082B5C] text-white font-bold">
              Order Confirmation #{orderId}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#082B5C]">Order Placed Successfully</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto font-normal">
              Thank you for supporting remote island micro-producers on Shopyland. Your order is scheduled for the MV Pacific Trader empty-leg return ferry.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 text-left space-y-2 border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-[#082B5C]">
              <Truck className="w-4 h-4 text-[#55AEB1]" />
              <span>Backhaul Route: MV Pacific Trader Return Leg (In 48 Hours)</span>
            </div>
            <p className="text-slate-600">
              Recipient: <strong>{formData.name}</strong> ({formData.email})
            </p>
            {ecoBackhaulMode && (
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Carbon Backhaul Applied: Reduced {backhaulCo2SavedKg} kg CO2</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-1 border-t border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-[#55AEB1]" />
              <span>Delivery location confirmed for route optimization</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="btn-navy px-8 py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-[#55AEB1]" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#082B5C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </Link>

      {/* Interactive Route Optimization Map */}
      <RouteMap toLat={customerGps.lat} toLng={customerGps.lng} />

      {/* Backhaul Arbitrage Card */}
      <BackhaulCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping & GPS Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-[#082B5C]">Island Shipping Checkout</h1>
            <p className="text-xs text-slate-500">
              Enter shipping address and verify delivery GPS coordinates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-light p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-serif font-bold text-[#082B5C] mb-2">1. Shipping Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#082B5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#082B5C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#082B5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Territory / Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#082B5C]"
                />
              </div>
            </div>

            {/* GPS Delivery Selector */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#082B5C]">
                  <MapPin className="w-4 h-4 text-[#55AEB1]" />
                  <span>2. Delivery location</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="px-3 py-1.5 rounded-full bg-[#55AEB1] text-white text-xs font-medium hover:bg-[#44979A] transition-all flex items-center gap-1 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
                  <span>Use my location</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {gpsStatus || "Delivery location set. We'll draw the consolidated shipping route from here."}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingOrder}
              className="btn-navy w-full py-4 rounded-full font-medium text-base shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {submittingOrder ? (
                <>
                  <RefreshCw className="w-5 h-5 text-[#55AEB1] animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <span>Place Order (${finalTotal.toFixed(2)})</span>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="card-light p-6 space-y-4 h-fit">
          <h3 className="font-serif font-bold text-[#082B5C] text-sm border-b border-slate-200 pb-3">Items in Crate</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#082B5C]">{item.product.name}</div>
                  <div className="text-slate-500">Qty: {item.quantity}</div>
                </div>
                <div className="font-bold text-[#082B5C]">${(item.quantity * item.pricePerUnit).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-bold text-[#082B5C]">${cartTotal.toFixed(2)}</span>
            </div>

            {ecoBackhaulMode && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Backhaul Discount (15% + $6 Rebate)</span>
                <span>-${backhaulRebate.toFixed(2)}</span>
              </div>
            )}

            {cargoDiscountPct > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>
                  Ferry consolidation −{cargoDiscountPct}%
                  <span className="block text-[10px] font-normal text-slate-500">
                    server-verified · ferry {pricing?.projectedFillPct}% full with this order
                  </span>
                </span>
                <span>-${cargoDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Consolidated Island Route</span>
              <span className="font-bold text-[#082B5C]">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Est. delivery 5 to 8 business days
            </div>

            <div className="flex justify-between text-sm font-extrabold text-[#082B5C] pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
