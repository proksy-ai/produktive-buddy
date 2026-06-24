import {
  Bus,
  CalendarDays,
  ChevronRight,
  Clock3,
  MessageCircle,
  Settings,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AddToCalendar } from "@/components/app/add-to-calendar";
import { NotificationToggle } from "@/components/app/notification-toggle";
import { PageHeader } from "@/components/app/page-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Card } from "@/components/ui/card";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "More" };

const FEATURE_LAB: {
  label: string;
  description: string;
  status: "Live" | "Building" | "Next" | "Soon";
  icon: LucideIcon;
}[] = [
  {
    label: "Live schedule alerts",
    description: "Push alerts, calendar sync, attendance, and cancellations.",
    status: "Live",
    icon: CalendarDays,
  },
  {
    label: "Exam seats",
    description: "Upload notices, find your room and seat without the PDF hunt.",
    status: "Building",
    icon: Sparkles,
  },
  {
    label: "Friends",
    description: "Compare timetables and find common free slots.",
    status: "Next",
    icon: Users,
  },
  {
    label: "Campus essentials",
    description: "Mess menu, shuttle timings, and quick campus info.",
    status: "Soon",
    icon: Clock3,
  },
];

const ITEMS: { label: string; description: string; icon: LucideIcon; href?: string }[] = [
  {
    label: "Academic calendar",
    description: "Holidays and vacation planning",
    icon: CalendarDays,
    href: "/calendar",
  },
  {
    label: "Groups",
    description: "Club and team free/busy matrix",
    icon: Users,
    href: "/groups",
  },
  {
    label: "Mess menu",
    description: "Month-wise menu — soon",
    icon: UtensilsCrossed,
  },
  { label: "Bus timings", description: "Campus shuttle schedule — soon", icon: Bus },
  {
    label: "Friends",
    description: "Compare timetables, find common free time — next",
    icon: Users,
  },
  {
    label: "Feedback",
    description: "Tell us what's cooked, what's cooking, what's burnt",
    icon: MessageCircle,
  },
  { label: "Settings", description: "Account, theme, notifications", icon: Settings },
];

function statusClass(status: (typeof FEATURE_LAB)[number]["status"]) {
  switch (status) {
    case "Live":
      return "bg-success/12 text-success";
    case "Building":
      return "bg-primary/12 text-primary";
    case "Next":
      return "bg-warning/15 text-warning-foreground";
    case "Soon":
      return "bg-muted text-muted-foreground";
  }
}

export default function MorePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="More"
        subtitle="The useful stuff, minus the campus-app clutter."
      />

      <InstallPrompt />

      <NotificationToggle />

      <AddToCalendar />

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Feature Lab</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What works today, and what ships next.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURE_LAB.map(({ label, description, status, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    statusClass(status),
                  )}
                >
                  {status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Card className="divide-y divide-border overflow-hidden p-0">
        {ITEMS.map(({ label, description, icon: Icon, href }) => {
          const Comp = href ? Link : "button";
          return (
          <Comp
            key={label}
            href={href as never}
            type={href ? undefined : "button"}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Comp>
        );
        })}
      </Card>

      <p className="px-1 text-center text-xs text-muted-foreground">
        {BRAND.name} - {BRAND.college}
      </p>
    </div>
  );
}
