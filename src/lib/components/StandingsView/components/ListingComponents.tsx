/**
 * Standings Listing Components
 *
 * Consolidates all standings listing variants (pure and container components)
 * while maintaining clear separation between stateful and stateless logic.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MoveDownIcon,
  MoveHorizontalIcon,
  MoveUpIcon,
  Star,
} from "lucide-react";
import { cn, formatMoney } from "@pgc-utils";
import type { Tour, Member } from "@prisma/client";
import { LoadingSpinner } from "src/lib/components/functional/ui";
import { LittleFucker } from "../../functional/LittleFucker";
import { useChampionsByMemberId } from "src/lib/hooks/hooks";
import type { ExtendedTourCard, Champion } from "../utils/types";
import { StandingsTourCardInfo } from "./TourCardInfoComponents";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Position Change Indicator
 * Pure functional component that shows position movement
 */
export const PositionChange: React.FC<{ posChange: number }> = ({
  posChange,
}) => {
  if (posChange === 0) {
    return (
      <span className="ml-1 flex items-center justify-center text-3xs">
        <MoveHorizontalIcon className="w-2" />
      </span>
    );
  }

  const isPositive = posChange > 0;
  const Icon = isPositive ? MoveUpIcon : MoveDownIcon;
  const colorClass = isPositive ? "text-green-900" : "text-red-900";

  return (
    <span
      className={cn(
        "ml-0.5 flex items-center justify-center text-2xs",
        colorClass,
      )}
    >
      <Icon className="w-2" />
      {Math.abs(posChange)}
    </span>
  );
};

/**
 * Friend Action Button
 * Pure component for friend management actions
 */
interface FriendActionButtonProps {
  isCurrent: boolean;
  isFriend: boolean;
  isFriendChanging: boolean;
  memberId: string;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

const FriendActionButton: React.FC<FriendActionButtonProps> = ({
  isCurrent,
  isFriend,
  isFriendChanging,
  memberId,
  onAddFriend,
  onRemoveFriend,
}) => {
  if (isCurrent) return null;

  if (isFriendChanging) {
    return <LoadingSpinner className="m-auto h-3 w-3" />;
  }

  if (isFriend) {
    return (
      <Star
        aria-disabled={isFriendChanging}
        fill="#111"
        size={12}
        className="m-auto cursor-pointer"
        onClick={() => onRemoveFriend?.(memberId)}
      />
    );
  }

  return (
    <Star
      size={12}
      className="m-auto cursor-pointer"
      onClick={() => onAddFriend?.(memberId)}
    />
  );
};

// ============================================================================
// PURE PRESENTATION COMPONENTS
// ============================================================================

/**
 * Regular Standings Listing - Pure Component
 */
interface RegularStandingsListingProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  isFriendChanging?: boolean;
  isOpen?: boolean;
  champions?: Champion[];
  friendsOnly: boolean;
  disabled?: boolean;
  onToggleOpen?: () => void;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

export const RegularStandingsListing: React.FC<
  RegularStandingsListingProps
> = ({
  tourCard,
  className,
  currentMember,
  isFriendChanging = false,
  isOpen = false,
  champions,
  friendsOnly,
  onToggleOpen,
  onAddFriend,
  onRemoveFriend,
}) => {
  const isCurrent = currentMember?.id === tourCard.memberId;
  const isFriend = currentMember?.friends?.includes(tourCard.memberId) ?? false;

  if (friendsOnly && !isFriend && !isCurrent) {
    return null;
  }
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
      onClick={onToggleOpen}
    >
      <div className="col-span-2 flex place-self-center font-varela text-sm sm:text-base">
        {tourCard.position}
        <PositionChange posChange={tourCard.posChange ?? 0} />
      </div>
      <div className="col-span-8 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
        {tourCard.displayName}
        {champions && (
          <LittleFucker
            champions={champions.filter((c) => c.tourCardId === tourCard.id)}
          />
        )}
      </div>
      <div className="col-span-3 place-self-center font-varela text-sm xs:text-base sm:text-lg">
        {tourCard.points}
      </div>
      <div className="col-span-3 place-self-center font-varela text-xs xs:text-sm sm:text-base">
        {formatMoney(tourCard.earnings)}
      </div>

      {currentMember && (
        <FriendActionButton
          isCurrent={isCurrent}
          isFriend={isFriend}
          isFriendChanging={isFriendChanging}
          memberId={tourCard.memberId}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      )}

      {isOpen && (
        <StandingsTourCardInfo tourCard={tourCard} member={currentMember} />
      )}
    </div>
  );
};

