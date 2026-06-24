import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function requireRole(allowed: Array<"FACULTY" | "ADMIN" | "ACADEMIC_ADMIN">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true, name: true, email: true },
  });
  if (!user || !allowed.includes(user.role as (typeof allowed)[number])) {
    redirect("/today");
  }
  return { session, user };
}
