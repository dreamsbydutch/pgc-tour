"use client";

import type { Golfer } from "@prisma/client";
import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  TeamData,
  TourCardData,
  TourData,
  TournamentData,
} from "@/src/types/prisma_include";
import { PGAListing } from "./PGALeaderboard";
import { api } from "@/src/trpc/react";
import Link from "next/link";
import { PGCListing } from "./PGCLeaderboard";
import { LeaderboardHeaderRow } from "../_components/LeaderboardHeaderRow";

export default function LeaderboardPage({
  tournament,
  tours,
  tourCard,
  inputTour,
}: {
  tournament: TournamentData;
  tours: TourData[];
  tourCard?: TourCardData;
  inputTour: string;
}) {
  const [activeTour, setActiveTour] = useState<string>(
    inputTour && inputTour !== "" ? inputTour : (tourCard?.tourId ?? ""),
  );
  const golfers = api.golfer.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    { staleTime: 30 * 1000 },
  ).data;
  const teams = api.team.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    { staleTime: 30 * 1000 },
  ).data;
  const userTeam = teams?.find((obj) => obj.tourCardId === tourCard?.id);

  return (
    <div className="mt-2">
      {tourCard?.member.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}
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
        {tours.find((tour) => tour.id === activeTour)?.shortForm === "PGA" ? (
          sortGolfersForSpecialPostions(golfers ?? []).map((obj) => (
            <PGAListing
              key={obj.id}
              {...{ tournament, golfer: obj, userTeam }}
            />
          ))
        ) : tours.find((tour) => tour.id === activeTour) ? (
          sortTeamsForSpecialPostions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .map((obj) => (
              <PGCListing
                key={obj.id}
                {...{ tournament, team: obj, golfers, tourCard }}
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

function sortTeamsForSpecialPostions(teams: TeamData[]) {
  return teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
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
