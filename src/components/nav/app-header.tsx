import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { firstName } from "@/lib/onboarding";
import { BRAND } from "@/lib/brand";

export async function AppHeader() {
  const session = await getSession();
  const greeting = firstName(session?.name ?? null);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg pt-safe">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link
          href="/today"
          className="flex items-center gap-2 md:hidden"
          aria-label={`${BRAND.name} home`}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {BRAND.shortName.charAt(0)}
          </span>
          <span className="text-base font-semibold tracking-tight">
            {greeting ? `Hi, ${greeting}` : BRAND.name}
          </span>
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">
          {session && (
            <p className="truncate text-xs text-muted-foreground">
              {greeting ? `${greeting} · ` : ""}
              {session.batchLabel} · {session.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/api/auth/logout">Sign out</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
