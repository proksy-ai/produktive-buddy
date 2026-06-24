import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isInstituteEmail,
  normalizeInstituteEmail,
  resolveBatchFromEmail,
} from "@/lib/auth/email-prefix";
import {
  createOtpToken,
  OtpRateLimitError,
} from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/send";
import {
  checkRateLimit,
  RateLimitError,
  requestIp,
} from "@/server/security/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email } = bodySchema.parse(json);
    const normalized = normalizeInstituteEmail(email);
    const ip = requestIp(request);

    checkRateLimit({
      key: `otp-send:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    checkRateLimit({
      key: `otp-send:email:${normalized}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!isInstituteEmail(normalized)) {
      return NextResponse.json(
        { error: "Use your @iimk.ac.in institute email." },
        { status: 400 },
      );
    }

    const batch = await resolveBatchFromEmail(normalized);
    if (!batch) {
      return NextResponse.json(
        {
          error:
            "This email prefix is not registered yet. Contact support if you believe this is an error.",
        },
        { status: 403 },
      );
    }

    const { code } = await createOtpToken(normalized);
    if (process.env.NODE_ENV === "development") {
      console.info(`[Produktive Buddy OTP] ${normalized} -> ${code}`);
    }

    // Deliver the code. In production this must succeed; in development without
    // an email provider it no-ops and we expose devCode below.
    await sendOtpEmail(normalized, code);

    const payload: Record<string, unknown> = {
      ok: true,
      message: "Verification code sent.",
      batchLabel: batch.label,
    };

    if (process.env.NODE_ENV === "development") {
      payload.devCode = code;
    }

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof OtpRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfterSec) },
        },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    console.error("[auth/otp/send]", err);
    return NextResponse.json(
      { error: "Could not send verification code." },
      { status: 500 },
    );
  }
}
