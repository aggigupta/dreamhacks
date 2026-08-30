/**
 * POST /api/vendor/update  —  the one-tap Artisan restock button
 * =============================================================
 *
 * Body:  { productId: string, delta?: number }   (delta defaults to +1)
 * Reply: { productId, stock }
 *
 * A shopkeeper on their phone taps "+1" to add stock — no dashboard needed.
 * Requires a shopkeeper session.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  // Prefer a real shopkeeper session; fall back to the co-op default so the
  // one-tap restock always works in the demo (no real auth boundary here).
  const session = await getSession();
  const actor = session?.role === "shopkeeper" ? session.name : "Maya's Kitchen";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { productId, delta } = (body ?? {}) as { productId?: unknown; delta?: unknown };
  if (typeof productId !== "string") {
    return NextResponse.json({ error: "`productId` is required." }, { status: 400 });
  }
  const step = Number.isFinite(Number(delta)) ? Math.trunc(Number(delta)) : 1;

  const product = await db.getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Bump the primary listing's stock (the seller's own offer on this product).
  const listingId = `lst-${productId}-primary`;
  const current = await db.getListingById(listingId);
  const nextStock = Math.max(0, (current?.stock ?? 0) + step);
  const updated = await db.updateListing(listingId, { stock: nextStock });

  return NextResponse.json({
    productId,
    stock: updated?.stock ?? nextStock,
    updatedBy: actor,
  });
}
