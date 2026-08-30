import nodemailer from "nodemailer";

export interface OtpRecord {
  code: string;
  expiresAt: number;
  role: "customer" | "shopkeeper";
}

// Global in-memory OTP store across requests
const globalOtpMap = globalThis as unknown as {
  shopylandOtpMap?: Map<string, OtpRecord>;
};

export const otpStore = globalOtpMap.shopylandOtpMap || new Map<string, OtpRecord>();
if (process.env.NODE_ENV !== "production") {
  globalOtpMap.shopylandOtpMap = otpStore;
}

export async function sendOtpEmail(email: string, otpCode: string, role: string) {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  let transporter: nodemailer.Transporter;

  if (user && pass) {
    const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");
    console.log(`[SMTP] Initializing SMTP transport for ${user} (Gmail mode: ${isGmail})`);

    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: { user, pass },
          }
        : {
            host: host || "smtp.gmail.com",
            port,
            secure: port === 465,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
          }
    );
  } else {
    console.log("[SMTP] No custom SMTP_USER/SMTP_PASS found. Using Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #082B5C; margin: 0; font-size: 24px;">⛵ Shopyland</h1>
        <p style="color: #55AEB1; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">
          Verification Code
        </p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">
        Hello,
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">
        Use the 6-digit verification code below to complete your sign-in as a <strong>${role}</strong> on Shopyland:
      </p>
      <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #f7f7f4; border: 1px solid #e2e8f0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #082B5C;">${otpCode}</span>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">
        This code is valid for 10 minutes. If you did not request this email, please ignore it.
      </p>
    </div>
  `;

  // Gmail SMTP requires the "from" address to match the authenticated SMTP_USER!
  const fromAddress = user ? `"Shopyland Storefront" <${user}>` : '"Shopyland Storefront" <no-reply@shopyland.com>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: `Shopyland — Your Verification Code: ${otpCode}`,
    text: `Your Shopyland verification code is: ${otpCode}`,
    html: htmlContent,
  });

  console.log(`[SMTP] Email sent successfully to ${email}. Message ID: ${info.messageId}`);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[SMTP] Test message preview URL: ${previewUrl}`);
  }

  return { info, previewUrl: previewUrl || undefined };
}
