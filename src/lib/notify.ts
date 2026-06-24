import type { ChangeType } from "@prisma/client";

import { db } from "@/lib/db";
import { sendToUser } from "@/lib/push";
import { resolveTermAvailability } from "@/lib/terms";
import { voice } from "@/lib/voice";

function changeTitle(type: ChangeType): string {
  switch (type) {
    case "CANCELLED":
      return voice.notify.cancelledTitle;
    case "RESCHEDULED":
      return voice.notify.rescheduledTitle;
    case "ROOM_CHANGED":
      return voice.notify.roomChangedTitle;
    case "TIME_CHANGED":
      return voice.notify.timeChangedTitle;
    case "ADDED":
      return voice.notify.addedTitle;
    default:
      return voice.notify.changeTitle;
  }
}

/** Users who should hear about a change to a given session. */
async function recipientsForSession(sessionId: string): Promise<string[]> {
  const klass = await db.session.findUnique({
    where: { id: sessionId },
    select: { termId: true, courseId: true, cohortSectionId: true },
  });
  if (!klass) return [];

  const ids = new Set<string>();

  // Elective students enrolled in this course for this term.
  const enrolled = await db.user.findMany({
    where: {
      activeTermId: klass.termId,
      enrollments: { some: { termId: klass.termId, courseId: klass.courseId } },
    },
    select: { id: true },
  });
  enrolled.forEach((u) => ids.add(u.id));

  // Year-1 cohort students in the matching section.
  if (klass.cohortSectionId) {
    const cohort = await db.user.findMany({
      where: {
        activeTermId: klass.termId,
        termProfiles: {
          some: { termId: klass.termId, cohortSectionId: klass.cohortSectionId },
        },
      },
      select: { id: true },
    });
    cohort.forEach((u) => ids.add(u.id));
  }

  return [...ids];
}

/**
 * Sends push for any undelivered schedule changes and newly-live terms.
 * Safe to call after every sync; it only acts on rows not yet notified.
 */
export async function dispatchPendingNotifications(): Promise<{
  changes: number;
  termsLive: number;
}> {
  let changesSent = 0;
  let termsLive = 0;

  // 1) Schedule changes (cancellations, reschedules, etc.).
  const pending = await db.changeEvent.findMany({
    where: { notifiedAt: null, sessionId: { not: null } },
    orderBy: { detectedAt: "asc" },
    take: 200,
  });

  for (const ev of pending) {
    if (!ev.sessionId) continue;
    const userIds = await recipientsForSession(ev.sessionId);
    for (const userId of userIds) {
      await sendToUser(userId, {
        title: changeTitle(ev.type),
        body: ev.summary,
        url: "/schedule",
        tag: `change-${ev.id}`,
      });
      changesSent++;
    }
    await db.changeEvent.update({
      where: { id: ev.id },
      data: { notifiedAt: new Date() },
    });
  }

  // 2) Locked terms that just went live → notify the waitlist.
  const requests = await db.termNotifyRequest.findMany({
    where: { notifiedAt: null },
    include: {
      term: {
        include: {
          batch: true,
          _count: { select: { courses: true } },
        },
      },
    },
    take: 500,
  });

  for (const req of requests) {
    const availability = resolveTermAvailability(
      req.term.batch.label,
      req.term.number,
      req.term._count.courses > 0,
    );
    if (availability !== "live") continue;

    await sendToUser(req.userId, {
      title: voice.notify.termLiveTitle(req.term.name),
      body: voice.notify.termLive(req.term.name),
      url: "/onboarding",
      tag: `term-live-${req.termId}`,
    });
    await db.termNotifyRequest.update({
      where: { id: req.id },
      data: { notifiedAt: new Date() },
    });
    termsLive++;
  }

  return { changes: changesSent, termsLive };
}
