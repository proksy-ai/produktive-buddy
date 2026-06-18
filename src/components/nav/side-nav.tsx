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
        "sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-border px-3 py-5 md:flex",
        className,
      )}
    >
      <Link
        href="/today"
        className="mb-4 flex items-center gap-2.5 px-3 py-1"
        aria-label={`${BRAND.name} home`}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          {BRAND.shortName.charAt(0)}
        </span>
        <span className="text-base font-semibold tracking-tight">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
