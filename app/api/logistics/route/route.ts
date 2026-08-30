/**
 * GET /api/logistics/route
 * ========================
 * Waypoints for the consolidated shipping route the storefront map draws.
 *
 * Query: fromLat, fromLng  (artisan) ; toLat, toLng (buyer)  — all optional.
 * Reply: { waypoints: [{ name, subtitle, lat, lng, mode, co2SavedKg, status }],
 *          totalDistanceKm, co2SavedKg, legs }
 *
 * The route always goes Artisan → Harbor Consolidation Hub → Regional Port →
 * Buyer: goods leave the island by one scheduled low-carbon ferry instead of
 * many individual air parcels.
 */
import { NextResponse } from "next/server";

// Fixed island logistics infrastructure.
const HARBOR_HUB = { lat: -17.52, lng: -149.56 };
const REGIONAL_PORT = { lat: -17.0, lng: -145.0 };

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const num = (k: string, d: number) => {
    const v = Number(searchParams.get(k));
    return Number.isFinite(v) && v !== 0 ? v : d;
  };

  const artisan = { lat: num("fromLat", -17.532), lng: num("fromLng", -149.568) };
  const buyer = { lat: num("toLat", 40.71), lng: num("toLng", -74.01) }; // default: NYC

  const waypoints = [
    {
      name: "Island Artisan Village",
      subtitle: "Atoll harvest co-op",
      ...artisan,
      mode: "Electric cargo trike",
      co2SavedKg: 0.4,
      status: "completed" as const,
    },
    {
      name: "Harbor Consolidation Hub",
      subtitle: "Where island orders are batched into one crate",
      ...HARBOR_HUB,
      mode: "Scheduled maritime ferry",
      co2SavedKg: 1.8,
      status: "active" as const,
    },
    {
      name: "Regional Mainland Port",
      subtitle: "Return-trip vessel, no empty leg",
      ...REGIONAL_PORT,
      mode: "Consolidated container ship",
      co2SavedKg: 2.6,
      status: "scheduled" as const,
    },
    {
      name: "Buyer Destination",
      subtitle: "Last-mile electric van",
      ...buyer,
      mode: "Local courier",
      co2SavedKg: 0.3,
      status: "scheduled" as const,
    },
  ];

  const legs = waypoints.slice(1).map((w, i) => ({
    from: waypoints[i].name,
    to: w.name,
    km: haversineKm(waypoints[i], w),
    mode: w.mode,
  }));
  const totalDistanceKm = legs.reduce((s, l) => s + l.km, 0);
  const co2SavedKg = Number(waypoints.reduce((s, w) => s + w.co2SavedKg, 0).toFixed(1));

  return NextResponse.json({ waypoints, legs, totalDistanceKm, co2SavedKg });
}
