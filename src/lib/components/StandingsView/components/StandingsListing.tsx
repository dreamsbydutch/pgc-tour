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
import { StandingsTourCardInfo } from "./StandingsTourCardInfo";
import { LittleFucker } from "../../functional/LittleFucker";
import { useChampionsByMemberId } from "src/lib/hooks/hooks";
import type { ExtendedTourCard } from "../types";

// --- Standings Listing ---
interface RegularStandingsListingProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  isFriendChanging?: boolean;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

function RegularStandingsListing({
  tourCard,
  className,
  currentMember,
  isFriendChanging = false,
  onAddFriend,
  onRemoveFriend,
}: RegularStandingsListingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCurrent = currentMember?.id === tourCard.memberId;
  const isFriend = currentMember?.friends?.includes(tourCard.memberId);
  const champions = useChampionsByMemberId(tourCard.memberId);
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
    >
      <div
        className="col-span-16 grid grid-flow-row grid-cols-10 rounded-lg text-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex place-self-center font-varela text-sm sm:text-base">
          {tourCard.position}
          <PositionChange posChange={tourCard.posChange ?? 0} />
        </div>
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
          {champions && (
            <LittleFucker
              champions={champions.filter((c) => c.tourCardId === tourCard.id)}
            />
          )}
        </div>
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {formatMoney(tourCard.earnings)}
        </div>
      </div>
      {currentMember &&
        (isFriendChanging ? (
          <LoadingSpinner className="m-auto h-3 w-3" />
        ) : isFriend ? (
          <Star
            aria-disabled={isFriendChanging}
            fill="#111"
            size={12}
            className="m-auto cursor-pointer"
            onClick={() => onRemoveFriend && onRemoveFriend(tourCard.memberId)}
          />
        ) : isCurrent ? null : (
          <Star
            size={12}
            className="m-auto cursor-pointer"
            onClick={() => onAddFriend && onAddFriend(tourCard.memberId)}
          />
        ))}
      {isOpen && (
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      )}
    </div>
  );
}

interface BumpedListingProps {
  tourCard: ExtendedTourCard;
  className?: string;
  currentMember?: Member | null;
  tour?: Tour;
}
function BumpedStandingsListing({
  tourCard,
  className,
  currentMember,
  tour,
}: BumpedListingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCurrent = currentMember?.id === tourCard.memberId;
  const isFriend = currentMember?.friends?.includes(tourCard.memberId);
  const champions = useChampionsByMemberId(tourCard.memberId);
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
    >
      <div
        className="col-span-16 grid grid-flow-row grid-cols-10 rounded-lg text-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex place-self-center font-varela text-sm sm:text-base">
          {tourCard.position}
          <PositionChange posChange={tourCard.posChange ?? 0} />
        </div>
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
          {champions && (
            <LittleFucker
              champions={champions.filter((c) => c.tourCardId === tourCard.id)}
            />
          )}
        </div>
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {formatMoney(tourCard.earnings)}
        </div>
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
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      )}
    </div>
  );
}
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

// --- Playoff Standings Listing ---
interface PlayoffStandingsListingProps {
  tourCard: ExtendedTourCard;
  teams: ExtendedTourCard[];
  strokes: number[];
  className?: string;
  tour?: Tour;
  currentMember?: Member | null;
}

function PlayoffStandingsListing({
  tourCard,
  teams,
  strokes,
  className,
  tour,
  currentMember,
}: PlayoffStandingsListingProps) {
  const [isOpen, setIsOpen] = useState(false);
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
  const isFriend = currentMember?.friends?.includes(tourCard.memberId);
  const champions = useChampionsByMemberId(tourCard.memberId);
  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        isCurrent ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
    >
      <div
        className="col-span-16 grid grid-flow-row grid-cols-10 rounded-lg text-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex place-self-center font-varela text-sm sm:text-base">
          {position}
          <PositionChange posChange={tourCard.posChangePO ?? 0} />
        </div>
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}{" "}
          {champions && (
            <LittleFucker
              champions={champions.filter((c) => c.tourCardId === tourCard.id)}
            />
          )}
        </div>
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {startingStrokes ?? "-"}
        </div>
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
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      )}
    </div>
  );
}

// --- Unified Listing Component ---
export type StandingsListingVariant = "regular" | "playoff" | "bumped";

export interface StandingsListingProps {
  variant: StandingsListingVariant;
  tourCard: ExtendedTourCard;
  teams?: ExtendedTourCard[];
  strokes?: number[];
  className?: string;
  tour?: Tour;
  currentMember?: Member | null;
  isFriendChanging?: boolean;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
}

export function StandingsListing(props: StandingsListingProps) {
  if (props.variant === "playoff" && props.teams && props.strokes) {
    return (
      <PlayoffStandingsListing
        {...props}
        teams={props.teams}
        strokes={props.strokes}
      />
    );
  }
  if (props.variant === "bumped") {
    return <BumpedStandingsListing {...props} />;
  }
  // default to regular
  return <RegularStandingsListing {...props} />;
}
