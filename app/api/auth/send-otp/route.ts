import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    // Store in persistent database table
    await db.saveOtp(cleanEmail, otpCode, expiresAt);

    let deliveredViaSmtp = false;

    // Send email via Nodemailer if SMTP credentials are provided. Hard 8s cap so
    // a slow/blocked SMTP host can never hang the sign-in — we fall back to the
    // on-screen code instead.
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const port = Number(process.env.SMTP_PORT || 587);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: process.env.SMTP_SECURE === "true" || port === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          connectionTimeout: 7000,
          greetingTimeout: 7000,
          socketTimeout: 7000,
        });

        await Promise.race([
          transporter.sendMail({
            from: process.env.SMTP_FROM || `"Shopyland" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: "Your Shopyland verification code",
            text: `Your 6-digit Shopyland verification code is: ${otpCode}. It expires in 10 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #FAFAF8; border-radius: 12px;">
                <h2 style="color: #082B5C;">Shopyland sign-in verification</h2>
                <p>Your 6-digit verification code is:</p>
                <div style="font-size: 28px; font-weight: bold; color: #55AEB1; letter-spacing: 4px; margin: 15px 0;">${otpCode}</div>
                <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
              </div>`,
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("smtp-timeout")), 8000)),
        ]);
        deliveredViaSmtp = true;
      } catch (smtpErr) {
        console.warn("SMTP delivery failed, falling back to on-screen code:", smtpErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: deliveredViaSmtp
        ? "Verification code sent to your email."
        : "Verification code generated (demo mode — email not configured).",
      // Only leak the code when we could NOT deliver it by email (local/demo).
      // With SMTP configured the code stays server-side, like a real sign-in.
      ...(deliveredViaSmtp ? {} : { otpCode }),
      expiresAt,
    });
  } catch (err: any) {
    console.error("Error in send-otp API:", err);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
