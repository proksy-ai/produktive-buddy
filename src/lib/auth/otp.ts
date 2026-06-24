import { createHash, randomInt } from "node:crypto";

import { db } from "@/lib/db";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SEND_COOLDOWN_MS = 60 * 1000;

function pepper(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256")
    .update(`${pepper()}:${code}`)
    .digest("hex");
}

export async function createOtpToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const recent = await db.otpToken.findFirst({
    where: {
      email: normalized,
      consumedAt: null,
      createdAt: { gte: new Date(Date.now() - OTP_SEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    throw new OtpRateLimitError("Please wait before requesting another code.");
  }

  const code = generateOtpCode();
  const token = await db.otpToken.create({
    data: {
      email: normalized,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { token, code };
}

export class OtpRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpRateLimitError";
  }
}

export class OtpVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpVerificationError";
  }
}

export async function verifyOtpCode(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const token = await db.otpToken.findFirst({
    where: {
      email: normalized,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    throw new OtpVerificationError("Code expired or not found. Request a new one.");
  }

  if (token.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpVerificationError("Too many attempts. Request a new code.");
  }

  const valid = token.codeHash === hashOtpCode(code.trim());

  await db.otpToken.update({
    where: { id: token.id },
    data: { attempts: { increment: 1 } },
  });

  if (!valid) {
    throw new OtpVerificationError("Invalid code. Try again.");
  }

  await db.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  return true;
}
