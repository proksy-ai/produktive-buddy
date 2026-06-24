"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BRAND } from "@/lib/brand";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-52 shrink-0 flex-col gap-1 px-3 py-5 md:flex",
        className,
      )}
    >
      <Link
        href="/today"
        className="mb-6 flex items-center gap-2.5 px-3 py-1"
        aria-label={`${BRAND.name} home`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {BRAND.shortName.charAt(0)}
        </span>
        <span className="text-sm font-medium tracking-tight">
          {BRAND.name}
        </span>
      </Link>

      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition-colors",
                    active
                      ? "border-2 border-foreground bg-accent text-accent-foreground shadow-nb-sm"
                      : "border-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
