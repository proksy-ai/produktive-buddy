import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Menu,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary navigation surfaces. Order matters: this is the tab/rail order. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: CalendarClock },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/more", label: "More", icon: Menu },
];
