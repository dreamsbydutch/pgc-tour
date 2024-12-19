"use client";

import { api } from "@/src/trpc/react";
import { type Tour } from "@prisma/client";
import { type Dispatch, type SetStateAction, useState } from "react";

export default function PGCStandings() {
  const [standingsToggle, setStandingsToggle] = useState("DbyD");
  const tours = api.tour.getActive.useQuery();

  if (!tours.data) return null;
  if (!tours.data[0]) return null;
  if (standingsToggle === "") {
    setStandingsToggle(tours.data[0].shortForm);
  }
  const activeTour = tours.data?.find(
    (tour) => tour.shortForm === standingsToggle,
  );
  return (
    <>
      <div className="mb-4 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {activeTour?.name} Standings
      </div>
      <div className="mb-2 text-center text-sm text-gray-400 md:text-base">
        Tap on a tour player to view their stats and tournament history.
      </div>
      <div className="mx-auto my-4 text-center">
        {tours.data?.map((tour) => (
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
        {activeTour?.tourCards.map((tourCard) => (
          <div
            key={tourCard.id}
            className="grid grid-flow-row grid-cols-8 text-center"
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
              {tourCard.earnings}
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
