import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SideNav } from "@/components/nav/side-nav";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { onboardingCompletedAt: true, name: true },
    });
    if (user && !(user.onboardingCompletedAt && user.name?.trim())) {
      redirect("/onboarding");
    }
  }

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
