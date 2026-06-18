import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";

import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <CalendarClock className="size-7" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">You&rsquo;re offline</h1>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {BRAND.name} needs a connection to load the latest schedule. Your
          last-viewed pages still work - reconnect to sync changes.
        </p>
      </div>
    </main>
  );
}
