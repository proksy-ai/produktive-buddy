import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { sendToUser } from "@/lib/push";
import { assertSameOrigin } from "@/server/security/csrf";

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const sent = await sendToUser(session.id, {
      title: "Kairo works 🎉",
      body: "Notifications are on. We'll only ping you when it matters.",
      url: "/today",
      tag: "kairo-test",
    });
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
