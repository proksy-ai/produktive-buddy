import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { VacationPlanner } from "@/components/app/vacation-planner";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getUserSessions } from "@/modules/schedule/application/schedule-service";

export const metadata: Metadata = { title: "Calendar" };

function label(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      activeTerm: true,
      batch: { include: { program: { include: { college: true } } } },
    },
  });
  if (!user?.batch) redirect("/onboarding");

  const [events, sessions] = await Promise.all([
    db.academicCalendarEvent.findMany({
      where: {
        collegeId: user.batch.program.collegeId,
        OR: [
          { batchId: null, termId: null },
          { batchId: user.batchId },
          { termId: user.activeTermId },
        ],
      },
      orderBy: { startDate: "asc" },
    }),
    getUserSessions(session.id),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Academic calendar"
        subtitle="Holidays, vacations, and trip-risk math."
      />

      <VacationPlanner sessions={sessions} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Upcoming dates</h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No holidays loaded yet"
            description="Once academic calendar dates are added, they will show up here and on the schedule rail."
          />
        ) : (
          <div className="grid gap-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {label(event.startDate)}
                      {event.endDate.toDateString() !== event.startDate.toDateString()
                        ? ` – ${label(event.endDate)}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {event.type.toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
