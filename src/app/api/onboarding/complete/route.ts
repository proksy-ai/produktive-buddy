import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSessionToken,
  requireSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  completeOnboarding,
  CompleteOnboardingError,
} from "@/modules/onboarding/application/complete-onboarding";
import { assertSameOrigin } from "@/server/security/csrf";

const enrollmentSchema = z.object({
  courseId: z.string(),
  courseSectionCode: z.enum(["A", "B", "C"]).optional(),
});

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  rollNumber: z.string().max(32).optional(),
  calendarPreference: z.enum(["GOOGLE", "APPLE", "BOTH", "LATER"]).optional(),
  termId: z.string(),
  cohortSectionId: z.string().optional(),
  enrollments: z.array(enrollmentSchema).optional(),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());

    await completeOnboarding({
      sessionId: session.id,
      sessionBatchId: session.batchId,
      name: body.name,
      rollNumber: body.rollNumber,
      calendarPreference: body.calendarPreference,
      termId: body.termId,
      cohortSectionId: body.cohortSectionId,
      enrollments: body.enrollments,
    });

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.id },
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
      user: { name: user.name, batchLabel: user.batch?.label },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    if (err instanceof CompleteOnboardingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[onboarding/complete]", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
