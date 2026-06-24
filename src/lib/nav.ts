import {
  BookOpen,
  CalendarDays,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary navigation surfaces. Order matters: this is the tab/rail order. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Now", icon: Sparkles },
  { href: "/schedule", label: "Plan", icon: CalendarDays },
  { href: "/courses", label: "Subjects", icon: BookOpen },
  { href: "/more", label: "Me", icon: UserRound },
];
