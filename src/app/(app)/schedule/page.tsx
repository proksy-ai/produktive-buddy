import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { ScheduleView } from "@/components/app/schedule-view";
import { Button } from "@/components/ui/button";
import { getAttendanceOverview } from "@/lib/attendance";
import { getSession } from "@/lib/auth/session";
import { campusNow, getActiveTermContext, getUserSessions } from "@/lib/schedule";
import { voice } from "@/lib/voice";

export const metadata: Metadata = { title: "Plan" };

export default async function SchedulePage() {
  const session = await getSession();
  const ctx = session ? await getActiveTermContext(session.id) : null;

  if (!ctx || (ctx.isElective && ctx.courses.length === 0)) {
    return (
      <div>
        <PageHeader title="Plan" subtitle={voice.schedule.subtitle} />
        <EmptyState
          icon={CalendarDays}
          title={voice.schedule.emptyTitle}
          description={voice.schedule.emptyBody}
          action={
            <Button asChild>
              <Link href="/onboarding">{voice.today.addCourses}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [sessions, attendance] = await Promise.all([
    getUserSessions(session!.id),
    getAttendanceOverview(session!.id),
  ]);
  const now = campusNow();

  return (
    <div>
      <PageHeader
        title="Plan"
        subtitle={`${ctx.termName} · official sheet, reduced to what you need`}
      />
      <ScheduleView
        sessions={sessions}
        now={now}
        marks={attendance?.marks ?? {}}
      />
    </div>
  );
}
