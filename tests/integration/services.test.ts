import { describe, expect, it } from "vitest";

import { markStudentAttendance } from "@/features/attendance/service";
import { addFriendByCode, createGroup } from "@/features/social/service";
import { db } from "@/lib/db";

async function seededUser() {
  const user = await db.user.findFirst({
    where: { email: "mba25piyushj@iimk.ac.in" },
    select: { id: true, activeTermId: true },
  });
  if (!user?.activeTermId) throw new Error("Seeded test user missing");
  return { id: user.id, activeTermId: user.activeTermId };
}

describe("service integration", () => {
  it("marks and clears attendance for an owned active-term class", async () => {
    const user = await seededUser();
    const klass = await db.session.findFirstOrThrow({
      where: { termId: user.activeTermId },
      select: { id: true },
    });

    await expect(markStudentAttendance(user.id, klass.id, "ABSENT")).resolves.toBe(
      "ABSENT",
    );
    await expect(markStudentAttendance(user.id, klass.id, "CLEAR")).resolves.toBe(
      null,
    );
  });

  it("creates a group with the owner as an active member", async () => {
    const user = await seededUser();
    const group = await createGroup(user.id, {
      name: `Integration Group ${Date.now()}`,
      kind: "CLUB",
    });
    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    });
    expect(member?.role).toBe("OWNER");
    await db.group.delete({ where: { id: group.id } });
  });

  it("adds a friend by code", async () => {
    const user = await seededUser();
    const friend = await db.user.upsert({
      where: { email: "integration-friend@iimk.ac.in" },
      create: {
        email: "integration-friend@iimk.ac.in",
        name: "Integration Friend",
        friendCode: `IF${Date.now().toString(36).slice(-6).toUpperCase()}`,
        batchId: (await db.batch.findFirstOrThrow()).id,
      },
      update: {
        friendCode: `IF${Date.now().toString(36).slice(-6).toUpperCase()}`,
      },
      select: { id: true, friendCode: true },
    });

    const added = await addFriendByCode(user.id, friend.friendCode!);
    expect(added.id).toBe(friend.id);
  });
});
