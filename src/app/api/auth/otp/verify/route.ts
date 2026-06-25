import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isInstituteEmail,
  normalizeInstituteEmail,
  resolveBatchFromEmail,
} from "@/lib/auth/email-prefix";
import {
  OtpVerificationError,
  verifyOtpCode,
} from "@/lib/auth/otp";
import { sessionCookieOptions } from "@/lib/auth/session";
import { signInInstituteUser } from "@/modules/auth/application/sign-in";
import { auditLog } from "@/server/audit/service";
import {
  error as logError,
  info as logInfo,
  requestLogContext,
} from "@/server/observability/logger";
import {
  checkRateLimit,
  RateLimitError,
  requestIp,
} from "@/server/security/rate-limit";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    const json = await request.json();
    const { email, code } = bodySchema.parse(json);
    const normalized = normalizeInstituteEmail(email);
    const ip = requestIp(request);

    await checkRateLimit({
      key: `otp-verify:ip:${ip}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    await checkRateLimit({
      key: `otp-verify:email:${normalized}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!isInstituteEmail(normalized)) {
      return NextResponse.json(
        { error: "Use your @iimk.ac.in institute email." },
        { status: 400 },
      );
    }

    await verifyOtpCode(normalized, code);

    const batch = await resolveBatchFromEmail(normalized);
    if (!batch) {
      return NextResponse.json(
        { error: "No batch mapping for this email." },
        { status: 403 },
      );
    }

    const { user, token } = await signInInstituteUser({
      email: normalized,
      batchId: batch.id,
    });
    await auditLog({
      actorId: user.id,
      action: "auth.otp.verify",
      metadata: { batchLabel: user.batchLabel },
      request,
    });
    logInfo("auth.otp.verify.success", {
      ...logCtx,
      actorId: user.id,
      status: 200,
      durationMs: Date.now() - started,
      errorCode: "AUTH_OTP_VERIFY_OK",
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        batchLabel: user.batchLabel,
      },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    if (err instanceof OtpVerificationError) {
      logInfo("auth.otp.verify.invalid_code", {
        ...logCtx,
        status: 401,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_VERIFY_INVALID",
      });
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof RateLimitError) {
      logInfo("auth.otp.verify.rate_limited", {
        ...logCtx,
        status: 429,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_VERIFY_RATE_LIMIT",
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
      logInfo("auth.otp.verify.invalid_request", {
        ...logCtx,
        status: 400,
        durationMs: Date.now() - started,
        errorCode: "AUTH_OTP_VERIFY_INVALID_REQUEST",
      });
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    logError("auth.otp.verify.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "AUTH_OTP_VERIFY_FAILED",
    });
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
