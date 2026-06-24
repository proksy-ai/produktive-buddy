import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth/session";
import { firstName } from "@/lib/onboarding";
import { BRAND } from "@/lib/brand";

export async function AppHeader() {
  const session = await getSession();
  const greeting = firstName(session?.name ?? null);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background pt-safe">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          href="/today"
          className="flex items-center gap-2"
          aria-label={`${BRAND.name} home`}
        >
          <span className="flex size-7 items-center justify-center rounded-md border-2 border-foreground bg-accent text-xs font-extrabold text-accent-foreground shadow-nb-sm">
            {BRAND.shortName.charAt(0)}
          </span>
          <span className="text-sm font-bold tracking-tight">
            {greeting ? `For ${greeting}` : BRAND.name}
          </span>
        </Link>
        <div className="min-w-0 flex-1" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? null : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
