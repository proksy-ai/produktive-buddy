import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/roles";
import { getRosterStats } from "@/modules/roster/application/roster-service";

import { RosterAdmin } from "./roster-admin";

export const metadata: Metadata = { title: "Roster" };

export default async function RosterPage() {
  await requireRole(["ADMIN", "ACADEMIC_ADMIN"]);
  const stats = await getRosterStats();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Student roster"
        subtitle="Import IIMK students and invite them to Produktive Buddy."
      />
      <RosterAdmin initialStats={stats} />
    </main>
  );
}
