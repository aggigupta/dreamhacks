/**
 * POST /api/pricing  —  the cargo-aware Dynamic Pricing Engine
 * ===========================================================
 *
 * The frontend sends the cart; the server decides the price. It is the single
 * source of truth for checkout totals — the client cannot forge a discount.
 *
 * Body:  { items: [{ productId: string, quantity: number }] }
 * Reply: {
 *   cartWeightKg, cargo: { currentWeightFilledKg, capacityMaxKg },
 *   projectedFillPct, discountPct, reason,
 *   lineItems: [{ productId, name, quantity, baseUnitPrice, unitPrice, lineTotal }],
 *   subtotal, total, co2SavedKg
 * }
 *
 * Rule: the fuller the returning ferry container this order would make it, the
 * bigger the consolidation discount — plus a volume floor at 5+ units.
 */
import { NextResponse } from "next/server";
import { db, weightForProduct } from "@/lib/db";

interface CartLine {
  productId: string;
  quantity: number;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawItems = (body as { items?: unknown })?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "`items` must be a non-empty array." }, { status: 400 });
  }

  const items: CartLine[] = [];
  for (const it of rawItems) {
    const r = (it ?? {}) as { productId?: unknown; quantity?: unknown };
    const quantity = Math.max(0, Math.floor(Number(r.quantity) || 0));
    if (typeof r.productId !== "string" || quantity <= 0) continue;
    items.push({ productId: r.productId, quantity });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "No valid line items." }, { status: 400 });
  }

  const cargo = await db.getCargo();

  let cartWeightKg = 0;
  let totalUnits = 0;
  const resolved = (
    await Promise.all(
      items.map(async (line) => {
        const product = await db.getProductById(line.productId);
        if (!product) return null;
        const perUnitKg = weightForProduct(product);
        const offers = await db.getListingsForProduct(product.id);
        const baseUnitPrice = offers[0]?.price ?? product.price;
        return { line, product, perUnitKg, baseUnitPrice };
      }),
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  for (const { line, perUnitKg } of resolved) {
    cartWeightKg += perUnitKg * line.quantity;
    totalUnits += line.quantity;
  }

  cartWeightKg = Number(cartWeightKg.toFixed(2));

  const projectedFill = (cargo.currentWeightFilledKg + cartWeightKg) / cargo.capacityMaxKg;
  const projectedFillPct = Math.round(projectedFill * 100);

  // Discount from how full this order makes the returning ferry, with a 5+ floor.
  let discountPct = 0;
  let reason = "Standard pricing — the ferry container has plenty of room.";
  if (projectedFill >= 0.85) {
    discountPct = 20;
    reason = `This order fills the ferry container to ${projectedFillPct}% — you unlock the full 20% consolidation discount.`;
  } else if (projectedFill >= 0.6) {
    discountPct = 10;
    reason = `This order brings the ferry container to ${projectedFillPct}% full — a 10% consolidation discount applies.`;
  }
  if (totalUnits >= 5 && discountPct < 10) {
    discountPct = 10;
    reason = `Buying ${totalUnits} units triggers the 10% volume-consolidation discount.`;
  }

  const lineItems = resolved.map(({ line, product, baseUnitPrice }) => {
    const unitPrice = Number((baseUnitPrice * (1 - discountPct / 100)).toFixed(2));
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      baseUnitPrice: Number(baseUnitPrice.toFixed(2)),
      unitPrice,
      lineTotal: Number((unitPrice * line.quantity).toFixed(2)),
    };
  });

  const subtotal = Number(
    resolved.reduce((s, { line, baseUnitPrice }) => s + baseUnitPrice * line.quantity, 0).toFixed(2),
  );
  const total = Number(lineItems.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const co2SavedKg = Number((cartWeightKg * 0.42 * (discountPct > 0 ? 1 : 0.4)).toFixed(2));

  return NextResponse.json({
    cartWeightKg,
    cargo: {
      currentWeightFilledKg: cargo.currentWeightFilledKg,
      capacityMaxKg: cargo.capacityMaxKg,
    },
    projectedFillPct,
    discountPct,
    reason,
    lineItems,
    subtotal,
    total,
    savings: Number((subtotal - total).toFixed(2)),
    co2SavedKg,
  });
}
