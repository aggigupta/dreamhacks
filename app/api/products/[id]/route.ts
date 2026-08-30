import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const product = await db.getProductById(resolvedParams.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    const offers = await db.getListingsForProduct(resolvedParams.id);
    return NextResponse.json({ product, offers });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
  }
}
