"use client";

import { BookText, Home, List, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@pgc-utils";
import { Skeleton } from "@pgc-ui";
import { useAuthData } from "src/lib/hooks/hooks";
import { UserAccountNav } from "./UserAccount";

// Move navItems outside component to prevent recreation on every render
const navItems = [
  { href: "/", icon: Home, label: "HOME" },
  { href: "/tournament", icon: List, label: "LEADERBOARD" },
  { href: "/standings", icon: Trophy, label: "STANDINGS" },
  { href: "/rulebook", icon: BookText, label: "RULEBOOK" },
  // { href: "/history", icon: ArchiveIcon, label: "RECORDS" },
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
  const pathName = usePathname();
  const { user, member, tourCards, isLoading } = useAuthData();

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
            <NavItem
              href={href}
              isActive={
                href === "/" ? pathName === href : pathName.startsWith(href)
              }
            >
              <Icon size={"2.5rem"} className="mx-auto" />
            </NavItem>
          </div>
          <div className="hidden lg:flex">
            <NavItem
              href={href}
              isActive={
                href === "/" ? pathName === href : pathName.startsWith(href)
              }
            >
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
      {isLoading ? (
        <Skeleton
          className={`h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]`}
        />
      ) : (
        <UserAccountNav
          user={user}
          member={member}
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
function NavItem({
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