/**
 * Bumped Standings Listing - Pure Component
 */
interface BumpedStandingsListingProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  tour?: Tour;
  isOpen?: boolean;
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  champions?: Champion[];
  onToggleOpen?: () => void;
}

export const BumpedStandingsListing: React.FC<BumpedStandingsListingProps> = ({
  tourCard,
  className,
  currentMember,
  tour,
  isOpen = false,
  champions,
  friendsOnly,
  onToggleOpen,
}) => {
  const isCurrent = currentMember?.id === tourCard.memberId;
  const isFriend = currentMember?.friends?.includes(tourCard.memberId) ?? false;

  if (friendsOnly && !isFriend && !isCurrent) {
    return null;
  }
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
      onClick={onToggleOpen}
    >
      <div className="col-span-2 flex place-self-center font-varela text-sm sm:text-base">
        {tourCard.position}
        <PositionChange posChange={tourCard.posChange ?? 0} />
      </div>
      <div className="col-span-8 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
        {tourCard.displayName}
        {champions && (
          <LittleFucker
            champions={champions.filter((c) => c.tourCardId === tourCard.id)}
          />
        )}
      </div>
      <div className="col-span-3 place-self-center font-varela text-sm xs:text-base sm:text-lg">
        {tourCard.points}
      </div>
      <div className="col-span-3 place-self-center font-varela text-xs xs:text-sm sm:text-base">
        {formatMoney(tourCard.earnings)}
      </div>
      <div className="max-h-8 min-h-6 min-w-6 max-w-8 place-self-center p-1 font-varela text-sm sm:text-base">
        <Image
          src={tour?.logoUrl ?? ""}
          alt="Tour Logo"
          width={128}
          height={128}
        />
      </div>
      {isOpen && (
        <StandingsTourCardInfo tourCard={tourCard} member={currentMember} />
      )}
    </div>
  );
};

/**
 * Playoff Standings Listing - Pure Component
 */
interface PlayoffStandingsListingProps {
  tourCard: ExtendedTourCard;
  teams: ExtendedTourCard[];
  strokes: number[];
  className?: string;
  tour?: Tour;
  currentMember?: Member | null;
  isOpen?: boolean;
  champions?: Champion[];
  friendsOnly: boolean;
  onToggleOpen?: () => void;
}

export const PlayoffStandingsListing: React.FC<
  PlayoffStandingsListingProps
> = ({
  tourCard,
  teams,
  strokes,
  className,
  tour,
  currentMember,
  friendsOnly,
  isOpen = false,
  champions,
  onToggleOpen,
}) => {
  const teamsBetterCount = teams?.filter(
    (obj) => (obj.points ?? 0) > (tourCard.points ?? 0),
  ).length;
  const teamsTiedCount = teams?.filter(
    (obj) => (obj.points ?? 0) === (tourCard.points ?? 0),
  ).length;
  const position = (teamsTiedCount > 1 ? "T" : "") + (teamsBetterCount + 1);
  const startingStrokes =
    teamsTiedCount > 1
      ? Math.round(
          (10 *
            strokes
              .slice(teamsBetterCount, teamsBetterCount + teamsTiedCount)
              .reduce((acc, obj) => acc + obj, 0)) /
            teamsTiedCount,
        ) / 10
      : strokes[+position - 1];
  const isCurrent = currentMember?.id === tourCard.memberId;
  const isFriend = currentMember?.friends?.includes(tourCard.memberId) ?? false;

  if (friendsOnly && !isFriend && !isCurrent) {
    return null;
  }
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
      onClick={onToggleOpen}
    >
      <div className="col-span-2 flex place-self-center font-varela text-sm sm:text-base">
        {position}
        <PositionChange posChange={tourCard.posChangePO ?? 0} />
      </div>
      <div className="col-span-8 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
        {tourCard.displayName}{" "}
        {champions && (
          <LittleFucker
            champions={champions.filter((c) => c.tourCardId === tourCard.id)}
          />
        )}
      </div>
      <div className="col-span-3 place-self-center font-varela text-sm xs:text-base sm:text-lg">
        {tourCard.points}
      </div>
      <div className="col-span-3 place-self-center font-varela text-xs xs:text-sm sm:text-base">
        {startingStrokes ?? "-"}
      </div>
      <div className="max-h-8 min-h-6 min-w-6 max-w-8 place-self-center p-1 font-varela text-sm sm:text-base">
        <Image
          src={tour?.logoUrl ?? ""}
          alt="Tour Logo"
          width={128}
          height={128}
        />
      </div>
      {isOpen && (
        <StandingsTourCardInfo tourCard={tourCard} member={currentMember} />
      )}
    </div>
  );
};

