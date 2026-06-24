"use client";

import { Plane } from "lucide-react";
import { useMemo, useState } from "react";

import type { ClassSession } from "@/lib/schedule";

function inRange(date: string, start: string, end: string) {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export function VacationPlanner({ sessions }: { sessions: ClassSession[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);

  const impact = useMemo(() => {
    const missed = sessions.filter(
      (s) =>
        s.status !== "CANCELLED" &&
        s.status !== "REMOVED" &&
        inRange(s.date, start, end),
    );
    const byCourse = new Map<string, { name: string; count: number }>();
    for (const s of missed) {
      const entry = byCourse.get(s.courseId) ?? { name: s.courseName, count: 0 };
      entry.count++;
      byCourse.set(s.courseId, entry);
    }
    return { missed, byCourse: [...byCourse.values()] };
  }, [sessions, start, end]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Plane className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Vacation planner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick dates and see what classes you would miss before booking that trip.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          From
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          To
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/40 p-4">
        <p className="text-sm font-semibold">
          {impact.missed.length} class{impact.missed.length === 1 ? "" : "es"} at risk
        </p>
        {impact.byCourse.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {impact.byCourse.map((c) => (
              <span
                key={c.name}
                className="rounded-full bg-background px-2 py-1 text-xs font-medium"
              >
                {c.name}: {c.count}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Looks clear. The universe approves this vacation.
          </p>
        )}
      </div>
    </section>
  );
}
