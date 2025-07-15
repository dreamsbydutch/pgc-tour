import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatMoney } from "@pgc-utils";
import type { TourCard, Tour, Member } from "@prisma/client";
import { LoadingSpinner } from "src/lib/components/functional/ui";
import { StandingsTourCardInfo } from "./StandingsTourCardInfo";

// --- Standings Listing ---
interface RegularStandingsListingProps {
  tourCard: TourCard;
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
        <div className="place-self-center font-varela text-sm sm:text-base">
          {tourCard.position}
        </div>
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
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

// --- Playoff Standings Listing ---
interface PlayoffStandingsListingProps {
  tourCard: TourCard;
  teams: TourCard[];
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
        <div className="place-self-center font-varela text-sm sm:text-base">
          {position}
        </div>
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
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
export type StandingsListingVariant = "regular" | "playoff";

export interface StandingsListingProps {
  variant: StandingsListingVariant;
  tourCard: TourCard;
  teams?: TourCard[];
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
  // default to regular
  return <RegularStandingsListing {...props} />;
}
