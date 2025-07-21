/**
 * Table Components - Headers and table-related UI
 *
 * Consolidates all table header variants and related components
 * while maintaining clear separation by functionality.
 */

import { cn } from "@pgc-utils";
import type { Tier } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/lib/components/functional/ui";
import { FriendsOnlyToggle, PointsAndPayoutsPopover } from "./UIComponents";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const TableHeaderCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("place-self-center font-varela", className)}>
    {children}
  </div>
);

// ============================================================================
// HEADER VARIANTS
// ============================================================================

/**
 * Regular standings table header
 */
function RegularStandingsHeader({
  friendsOnly,
  setFriendsOnly,
  disabled,
}: {
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-flow-row grid-cols-16 text-center">
      <TableHeaderCell className="col-span-2 text-xs font-bold sm:text-sm">
        Rank
      </TableHeaderCell>
      <TableHeaderCell className="col-span-7 text-base font-bold sm:text-lg">
        Name
      </TableHeaderCell>
      <TableHeaderCell className="col-span-3 text-xs font-bold xs:text-sm sm:text-base">
        Cup Points
      </TableHeaderCell>
      <TableHeaderCell className="col-span-3 text-2xs xs:text-xs sm:text-sm">
        Earnings
      </TableHeaderCell>
      <TableHeaderCell className="col-span-1 overflow-x-clip text-2xs xs:text-xs sm:text-sm">
        <FriendsOnlyToggle
          friendsOnly={friendsOnly}
          setFriendsOnly={setFriendsOnly}
          disabled={disabled}
        />
      </TableHeaderCell>
    </div>
  );
}

/**
 * Bumped/eliminated players header
 */
function BumpedHeader({
  friendsOnly,
  setFriendsOnly,
  disabled,
}: {
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-12 grid grid-flow-row grid-cols-16 rounded-xl bg-gradient-to-b from-red-200 text-center text-red-900">
      <div
        className={cn("col-span-16 my-2 font-varela text-2xl font-extrabold")}
      >
        KNOCKED OUT
      </div>
      <TableHeaderCell className="col-span-2 text-xs font-bold sm:text-sm">
        Rank
      </TableHeaderCell>
      <TableHeaderCell className="col-span-7 text-base font-bold sm:text-lg">
        Name
      </TableHeaderCell>
      <TableHeaderCell className="col-span-3 text-xs font-bold xs:text-sm sm:text-base">
        Cup Points
      </TableHeaderCell>
      <TableHeaderCell className="col-span-3 text-2xs xs:text-xs sm:text-sm">
        Earnings
      </TableHeaderCell>
      <TableHeaderCell className="col-span-1 overflow-x-clip text-2xs xs:text-xs sm:text-sm">
        <FriendsOnlyToggle
          friendsOnly={friendsOnly}
          setFriendsOnly={setFriendsOnly}
          disabled={disabled}
        />
      </TableHeaderCell>
    </div>
  );
}

/**
 * Playoff header with popover
 */
const PlayoffHeader = ({
  title,
  tier,
  className = "",
  friendsOnly,
  setFriendsOnly,
  disabled = false,
}: {
  title: string;
  tier: Tier;
  className?: string;
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <div
    className={cn(
      "grid grid-flow-row grid-cols-16 rounded-xl text-center",
      title.includes("GOLD")
        ? "mt-4 bg-gradient-to-b from-champ-400"
        : "mt-12 bg-gradient-to-b from-zinc-300",
      //   "col-span-7 row-span-1 w-full text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg",
      className,
    )}
  >
    <Popover>
      <PopoverTrigger className={cn("col-span-17")}>
        <div
          className={cn(
            "col-span-16 my-2 font-varela text-2xl font-extrabold",
            title.includes("GOLD") ? "text-champ-900" : "text-zinc-600",
          )}
        >
          {title}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <PointsAndPayoutsPopover tier={tier} />
      </PopoverContent>
    </Popover>
    <TableHeaderCell className="col-span-2 text-xs font-bold sm:text-sm">
      Rank
    </TableHeaderCell>
    <TableHeaderCell className="col-span-7 text-base font-bold sm:text-lg">
      Name
    </TableHeaderCell>
    <TableHeaderCell className="col-span-3 text-xs font-bold xs:text-sm sm:text-base">
      Cup Points
    </TableHeaderCell>
    <TableHeaderCell className="col-span-3 text-2xs xs:text-xs sm:text-sm">
      Starting Strokes
    </TableHeaderCell>
    <TableHeaderCell className="col-span-1 overflow-x-clip text-2xs xs:text-xs sm:text-sm">
      <FriendsOnlyToggle
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={disabled}
      />
    </TableHeaderCell>
  </div>
);

/**
 * Gold playoff header
 */
const GoldPlayoffHeader = ({
  tier,
  friendsOnly,
  setFriendsOnly,
  disabled,
}: {
  tier: Tier;
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <PlayoffHeader
    title="PGC GOLD PLAYOFF"
    tier={tier}
    friendsOnly={friendsOnly}
    setFriendsOnly={setFriendsOnly}
    disabled={disabled}
  />
);

/**
 * Silver playoff header
 */
const SilverPlayoffHeader = ({
  tier,
  friendsOnly,
  setFriendsOnly,
  disabled,
}: {
  tier: Tier;
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <PlayoffHeader
    title="PGC SILVER PLAYOFF"
    tier={tier}
    friendsOnly={friendsOnly}
    setFriendsOnly={setFriendsOnly}
    disabled={disabled}
  />
);

// ============================================================================
// UNIFIED HEADER COMPONENT
// ============================================================================

export type StandingsTableHeaderVariant =
  | "regular"
  | "gold"
  | "silver"
  | "bumped";

export interface StandingsTableHeaderProps {
  variant: StandingsTableHeaderVariant;
  tier?: Tier;
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Unified standings table header component
 * Routes to the appropriate header variant based on props
 */
export function StandingsTableHeader({
  variant,
  tier,
  friendsOnly,
  setFriendsOnly,
  disabled = false,
}: StandingsTableHeaderProps) {
  if (variant === "gold" && tier) {
    return (
      <GoldPlayoffHeader
        tier={tier}
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={disabled}
      />
    );
  }
  if (variant === "silver" && tier) {
    return (
      <SilverPlayoffHeader
        tier={tier}
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={disabled}
      />
    );
  }
  if (variant === "bumped") {
    return (
      <BumpedHeader
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={disabled}
      />
    );
  }
  // default to regular
  return (
    <RegularStandingsHeader
      friendsOnly={friendsOnly}
      setFriendsOnly={setFriendsOnly}
      disabled={disabled}
    />
  );
}
