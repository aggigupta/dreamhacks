"use client";

import { useEffect, useRef, useState } from "react";
import { Ship } from "lucide-react";

interface Cargo {
  label: string;
  currentWeightFilledKg: number;
  capacityMaxKg: number;
  fillPct: number;
  remainingKg: number;
  voyage: number;
}

/**
 * Live view of the shared island-ferry container. Every order placed anywhere
 * adds weight; the meter fills and the consolidation discount climbs.
 */
export function CargoMeter({ variant = "bar" }: { variant?: "bar" | "chip" }) {
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [bump, setBump] = useState(false);
  const [sailed, setSailed] = useState(false);
  const prev = useRef<number | null>(null);
  const prevVoyage = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/cargo")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Cargo | null) => {
          if (!alive || !d) return;
          if (prev.current != null && d.currentWeightFilledKg !== prev.current) {
            setBump(true);
            setTimeout(() => setBump(false), 900);
          }
          if (prevVoyage.current != null && d.voyage > prevVoyage.current) {
            // A container just filled and sailed — a fresh ferry is now loading.
            setSailed(true);
            setTimeout(() => setSailed(false), 3200);
          }
          prev.current = d.currentWeightFilledKg;
          prevVoyage.current = d.voyage;
          setCargo(d);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!cargo) return null;

  const pct = Math.min(100, cargo.fillPct);
  const tier = pct >= 85 ? "20% off unlocked" : pct >= 60 ? "10% off unlocked" : "standard rate";
  const tierColor = pct >= 85 ? "text-emerald-300" : pct >= 60 ? "text-[#8fe0e2]" : "text-slate-300";

  if (variant === "chip") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0f2b45]" title={cargo.label}>
        <Ship className={`h-3.5 w-3.5 text-[#2f8f92] ${sailed ? "animate-float" : ""}`} />
        {sailed ? (
          <span className="text-emerald-600">Ferry #{cargo.voyage} now loading</span>
        ) : (
          <span>
            Ferry #{cargo.voyage} · {pct}%
          </span>
        )}
        <span className="relative block h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
          <span
            className="cargo-fill block h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </span>
        {bump && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-once" />}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-[#0f2b45] p-4 text-white shadow-sm transition-shadow ${
        bump ? "pulse-once" : ""
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <Ship className={`h-4 w-4 text-[#8fe0e2] ${sailed ? "animate-float" : ""}`} />
          {cargo.label}
        </span>
        <span className={`font-bold ${tierColor}`}>{tier}</span>
      </div>

      {sailed && (
        <div className="mt-2 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 pulse-once">
          Container #{cargo.voyage - 1} filled up and sailed — ferry #{cargo.voyage} is now loading.
        </div>
      )}

      <div className="relative mt-2 h-3.5 overflow-hidden rounded-full bg-white/10">
        {/* tier markers at 60% and 85% */}
        <span className="absolute inset-y-0 left-[60%] w-px bg-white/25" />
        <span className="absolute inset-y-0 left-[85%] w-px bg-white/25" />
        <span
          className="cargo-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-slate-300">
        <span>
          {cargo.currentWeightFilledKg} / {cargo.capacityMaxKg} kg &middot; {pct}% full
        </span>
        <span>{cargo.remainingKg} kg to sail</span>
      </div>
    </div>
  );
}
