import type { AttendanceStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type AttendanceMutationStatus = "PRESENT" | "ABSENT" | "CLEAR";

export async function markStudentAttendance(
  userId: string,
  sessionId: string,
  status: AttendanceMutationStatus,
): Promise<AttendanceStatus | null> {
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

  if (status === "CLEAR") {
    await db.attendance.deleteMany({ where: { userId, sessionId } });
    return null;
  }

  const record = await db.attendance.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId, status },
    update: { status },
  });
  return record.status;
}