// ============================================================================
// CONTAINER COMPONENTS (STATEFUL)
// ============================================================================

/**
 * Regular Standings Container
 */
interface RegularStandingsContainerProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  isFriendChanging?: boolean;
  friendsOnly: boolean;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

const RegularStandingsContainer: React.FC<RegularStandingsContainerProps> = ({
  tourCard,
  className,
  currentMember,
  isFriendChanging = false,
  friendsOnly = false,
  onAddFriend,
  onRemoveFriend,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const champions = useChampionsByMemberId(tourCard.memberId);

  return (
    <RegularStandingsListing
      tourCard={tourCard}
      className={className}
      currentMember={currentMember}
      isFriendChanging={isFriendChanging}
      friendsOnly={friendsOnly}
      isOpen={isOpen}
      champions={champions ?? undefined}
      onToggleOpen={() => setIsOpen(!isOpen)}
      onAddFriend={onAddFriend}
      onRemoveFriend={onRemoveFriend}
    />
  );
};

/**
 * Bumped Standings Container
 */
interface BumpedStandingsContainerProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  friendsOnly?: boolean;
  tour?: Tour;
}

const BumpedStandingsContainer: React.FC<BumpedStandingsContainerProps> = ({
  tourCard,
  className,
  currentMember,
  friendsOnly,
  tour,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const champions = useChampionsByMemberId(tourCard.memberId);

  return (
    <BumpedStandingsListing
      tourCard={tourCard}
      className={className}
      currentMember={currentMember}
      friendsOnly={friendsOnly}
      tour={tour}
      isOpen={isOpen}
      champions={champions ?? undefined}
      onToggleOpen={() => setIsOpen(!isOpen)}
    />
  );
};

/**
 * Playoff Standings Container
 */
interface PlayoffStandingsContainerProps {
  tourCard: ExtendedTourCard;
  teams: ExtendedTourCard[];
  strokes: number[];
  className?: string;
  tour?: Tour;
  currentMember?: Member | null;
  friendsOnly?: boolean;
}

const PlayoffStandingsContainer: React.FC<PlayoffStandingsContainerProps> = ({
  tourCard,
  teams,
  strokes,
  className,
  tour,
  currentMember,
  friendsOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const champions = useChampionsByMemberId(tourCard.memberId);

  return (
    <PlayoffStandingsListing
      tourCard={tourCard}
      teams={teams}
      strokes={strokes}
      className={className}
      tour={tour}
      currentMember={currentMember}
      isOpen={isOpen}
      champions={champions ?? undefined}
      onToggleOpen={() => setIsOpen(!isOpen)}
      friendsOnly={friendsOnly}
    />
  );
};

// ============================================================================
// UNIFIED LISTING COMPONENT
// ============================================================================

export type StandingsListingVariant = "regular" | "playoff" | "bumped";

export interface StandingsListingProps {
  variant: StandingsListingVariant;
  tourCard: ExtendedTourCard;
  teams?: ExtendedTourCard[];
  strokes?: number[];
  className?: string;
  tour?: Tour;
  currentMember?: Member | null;
  friendsOnly: boolean;
  isFriendChanging: boolean;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

/**
 * Unified Standings Listing Component
 *
 * This is the main component that other parts of the app use.
 * It routes to the appropriate container component based on variant.
 */
export const StandingsListing: React.FC<StandingsListingProps> = (props) => {
  if (props.variant === "playoff" && props.teams && props.strokes) {
    return (
      <PlayoffStandingsContainer
        {...props}
        teams={props.teams}
        strokes={props.strokes}
      />
    );
  }

  if (props.variant === "bumped") {
    return <BumpedStandingsContainer {...props} />;
  }

  // default to regular
  return <RegularStandingsContainer {...props} />;
};
