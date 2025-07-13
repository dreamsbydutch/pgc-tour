/**
 * NavItem Component
 *
 * Renders a navigation link with active state styling
 */

import Link from "next/link";
import { cn } from "@pgc-utils";

interface NavItemProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

export function NavItem({ href, isActive, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn("py-1 text-sm text-muted-foreground", {
        "text-secondary-foreground": isActive,
      })}
    >
      {children}
    </Link>
  );
}
