import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Product } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let items = await db.getAllProductsWithOffers();

    if (category && category !== "all") {
      items = items.filter((p) => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.seller ?? "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ products: items, total: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSession();
    // Guard server-side: only authenticated shopkeepers can post products
    if (!sessionUser || sessionUser.role !== "shopkeeper") {
      return NextResponse.json({ error: "Unauthorized. Shopkeeper session required." }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Product name and price are required." }, { status: 400 });
    }

    const newProd: Product = {
      ...body,
      id: body.id || `p-custom-${Date.now().toString().slice(-6)}`,
      seller: sessionUser.storeName || sessionUser.name,
      sellerId: sessionUser.id,
      sellerAvatar: sessionUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    };

    const saved = await db.addProduct(newProd);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
