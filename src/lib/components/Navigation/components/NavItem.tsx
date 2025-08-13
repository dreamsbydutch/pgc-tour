/**
 * NavItem Component
 *
 * Renders a navigation link with active state styling, accessibility, and error handling
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { cn } from "@pgc-utils";

interface NavItemProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
  className?: string;
  onClick?: () => void;
}

export function NavItem({
  href,
  isActive,
  children,
  "aria-label": ariaLabel,
  className,
  onClick,
}: NavItemProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle navigation with error recovery
  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isNavigating) {
        e.preventDefault();
        return;
      }

      if (onClick) {
        onClick();
      }

      // For same page navigation, don't show loading state
      if (href === window.location.pathname) {
        return;
      }

      setIsNavigating(true);

      try {
        // Pre-fetch the route if it's not the current page
        if (href !== window.location.pathname) {
          router.prefetch(href);
        }
      } catch (error) {
        console.warn("Failed to prefetch route:", href, error);
      }

      // Reset loading state after a reasonable time
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
    },
    [href, isNavigating, onClick, router],
  );

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[55px] items-center justify-center rounded-md text-sm",
      )}
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      tabIndex={0}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className={cn(
          "inline-flex h-[45px] items-center justify-center rounded-md px-2 text-sm",
          isActive
            ? "bg-gray-900 text-white"
            : "bg-transparent text-gray-700 hover:bg-gray-900/10 hover:text-gray-900",
          {
            "pointer-events-none opacity-75": isNavigating,
          },
          className,
        )}
      >
        {children}
      </div>
    </Link>
  );
}
