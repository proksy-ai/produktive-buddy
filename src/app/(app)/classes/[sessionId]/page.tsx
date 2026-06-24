import { ArrowLeft, CalendarClock, MapPin, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClassDetailActions } from "@/components/app/class-detail-actions";
import { Button } from "@/components/ui/button";
import { getAttendanceOverview } from "@/lib/attendance";
import { getSession } from "@/lib/auth/session";
import { courseAccent } from "@/lib/colors";
import { db } from "@/lib/db";
import { getUserSessions } from "@/lib/schedule";

function longDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const auth = await getSession();
  if (!auth) notFound();

  const [sessions, attendance] = await Promise.all([
    getUserSessions(auth.id),
    getAttendanceOverview(auth.id),
  ]);
  const klass = sessions.find((s) => s.id === sessionId);
  if (!klass) notFound();

  const note = await db.sessionNote.findUnique({
    where: { userId_sessionId: { userId: auth.id, sessionId } },
    select: { body: true },
  });

  const official = await db.officialAttendance.findUnique({
    where: { studentId_sessionId: { studentId: auth.id, sessionId } },
    select: { status: true, markedAt: true },
  });

  const accent = courseAccent(klass.colorKey);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/schedule">
          <ArrowLeft className="size-4" />
          Back to schedule
        </Link>
      </Button>

      <section
        className="rounded-3xl border border-border bg-card p-5 shadow-sm"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 14%, transparent), transparent 52%), var(--color-card)`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                color: accent,
                background: `color-mix(in oklch, ${accent} 16%, transparent)`,
              }}
            >
              {klass.courseAbbr}
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {klass.courseName}
            </h1>
          </div>
          {klass.status !== "SCHEDULED" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {klass.status.toLowerCase()}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" />
            {longDate(klass.date)} · {klass.startTime}–{klass.endTime}
          </span>
          {klass.room ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4" />
              {klass.room}
            </span>
          ) : null}
          {klass.faculty ? (
            <span className="inline-flex items-center gap-2">
              <User className="size-4" />
              {klass.faculty}
            </span>
          ) : null}
        </div>

        {official ? (
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-3 text-sm">
            <p className="font-semibold">Official attendance</p>
            <p className="mt-0.5 text-muted-foreground">
              Marked {official.status.toLowerCase()} by faculty/admin.
            </p>
          </div>
        ) : null}
      </section>

      <ClassDetailActions
        sessionId={sessionId}
        initialMark={attendance?.marks[sessionId]}
        initialNote={note?.body ?? ""}
      />
    </div>
  );
}
