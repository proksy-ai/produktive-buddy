"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-background pb-safe",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-6xl items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-bold"
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-md border-2 transition-colors",
                    active
                      ? "border-foreground bg-accent text-accent-foreground shadow-nb-sm"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className={active ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
