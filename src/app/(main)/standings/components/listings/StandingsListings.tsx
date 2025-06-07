"use client";

import { cn, formatMoney } from "@/src/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { StandingsTourCardInfo } from "../dropdowns/StandingsDropdown";
import LittleFucker from "@/src/app/_components/LittleFucker";
import { useMainStore } from "@/src/lib/store/store";
import { api } from "@/src/trpc/react";
import { TourLogo } from "@/src/app/_components/OptimizedImage";
import { useAuth } from "@/src/lib/auth/Auth";
import { authStoreService } from "@/src/lib/auth/AuthStoreService";
import type {
  StandingsListingProps,
  PlayoffStandingsListingProps,
} from "../../types";

/**
 * StandingsListing Component
 *
 * Displays a single player's standings in the leaderboard.
 * - Highlights the user's standings and their friends' standings.
 * - Allows adding or removing friends from the standings view.
 *
 * Props:
 * - tourCard: The tour card data to display.
 * - className: Additional CSS classes to apply.
 */
export function StandingsListing({
  tourCard,
  className,
}: StandingsListingProps & { className?: string }) {
  const [isFriendChanging, setIsFriendChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { member: currentMember } = useAuth();
  const addFriend = api.member.addFriend.useMutation();
  const removeFriend = api.member.removeFriend.useMutation();

  const handleAddFriend = () => {
    if (!currentMember) return;
    setIsFriendChanging(true);
    
    const updatedMember = {
      ...currentMember,
      friends: [...currentMember.friends, tourCard.memberId],
    };
    
    // Update through auth store service for consistency
    authStoreService.updateCurrentMember(updatedMember);
    
    addFriend.mutate({
      memberId: currentMember.id,
      friendId: tourCard.memberId,
    });

    setIsFriendChanging(false);
  };

  const handleRemoveFriend = () => {
    if (!currentMember) return;
    setIsFriendChanging(true);
    
    const updatedFriends = currentMember.friends.filter(
      (friendId) => friendId !== tourCard.memberId,
    );
    
    const updatedMember = {
      ...currentMember,
      friends: updatedFriends,
    };
    
    // Update through auth store service for consistency
    authStoreService.updateCurrentMember(updatedMember);
    
    removeFriend.mutate({
      memberId: currentMember.id,
      friendsList: updatedFriends,
    });

    setIsFriendChanging(false);
  };

  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        currentMember?.id === tourCard.memberId
          ? "bg-slate-200 font-semibold"
          : "",
        currentMember?.friends.includes(tourCard.memberId)
          ? "bg-slate-100"
          : "",
      )}
    >
      <div
        className="col-span-16 grid grid-flow-row grid-cols-10 rounded-lg text-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Player Rank */}
        <div className="place-self-center font-varela text-sm sm:text-base">
          {tourCard.position}
        </div>

        {/* Player Name */}
        <div className="col-span-5 flex items-center justify-center gap-0.5 place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
          {tourCard.win > 0 && <LittleFucker {...{ tourCard }} />}
        </div>

        {/* Player Points */}
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>

        {/* Player Earnings */}
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {formatMoney(tourCard.earnings)}
        </div>
      </div>

      {/* Friend Actions */}
      {currentMember &&
        (isFriendChanging ? (
          <LoadingSpinner className="h-3 w-3" />
        ) : currentMember.friends.includes(tourCard.memberId) ? (
          <Star
            aria-disabled={isFriendChanging}
            fill="#111"
            size={12}
            className="m-auto cursor-pointer"
            onClick={handleRemoveFriend}
          />
        ) : currentMember.id === tourCard.memberId ? null : (
          <Star
            size={12}
            className="m-auto cursor-pointer"
            onClick={handleAddFriend}
          />
        ))}
      {isOpen ? (
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      ) : (
        <></>
      )}
    </div>
  );
}

/**
 * PlayoffStandingsListing Component
 *
 * Displays a single player's standings in the playoff leaderboard.
 * - Shows starting strokes instead of earnings.
 * - Includes tour logo.
 *
 * Props:
 * - tourCard: The tour card data to display.
 * - teams: Array of all tour cards for position calculation.
 * - strokes: Array of starting strokes values.
 * - className: Additional CSS classes to apply.
 */
export function PlayoffStandingsListing({
  tourCard,
  teams,
  strokes,
  className,
}: PlayoffStandingsListingProps & { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMember = useMainStore((state) => state.currentMember);
  const tour = useMainStore((state) => state.tours)?.find(
    (t) => t.id === tourCard.tourId,
  );

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

  return (
    <div
      key={tourCard.id}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        currentMember?.id === tourCard.memberId
          ? "bg-slate-200 font-semibold"
          : "",
        currentMember?.friends.includes(tourCard.memberId)
          ? "bg-slate-100"
          : "",
      )}
    >
      <div
        className="col-span-16 grid grid-flow-row grid-cols-10 rounded-lg text-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Player Rank */}
        <div className="place-self-center font-varela text-sm sm:text-base">
          {position}
        </div>

        {/* Player Name */}
        <div className="col-span-5 flex gap-0.5 place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
          {tourCard.win > 0 && <LittleFucker {...{ tourCard }} />}
        </div>

        {/* Player Points */}
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>

        {/* Starting Strokes */}
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {startingStrokes ?? "-"}
        </div>
      </div>
      {/* Tour Logo */}
      <div className="max-h-8 min-h-6 min-w-6 max-w-8 place-self-center p-1 font-varela text-sm sm:text-base">
        <TourLogo src={tour?.logoUrl ?? ""} alt="Tour Logo" size="small" />
      </div>
      {isOpen ? (
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      ) : (
        <></>
      )}
    </div>
  );
}
