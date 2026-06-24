import { MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { courseAccent } from "@/lib/colors";
import type { ClassSession } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  ClassSession["status"],
  { label: string | null; dot: string; text: string }
> = {
  SCHEDULED: { label: null, dot: "bg-primary", text: "" },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  ADDED: {
    label: "Added",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  REMOVED: {
    label: "Removed",
    dot: "bg-muted",
    text: "text-muted-foreground",
  },
};

const KIND_LABELS: Record<ClassSession["kind"], string> = {
  CLASS: "Class",
  TUTORIAL: "Tutorial",
  QUIZ: "Quiz",
  EXAM: "Exam",
  GUEST_LECTURE: "Guest",
  WORKSHOP: "Workshop",
  MEETING: "Meeting",
  OTHER: "Other",
};

export function SessionRow({
  session,
  action,
}: {
  session: ClassSession;
  action?: ReactNode;
}) {
  const style = STATUS_STYLES[session.status];
  const inactive = session.status === "CANCELLED" || session.status === "REMOVED";
  const accent = courseAccent(session.colorKey);

  return (
    <div className="flex gap-3">
      <div className="flex w-14 shrink-0 flex-col items-end pt-0.5">
        <span className="text-sm font-medium tabular-nums">
          {session.startTime}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {session.endTime}
        </span>
      </div>

      <div className="relative flex flex-col items-center">
        <span
          className="mt-1.5 size-2.5 rounded-full ring-2 ring-background"
          style={{ background: inactive ? "var(--color-muted)" : accent }}
        />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pb-4">
        <Link href={`/classes/${session.id}`} className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              "hover:text-primary",
              inactive && "text-muted-foreground line-through",
            )}
          >
            {session.courseName}
            {session.sectionCode ? (
              <span className="text-muted-foreground">
                {" "}
                · {session.sectionCode}
              </span>
            ) : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span
              className="rounded px-1.5 py-0.5 font-medium"
              style={{
                color: accent,
                background: `color-mix(in oklch, ${accent} 14%, transparent)`,
              }}
            >
              {session.courseAbbr}
            </span>
            {session.kind !== "CLASS" ? (
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                {KIND_LABELS[session.kind]}
              </span>
            ) : null}
            {session.room ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {session.room}
              </span>
            ) : null}
            {style.label ? (
              <span className={cn("font-medium", style.text)}>
                {style.label}
              </span>
            ) : null}
          </div>
        </Link>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
