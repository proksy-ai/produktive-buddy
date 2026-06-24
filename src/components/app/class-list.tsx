"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { SessionRow } from "@/components/app/session-row";
import { Card, CardContent } from "@/components/ui/card";
import type { AttendanceMark } from "@/lib/attendance";
import type { ClassSession } from "@/lib/schedule";
import { cn } from "@/lib/utils";

function isPast(s: ClassSession, now: { ymd: string; hm: string }) {
  return s.date < now.ymd || (s.date === now.ymd && s.endTime <= now.hm);
}

export function ClassList({
  sessions,
  now,
  markable = false,
  initialMarks = {},
}: {
  sessions: ClassSession[];
  now: { ymd: string; hm: string };
  markable?: boolean;
  initialMarks?: Record<string, AttendanceMark>;
}) {
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>(initialMarks);

  async function setMark(sessionId: string, next: AttendanceMark) {
    const current = marks[sessionId];
    const value = current === next ? "CLEAR" : next;

    // Optimistic.
    setMarks((prev) => {
      const copy = { ...prev };
      if (value === "CLEAR") delete copy[sessionId];
      else copy[sessionId] = value;
      return copy;
    });

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status: value }),
      });
    } catch {
      // Revert on failure.
      setMarks((prev) => {
        const copy = { ...prev };
        if (current) copy[sessionId] = current;
        else delete copy[sessionId];
        return copy;
      });
    }
  }

  return (
    <Card>
      <CardContent className="p-4 pb-0">
        {sessions.map((s) => {
          const showToggle =
            markable && s.status !== "CANCELLED" && isPast(s, now);
          return (
            <SessionRow
              key={s.id}
              session={s}
              action={
                showToggle ? (
                  <AttendanceToggle
                    mark={marks[s.id]}
                    onMark={(m) => void setMark(s.id, m)}
                  />
                ) : null
              }
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function AttendanceToggle({
  mark,
  onMark,
}: {
  mark: AttendanceMark | undefined;
  onMark: (m: AttendanceMark) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Present"
        onClick={() => onMark("PRESENT")}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg border transition-colors",
          mark === "PRESENT"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-500",
        )}
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Absent"
        onClick={() => onMark("ABSENT")}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg border transition-colors",
          mark === "ABSENT"
            ? "border-destructive bg-destructive text-white"
            : "border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive",
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
