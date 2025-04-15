"use client"; // Indicates that this is a client-side component

import { BookText, Home, List, LogInIcon, Trophy } from "lucide-react"; // Importing icons from the lucide-react library
import { cn } from "@/src/lib/utils"; // Utility function for conditional class names
import { useUser } from "@/src/lib/hooks/use-user"; // Hook to fetch user data
import { Skeleton } from "../ui/skeleton"; // Skeleton loader for loading states
import { UserAccountNav } from "./UserAccount"; // User account navigation component
import { useState } from "react"; // React hook for managing state
import LoadingSpinner from "../LoadingSpinner"; // Loading spinner component
import { signInWithGoogle } from "../../signin/actions"; // Function to handle Google sign-in
import Link from "next/link";
import { usePathname } from "next/navigation";

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
export default function MenuBar({ className }: { className?: string }) {
  const { user, loading } = useUser(); // Fetch user data and loading state
  const member = user?.user_metadata; // Extract member data from user metadata
  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const fullName: string | undefined = member?.full_name; // Get the full name of the member
  //eslint-disable-next-line @typescript-eslint/no-unsafe-call
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const firstName: string | undefined = fullName?.split(" ")[0]; // Extract first name from full name
  //eslint-disable-next-line @typescript-eslint/no-unsafe-call
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const lastName: string | undefined = fullName?.split(" ").slice(-1)[0]; // Extract last name from full name
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false); // State for Google sign-in loading
  const [isSigningOut, setIsSigningOut] = useState(false); // State for sign-out process

  // Configuration for navigation items
  const navItems = [
    { href: "/", icon: Home, label: "HOME" },
    { href: "/tournament", icon: List, label: "LEADERBOARD" },
    { href: "/standings", icon: Trophy, label: "STANDINGS" },
    { href: "/rulebook", icon: BookText, label: "RULEBOOK" },
    // { href: "/history", icon: ArchiveIcon, label: "RECORDS" },
  ];

  /**
   * UserActions Component
   *
   * This component handles the display of user-related actions:
   * - Shows a loading skeleton while user data is being fetched.
   * - Displays the user's account navigation if authenticated.
   * - Provides a sign-in button for unauthenticated users.
   */
  const UserActions = () => (
    <>
      <div className="flex lg:hidden">
        <div className="flex min-w-[2.5rem] items-center justify-center">
          {loading || isSigningOut ? (
            <Skeleton className="h-[2.5rem] w-[2.5rem] rounded-full" />
          ) : user ? (
            <UserAccountNav {...{ user, setIsSigningOut }} />
          ) : (
            <div onClick={() => signInWithGoogle({ setIsGoogleLoading })}>
              {isGoogleLoading ? (
                <LoadingSpinner />
              ) : (
                <LogInIcon size={"2.25rem"} className="mx-auto" />
              )}
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:flex">
        {loading || isSigningOut ? (
          <Skeleton className="h-[1.5rem] w-[1.5rem] rounded-full" />
        ) : user ? (
          <NavItem href={"/user/" + user.id}>
            <div className="flex items-center justify-center gap-2">
              <UserAccountNav {...{ user, size: "small", setIsSigningOut }} />
              <span className="font-barlow text-2xl font-semibold">
                {firstName[0] + ". " + lastName || "User"}
              </span>
            </div>
          </NavItem>
        ) : (
          <div onClick={() => signInWithGoogle({ setIsGoogleLoading })}>
            {isGoogleLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogInIcon size={"1.5rem"} className="mx-auto" />
                <span className="font-barlow text-2xl font-semibold">
                  LOG IN
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        className,
        // Responsive styling for the navigation bar
        "shadow-inv fixed bottom-0 z-20 flex w-full items-center justify-evenly bg-gray-200 lg:top-0 lg:justify-center lg:gap-8 lg:px-4 lg:py-2 xl:gap-14",
        "h-[55px] text-center",
      )}
    >
      {/* Render Navigation Items */}
      {navItems.map(({ href, icon: Icon, label }) => (
        <div key={href}>
          <div className="flex lg:hidden">
            <NavItem href={href}>
              <Icon size={"2.5rem"} className="mx-auto" />
            </NavItem>
          </div>
          <div className="hidden lg:flex">
            <NavItem href={href}>
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

      {/* User Account or Sign-In */}
      <UserActions />
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
type NavItemProps = {
  href: string;
  children: React.ReactNode;
};

export function NavItem({ href, children }: NavItemProps) {
  const pathname = usePathname(); // Get the current pathname
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href); // Determine if the link is active

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
