"use client";

import { useEffect, useState } from "react";
import { Anchor, Zap, Ship, Leaf, Route } from "lucide-react";

interface Waypoint {
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  mode: string;
  co2SavedKg: number;
  status: "completed" | "active" | "scheduled";
}
interface RouteData {
  waypoints: Waypoint[];
  legs: { from: string; to: string; km: number; mode: string }[];
  totalDistanceKm: number;
  co2SavedKg: number;
}

const W = 760;
const H = 380;
const PAD = 70;

export function RouteMap({ toLat, toLng }: { toLat?: number; toLng?: number }) {
  const [data, setData] = useState<RouteData | null>(null);

  useEffect(() => {
    const q = new URLSearchParams();
    if (toLat) q.set("toLat", String(toLat));
    if (toLng) q.set("toLng", String(toLng));
    fetch(`/api/logistics/route?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [toLat, toLng]);

  if (!data) {
    return (
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-6 h-64 animate-pulse" />
    );
  }

  // Schematic layout: the island infra is geographically bunched, so we space
  // the stops evenly along a gentle arc rather than by true coordinates. The
  // distances / CO2 below the map are the real figures from the route API.
  const n = data.waypoints.length;
  const pts = data.waypoints.map((w, i) => ({
    ...w,
    x: PAD + (i / (n - 1)) * (W - 2 * PAD),
    y: H / 2 - 40 + (i % 2 === 0 ? -28 : 28) + (i / (n - 1)) * 20,
  }));
  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#55AEB1]/15 text-[#082B5C] text-xs font-bold mb-1">
            <Anchor className="w-3.5 h-3.5 text-[#55AEB1]" />
            <span>Consolidated shipping route</span>
          </div>
          <h2 className="text-2xl font-bold text-[#082B5C]">Island → Buyer, one crate</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Route optimized</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px] overflow-visible" role="img" aria-label="Shipping route map">
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dbeef0" />
              <stop offset="1" stopColor="#bfe0e3" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} rx="14" fill="url(#ocean)" />
          {/* graticule */}
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1">
              <line x1={f * W} y1="0" x2={f * W} y2={H} />
              <line x1="0" y1={f * H} x2={W} y2={f * H} />
            </g>
          ))}

          {/* route */}
          <path id="routePath" d={pathD} fill="none" stroke="#082B5C" strokeOpacity="0.25" strokeWidth="4" />
          <path
            d={pathD}
            fill="none"
            stroke="#0d6a6d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 8"
            style={{ animation: "routeFlow 1.4s linear infinite" }}
          />

          {/* moving ferry */}
          <circle r="6" fill="#082B5C" stroke="#fff" strokeWidth="2">
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#routePath" />
            </animateMotion>
          </circle>

          {/* waypoints */}
          {pts.map((p, i) => {
            const above = i % 2 === 0;
            const labelY = above ? p.y - 20 : p.y + 30;
            const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
            return (
              <g key={p.name}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.status === "active" ? 9 : 6}
                  fill={p.status === "completed" ? "#55AEB1" : p.status === "active" ? "#082B5C" : "#94a3b8"}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text x={p.x} y={labelY} textAnchor={anchor} fontSize="11" fontWeight="700" fill="#082B5C">
                  {p.name}
                </text>
                <text x={p.x} y={labelY + 13} textAnchor={anchor} fontSize="9" fill="#0d6a6d">
                  {p.mode}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-[#55AEB1]" /> Total distance
          </span>
          <div className="font-bold text-base text-[#082B5C]">{data.totalDistanceKm.toLocaleString()} km</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Ship className="w-3.5 h-3.5 text-[#55AEB1]" /> Legs
          </span>
          <div className="font-bold text-base text-[#082B5C]">{data.legs.length} consolidated hops</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
          <span className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> CO₂ saved vs air
          </span>
          <div className="font-bold text-base text-emerald-800">~{data.co2SavedKg} kg / crate</div>
        </div>
      </div>
    </div>
  );
}
