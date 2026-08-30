import { NextResponse } from "next/server";
import { db, weightForProduct } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const orders = await db.getOrders();
    return NextResponse.json({ orders, total: orders.length });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSession();
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order items cannot be empty." }, { status: 400 });
    }

    // Weigh the order so it fills the shared ferry container.
    let orderWeightKg = 0;
    for (const it of body.items) {
      const p = await db.getProductById(it.productId);
      if (p) orderWeightKg += weightForProduct(p) * (Number(it.quantity) || 1);
    }
    orderWeightKg = Number(orderWeightKg.toFixed(2));

    const orderData = {
      userId: sessionUser?.id,
      customerName: body.customerName || sessionUser?.name || "Alex Morgan",
      customerEmail: body.customerEmail || sessionUser?.email || "alex.morgan@gmail.com",
      address: body.address || "74 Sunset Cove Road, East Ridge",
      city: body.city || "Isla Sol Co-op District",
      country: body.country || "Pacific Island Territory",
      gpsLat: body.gpsLat ?? -17.54,
      gpsLng: body.gpsLng ?? -149.55,
      subtotal: body.subtotal ?? 0,
      backhaulRebate: body.backhaulRebate ?? 0,
      shippingCost: body.shippingCost ?? 0,
      grandTotal: body.grandTotal ?? 0,
      ecoBackhaulMode: body.ecoBackhaulMode ?? true,
      co2SavedKg: Number((orderWeightKg * 0.42).toFixed(2)),
      items: body.items,
    };

    const created = await db.createOrder(orderData);
    const cargo = await db.addCargoWeight(orderWeightKg);
    return NextResponse.json({ success: true, order: created, cargo, orderWeightKg });
  } catch (err: any) {
    console.error("Error creating order:", err);
    return NextResponse.json({ error: "Failed to process order." }, { status: 500 });
  }
}
