/**
 * NavigationContainer Component
 *
 * Main navigation bar with responsive design
 */

"use client";

import { usePathname } from "next/navigation";
import { cn } from "@pgc-utils";
import { NavItem } from "./NavItem";
import { UserAccountNav } from "./UserAccountNav";
import { useNavigationData } from "../hooks/useNavigationData";
import { NAV_ITEMS, isNavItemActive } from "../utils";
import type { NavigationContainerProps } from "../types";

export function NavigationContainer({ className }: NavigationContainerProps) {
  const pathname = usePathname();
  const navigationData = useNavigationData();

  return (
    <div
      className={cn(
        className,
        "shadow-inv fixed bottom-0 z-20 flex w-full items-center justify-evenly bg-gray-200 lg:top-0 lg:justify-center lg:gap-8 lg:px-4 lg:py-2 xl:gap-14",
        "h-[55px] text-center",
      )}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
        <div key={href}>
          {/* Mobile Navigation */}
          <div className="flex lg:hidden">
            <NavItem href={href} isActive={isNavItemActive(href, pathname)}>
              <Icon size="2.5rem" className="mx-auto" />
            </NavItem>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavItem href={href} isActive={isNavItemActive(href, pathname)}>
              <div className="flex items-center justify-center gap-2">
                <Icon size="1.5rem" className="mx-auto" />
                <span className="font-barlow text-2xl font-semibold">
                  {label}
                </span>
              </div>
            </NavItem>
          </div>
        </div>
      ))}

      {/* User Account Section */}
      <UserAccountNav navigationData={navigationData} />
    </div>
  );
}
