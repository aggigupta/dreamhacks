"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, MapPin, PlusCircle, Plus, Package, RefreshCw, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import type { DbOrder } from "@/lib/db";

export default function ShopkeeperDashboard() {
  const { user } = useAuth();
  const { allProducts } = useCart();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const storeName = user?.storeName || "Maya's Kitchen";
  const myProducts = allProducts.filter(
    (p) => p.seller === storeName || p.sellerId === user?.id || p.sellerId === "mayas-kitchen"
  );

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to fetch shopkeeper orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const carbonSaved = orders.reduce((sum, o) => sum + (o.co2SavedKg || 0), 0);

  // one-tap restock
  const [stockById, setStockById] = useState<Record<string, number>>({});
  const [bumping, setBumping] = useState<string | null>(null);
  async function restock(productId: string) {
    setBumping(productId);
    try {
      const res = await fetch("/api/vendor/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, delta: 1 }),
      });
      if (res.ok) {
        const d = await res.json();
        setStockById((s) => ({ ...s, [productId]: d.stock }));
      }
    } finally {
      setBumping(null);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="card-light p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#082B5C] text-white text-xs font-bold">
            <Store className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>Registered Artisan Co-op Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#082B5C]">
            {storeName} Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Manage your registered island store, view real-time co-op orders, and list handcrafted goods live.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shopkeeper/add-product"
            className="btn-navy px-5 py-3 rounded-full font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#55AEB1]" />
            <span>+ List New Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-light p-5 space-y-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Co-op Revenue</span>
          <div className="font-serif font-bold text-[#082B5C] text-2xl">${totalRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Direct Revenue</span>
        </div>

        <div className="card-light p-5 space-y-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Listed Goods</span>
          <div className="font-serif font-bold text-[#082B5C] text-2xl">{myProducts.length} Items</div>
          <span className="text-[11px] text-[#55AEB1] font-medium">Live on Shopyland</span>
        </div>

        <div className="card-light p-5 space-y-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Registered Store GPS</span>
          <div className="font-mono font-bold text-[#082B5C] text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4 text-[#55AEB1]" />
            <span>-17.53, -149.56</span>
          </div>
          <span className="text-[11px] text-slate-500">North Atoll Co-op</span>
        </div>

        <div className="card-light p-5 space-y-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Carbon Savings</span>
          <div className="font-serif font-bold text-emerald-700 text-2xl">-{carbonSaved.toFixed(1)} kg CO2</div>
          <span className="text-[11px] text-emerald-600 font-medium">Consolidated maritime freight</span>
        </div>
      </div>

      {/* One-tap restock: the "artisan on their phone" flow */}
      <div className="card-light p-6 space-y-4">
        <div className="flex items-center gap-2 font-serif font-bold text-[#082B5C] text-lg border-b border-slate-200 pb-3">
          <Package className="w-5 h-5 text-[#55AEB1]" />
          <span>My inventory: tap to add stock</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myProducts.slice(0, 9).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#082B5C] truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500">
                  {stockById[p.id] != null ? `${stockById[p.id]} in stock` : "tap +1 to restock"}
                </div>
              </div>
              <button
                onClick={() => restock(p.id)}
                disabled={bumping === p.id}
                className="shrink-0 w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                aria-label={`Add one ${p.name} to stock`}
              >
                {bumping === p.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : stockById[p.id] != null ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Real Orders Table */}
      <div className="card-light p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 font-serif font-bold text-[#082B5C] text-lg">
            <Package className="w-5 h-5 text-[#55AEB1]" />
            <span>Recent Customer Orders ({orders.length})</span>
          </div>
          {loadingOrders && <RefreshCw className="w-4 h-4 text-[#55AEB1] animate-spin" />}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 font-normal">
            No customer orders placed yet. Place an order on `/checkout` to view it here live!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Delivery GPS</th>
                  <th className="py-2.5 px-3">Freight Mode</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-[#082B5C]">{o.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{o.customerName}</div>
                      <div className="text-[11px] text-slate-500">{o.customerEmail}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {o.gpsLat}, {o.gpsLng}
                    </td>
                    <td className="py-3 px-3">
                      {o.ecoBackhaulMode ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[10px]">
                          Zero-Carbon Backhaul
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                          Standard Freight
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-serif font-bold text-[#082B5C] text-sm">
                      ${o.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#082B5C] text-white font-bold text-[10px] capitalize">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
