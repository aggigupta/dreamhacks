import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
