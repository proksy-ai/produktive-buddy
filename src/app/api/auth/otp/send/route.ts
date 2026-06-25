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
import { assertSameOrigin } from "@/server/security/csrf";
import { auditLog } from "@/server/audit/service";
import { error as logError, info as logInfo, requestLogContext } from "@/server/observability/logger";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    const json = await request.json();
    const { email } = bodySchema.parse(json);
    const normalized = normalizeInstituteEmail(email);
    const ip = requestIp(request);

    await checkRateLimit({
      key: `otp-send:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    await checkRateLimit({
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

    await auditLog({
      action: "auth.otp.send",
      metadata: { batchLabel: batch.label },
      request,
    });
    logInfo("auth.otp.send.success", {
      ...logCtx,
      status: 200,
      durationMs: Date.now() - started,
      errorCode: "AUTH_OTP_SEND_OK",
    });

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof OtpRateLimitError) {
      logInfo("auth.otp.send.rate_limited", {
        ...logCtx,
        status: 429,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_SEND_RATE_LIMIT",
      });
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof RateLimitError) {
      logInfo("auth.otp.send.rate_limited", {
        ...logCtx,
        status: 429,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_SEND_RATE_LIMIT",
      });
      return NextResponse.json(
        { error: err.message },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfterSec) },
        },
      );
    }
    if (err instanceof z.ZodError) {
      logInfo("auth.otp.send.invalid_email", {
        ...logCtx,
        status: 400,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_SEND_INVALID",
      });
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    logError("auth.otp.send.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "AUTH_OTP_SEND_FAILED",
    });
    return NextResponse.json(
      { error: "Could not send verification code." },
      { status: 500 },
    );
  }
}
