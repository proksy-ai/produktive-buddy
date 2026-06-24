"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ClassList } from "@/components/app/class-list";
import { EmptyState } from "@/components/app/empty-state";
import type { AttendanceMark } from "@/lib/attendance";
import type { ClassSession } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { voice } from "@/lib/voice";

type View = "day" | "week";
type Now = { ymd: string; hm: string };

function parse(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`);
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(ymd: string, n: number): string {
  const d = parse(ymd);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

/** Monday-based start of the week containing ymd. */
function weekStart(ymd: string): string {
  const d = parse(ymd);
  const dow = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dow);
  return toYmd(d);
}

function dayLabel(ymd: string): string {
  return parse(ymd).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function longDay(ymd: string): string {
  return parse(ymd).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ScheduleView({
  sessions,
  now,
  marks = {},
}: {
  sessions: ClassSession[];
  now: Now;
  marks?: Record<string, AttendanceMark>;
}) {
  const today = now.ymd;
  const [view, setView] = useState<View>("day");
  // Anchor on today if it has classes, else the first day that does.
  const initialAnchor = useMemo(() => {
    const dates = new Set(sessions.map((s) => s.date));
    if (dates.has(today)) return today;
    const future = sessions.find((s) => s.date >= today);
    return future?.date ?? sessions[0]?.date ?? today;
  }, [sessions, today]);

  const [anchor, setAnchor] = useState(initialAnchor);

  const byDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [sessions]);

  const step = view === "day" ? 1 : 7;
  const go = (dir: -1 | 1) => setAnchor((a) => addDays(a, dir * step));

  const weekDays = useMemo(() => {
    const start = weekStart(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor]);

  const rangeLabel =
    view === "day"
      ? longDay(anchor)
      : `${dayLabel(weekDays[0])} – ${dayLabel(weekDays[6])}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "day" ? voice.schedule.dayTab : voice.schedule.weekTab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAnchor(today)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {voice.schedule.today}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
          aria-label={voice.schedule.prev}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold">{rangeLabel}</span>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
          aria-label={voice.schedule.next}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {view === "day" ? (
        <DayView sessions={byDate.get(anchor) ?? []} now={now} marks={marks} />
      ) : (
        <WeekView days={weekDays} byDate={byDate} now={now} marks={marks} />
      )}
    </div>
  );
}

function DayView({
  sessions,
  now,
  marks,
}: {
  sessions: ClassSession[];
  now: Now;
  marks: Record<string, AttendanceMark>;
}) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={voice.schedule.emptyTitle}
        description={voice.schedule.emptyDay}
      />
    );
  }
  return (
    <ClassList sessions={sessions} now={now} markable initialMarks={marks} />
  );
}

function WeekView({
  days,
  byDate,
  now,
  marks,
}: {
  days: string[];
  byDate: Map<string, ClassSession[]>;
  now: Now;
  marks: Record<string, AttendanceMark>;
}) {
  const withClasses = days.filter((d) => (byDate.get(d)?.length ?? 0) > 0);

  if (withClasses.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={voice.schedule.emptyTitle}
        description={voice.schedule.emptyDay}
      />
    );
  }

  return (
    <div className="space-y-4">
      {withClasses.map((d) => (
        <div key={d}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{longDay(d)}</h3>
            {d === now.ymd ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {voice.schedule.today}
              </span>
            ) : null}
          </div>
          <ClassList
            sessions={byDate.get(d) ?? []}
            now={now}
            markable
            initialMarks={marks}
          />
        </div>
      ))}
    </div>
  );
}
