"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  children: React.ReactNode;
};

export function NavItem({ href, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const searchParamString = "?" + useSearchParams().toString();

  return (
    <Link
      href={href + searchParamString}
      className={cn("text-sm text-muted-foreground", {
        "text-secondary-foreground": isActive,
      })}
    >
      {children}
    </Link>
  );
}
