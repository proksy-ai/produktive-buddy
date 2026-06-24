import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/roles";

export default async function AdminPage() {
  await requireRole(["ADMIN", "ACADEMIC_ADMIN"]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Academic admin"
        subtitle="Invite students, manage sheets, holidays, and sync health."
      />
      <Link
        href="/admin/roster"
        className="flex items-center justify-between rounded-md border-2 border-foreground bg-card p-5 shadow-nb transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-nb-lg"
      >
        <span>
          <span className="block text-sm font-bold">Student roster &amp; invites</span>
          <span className="block text-xs text-muted-foreground">
            Import IIMK students and email them an invite to the app.
          </span>
        </span>
        <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
