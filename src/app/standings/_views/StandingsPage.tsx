"use client";

import { cn, formatMoney } from "@/src/lib/utils";
import {
  addFriendsToMember,
  removeFriendsFromMember,
} from "@/src/server/api/actions/member";
import { api } from "@/src/trpc/react";
import { Star } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import LoadingSpinner from "../../_components/LoadingSpinner";
import type { Member, TourCard, Tour } from "@prisma/client";
import type { TourData } from "@/src/types/prisma_include";
import { StandingsTourCardInfo } from "../_components/StandingsDropdown";
import LittleFucker from "../../_components/LittleFucker";

/**
 * PGCStandings Component
 *
 * Displays the standings for a specific tour.
 * - Allows toggling between tours.
 * - Displays a list of players with their rank, name, points, and earnings.
 * - Allows users to add or remove friends from their standings view.
 *
 * Props:
 * - tours: The list of tours available.
 * - tourCard: The user's tour card data (optional).
 * - inputTour: The initial active tour ID (optional).
 */
export default function PGCStandings({
  tours,
  member,
  inputTour,
}: {
  tours: TourData[];
  member: Member | null | undefined;
  inputTour?: string;
}) {
  const tourCard = tours
    .map((tour) => tour.tourCards.find((t) => t.memberId === member?.id))
    .find((t) => t !== undefined);
  const [standingsToggle, setStandingsToggle] = useState<string>(
    inputTour && inputTour !== ""
      ? inputTour
      : (tourCard?.tourId ?? tours[0]?.id ?? ""),
  );
  const [addingToFriends, setAddingToFriends] = useState(false);
  const activeTour =
    tours.find((tour) => tour.id === standingsToggle) ?? tours[0];

  return (
    <>
      <div className="mb-4 mt-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {activeTour?.name} Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view thier stats and tournament history
      </div>
      {tours.length > 1 && (
        <div className="mx-auto my-4 text-center">
          {tours
            .sort((a, b) => a.shortForm.localeCompare(b.shortForm))
            .map((tour) => (
              <StandingsToggleButton
                key={"toggle-" + tour.id}
                {...{ tour, standingsToggle, setStandingsToggle }}
              />
            ))}
        </div>
      )}
      <div className="mx-auto w-11/12">
        <StandingsHeader />
        {activeTour?.tourCards
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
          .filter(
            (obj) =>
              +(obj.position?.replace("T", "") ?? 0) <=
              (activeTour?.playoffSpots[0] ?? 0),
          )
          .map((tourCard) => (
            <StandingsListing
              key={tourCard.id}
              {...{
                tourCard,
                member,
                addingToFriends,
                setAddingToFriends,
              }}
            />
          ))}
        <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
          GOLD PLAYOFF CUT LINE
        </div>
        {activeTour?.tourCards
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
          .filter(
            (obj) =>
              +(obj.position?.replace("T", "") ?? 0) >
                (activeTour?.playoffSpots[0] ?? 0) &&
              +(obj.position?.replace("T", "") ?? 0) <=
                (activeTour?.playoffSpots[0] ?? 0) +
                  (activeTour?.playoffSpots[1] ?? 0),
          )
          .map((tourCard) => (
            <StandingsListing
              key={tourCard.id}
              {...{
                tourCard,
                member,
                addingToFriends,
                setAddingToFriends,
              }}
            />
          ))}
        <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
          SILVER PLAYOFF CUT LINE
        </div>
        {activeTour?.tourCards
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
          .filter(
            (obj) =>
              +(obj.position?.replace("T", "") ?? 0) >
              (activeTour?.playoffSpots[0] ?? 0) +
                (activeTour?.playoffSpots[1] ?? 0),
          )
          .map((tourCard) => (
            <StandingsListing
              key={tourCard.id}
              {...{
                tourCard,
                member,
                addingToFriends,
                setAddingToFriends,
              }}
            />
          ))}
      </div>
    </>
  );
}

