import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import {
  listOnboardingCourses,
  OnboardingCourseAccessError,
} from "@/modules/onboarding/application/course-catalog";

const querySchema = z.object({
  termId: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const { termId } = querySchema.parse({
      termId: searchParams.get("termId"),
    });
    return NextResponse.json({
      courses: await listOnboardingCourses(session, termId),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "termId required" }, { status: 400 });
    }
    if (err instanceof OnboardingCourseAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
