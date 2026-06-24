import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/roles";

export default async function AdminPage() {
  await requireRole(["ADMIN", "ACADEMIC_ADMIN"]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Academic admin"
        subtitle="Foundation ready: sheet links, holidays, notices, and sync health."
      />
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Admin tooling will build on the same terms, sheets, notices, and calendar models.
      </div>
    </main>
  );
}
