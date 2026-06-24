import { randomBytes } from "node:crypto";

import { compareSlotsForDate } from "@/features/social/free-busy";
import { db } from "@/lib/db";
import { campusNow, getUserSessions, type ClassSession } from "@/lib/schedule";

export interface FriendSummary {
  id: string;
  name: string;
  email: string;
  statusNow: "free" | "busy";
  currentClass: string | null;
}

function code(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

export async function ensureFriendCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { friendCode: true },
  });
  if (user?.friendCode) return user.friendCode;

  for (let i = 0; i < 5; i++) {
    const friendCode = code();
    try {
      const updated = await db.user.update({
        where: { id: userId },
        data: { friendCode },
        select: { friendCode: true },
      });
      return updated.friendCode!;
    } catch {
      // Rare collision; retry.
    }
  }
  throw new Error("Could not create friend code");
}

export async function getAcceptedFriends(
  userId: string,
): Promise<{ id: string; name: string | null; email: string }[]> {
  const rows = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ fromId: userId }, { toId: userId }],
    },
    include: {
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
  });

  return rows.map((r) => (r.fromId === userId ? r.to : r.from));
}

function currentClass(
  sessions: ClassSession[],
  now: { ymd: string; hm: string },
): ClassSession | null {
  return (
    sessions.find(
      (s) =>
        s.status !== "CANCELLED" &&
        s.date === now.ymd &&
        s.startTime <= now.hm &&
        s.endTime > now.hm,
    ) ?? null
  );
}

export async function getFriendSummaries(userId: string): Promise<FriendSummary[]> {
  const friends = await getAcceptedFriends(userId);
  const now = campusNow();
  return Promise.all(
    friends.map(async (friend) => {
      const klass = currentClass(await getUserSessions(friend.id), now);
      return {
        id: friend.id,
        name: friend.name ?? friend.email.split("@")[0],
        email: friend.email,
        statusNow: klass ? "busy" : "free",
        currentClass: klass?.courseName ?? null,
      };
    }),
  );
}

export function compareSlots(
  mine: ClassSession[],
  theirs: ClassSession[],
  date: string,
) {
  return compareSlotsForDate(mine, theirs, date);
}
