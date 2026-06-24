import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GroupMemberPanel } from "@/components/app/group-member-panel";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { campusNow, getUserSessions, type ClassSession } from "@/lib/schedule";
import { cn } from "@/lib/utils";

function busyAt(sessions: ClassSession[], date: string, start: string, end: string) {
  return sessions.find(
    (s) =>
      s.status !== "CANCELLED" &&
      s.status !== "REMOVED" &&
      s.date === date &&
      s.startTime < end &&
      s.endTime > start,
  );
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const auth = await getSession();
  if (!auth) redirect("/login");

  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId: auth.id, status: "ACTIVE" } },
    },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!group) notFound();

  const now = campusNow();
  const schedules = await Promise.all(
    group.members.map(async (m) => ({
      user: m.user,
      sessions: await getUserSessions(m.userId),
    })),
  );

  const boundaries = Array.from(
    new Set(
      schedules.flatMap((s) =>
        s.sessions
          .filter(
            (klass) =>
              klass.date === now.ymd &&
              klass.status !== "CANCELLED" &&
              klass.status !== "REMOVED",
          )
          .flatMap((klass) => [klass.startTime, klass.endTime]),
      ),
    ),
  ).sort();
  const slots = boundaries.slice(0, -1).map((start, i) => ({
    start,
    end: boundaries[i + 1],
  }));

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/groups">
          <ArrowLeft className="size-4" />
          Groups
        </Link>
      </Button>
      <PageHeader
        title={group.name}
        subtitle={`${group.kind.toLowerCase()} · ${group.members.length} members · today`}
      />
      <GroupMemberPanel groupId={group.id} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Free/busy matrix</h2>
        {slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold">Everyone looks free today</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Either that or the sheet is being suspiciously kind.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const states = schedules.map((entry) => ({
                user: entry.user,
                busy: busyAt(entry.sessions, now.ymd, slot.start, slot.end),
              }));
              const free = states.filter((s) => !s.busy).length;
              const allFree = free === states.length;
              const allBusy = free === 0;
              return (
                <div
                  key={`${slot.start}-${slot.end}`}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold tabular-nums">
                      {slot.start}–{slot.end}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        allFree
                          ? "bg-success/10 text-success"
                          : allBusy
                            ? "bg-muted text-muted-foreground"
                            : "bg-warning/15 text-warning-foreground",
                      )}
                    >
                      {allFree ? "All free" : allBusy ? "All busy" : `${free} free`}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {states.map(({ user, busy }) => (
                      <span
                        key={user.id}
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          busy
                            ? "bg-muted text-muted-foreground"
                            : "bg-success/10 text-success",
                        )}
                      >
                        {user.name ?? user.email.split("@")[0]}
                        {busy ? ` · ${busy.courseAbbr}` : " · free"}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
