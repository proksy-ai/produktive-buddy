import type { ReactNode } from "react";

import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SideNav } from "@/components/nav/side-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <SideNav />
      <div className="flex min-h-dvh w-full min-w-0 flex-col md:border-x md:border-border">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:px-6 md:pb-10">
          {children}
        </main>
        <BottomNav className="md:hidden" />
      </div>
    </div>
  );
}