/**
 * StandingsToggleButton Component
 *
 * Renders a button to toggle between tours in the standings view.
 *
 * Props:
 * - tour: The tour data.
 * - standingsToggle: The currently active tour ID.
 * - setStandingsToggle: Function to set the active tour.
 */
function StandingsToggleButton({
  tour,
  standingsToggle,
  setStandingsToggle,
}: {
  tour: Tour;
  standingsToggle: string;
  setStandingsToggle: Dispatch<SetStateAction<string>>;
}) {
  const [effect, setEffect] = useState(false);

  return (
    <button
      onClick={() => {
        setStandingsToggle(tour.id);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} mx-3 my-2 rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:px-10 md:text-xl ${
        standingsToggle === tour.id
          ? "shadow-btn bg-gray-600 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-800"
      }`}
      onAnimationEnd={() => setEffect(false)}
    >
      {tour.shortForm}
    </button>
  );
}

/**
 * StandingsHeader Component
 *
 * Renders the header row for the standings table.
 */
function StandingsHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 text-center">
      <div className="col-span-2 place-self-center font-varela text-xs font-bold sm:text-sm">
        Rank
      </div>
      <div className="col-span-8 place-self-center font-varela text-base font-bold sm:text-lg">
        Name
      </div>
      <div className="col-span-4 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
        Cup Points
      </div>
      <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
        Earnings
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
function StandingsListing({
  tourCard,
  member,
  addingToFriends,
  setAddingToFriends,
  className,
}: {
  tourCard: TourCard;
  member: Member | null|undefined;
  addingToFriends: boolean;
  setAddingToFriends: Dispatch<SetStateAction<boolean>>;
  className?: string;
}) {
  const utils = api.useUtils();
  const [isFriendChanging, setIsFriendChanging] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const handleAddFriend = async () => {
    if (addingToFriends) return;
    setAddingToFriends(true);
    setIsFriendChanging(true);
    if (member) {
      await addFriendsToMember({
        member,
        friendId: tourCard.memberId,
      });
    }
    await utils.member.invalidate();
    setIsFriendChanging(false);
    setAddingToFriends(false);
  };

  const handleRemoveFriend = async () => {
    if (addingToFriends) return;
    setAddingToFriends(true);
    setIsFriendChanging(true);
    if (member) {
      await removeFriendsFromMember({
        member,
        friendId: tourCard.memberId,
      });
    }
    await utils.member.invalidate();
    setIsFriendChanging(false);
    setAddingToFriends(false);
  };

  return (
    <div
      key={tourCard.id}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        className,
        "grid grid-flow-row grid-cols-17 rounded-lg py-[1px] text-center",
        member?.id === tourCard.memberId ? "bg-slate-200 font-semibold" : "",
        member?.friends.includes(tourCard.memberId) ? "bg-slate-100" : "",
      )}
    >
      {/* Player Rank */}
      <div className="col-span-2 place-self-center font-varela text-sm sm:text-base">
        {tourCard.position}
      </div>

      {/* Player Name */}
      <div className="col-span-8 place-self-center font-varela text-lg sm:text-xl">
        {tourCard.displayName}
        {tourCard.win > 0 && <LittleFucker {...{ tourCard }} />}
      </div>

      {/* Player Points */}
      <div className="col-span-4 place-self-center font-varela text-sm xs:text-base sm:text-lg">
        {tourCard.points}
      </div>

      {/* Player Earnings */}
      <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
        {formatMoney(tourCard.earnings)}
      </div>

      {/* Friend Actions */}
      {member &&
        (isFriendChanging ? (
          <LoadingSpinner className="h-3 w-3" />
        ) : member.friends.includes(tourCard.memberId) ? (
          <Star
            aria-disabled={isFriendChanging}
            fill="#111"
            size={12}
            className="m-auto cursor-pointer"
            onClick={handleRemoveFriend}
          />
        ) : member.id === tourCard.memberId ? null : (
          <Star
            size={12}
            className="m-auto cursor-pointer"
            onClick={handleAddFriend}
          />
        ))}
      {isOpen ? <StandingsTourCardInfo {...{ tourCard, member }} /> : <></>}
    </div>
  );
}
