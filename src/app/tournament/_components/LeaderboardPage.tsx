"use client";

import type { Golfer, Member, TourCard } from "@prisma/client";
import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  TeamData,
  TourData,
  TournamentData,
} from "@/src/types/prisma_include";
import { useRouter } from "next/navigation";
import { PGAListing } from "./PGALeaderboard";
import { PGCListing } from "./PGCLeaderboard";
import { api } from "@/src/trpc/react";

export default function LeaderboardPage({
  tournament,
  tours,
  member,
  tourCard,
}: {
  tournament: TournamentData;
  tours: TourData[];
  member: Member;
  tourCard: TourCard;
}) {
  const [activeTour, setActiveTour] = useState<string>(tourCard.tourId);
  const golfers = api.golfer.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    { staleTime: 60 * 1000 },
  ).data;
  const teams = api.team.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    { staleTime: 60 * 1000 },
  ).data;

  return (
    <div className="mt-2">
      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {tours.map((tour) => (
          <ToggleButton
            {...{
              tour,
              activeTour,
              setActiveTour,
            }}
            key={tour.id}
          />
        ))}
      </div>
      <div>
        <LeaderboardHeaderRow />
        {activeTour === tours.find((tour) => tour.shortForm === "PGA")?.id ? (
          sortGolfersForSpecialPostions(golfers ?? []).map((obj) => (
            <PGAListing key={obj.id} {...{ golfer: obj }} />
          ))
        ) : activeTour ===
          tours.find((tour) => tour.shortForm === "DbyD")?.id ? (
          sortTeamsForSpecialPostions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
            .map((obj) => (
              <PGCListing
                key={obj.id}
                {...{ tournament, team: obj, golfers, member }}
              />
            ))
        ) : activeTour ===
          tours.find((tour) => tour.shortForm === "CCG")?.id ? (
          sortTeamsForSpecialPostions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .map((obj) => (
              <PGCListing
                key={obj.id}
                {...{ tournament, team: obj, golfers, member }}
              />
            ))
        ) : (
          <div className="py-4 text-center text-lg font-bold">
            Choose a tour using the toggle buttons
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  tour,
  activeTour,
  setActiveTour,
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
}) {
  const [effect, setEffect] = useState(false);
  return (
    <button
      key={tour.id}
      onClick={() => {
        setActiveTour(tour.id);
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
      {tour?.shortForm}
    </button>
  );
}

function LeaderboardHeaderRow() {
  return (
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
  );
}

function sortTeamsForSpecialPostions(teams: TeamData[]) {
  return teams.sort(
    (a, b) =>
      (a.position === "DQ"
        ? 999 + (a.score ?? 999)
        : a.position === "WD"
          ? 888 + (a.score ?? 999)
          : a.position === "CUT"
            ? 444 + (a.score ?? 999)
            : (a.score ?? 999)) -
      (b.position === "DQ"
        ? 999 + (b.score ?? 999)
        : b.position === "WD"
          ? 888 + (b.score ?? 999)
          : b.position === "CUT"
            ? 444 + (b.score ?? 999)
            : (b.score ?? 999)),
  );
}

function sortGolfersForSpecialPostions(golfers: Golfer[]) {
  return golfers.sort(
    (a, b) =>
      (a.position === "DQ"
        ? 999 + (a.score ?? 999)
        : a.position === "WD"
          ? 888 + (a.score ?? 999)
          : a.position === "CUT"
            ? 444 + (a.score ?? 999)
            : (a.score ?? 999)) -
      (b.position === "DQ"
        ? 999 + (b.score ?? 999)
        : b.position === "WD"
          ? 888 + (b.score ?? 999)
          : b.position === "CUT"
            ? 444 + (b.score ?? 999)
            : (b.score ?? 999)),
  );
}
