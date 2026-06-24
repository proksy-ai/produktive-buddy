import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({ endpoint: z.string().url() });

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { endpoint } = bodySchema.parse(await request.json());

    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
