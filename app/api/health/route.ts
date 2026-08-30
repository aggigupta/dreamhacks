import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const productsCount = (await db.getAllProducts()).length;
    const ordersCount = (await db.getOrders()).length;

    return NextResponse.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        productsCount,
        ordersCount,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
