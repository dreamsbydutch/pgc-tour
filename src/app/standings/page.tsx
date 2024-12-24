"use client";

import { useUser } from "@/src/lib/hooks/use-user";
import { formatMoney } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import { type Tour } from "@prisma/client";
import { type Dispatch, type SetStateAction, useState } from "react";

export default function PGCStandings() {
  const { user } = useUser();
  const [standingsToggle, setStandingsToggle] = useState("");
  const tours = api.tour.getActive.useQuery().data;
  const member = api.member.getById.useQuery({ memberId: user?.id }).data;
  const tourCard = api.tourCard.getByUserSeason.useQuery({
    userId: user?.id,
  }).data;
  console.log(member);

  if (!tours) return null;
  if (!tours[0]) return null;
  if (standingsToggle === "") {
    setStandingsToggle(
      tours.find((obj) => obj.id === tourCard?.seasonId)?.shortForm ?? "DbyD",
    );
  }
  const activeTour = tours?.find((tour) => tour.shortForm === standingsToggle);
  return (
    <>
      <div className="mb-4 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {activeTour?.name} Standings
      </div>
      <div className="mb-2 text-center text-sm text-gray-400 md:text-base">
        Tap on a tour player to view their stats and tournament history.
      </div>
      <div className="mx-auto my-4 text-center">
        {tours
          ?.sort((a, b) => a.shortForm.localeCompare(b.shortForm))
          .map((tour) => (
            <StandingsToggleButton
              key={"toggle-" + tour.id}
              {...{ tour, standingsToggle, setStandingsToggle }}
            />
          ))}
      </div>
      <div id="my-4">
        <div className="grid grid-flow-row grid-cols-8 text-center">
          <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
            Rank
          </div>
          <div className="col-span-4 place-self-center font-varela text-base font-bold sm:text-lg">
            Name
          </div>
          <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
            Cup Points
          </div>
          <div className="place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
            Earnings
          </div>
        </div>
        {activeTour?.tourCards
          .sort((a, b) => +a.createdAt - +b.createdAt)
          .map((tourCard) => (
            <div
              key={tourCard.id}
              className={`grid grid-flow-row grid-cols-8 rounded-lg text-center ${member?.friends && member?.friends.includes(tourCard.memberId) ? "bg-slate-100" : ""} ${user?.id === tourCard.memberId ? "bg-slate-200" : ""}`}
            >
              <div className="place-self-center font-varela text-sm sm:text-base">
                {tourCard.position}
              </div>
              <div className="col-span-4 place-self-center font-varela text-lg sm:text-xl">
                {tourCard.displayName}
              </div>
              <div className="col-span-2 place-self-center font-varela text-sm xs:text-base sm:text-lg">
                {tourCard.points}
              </div>
              <div className="place-self-center font-varela text-xs xs:text-sm sm:text-base">
                {formatMoney(tourCard.earnings)}
              </div>
            </div>
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
        setStandingsToggle(tour.shortForm);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} mx-3 my-2 rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:px-10 md:text-xl ${
        standingsToggle === tour.shortForm
          ? "shadow-btn bg-gray-600 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-800"
      }`}
      onAnimationEnd={() => setEffect(false)}
    >
      {tour.shortForm}
    </button>
  );
}
