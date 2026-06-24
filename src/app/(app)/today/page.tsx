import { CalendarClock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AttendanceSummaryCard } from "@/components/app/attendance-card";
import { ClassList } from "@/components/app/class-list";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAttendanceOverview } from "@/lib/attendance";
import { getSession } from "@/lib/auth/session";
import { firstName } from "@/lib/onboarding";
import {
  campusDateUTC,
  campusNow,
  findNextSession,
  getActiveTermContext,
  getUserSessions,
} from "@/lib/schedule";
import { voice } from "@/lib/voice";

export const metadata: Metadata = { title: "Today" };

function longDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function TodayPage() {
  const session = await getSession();
  const greeting = firstName(session?.name ?? null) ?? "there";
  const now = campusNow();

  const ctx = session ? await getActiveTermContext(session.id) : null;

  // Electives with no enrolled courses → nudge to add courses.
  if (!ctx || (ctx.isElective && ctx.courses.length === 0)) {
    return (
      <div className="space-y-5">
        <Header date={now.ymd} greeting={greeting} />
        <EmptyState
          icon={CalendarClock}
          title={voice.today.emptyTitle}
          description={voice.today.emptyBody}
          action={
            <Button asChild>
              <Link href="/onboarding">{voice.today.addCourses}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const today = campusDateUTC(now.ymd);
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 14);

  const [upcoming, attendance] = await Promise.all([
    getUserSessions(session!.id, { from: today, to: horizon }),
    getAttendanceOverview(session!.id),
  ]);

  const todays = upcoming.filter((s) => s.date === now.ymd);
  const next = findNextSession(upcoming, now);
  const nextIsToday = next?.date === now.ymd;

  return (
    <div className="space-y-5">
      <Header date={now.ymd} greeting={greeting} />

      <Card className="border-primary/15 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {voice.today.nextUp}
          </p>
          {next ? (
            <div className="mt-2">
              <p className="text-base font-semibold leading-snug">
                {next.courseName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">
                  {next.startTime}–{next.endTime}
                </span>
                <span>{nextIsToday ? "Today" : longDate(next.date)}</span>
                {next.room ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {next.room}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {voice.today.freeRestOfDay(greeting)}
            </p>
          )}
        </CardContent>
      </Card>

      {attendance?.overall && attendance.overall.held > 0 ? (
        <AttendanceSummaryCard overall={attendance.overall} />
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Today&apos;s classes
        </h2>
        {todays.length > 0 ? (
          <ClassList
            sessions={todays}
            now={now}
            markable
            initialMarks={attendance?.marks ?? {}}
          />
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="Clear schedule"
            description={voice.today.noClassesToday(greeting)}
          />
        )}
      </section>
    </div>
  );
}

function Header({ date, greeting }: { date: string; greeting: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        {longDate(date)}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {voice.today.greeting(greeting)}
      </h1>
    </div>
  );
}
