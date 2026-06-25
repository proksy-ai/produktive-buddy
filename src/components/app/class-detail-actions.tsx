"use client";

import { Check, Loader2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AttendanceMark } from "@/lib/attendance";
import {
  attendanceDraftForSession,
  noteDraftForSession,
  saveAttendanceDraft,
  saveNoteDraft,
} from "@/lib/local-first/store";
import {
  flushPendingLocalDrafts,
  syncAttendanceDraft,
  syncNoteDraft,
} from "@/lib/local-first/sync";
import { cn } from "@/lib/utils";

export function ClassDetailActions({
  sessionId,
  initialMark,
  initialNote,
}: {
  sessionId: string;
  initialMark?: AttendanceMark;
  initialNote: string;
}) {
  const [mark, setMark] = useState<AttendanceMark | undefined>(initialMark);
  const [note, setNote] = useState(initialNote);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [attendanceDraft, noteDraft] = await Promise.all([
          attendanceDraftForSession(sessionId),
          noteDraftForSession(sessionId),
        ]);
        if (!active) return;

        if (attendanceDraft?.status === "PRESENT" || attendanceDraft?.status === "ABSENT") {
          setMark(attendanceDraft.status);
        }
        if (attendanceDraft?.status === "CLEAR") {
          setMark(undefined);
        }
        if (noteDraft) {
          setNote(noteDraft.body);
        }
        await flushPendingLocalDrafts();
      } catch {
        // Local-first storage is best-effort.
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  async function saveMark(next: AttendanceMark) {
    const value = mark === next ? "CLEAR" : next;
    setMark(value === "CLEAR" ? undefined : next);
    await saveAttendanceDraft(sessionId, value);
    await syncAttendanceDraft(sessionId, value);
  }

  async function saveNote() {
    setSavingNote(true);
    setNoteSaved(false);
    try {
      await saveNoteDraft(sessionId, note);
      await syncNoteDraft(sessionId, note);
      setNoteSaved(true);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Attendance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mark this lecture for your private bunk planning.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void saveMark("PRESENT")}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors",
              mark === "PRESENT"
                ? "border-success bg-success text-success-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            <Check className="size-4" />
            Present
          </button>
          <button
            type="button"
            onClick={() => void saveMark("ABSENT")}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors",
              mark === "ABSENT"
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            <X className="size-4" />
            Absent
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Lecture notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick thoughts, doubts, assignment hints — keep it simple.
            </p>
          </div>
          {noteSaved ? (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              Saved
            </span>
          ) : null}
        </div>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteSaved(false);
          }}
          placeholder="What did the prof say that will definitely be on the quiz?"
          className="mt-4 min-h-40 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => void saveNote()}
          disabled={savingNote}
        >
          {savingNote ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save note
        </Button>
      </section>
    </div>
  );
}
