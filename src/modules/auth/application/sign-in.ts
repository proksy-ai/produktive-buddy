import { db } from "@/lib/db";
import {
  createSessionToken,
  type SessionUser,
} from "@/lib/auth/session";

export async function signInInstituteUser({
  email,
  name,
  batchId,
}: {
  email: string;
  name?: string | null;
  batchId: string;
}): Promise<{ user: SessionUser; token: string }> {
  const now = new Date();
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      emailVerified: now,
      name: name || null,
      batchId,
    },
    update: {
      emailVerified: now,
      batchId,
      ...(name ? { name } : {}),
    },
    include: { batch: true },
  });

  // If this student was on the invite roster, record that they joined.
  await db.rosterEntry.updateMany({
    where: { email, joinedAt: null },
    data: { joinedAt: now },
  });

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    batchId: user.batchId,
    batchLabel: user.batch?.label ?? null,
    role: user.role,
  };

  return {
    user: sessionUser,
    token: await createSessionToken(sessionUser),
  };
}
