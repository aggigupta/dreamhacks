/**
 * GET /api/cargo
 * ==============
 * Current fill state of the shared island-ferry container. The storefront polls
 * this for a live "cargo filling up" meter — the closer to full, the bigger the
 * consolidation discount every shopper gets (see POST /api/pricing).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const c = await db.getCargo();
  const fillPct = Math.round((c.currentWeightFilledKg / c.capacityMaxKg) * 100);
  return NextResponse.json({
    ...c,
    fillPct,
    remainingKg: Number((c.capacityMaxKg - c.currentWeightFilledKg).toFixed(1)),
  });
}
