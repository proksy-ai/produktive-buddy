import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/roles";
import { getRosterStats } from "@/modules/roster/application/roster-service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stats = await getRosterStats();
  return NextResponse.json(stats);
}
