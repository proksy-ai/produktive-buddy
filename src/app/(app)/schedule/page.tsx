import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Day and week views with live cancellation and reschedule status."
      />
      <EmptyState
        icon={CalendarDays}
        title="Your timetable will live here"
        description="A clean Day/Week view of your classes, color-coded when something is cancelled or rescheduled."
      />
    </div>
  );
}
