import { NextResponse } from "next/server";

import { getRosterStats } from "@/features/roster/service";
import { getAdminSession } from "@/lib/roles";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stats = await getRosterStats();
  return NextResponse.json(stats);
}
