import { Bus, CalendarClock, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClassList } from "@/components/app/class-list";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAttendanceOverview, type CourseAttendance } from "@/lib/attendance";
import { getSession } from "@/lib/auth/session";
import {
  getNextShuttles,
  getRelevantMealMenu,
  type MealMenu,
  type ShuttleTripView,
} from "@/lib/campus";
import { firstName } from "@/lib/onboarding";
import {
  campusDateUTC,
  campusNow,
  findNextSession,
  getActiveTermContext,
  getUserSessions,
} from "@/lib/schedule";
import { voice } from "@/lib/voice";

export const metadata: Metadata = { title: "Now" };

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
  const [meal, nextShuttles] = await Promise.all([
    getRelevantMealMenu(now),
    getNextShuttles(now, 1),
  ]);
  const nextShuttle = nextShuttles[0] ?? null;

  const todays = upcoming.filter((s) => s.date === now.ymd);
  const visibleToday = todays
    .filter((s) => s.endTime >= now.hm || s.status === "CANCELLED")
    .slice(0, 3);
  const hiddenTodayCount = Math.max(todays.length - visibleToday.length, 0);
  const next = findNextSession(upcoming, now);
  const nextIsToday = next?.date === now.ymd;

  return (
    <div className="space-y-5">
      <Header date={now.ymd} greeting={greeting} />
      <CalendarStrip today={now.ymd} />

      <FocusBrief
        next={next}
        nextIsToday={nextIsToday}
        meal={meal}
        now={now.hm}
        attendance={attendance?.byCourse ?? []}
        greeting={greeting}
      />

      {nextShuttle ? <NextShuttleCard shuttle={nextShuttle} /> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            On deck
          </h2>
          <Link
            href="/schedule"
            className="text-sm font-medium text-primary hover:underline"
          >
            Full plan
          </Link>
        </div>
        {visibleToday.length > 0 ? (
          <>
          <ClassList
            sessions={visibleToday}
            now={now}
            markable
            initialMarks={attendance?.marks ?? {}}
          />
          {hiddenTodayCount > 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              {hiddenTodayCount} more tucked away in Plan.
            </p>
          ) : null}
          </>
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
        Now, {greeting}
      </h1>
    </div>
  );
}

function addDays(ymd: string, offset: number): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function CalendarStrip({ today }: { today: string }) {
  const days = Array.from({ length: 11 }, (_, i) => addDays(today, i - 3));

  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-2">
        {days.map((day) => {
          const date = new Date(`${day}T12:00:00`);
          const active = day === today;
          return (
            <div
              key={day}
              className={`w-16 rounded-md border-2 border-foreground px-3 py-2 text-center ${
                active
                  ? "bg-accent text-accent-foreground shadow-nb-sm"
                  : "bg-card text-muted-foreground"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase">
                {date.toLocaleDateString("en-IN", { weekday: "short" })}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {date.getDate()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FocusBrief({
  next,
  nextIsToday,
  meal,
  now,
  attendance,
  greeting,
}: {
  next: Awaited<ReturnType<typeof findNextSession>>;
  nextIsToday: boolean;
  meal: MealMenu;
  now: string;
  attendance: CourseAttendance[];
  greeting: string;
}) {
  const active = now >= meal.startsAt && now <= meal.endsAt;
  const risk = attendance
    .filter((c) => c.held > 0)
    .sort((a, b) => a.bunksLeft - b.bunksLeft || a.percent - b.percent)[0];

  return (
    <Card className="overflow-hidden bg-accent">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-primary text-primary-foreground shadow-nb-sm">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-accent-foreground">
              Produktive Buddy brief
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {next
                ? "Here’s the move."
                : voice.today.freeRestOfDay(greeting)}
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <BriefItem
            label={voice.today.nextUp}
            value={next ? next.courseName : "No more classes"}
            meta={
              next
                ? `${next.startTime}-${next.endTime} · ${
                    nextIsToday ? "Today" : longDate(next.date)
                  }${next.room ? ` · ${next.room}` : ""}`
                : "Calendar says breathe."
            }
          />
          <BriefItem
            label={active ? `${meal.label} is on` : `${meal.label} next`}
            value={meal.items.join(" · ")}
            meta={`${meal.startsAt}-${meal.endsAt}`}
          />
          <BriefItem
            label="Attendance risk"
            value={risk ? risk.name : "Nothing risky yet"}
            meta={
              risk
                ? `${risk.percent}% · ${voice.attendance.bunksLeft(risk.bunksLeft)}`
                : "Subject-level only. Total attendance is noise."
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NextShuttleCard({ shuttle }: { shuttle: ShuttleTripView }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-primary text-primary-foreground shadow-nb-sm">
          <Bus className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
            Next shuttle
          </p>
          <p className="truncate text-sm font-bold">
            {shuttle.fromStop} → {shuttle.toStop}
            {shuttle.finalStop ? ` → ${shuttle.finalStop}` : ""}
          </p>
        </div>
        <span className="rounded-md border-2 border-foreground bg-accent px-2 py-1 text-xs font-extrabold text-accent-foreground tabular-nums">
          {shuttle.departTime}
        </span>
      </CardContent>
    </Card>
  );
}

function BriefItem({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-md border-2 border-foreground bg-card p-3 text-card-foreground shadow-nb-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}
