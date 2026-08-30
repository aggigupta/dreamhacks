"use client";

import { useEffect, useState } from "react";
import { Ship } from "lucide-react";

interface Cargo {
  label: string;
  currentWeightFilledKg: number;
  capacityMaxKg: number;
  fillPct: number;
  remainingKg: number;
}

/**
 * Live view of the shared island-ferry container. Every order placed anywhere
 * adds weight. Judges watch it fill and the consolidation discount climb.
 */
export function CargoMeter({ variant = "bar" }: { variant?: "bar" | "chip" }) {
  const [cargo, setCargo] = useState<Cargo | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/cargo")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setCargo(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!cargo) return null;

  const pct = Math.min(100, cargo.fillPct);
  const tierLabel = pct >= 85 ? "20% off unlocked" : pct >= 60 ? "10% off unlocked" : "standard rate";
  const tierColor =
    pct >= 85 ? "text-emerald-300" : pct >= 60 ? "text-[#8fe0e2]" : "text-slate-300";

  if (variant === "chip") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#082B5C]" title={cargo.label}>
        <Ship className="w-3.5 h-3.5 text-[#55AEB1]" />
        <span>Ferry {pct}%</span>
        <span className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <span
            className="block h-full bg-[#55AEB1] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#082B5C] text-white p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <Ship className="w-4 h-4 text-[#55AEB1]" />
          {cargo.label}
        </span>
        <span className={`font-bold ${tierColor}`}>{tierLabel}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#55AEB1] to-emerald-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-300">
        <span>
          {cargo.currentWeightFilledKg} / {cargo.capacityMaxKg} kg ({pct}% full)
        </span>
        <span>{cargo.remainingKg} kg to sail</span>
      </div>
    </div>
  );
}
