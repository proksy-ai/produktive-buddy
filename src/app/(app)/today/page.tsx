import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Today" };

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function TodayPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {todayLabel()}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </div>

      <Card className="bg-primary/5 border-primary/15">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Next up
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once your schedule is set up, your next class - with room and live
            status - shows here.
          </p>
        </CardContent>
      </Card>

      <EmptyState
        icon={CalendarClock}
        title="No schedule yet"
        description="Sign in with your institute email and load your courses to see your personalized day."
        action={<Button>Set up my schedule</Button>}
      />
    </div>
  );
}
