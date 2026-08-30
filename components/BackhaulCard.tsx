"use client";

import { Ship, Leaf, Zap, Clock, ShieldCheck, Anchor } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function BackhaulCard() {
  const { ecoBackhaulMode, setEcoBackhaulMode, backhaulRebate, backhaulCo2SavedKg } = useCart();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-[0_8px_30px_rgba(8,43,92,0.04)] space-y-4">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
            <Anchor className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Carbon Return Pricing</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#082B5C]">
            Backhaul Arbitrage Engine
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Supply vessels arrive loaded with island imports and return empty. We match your crate with returning holds.
          </p>
        </div>

        {/* Live Cart Toggle */}
        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAFAF8] border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all shrink-0">
          <input
            type="checkbox"
            checked={ecoBackhaulMode}
            onChange={(e) => setEcoBackhaulMode(e.target.checked)}
            className="accent-emerald-600 w-5 h-5 rounded-md cursor-pointer"
          />
          <div className="text-left">
            <span className="text-xs font-bold text-[#082B5C] block">
              Eco-Backhaul Mode
            </span>
            <span className="text-[11px] font-medium text-emerald-700 block">
              Saves 4.2 kg CO2 + $6.00 Rebate
            </span>
          </div>
        </label>
      </div>

      {/* Telemetry Details */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#FAFAF8] p-4 rounded-xl border border-slate-200 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Return Vessel</span>
          <div className="font-bold text-[#082B5C] flex items-center gap-1">
            <Ship className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>MV Pacific Trader</span>
          </div>
          <span className="text-[10px] text-slate-500">Scheduled Empty Leg</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Empty Hold Space</span>
          <div className="font-bold text-emerald-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>70% Available</span>
          </div>
          <span className="text-[10px] text-slate-500">High Capacity Arbitrage</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Return Departure</span>
          <div className="font-bold text-[#082B5C] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>In 48 Hours</span>
          </div>
          <span className="text-[10px] text-slate-500">Ferry Slot Reserved</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Emission Impact</span>
          <div className="font-bold text-emerald-700 flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>-80% Shipping CO2</span>
          </div>
          <span className="text-[10px] text-slate-500">Zero Added Voyages</span>
        </div>
      </div>

      {ecoBackhaulMode && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Green Backhaul Discount Applied! You saved ${backhaulRebate.toFixed(2)} and reduced {backhaulCo2SavedKg} kg CO2.</span>
          </div>
        </div>
      )}
    </div>
  );
}
