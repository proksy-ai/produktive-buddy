import {
  CalendarDays,
  ChevronRight,
  LogOut,
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
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Me" };

const ITEMS: { label: string; description: string; icon: LucideIcon; href?: string }[] = [
  {
    label: "Campus",
    description: "Mess, shuttle, contacts",
    icon: UtensilsCrossed,
    href: "/campus",
  },
  {
    label: "Calendar",
    description: "Academic dates and vacation impact",
    icon: CalendarDays,
    href: "/calendar",
  },
  {
    label: "People",
    description: "Friends and groups, when you need them",
    icon: Users,
    href: "/friends",
  },
];

export default async function MorePage() {
  const session = await getSession();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Me"
        subtitle={
          session?.batchLabel
            ? `${session.batchLabel} · controls and quiet extras`
            : "Controls and quiet extras"
        }
      />

      <InstallPrompt />

      <section className="space-y-3">
        <NotificationToggle />
        <AddToCalendar />
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
        <form method="post" action="/api/auth/logout">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <LogOut className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Sign out</span>
              <span className="block text-xs text-muted-foreground">
                Leave this device
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </form>
      </Card>

      <p className="px-1 text-center text-xs text-muted-foreground">
        {BRAND.name} - {BRAND.college}
      </p>
    </div>
  );
}
