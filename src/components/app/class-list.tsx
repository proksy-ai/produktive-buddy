"use client";

import { useEffect, useState } from "react";

import { SessionRow } from "@/components/app/session-row";
import type { AttendanceMark } from "@/lib/attendance";
import {
  attendanceMarksFromLocal,
  saveAttendanceDraft,
} from "@/lib/local-first/store";
import {
  flushPendingLocalDrafts,
  syncAttendanceDraft,
} from "@/lib/local-first/sync";
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

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const localMarks = await attendanceMarksFromLocal();
        if (!active) return;
        setMarks((prev) => ({ ...prev, ...localMarks }));
        await flushPendingLocalDrafts();
      } catch {
        // Local-first storage is best-effort only.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

    await saveAttendanceDraft(sessionId, value);
    await syncAttendanceDraft(sessionId, value);
  }

  return (
    <div className="rounded-md border-2 border-foreground bg-card p-4 pb-0 shadow-nb">
        {sessions.map((s) => {
          const showToggle =
            markable &&
            s.status !== "CANCELLED" &&
            s.status !== "REMOVED" &&
            isPast(s, now);
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
    </div>
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
    <div className="grid min-w-28 grid-cols-1 gap-1">
      <button
        type="button"
        aria-label="Attended class"
        onClick={() => onMark("PRESENT")}
        className={cn(
          "rounded-md border-2 border-foreground px-2.5 py-1.5 text-xs font-bold transition-all",
          mark === "PRESENT"
            ? "bg-success text-success-foreground shadow-nb-sm"
            : "bg-card text-muted-foreground hover:bg-success/20",
        )}
      >
        Attended
      </button>
      <button
        type="button"
        aria-label="Missed class"
        onClick={() => onMark("ABSENT")}
        className={cn(
          "rounded-md border-2 border-foreground px-2.5 py-1.5 text-xs font-bold transition-all",
          mark === "ABSENT"
            ? "bg-destructive text-destructive-foreground shadow-nb-sm"
            : "bg-card text-muted-foreground hover:bg-destructive/20",
        )}
      >
        Missed
      </button>
    </div>
  );
}
