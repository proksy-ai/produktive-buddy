import { db } from "@/lib/db";

export async function saveSessionNote(
  userId: string,
  sessionId: string,
  body: string,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeTermId: true },
  });
  const klass = await db.session.findUnique({
    where: { id: sessionId },
    select: { termId: true },
  });
  if (!user?.activeTermId || klass?.termId !== user.activeTermId) {
    throw new Error("Invalid class.");
  }

  const trimmed = body.trim();
  if (!trimmed) {
    await db.sessionNote.deleteMany({ where: { userId, sessionId } });
    return null;
  }

  return db.sessionNote.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId, body: trimmed },
    update: { body: trimmed },
  });
}
