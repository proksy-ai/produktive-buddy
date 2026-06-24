import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/roles";

export default async function FacultyPage() {
  await requireRole(["FACULTY", "ADMIN", "ACADEMIC_ADMIN"]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Faculty dashboard"
        subtitle="Foundation ready: lectures, enrolled students, and official attendance come next."
      />
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Official attendance will live here, separate from student self-tracking.
      </div>
    </main>
  );
}
