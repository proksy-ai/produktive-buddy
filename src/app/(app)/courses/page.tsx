import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Your enrolled courses, faculty, and attendance."
      />
      <EmptyState
        icon={BookOpen}
        title="No courses loaded"
        description="Upload your EDTEX confirmed-courses PDF or pick your courses to get started."
      />
    </div>
  );
}
