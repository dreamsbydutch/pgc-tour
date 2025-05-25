"use client";

import { cn, formatMoney } from "@/src/lib/utils";
// Remove server action imports
import { Star } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import type { TourCard, Tour } from "@prisma/client";
import { StandingsTourCardInfo } from "./StandingsDropdown";
import LittleFucker from "../../../_components/LittleFucker";
import { useMainStore } from "@/src/lib/store/store";
import { api } from "@/src/trpc/react";
import Image from "next/image";

/**
 * tourToggleButton Component
 *
 * Renders a button to toggle between tours in the standings view.
 *
 * Props:
 * - tour: The tour data.
 * - tourToggle: The currently active tour ID.
 * - setTourToggle: Function to set the active tour.
 */
export function ToursToggleButton({
  tour,
  tourToggle,
  setTourToggle,
}: {
  tour: Tour;
  tourToggle: string;
  setTourToggle: Dispatch<SetStateAction<string>>;
}) {
  const [effect, setEffect] = useState(false);

  return (
    <button
      onClick={() => {
        setTourToggle(tour.id);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 text-lg font-bold sm:px-8 md:px-10 md:text-xl ${
        tourToggle === tour.id
          ? "shadow-btn bg-gray-600 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-800"
      }`}
      onAnimationEnd={() => setEffect(false)}
    >
      <Image
        key={tour.id}
        src={tour.logoUrl}
        alt="Tour Logo"
        width={512}
        height={512}
        className={cn(
          "mx-1 inline-block h-6 w-auto",
          tourToggle === tour.id &&
            tour.id !== "pga" &&
            tour.id !== "playoffs" &&
            tour.id !== "gold" &&
            tour.id !== "silver"
            ? "invert"
            : "",
        )}
      />
      {tour.shortForm}
    </button>
  );
}

/**
 * StandingsHeader Component
 *
 * Renders the header row for the standings table.
 */
export function StandingsHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 text-center">
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
          Rank
        </div>
        <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
          Name
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </div>
        <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
          Earnings
        </div>
      </div>
    </div>
  );
}
export function GoldPlayoffHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 rounded-xl bg-gradient-to-b from-champ-400 text-center">
      <div className="col-span-17 my-2 font-varela text-2xl font-extrabold text-champ-900">
        PGC GOLD PLAYOFF
      </div>
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
          Rank
        </div>
        <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
          Name
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </div>
        <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
          Starting Strokes
        </div>
      </div>
    </div>
  );
}
export function SilverPlayoffHeader() {
  return (
    <div className="mt-12 grid grid-flow-row grid-cols-17 rounded-xl bg-gradient-to-b from-zinc-300 text-center">
      <div className="col-span-17 my-2 font-varela text-2xl font-extrabold text-zinc-600">
        PGC SILVER PLAYOFF
      </div>
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
          Rank
        </div>
        <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
          Name
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </div>
        <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
          Starting Strokes
        </div>
      </div>
    </div>
  );
}

/**
 * StandingsListing Component
 *
 * Displays a single player's standings in the leaderboard.
 * - Highlights the user's standings and their friends' standings.
 * - Allows adding or removing friends from the standings view.
 *
 * Props:
 * - tourCard: The tour card data to display.
 * - member: The current user's member data.
 * - user: The authenticated user object.
 * - addingToFriends: Boolean indicating if a friend is being added.
 * - setAddingToFriends: Function to set the adding-to-friends state.
 */
export function StandingsListing({
  tourCard,
  className,
}: {
  tourCard: TourCard;
  className?: string;
}) {
  const [isFriendChanging, setIsFriendChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const currentMember = useMainStore((state) => state.currentMember);
  const setCurrentMember = useMainStore((state) => state.setCurrentMember);
  const addFriend = api.member.addFriend.useMutation();
  const removeFriend = api.member.removeFriend.useMutation();

  const handleAddFriend = () => {
    if (!currentMember) return;
    setIsFriendChanging(true);
    setCurrentMember({
      ...currentMember,
      friends: [...currentMember.friends, tourCard.memberId],
    });
    addFriend.mutate({
      memberId: currentMember.id,
      friendId: tourCard.memberId,
    });

    setIsFriendChanging(false);
  };
  const handleRemoveFriend = () => {
    if (!currentMember) return;
    setIsFriendChanging(true);
    setCurrentMember({
      ...currentMember,
      friends: currentMember.friends.filter(
        (friendId) => friendId !== tourCard.memberId,
      ),
    });
    removeFriend.mutate({
      memberId: currentMember.id,
      friendsList: currentMember.friends.filter(
        (friendId) => friendId !== tourCard.memberId,
      ),
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
        <div className="col-span-5 flex items-center justify-center place-self-center font-varela text-lg sm:text-xl">
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
export function PlayoffStandingsListing({
  tourCard,
  teams,
  strokes,
  className,
}: {
  tourCard: TourCard;
  teams: TourCard[];
  strokes: number[];
  className?: string;
}) {
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
        <div className="col-span-5 place-self-center font-varela text-lg sm:text-xl">
          {tourCard.displayName}
          {tourCard.win > 0 && <LittleFucker {...{ tourCard }} />}
        </div>

        {/* Player Points */}
        <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
          {tourCard.points}
        </div>

        {/* Player Earnings */}
        <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
          {startingStrokes ?? "-"}
        </div>
      </div>
      {/* Player Rank */}
      <div className="place-self-center p-1 font-varela text-sm sm:text-base">
        <Image
          src={tour?.logoUrl ?? ""}
          alt="Tour Logo"
          width={128}
          height={128}
        />
      </div>
      {isOpen ? (
        <StandingsTourCardInfo {...{ tourCard, member: currentMember }} />
      ) : (
        <></>
      )}
    </div>
  );
}
