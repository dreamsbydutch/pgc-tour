"use client";

import { cn, formatMoney, formatRank } from "@/lib/utils/main";
import { Star } from "lucide-react";
import { useState } from "react";
import LoadingSpinner from "@/lib/smartComponents/functionalComponents/loading/LoadingSpinner";
import type { TourCard, Tour, Tier, Member } from "@prisma/client";
import { StandingsTourCardInfo } from "../../StandingsDropdown";
import LittleFucker from "@/lib/components/LittleFucker";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";

// --- Utility Components ---
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

// --- Table Headers ---
function RegularStandingsHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 text-center">
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <TableHeaderCell className="text-xs font-bold sm:text-sm">
          Rank
        </TableHeaderCell>
        <TableHeaderCell className="col-span-5 text-base font-bold sm:text-lg">
          Name
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-2xs xs:text-xs sm:text-sm">
          Earnings
        </TableHeaderCell>
      </div>
    </div>
  );
}

const PlayoffHeader = ({
  title,
  tier,
  className = "",
}: {
  title: string;
  tier: Tier;
  className?: string;
}) => (
  <Popover>
    <PopoverTrigger
      className={cn(
        "col-span-7 row-span-1 w-full text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg",
        className,
      )}
    >
      <div
        className={cn(
          "grid grid-flow-row grid-cols-17 rounded-xl text-center",
          title.includes("GOLD")
            ? "bg-gradient-to-b from-champ-400"
            : "mt-12 bg-gradient-to-b from-zinc-300",
        )}
      >
        <div
          className={cn(
            "col-span-17 my-2 font-varela text-2xl font-extrabold",
            title.includes("GOLD") ? "text-champ-900" : "text-zinc-600",
          )}
        >
          {title}
        </div>
        <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
          <TableHeaderCell className="text-xs font-bold sm:text-sm">
            Rank
          </TableHeaderCell>
          <TableHeaderCell className="col-span-5 text-base font-bold sm:text-lg">
            Name
          </TableHeaderCell>
          <TableHeaderCell className="col-span-2 text-xs font-bold xs:text-sm sm:text-base">
            Cup Points
          </TableHeaderCell>
          <TableHeaderCell className="col-span-2 text-2xs xs:text-xs sm:text-sm">
            Starting Strokes
          </TableHeaderCell>
        </div>
      </div>
    </PopoverTrigger>
    <PopoverContent className="w-fit">
      <PointsAndPayoutsPopover tier={tier} />
    </PopoverContent>
  </Popover>
);

const GoldPlayoffHeader = ({ tier }: { tier: Tier }) => (
  <PlayoffHeader title="PGC GOLD PLAYOFF" tier={tier} />
);
const SilverPlayoffHeader = ({ tier }: { tier: Tier }) => (
  <PlayoffHeader title="PGC SILVER PLAYOFF" tier={tier} />
);

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
          {tourCard.win > 0 && (
            <LittleFucker
              memberId={tourCard.memberId}
              seasonId={tourCard.seasonId}
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
          <LoadingSpinner className="h-3 w-3" />
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
          {tourCard.win > 0 && (
            <LittleFucker
              memberId={tourCard.memberId}
              seasonId={tourCard.seasonId}
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

// --- Points and Payouts Popover ---
export function PointsAndPayoutsPopover({
  tier,
}: {
  tier: Tier | null | undefined;
}) {
  return (
    <div className="grid w-full grid-cols-3 text-center">
      <div className="mx-auto flex flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
      <div className="col-span-2 mx-auto flex flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier?.payouts.slice(0, 35).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Unified Header Component ---
export type StandingsHeaderVariant = "regular" | "gold" | "silver";

export interface StandingsHeaderProps {
  variant: StandingsHeaderVariant;
  tier?: Tier;
}

export function StandingsHeader({ variant, tier }: StandingsHeaderProps) {
  if (variant === "gold" && tier) {
    return <GoldPlayoffHeader tier={tier} />;
  }
  if (variant === "silver" && tier) {
    return <SilverPlayoffHeader tier={tier} />;
  }
  // default to regular
  return <RegularStandingsHeader />;
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
