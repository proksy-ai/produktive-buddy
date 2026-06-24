import { redirect } from "next/navigation";

import { getSession, type SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

type ElevatedRole = "FACULTY" | "ADMIN" | "ACADEMIC_ADMIN";

/** Comma-separated emails granted admin access without a DB role change. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export async function requireRole(allowed: ElevatedRole[]) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Env allowlist short-circuits to ADMIN for bootstrapping.
  if (isAdminEmail(session.email)) {
    return { session, user: { role: "ADMIN" as const, name: session.name, email: session.email } };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true, name: true, email: true },
  });
  if (!user || !allowed.includes(user.role as ElevatedRole)) {
    redirect("/today");
  }
  return { session, user };
}

/** API-route admin guard: returns the session or null (caller returns 403). */
export async function getAdminSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  if (isAdminEmail(session.email)) return session;

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true },
  });
  if (user?.role === "ADMIN" || user?.role === "ACADEMIC_ADMIN") return session;
  return null;
}
