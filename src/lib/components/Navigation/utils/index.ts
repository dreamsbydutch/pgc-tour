/**
 * Navigation utilities
 */

import { BookText, Home, List, Trophy } from "lucide-react";
import type { NavItem, NavigationError } from "./types";

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
  if (!href || !pathname) return false;
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

/**
 * Format user display name with fallback handling
 */
export function formatUserDisplayName(
  firstname: string | null,
  lastname: string | null,
): string {
  const first = firstname?.trim() ?? "";
  const last = lastname?.trim() ?? "";

  if (!first && !last) return "User";
  return `${first} ${last}`.trim();
}

/**
 * Create navigation error with consistent structure
 */
export function createNavigationError(
  code: string,
  message: string,
  retry?: () => void,
): NavigationError {
  return { code, message, retry };
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("offline")
  );
}

/**
 * Calculate exponential backoff delay
 */
export function getRetryDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Safe array aggregation with fallback
 */
export function safeAggregate<T>(
  array: T[] | undefined | null,
  reducer: (acc: number, item: T) => number,
  initialValue: number = 0,
): number {
  if (!Array.isArray(array)) return initialValue;

  try {
    return array.reduce(reducer, initialValue);
  } catch (error) {
    console.warn("Error during array aggregation:", error);
    return initialValue;
  }
}
