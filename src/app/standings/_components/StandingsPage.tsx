"use client";

import { useUser } from "@/src/lib/hooks/use-user";
import { formatMoney } from "@/src/lib/utils";
import {
  addFriendsToMember,
  removeFriendsFromMember,
} from "@/src/server/api/actions/member";
import { api } from "@/src/trpc/react";
import type { Member, TourCard, Tour } from "@prisma/client";
import { Star } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { User } from "@supabase/supabase-js";
import LoadingSpinner from "../../_components/LoadingSpinner";
import type { TourData } from "@/src/types/prisma_include";

export default function PGCStandings({
  tours,
  tourCard,
  inputTour,
}: {
  tours: TourData[];
  tourCard: TourCard | null | undefined;
  inputTour?: string;
}) {
  const { user } = useUser();
  const [standingsToggle, setStandingsToggle] = useState<string>(
    inputTour && inputTour !== "" ? inputTour : (tourCard?.tourId ?? ""),
  );
  const [addingToFriends, setAddingToFriends] = useState(false);
  const member = api.member.getSelf.useQuery().data;

  const activeTour =
    tours.find((tour) => tour.id === standingsToggle) ?? tours[0];

  return (
    <>
      <div className="mb-4 mt-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {activeTour?.name} Standings
      </div>
      {/* <div className="mb-2 text-center text-sm text-gray-400 md:text-base">
        Tap on a tour player to view their stats and tournament history.
      </div> */}
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
      <div id="my-4">
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
        {member &&
          user &&
          activeTour?.tourCards
            .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
            .map((tourCard) => (
              <StandingsListing
                key={tourCard.id}
                {...{
                  tourCard,
                  member,
                  user,
                  addingToFriends,
                  setAddingToFriends,
                }}
              />
            ))}
      </div>
    </>
  );
}

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

function StandingsListing({
  tourCard,
  member,
  user,
  addingToFriends,
  setAddingToFriends,
}: {
  tourCard: TourCard;
  member: Member;
  user: User;
  addingToFriends: boolean;
  setAddingToFriends: Dispatch<SetStateAction<boolean>>;
}) {
  const utils = api.useUtils();
  const [isfriendChanging, setIsFriendChanging] = useState(false);
  return (
    <div
      key={tourCard.id}
      className={`grid grid-flow-row grid-cols-17 rounded-lg text-center ${member.friends.includes(tourCard.memberId) ? "bg-slate-100" : ""} ${user.id === tourCard.memberId ? "bg-slate-200 font-semibold" : ""}`}
    >
      <div className="col-span-2 place-self-center font-varela text-sm sm:text-base">
        {tourCard.position}
      </div>
      <div className="col-span-8 place-self-center font-varela text-lg sm:text-xl">
        {tourCard.displayName}
      </div>
      <div className="col-span-4 place-self-center font-varela text-sm xs:text-base sm:text-lg">
        {tourCard.points}
      </div>
      <div className="col-span-2 place-self-center font-varela text-xs xs:text-sm sm:text-base">
        {formatMoney(tourCard.earnings)}
      </div>
      {isfriendChanging ? (
        <LoadingSpinner className="h-3 w-3" />
      ) : member.friends.includes(tourCard.memberId) ? (
        <Star
          aria-disabled={isfriendChanging}
          fill="#111"
          size={12}
          className="m-auto"
          onClick={async () => {
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
            return;
          }}
        />
      ) : user.id === tourCard.memberId ? (
        <></>
      ) : (
        <Star
          size={12}
          className="m-auto"
          onClick={async () => {
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
            return;
          }}
        />
      )}
    </div>
  );
}
