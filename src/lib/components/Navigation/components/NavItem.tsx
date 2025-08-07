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
        "rounded-sm py-1 text-sm text-muted-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        {
          "text-secondary-foreground": isActive,
          "pointer-events-none opacity-75": isNavigating,
        },
        className,
      )}
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      tabIndex={0}
    >
      {children}
    </Link>
  );
}
