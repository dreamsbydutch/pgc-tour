"use client";

import { Member, TourCard, Tournament } from "@prisma/client";
import { LeaderboardListing } from "./LeaderboardListing";
import ToursToggle from "./ToursToggle";
import { type Dispatch, type SetStateAction, useState } from "react";
import { TourData } from "@/src/types/prisma_include";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../_components/LoadingSpinner";

export default function LeaderboardPage({
  tournament,
  tours,
  member,
  tourCard,
}: {
  tournament: Tournament;
  tours: TourData[];
  member: Member;
  tourCard: TourCard;
}) {
  const [activeTourLoading, setActiveTourLoading] = useState<
    boolean | undefined
  >(false);
  const [activeTour, setActiveTour] = useState<string>(tourCard.tourId);
  

  return (
    <div className="mt-2">
      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {tours.map((tour) => (
          <ToggleButton
            {...{
              tour,
              activeTour,
              setActiveTour,
              activeTourLoading,
              setActiveTourLoading,
            }}
            key={tour.id}
          />
        ))}
      </div>
      <div>
        <div className="mx-auto grid max-w-xl grid-flow-row grid-cols-10 text-center">
          <div className="col-span-2 place-self-center font-varela text-sm font-bold">
            Rank
          </div>
          <div className="col-span-4 place-self-center font-varela text-base font-bold">
            Name
          </div>
          <div className="col-span-2 place-self-center font-varela text-sm font-bold">
            Score
          </div>
          <div className="col-span-1 place-self-center font-varela text-2xs">
            Today
          </div>
          <div className="col-span-1 place-self-center font-varela text-2xs">
            Thru
          </div>
        </div>
        {/* <LeaderboardListing {...{ tournament }} /> */}
      </div>
    </div>
  );
}

function ToggleButton({
  tour,
  activeTour,
  setActiveTour,
  activeTourLoading,
  setActiveTourLoading,
}: {
  tour:
    | {
        id: string;
        name: string;
        logoUrl: string;
        shortForm: string;
        buyIn: number | null;
      }
    | {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        shortForm: string;
        logoUrl: string;
        seasonId: string;
      };
  activeTour: string;
  setActiveTour: Dispatch<SetStateAction<string>>;
  activeTourLoading: boolean | undefined;
  setActiveTourLoading: Dispatch<SetStateAction<boolean | undefined>>;
}) {
  const [effect, setEffect] = useState(false);
  const router = useRouter();
  return (
    <button
      key={tour.id}
      onClick={() => {
        router.push("?tour=" + tour.shortForm);
        setActiveTour(tour.id);
        setActiveTourLoading(true);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:text-xl ${
        tour.id === activeTour
          ? "shadow-btn bg-gray-700 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-700"
      }`}
      onAnimationEnd={() => {
        setEffect(false);
      }}
    >
      {activeTourLoading && tour.id === activeTour ? (
        <LoadingSpinner className="my-0 h-7 w-7" />
      ) : (
        tour?.shortForm
      )}
    </button>
  );
}
