import {
  Bus,
  ChevronRight,
  Settings,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Card } from "@/components/ui/card";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "More" };

const ITEMS: { label: string; description: string; icon: LucideIcon }[] = [
  {
    label: "Mess menu",
    description: "Month-wise menu",
    icon: UtensilsCrossed,
  },
  { label: "Bus timings", description: "Campus shuttle schedule", icon: Bus },
  {
    label: "Friends",
    description: "Compare timetables, find common free time",
    icon: Users,
  },
  { label: "Settings", description: "Account, theme, notifications", icon: Settings },
];

export default function MorePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="More" subtitle="Campus services and settings." />

      <InstallPrompt />

      <Card className="divide-y divide-border overflow-hidden p-0">
        {ITEMS.map(({ label, description, icon: Icon }) => (
          <button
            key={label}
            type="button"
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
          </button>
        ))}
      </Card>

      <p className="px-1 text-center text-xs text-muted-foreground">
        {BRAND.name} - {BRAND.college}
      </p>
    </div>
  );
}
