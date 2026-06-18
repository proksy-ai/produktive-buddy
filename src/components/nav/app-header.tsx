import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export function AppHeader() {
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
            {BRAND.name}
          </span>
        </Link>
        {/* Spacer keeps the toggle right-aligned on desktop where brand is hidden. */}
        <div className="hidden md:block" aria-hidden />
        <ThemeToggle />
      </div>
    </header>
  );
}
