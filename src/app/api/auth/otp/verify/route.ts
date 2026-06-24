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
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email, code } = bodySchema.parse(json);
    const normalized = normalizeInstituteEmail(email);

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

    const user = await db.user.upsert({
      where: { email: normalized },
      create: {
        email: normalized,
        emailVerified: new Date(),
        batchId: batch.id,
      },
      update: {
        emailVerified: new Date(),
        batchId: batch.id,
      },
      include: { batch: true },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      batchId: user.batchId,
      batchLabel: user.batch?.label ?? null,
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        batchLabel: user.batch?.label ?? null,
      },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    if (err instanceof OtpVerificationError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[auth/otp/verify]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
