import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get("termId");
    if (!termId) {
      return NextResponse.json({ error: "termId required" }, { status: 400 });
    }

    const courses = await db.course.findMany({
      where: { termId },
      orderBy: { name: "asc" },
      include: { sections: { orderBy: { code: "asc" } } },
    });

    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        abbr: c.abbr,
        name: c.name,
        faculty: c.faculty,
        credits: c.credits,
        sections: c.sections
          .map((s) => s.code)
          .filter((code) => code === "A" || code === "B" || code === "C"),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
