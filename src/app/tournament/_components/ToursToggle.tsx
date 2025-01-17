"use client";

import { api } from "@/src/trpc/react";
import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { LeaderboardListSkeleton } from "./skeletons/LeaderboardListSkeleton";

export default function ToursToggle({
  children,
  tournamentId,
  searchParams,
}: {
  children: ReactNode;
  tournamentId: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const date = new Date();
  const year = date.getFullYear();
  const [activeTourLoading, setActiveTourLoading] = useState<
    boolean | undefined
  >(false);
  const [activeTourShortForm, setActiveTourShortForm] = useState<string>(
    searchParams?.tour ?? "PGA",
  );
  useEffect(() => {
    if (searchParams?.tour === activeTourShortForm) {
      setActiveTourLoading(false);
    }
  }, [activeTourLoading, activeTourShortForm, searchParams?.tour]);

  const { data: tournament } = api.tournament.getById.useQuery({
    tournamentId: tournamentId,
  });
  const { data: tours } = api.tour.getBySeason.useQuery({
    seasonID: tournament?.seasonId,
  });

  if (!tournament) return <LeaderboardListSkeleton />;

  const toursInPlay = tours && [
    ...tours,
    {
      id: "1",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "PGA Tour",
      shortForm: "PGA",
      logoUrl: "",
      seasonId: tournament.seasonId,
    },
  ];

  if (!toursInPlay) return <LeaderboardListSkeleton />;
  return (
    <div className="mt-2">
      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {toursInPlay.map((tour) => (
          <ToggleButton
            {...{
              tour,
              activeTourShortForm,
              setActiveTourShortForm,
              activeTourLoading,
              setActiveTourLoading,
            }}
            key={tour.id}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({
  tour,
  activeTourShortForm,
  setActiveTourShortForm,
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
  activeTourShortForm: string;
  setActiveTourShortForm: Dispatch<SetStateAction<string>>;
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
        setActiveTourShortForm(tour.shortForm);
        setActiveTourLoading(true);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:text-xl ${
        tour.shortForm === activeTourShortForm
          ? "shadow-btn bg-gray-700 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-700"
      }`}
      onAnimationEnd={() => {
        setEffect(false);
      }}
    >
      {activeTourLoading && tour.shortForm === activeTourShortForm ? (
        <LoadingSpinner className="my-0 h-7 w-7" />
      ) : (
        tour?.shortForm
      )}
    </button>
  );
}
