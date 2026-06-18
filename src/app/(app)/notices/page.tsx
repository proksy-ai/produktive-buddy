import { Bell } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Notices" };

export default function NoticesPage() {
  return (
    <div>
      <PageHeader
        title="Notices"
        subtitle="Placements, quizzes, and exams - with your personal seat."
      />
      <EmptyState
        icon={Bell}
        title="No notices yet"
        description="Placement meets, quizzes, and exam seating will appear here, highlighting your room and seat."
      />
    </div>
  );
}
