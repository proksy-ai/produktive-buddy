import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupsPanel, type GroupListItem } from "@/components/app/groups-panel";
import { PageHeader } from "@/components/app/page-header";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const groups = await db.group.findMany({
    where: { members: { some: { userId: session.id, status: "ACTIVE" } } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  const items: GroupListItem[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    kind: g.kind,
    count: g._count.members,
  }));

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle="Clubs, committees, teams — find a meeting slot without the spam."
      />
      <GroupsPanel initialGroups={items} />
    </div>
  );
}
