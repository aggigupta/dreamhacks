import { NextResponse } from "next/server";
import { db, type DbUser } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, code, role, name, storeName } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const storedOtp = await db.getOtp(cleanEmail);

    if (!storedOtp) {
      return NextResponse.json({ error: "No verification code found for this email. Please request a new code." }, { status: 400 });
    }

    if (Date.now() > storedOtp.expiresAt) {
      await db.deleteOtp(cleanEmail);
      return NextResponse.json({ error: "Verification code has expired. Please request a new code." }, { status: 400 });
    }

    if (storedOtp.code !== code.trim()) {
      return NextResponse.json({ error: "Invalid verification code. Please check and try again." }, { status: 400 });
    }

    // Code is valid! Delete spent OTP
    await db.deleteOtp(cleanEmail);

    // Get or create user
    let user = await db.getUserByEmail(cleanEmail);
    const userRole = role || (cleanEmail.includes("shopkeeper") || cleanEmail.includes("seller") ? "shopkeeper" : "customer");
    const userName = name || (userRole === "shopkeeper" ? "Maya Lin" : cleanEmail.split("@")[0]);

    if (!user) {
      user = {
        id: `usr-${Date.now().toString().slice(-6)}`,
        email: cleanEmail,
        name: userName,
        role: userRole,
        storeName: userRole === "shopkeeper" ? storeName || "Maya's Kitchen" : undefined,
        avatar: userRole === "shopkeeper"
          ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        createdAt: new Date().toISOString(),
      };
      await db.saveUser(user);
    }

    // Mint signed HttpOnly JWT session cookie
    await createSession(user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    console.error("Error verifying OTP:", err);
    return NextResponse.json({ error: "Failed to verify code." }, { status: 500 });
  }
}
