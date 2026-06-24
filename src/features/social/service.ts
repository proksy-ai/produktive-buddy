import type { GroupKind } from "@prisma/client";

import { db } from "@/lib/db";

export async function addFriendByCode(userId: string, rawCode: string) {
  const target = await db.user.findUnique({
    where: { friendCode: rawCode.trim().toUpperCase() },
    select: { id: true, name: true, email: true },
  });
  if (!target || target.id === userId) throw new Error("Friend code not found.");

  const [fromId, toId] = [userId, target.id].sort();
  await db.friendship.upsert({
    where: { fromId_toId: { fromId, toId } },
    create: {
      fromId,
      toId,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
    update: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  return target;
}

export async function createGroup(
  ownerId: string,
  input: { name: string; kind: GroupKind },
) {
  return db.group.create({
    data: {
      name: input.name.trim(),
      kind: input.kind,
      ownerId,
      members: {
        create: { userId: ownerId, role: "OWNER", status: "ACTIVE" },
      },
    },
    select: { id: true, name: true, kind: true },
  });
}

export async function addGroupMemberByCode(
  actorId: string,
  groupId: string,
  rawCode: string,
) {
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId: actorId, status: "ACTIVE" } },
    },
    select: { id: true },
  });
  if (!group) throw new Error("Group not found.");

  const user = await db.user.findUnique({
    where: { friendCode: rawCode.trim().toUpperCase() },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new Error("Friend code not found.");

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: user.id } },
    create: { groupId, userId: user.id, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  return user;
}
