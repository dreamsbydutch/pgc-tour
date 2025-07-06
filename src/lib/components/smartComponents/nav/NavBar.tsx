"use client";

import React from "react";
import { ArchiveIcon, BookText, Home, List, Trophy } from "lucide-react";
import { UserAccountNav } from "./UserAccount";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "../../ui/skeleton";
import { useHeaderUser } from "@/lib/providers/AuthProvider";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils/core";

// Move navItems outside component to prevent recreation on every render
const navItems = [
  { href: "/", icon: Home, label: "HOME" },
  { href: "/tournament", icon: List, label: "LEADERBOARD" },
  { href: "/standings", icon: Trophy, label: "STANDINGS" },
  { href: "/rulebook", icon: BookText, label: "RULEBOOK" },
  { href: "/history", icon: ArchiveIcon, label: "RECORDS" },
];

/**
 * MenuBar Component
 *
 * This component renders a responsive navigation bar that adapts to different screen sizes.
 * It includes:
 * - Navigation links for various sections of the application.
 * - User account management options (e.g., viewing account or signing out).
 * - A sign-in option for unauthenticated users.
 *
 * The navigation bar dynamically adjusts its layout for mobile and desktop views.
 *
 * Props:
 * - className (optional): Additional CSS classes to style the component.
 */
export default function NavBar({ className }: { className?: string }) {
  const userData = useHeaderUser();
  const pathName = usePathname();

  const { data: tourCards, isLoading: isLoadingTourCards } =
    api.tourCard.getByUserId.useQuery(
      {
        userId: userData?.member?.id ?? "",
      },
      {
        enabled: !!userData?.member?.id,
        retry: 3,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
    );

  return (
    <div
      className={cn(
        className,
        "shadow-inv fixed bottom-0 z-20 flex w-full items-center justify-evenly bg-gray-200 lg:top-0 lg:justify-center lg:gap-8 lg:px-4 lg:py-2 xl:gap-14",
        "h-[55px] text-center",
      )}
    >
      {navItems.map(({ href, icon: Icon, label }) => (
        <div key={href}>
          <div className="flex lg:hidden">
            <NavItem href={href} isActive={pathName === href}>
              <Icon size={"2.5rem"} className="mx-auto" />
            </NavItem>
          </div>
          <div className="hidden lg:flex">
            <NavItem href={href} isActive={pathName === href}>
              <div className="flex items-center justify-center gap-2">
                <Icon size={"1.5rem"} className="mx-auto" />
                <span className="font-barlow text-2xl font-semibold">
                  {label}
                </span>
              </div>
            </NavItem>
          </div>
        </div>
      ))}
      {isLoadingTourCards ? (
        <Skeleton
          className={`h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]`}
        />
      ) : (
        <UserAccountNav
          user={userData?.user ?? null}
          member={userData?.member ?? null}
          tourCards={tourCards ?? []}
        />
      )}
    </div>
  );
}

/**
 * NavItem Component
 *
 * This component renders a navigation link with active state styling.
 *
 * Props:
 * - href: The URL the navigation item links to.
 * - children: The content to display inside the navigation item (e.g., icon, label).
 */
export function NavItem({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn("py-1 text-sm text-muted-foreground", {
        "text-secondary-foreground": isActive, // Apply active styling
      })}
    >
      {children}
    </Link>
  );
}
