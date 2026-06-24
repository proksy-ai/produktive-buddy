import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FriendsPanel } from "@/components/app/friends-panel";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { ensureFriendCode, getFriendSummaries } from "@/lib/friends";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [friendCode, friends] = await Promise.all([
    ensureFriendCode(session.id),
    getFriendSummaries(session.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Friends"
        subtitle="Compare schedules without the “are you free?” spam."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/groups">Groups</Link>
          </Button>
        }
      />
      <FriendsPanel friendCode={friendCode} initialFriends={friends} />
    </div>
  );
}
