import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { compareSlots, getAcceptedFriends } from "@/lib/friends";
import { campusNow, getUserSessions } from "@/lib/schedule";
import { cn } from "@/lib/utils";

function stateLabel(state: string) {
  switch (state) {
    case "both_free":
      return "Both free";
    case "both_busy":
      return "Both busy";
    case "you_busy":
      return "You busy";
    case "friend_busy":
      return "Friend busy";
    default:
      return state;
  }
}

function stateClass(state: string) {
  switch (state) {
    case "both_free":
      return "bg-success/10 text-success";
    case "both_busy":
      return "bg-muted text-muted-foreground";
    case "you_busy":
    case "friend_busy":
      return "bg-warning/15 text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function FriendComparePage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const { friendId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const friend = (await getAcceptedFriends(session.id)).find(
    (f) => f.id === friendId,
  );
  if (!friend) notFound();

  const now = campusNow();
  const [mine, theirs] = await Promise.all([
    getUserSessions(session.id),
    getUserSessions(friend.id),
  ]);
  const slots = compareSlots(mine, theirs, now.ymd);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/friends">
          <ArrowLeft className="size-4" />
          Friends
        </Link>
      </Button>
      <PageHeader
        title={friend.name ?? friend.email.split("@")[0]}
        subtitle="Today’s free/busy comparison."
      />

      <div className="grid gap-2">
        {slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold">No classes on either side today</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Both free. Suspiciously productive.
            </p>
          </div>
        ) : (
          slots.map((slot) => (
            <div
              key={`${slot.start}-${slot.end}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {slot.start}–{slot.end}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You: {slot.mine ?? "free"} · Friend: {slot.theirs ?? "free"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  stateClass(slot.state),
                )}
              >
                {stateLabel(slot.state)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
