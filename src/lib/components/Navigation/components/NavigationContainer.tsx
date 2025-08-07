/**
 * NavigationContainer Component
 *
 * Main navigation bar with responsive design, error handling, and accessibility
 */

"use client";

import { usePathname } from "next/navigation";
import { Suspense, useMemo } from "react";
import { cn } from "@pgc-utils";
import { NavItem } from "./NavItem";
import { UserAccountNav } from "./UserAccountNav";
import { ErrorBoundary } from "./EnhancedErrorBoundary";
import { useNavigationData } from "../hooks/useNavigationData";
import { NAV_ITEMS, isNavItemActive } from "../utils";
import type { NavigationContainerProps } from "../utils/types";

export function NavigationContainer({ className }: NavigationContainerProps) {
  const pathname = usePathname();
  const navigationData = useNavigationData();

  // Memoize navigation items to prevent unnecessary re-renders
  const navItems = useMemo(() => {
    return NAV_ITEMS.map(({ href, icon: Icon, label }) => {
      const isActive = isNavItemActive(href, pathname);
      return {
        href,
        Icon,
        label,
        isActive,
        key: href, // Stable key for React
      };
    });
  }, [pathname]);

  return (
    <ErrorBoundary fallback={<NavigationFallback />}>
      <nav
        className={cn(
          className,
          "shadow-inv fixed bottom-0 z-20 flex w-full items-center justify-evenly bg-gray-200 lg:top-0 lg:justify-center lg:gap-8 lg:px-4 lg:py-2 xl:gap-14",
          "h-[55px] text-center",
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, Icon, label, isActive, key }) => (
          <div key={key}>
            {/* Mobile Navigation */}
            <div className="flex lg:hidden">
              <NavItem
                href={href}
                isActive={isActive}
                aria-label={`Navigate to ${label}`}
              >
                <Icon size="2.5rem" className="mx-auto" aria-hidden="true" />
              </NavItem>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex">
              <NavItem
                href={href}
                isActive={isActive}
                aria-label={`Navigate to ${label}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon size="1.5rem" className="mx-auto" aria-hidden="true" />
                  <span className="font-barlow text-2xl font-semibold">
                    {label}
                  </span>
                </div>
              </NavItem>
            </div>
          </div>
        ))}

        {/* User Account Section */}
        <Suspense fallback={<UserAccountSkeleton />}>
          <UserAccountNav navigationData={navigationData} />
        </Suspense>
      </nav>
    </ErrorBoundary>
  );
}

/**
 * Fallback component for navigation errors
 */
function NavigationFallback() {
  return (
    <div
      className="shadow-inv fixed bottom-0 z-20 flex h-[55px] w-full items-center justify-center bg-gray-200 text-center lg:top-0"
      role="navigation"
      aria-label="Navigation unavailable"
    >
      <div className="text-sm text-gray-600">
        Navigation temporarily unavailable
      </div>
    </div>
  );
}

/**
 * Loading skeleton for user account section
 */
function UserAccountSkeleton() {
  return (
    <div className="flex min-w-[2.5rem] items-center justify-center">
      <div className="h-[2.5rem] w-[2.5rem] animate-pulse rounded-full bg-gray-300" />
    </div>
  );
}
