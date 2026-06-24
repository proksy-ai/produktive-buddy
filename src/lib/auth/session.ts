import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/auth/cookie";
import { db } from "@/lib/db";

export { SESSION_COOKIE } from "@/lib/auth/cookie";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  batchId: string | null;
  batchLabel: string | null;
  role: UserRole;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    batchId: user.batchId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = payload.sub;
    if (!id || typeof id !== "string") return null;

    const user = await db.user.findUnique({
      where: { id },
      include: { batch: true },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      batchId: user.batchId,
      batchLabel: user.batch?.label ?? null,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
