import { BRAND } from "@/lib/brand";

/**
 * Minimal, dependency-free transactional email via Resend's HTTP API.
 *
 * Configure with:
 *   RESEND_API_KEY  - Resend API key
 *   EMAIL_FROM      - verified sender, e.g. "Produktive Buddy <login@yourdomain.com>"
 *
 * In development, if RESEND_API_KEY is absent we no-op (the OTP route returns
 * a devCode so you can still log in). In production a missing provider throws,
 * so misconfiguration fails loudly instead of silently dropping logins.
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email provider is not configured (set RESEND_API_KEY + EMAIL_FROM).");
    this.name = "EmailNotConfiguredError";
  }
}

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Produktive Buddy <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailNotConfiguredError();
    }
    // Dev convenience: skip sending; caller exposes devCode.
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = `${code} is your ${BRAND.name} verification code`;
  const text = `Your ${BRAND.name} verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#111">
      <h1 style="font-size:18px;margin:0 0 12px">${BRAND.name} sign-in</h1>
      <p style="margin:0 0 16px;color:#444">Use this code to sign in. It expires in 10 minutes.</p>
      <div style="font-size:32px;font-weight:800;letter-spacing:6px;padding:14px 18px;border:2px solid #111;border-radius:8px;text-align:center">${code}</div>
      <p style="margin:16px 0 0;color:#888;font-size:12px">If you didn't request this, you can safely ignore it.</p>
    </div>`;
  await sendEmail({ to, subject, text, html });
}
