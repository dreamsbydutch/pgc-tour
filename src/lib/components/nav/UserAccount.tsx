"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { LogInIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Skeleton,
} from "@pgc-ui";
import { useInstallPWA, LittleFucker } from "@pgc-components";
import { useRouter } from "next/navigation";
import { formatMoney, formatNumber } from "@pgc-utils";
import { handleLogout, signInWithGoogle } from "@app/(auth)/signin/actions";

import MemberUpdateForm from "./MemberUpdateForm";

// Move handleSignIn outside component to prevent recreation
const handleSignInAction = (
  setIsGoogleLoading: Dispatch<SetStateAction<boolean>>,
) => {
  void signInWithGoogle({ setIsGoogleLoading });
};

/**
 * UserActions Component
 *
 * This component handles the display of user-related actions:
 * - Shows a loading skeleton while user data is being fetched.
 * - Displays the user's account navigation if authenticated.
 * - Provides a sign-in button for unauthenticated users.
 */
export function UserAccountNav({
  user,
  member,
  tourCards,
  champions,
}: {
  user: { avatar?: string | undefined } | null;
  member: {
    id: string;
    email: string;
    firstname: string | null;
    lastname: string | null;
    role: string;
  } | null;
  tourCards: {
    appearances: number;
    win: number;
    topTen: number;
    points: number;
    earnings: number;
  }[];
  champions?:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
}) {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false); // State for Google sign-in loading
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false); // State for sign-out process
  const handleSignIn = () => handleSignInAction(setIsGoogleLoading);

  if (isSigningOut) {
    return (
      <Skeleton
        className={`h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]`}
      />
    );
  }
  return (
    <>
      {user && member && tourCards ? (
        <div className="flex min-w-[2.5rem] items-center justify-center lg:gap-2">
          <UserAccountNavMenu
            user={user}
            member={member}
            tourCards={tourCards}
            champions={champions}
            setIsSigningOut={setIsSigningOut}
          />
          <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
            {member.firstname + " " + member.lastname}
          </span>
        </div>
      ) : (
        <SignInButton isLoading={isGoogleLoading} onClick={handleSignIn} />
      )}
    </>
  );
}

function UserAccountNavMenu({
  user,
  member,
  tourCards,
  champions,
  setIsSigningOut,
}: {
  user: { avatar?: string | undefined } | null;
  member: {
    id: string;
    email: string;
    firstname: string | null;
    lastname: string | null;
    role: string;
  } | null;
  tourCards: {
    appearances: number;
    win: number;
    topTen: number;
    points: number;
    earnings: number;
  }[];
  champions?:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!member) {
    return (
      <div className="flex items-center justify-center p-4">
        <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
      </div>
    );
  }
  return (
    <div className="w-fit">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center">
          <UserAvatar user={user} />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <UserInfo
            user={user}
            member={member}
            tourCards={tourCards}
            champions={champions}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
          {member.role === "admin" && <AdminButton />}
          <InstallAppButton />
          {/* <PushNotificationButton member={member} /> */}
          <SignOutButton setIsSigningOut={setIsSigningOut} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserInfo({
  user,
  member,
  tourCards,
  champions,
  isEditing,
  setIsEditing,
}: {
  user: { avatar?: string | undefined } | null;
  member: {
    id: string;
    email: string;
    firstname: string | null;
    lastname: string | null;
    role: string;
  };
  tourCards: {
    appearances: number;
    win: number;
    topTen: number;
    points: number;
    earnings: number;
  }[];
  champions?:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) {
  if (!user || !tourCards) {
    return (
      <div className="flex items-center justify-center p-4">
        <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-start gap-2 p-2">
      <div className="flex flex-col gap-1 space-y-1 leading-none">
        <div className="flex w-[200px] flex-row gap-2 truncate text-base font-bold text-slate-800">
          <UserAvatar user={user} size={"small"} />
          {member.firstname + " " + member.lastname}
        </div>
        <p className="w-[200px] truncate text-base text-slate-800">
          {member.email}
        </p>
        {champions && <LittleFucker champions={champions} showSeasonText />}
        <div className="flex w-[200px] flex-col text-sm text-slate-800">
          <p>
            {`${tourCards.length} seasons - ${tourCards.reduce((p, c) => (p += c.appearances ?? 0), 0)} tournaments`}
          </p>
          <p>
            {`${formatNumber(tourCards.reduce((p, c) => (p += c.win ?? 0), 0))} wins - ${formatNumber(tourCards.reduce((p, c) => (p += c.topTen ?? 0), 0))} top tens`}
          </p>
          <p>
            {`${formatNumber(tourCards.reduce((p, c) => (p += c.points ?? 0), 0))} pts - ${formatMoney(tourCards.reduce((p, c) => (p += c.earnings ?? 0), 0))}`}
          </p>
        </div>

        {!isEditing ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-sm"
          >
            Edit user info
          </Button>
        ) : (
          <MemberUpdateForm member={member} setIsEditing={setIsEditing} />
        )}
      </div>
    </div>
  );
}
function AdminButton() {
  const router = useRouter();
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/admin")}
          className="w-full"
        >
          Admin
        </Button>
      </DropdownMenuItem>
    </>
  );
}
function InstallAppButton() {
  const { isInstallable, isInstalled, installApp } = useInstallPWA();
  if (!isInstallable || isInstalled) return null;
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          variant="secondary"
          size="sm"
          onClick={installApp}
          className="w-full"
        >
          Install App
        </Button>
      </DropdownMenuItem>
    </>
  );
}
// function PushNotificationButton({ member }: { member: Member }) {
//   const { isPushSubscribed, handleToggle } = usePushNotifications(member.id);

//   return (
//     <>
//       <DropdownMenuSeparator />
//       <DropdownMenuItem>
//         <Button
//           variant="secondary"
//           size="sm"
//           onClick={handleToggle}
//           className="w-full"
//         >
//           {isPushSubscribed
//             ? "🔕 Disable Notifications"
//             : "🔔 Enable Notifications"}
//         </Button>
//       </DropdownMenuItem>
//     </>
//   );
// }
function SignInButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  if (isLoading) {
    return (
      <Skeleton className="h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]" />
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center justify-center gap-2"
    >
      <LogInIcon className="mx-auto w-[2.5rem]" />
      <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
        LOG IN
      </span>
    </button>
  );
}
function SignOutButton({
  setIsSigningOut,
}: {
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          className="w-full"
          variant="destructive"
          onClick={() => handleLogout({ router, setIsSigningOut })}
        >
          Sign out
        </Button>
      </DropdownMenuItem>
    </>
  );
}
function UserAvatar({
  user,
  size,
}: {
  user: { avatar?: string | undefined } | null;
  size?: "small" | "large";
}) {
  if (!user || !user.avatar)
    return <Skeleton className="h-6 w-6 rounded-full bg-gray-200" />;

  return (
    <Image
      className="grid place-items-center rounded-full bg-border"
      src={user.avatar}
      alt="User Avatar"
      width={size === "small" ? 24 : 36}
      height={size === "small" ? 24 : 36}
    />
  );
}
