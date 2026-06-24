import { NextResponse } from "next/server";
import { z } from "zod";

import { importRoster, parseRosterCsv } from "@/features/roster/service";
import { getAdminSession } from "@/lib/roles";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  csv: z.string().min(1).max(2_000_000),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { csv } = bodySchema.parse(await request.json());
    const entries = parseRosterCsv(csv);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Expected at least an email column." },
        { status: 422 },
      );
    }

    const source = `csv-import ${new Date().toISOString().slice(0, 10)}`;
    const { imported } = await importRoster(entries, source);

    await auditLog({
      actorId: session.id,
      action: "roster.import",
      metadata: { imported },
      request,
    });

    return NextResponse.json({ ok: true, imported, parsed: entries.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Provide CSV text." }, { status: 400 });
    }
    console.error("[admin/roster/import]", err);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
