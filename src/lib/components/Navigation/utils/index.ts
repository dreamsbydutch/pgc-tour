/**
 * Navigation utilities
 */

import { BookText, Home, List, Trophy } from "lucide-react";
import type { NavItem } from "../types";

/**
 * Navigation items configuration
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: Home, label: "HOME" },
  { href: "/tournament", icon: List, label: "LEADERBOARD" },
  { href: "/standings", icon: Trophy, label: "STANDINGS" },
  { href: "/rulebook", icon: BookText, label: "RULEBOOK" },
];

/**
 * Check if a navigation item is active based on current pathname
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

/**
 * Format user display name
 */
export function formatUserDisplayName(
  firstname: string | null,
  lastname: string | null,
): string {
  if (!firstname && !lastname) return "User";
  return `${firstname || ""} ${lastname || ""}`.trim();
}
