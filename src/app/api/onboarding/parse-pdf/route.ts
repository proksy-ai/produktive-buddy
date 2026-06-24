import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

import { matchEdtexToCatalog, parseEdtexText } from "@/lib/edtex/parse";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await requireSession();
    const form = await request.formData();
    const file = form.get("file");
    const termId = form.get("termId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file required." }, { status: 400 });
    }
    if (typeof termId !== "string" || !termId) {
      return NextResponse.json({ error: "termId required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();

    const parsed = parseEdtexText(textResult.text);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No courses found in PDF. Use your EDTEX Confirmed Courses export." },
        { status: 422 },
      );
    }

    const catalog = await db.course.findMany({
      where: { termId },
      include: { sections: true },
    });

    const { matched, unmatched } = matchEdtexToCatalog(parsed, catalog);

    return NextResponse.json({
      parsedCount: parsed.length,
      matched,
      unmatched: unmatched.map((u) => ({ code: u.code, name: u.name })),
    });
  } catch (err) {
    console.error("[onboarding/parse-pdf]", err);
    return NextResponse.json(
      { error: "Could not read PDF. Try a different file." },
      { status: 500 },
    );
  }
}
