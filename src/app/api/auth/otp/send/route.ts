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

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email } = bodySchema.parse(json);
    const normalized = normalizeInstituteEmail(email);

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
    console.info(`[Kairo OTP] ${normalized} -> ${code}`);

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
