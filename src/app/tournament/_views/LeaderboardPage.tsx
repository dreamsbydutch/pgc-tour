"use client";

import type { Golfer } from "@prisma/client";
import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  TeamData,
  TourCardData,
  TourData,
  TournamentData,
} from "@/src/types/prisma_include";
import Link from "next/link";
import { LeaderboardListing } from "./LeaderboardListing";

/**
 * LeaderboardPage Component
 *
 * Displays the leaderboard for a tournament, allowing users to toggle between tours.
 * - Shows golfers or teams based on the selected tour.
 * - Includes sorting logic for special positions (e.g., DQ, WD, CUT).
 *
 * Props:
 * - tournament: The tournament data.
 * - tours: The list of tours available for the tournament.
 * - tourCard (optional): The user's tour card data.
 * - inputTour: The initial active tour ID.
 */
export default function LeaderboardPage({
  tournament,
  tourCard,
  inputTour,
  tours,
  teams,
}: {
  tournament: TournamentData;
  tourCard: TourCardData;
  inputTour: string;
  tours: TourData[];
  teams: TeamData[];
}) {
  const [activeTour, setActiveTour] = useState<string>(
    inputTour && inputTour !== "" ? inputTour : tourCard.tourId,
  );
  tours = [
    ...tours,
    {
      id: "1",
      shortForm: "PGA",
      name: "PGA Tour",
      logoUrl: "",
      seasonId: tournament?.seasonId ?? "",
      buyIn: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tourCards: [],
      playoffSpots: [],
    },
  ];

  return (
    <div className="mt-2">
      {/* Admin-only link to tournament stats */}
      {tourCard.member.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}

      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {tours.map((tour) => (
          <ToggleButton
            key={tour.id}
            {...{ tour, activeTour, setActiveTour }}
          />
        ))}
      </div>

      {/* Leaderboard content */}
      <div>
        <LeaderboardHeaderRow
          {...{
            tournamentOver: tournament.currentRound === 5,
            activeTour:
              tours.find((tour) => tour.id === activeTour)?.shortForm ?? "",
          }}
        />
        {tours.find((tour) => tour.id === activeTour)?.shortForm === "PGA" ? (
          sortGolfersForSpecialPositions(tournament.golfers ?? []).map(
            (golfer) => (
              <LeaderboardListing
                key={golfer.id}
                {...{ type: "PGA", tournament, tourCard, golfer }}
              />
            ),
          )
        ) : tours.find((tour) => tour.id === activeTour) ? (
          sortTeamsForSpecialPositions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .map((team) => (
              <LeaderboardListing
                key={team.id}
                {...{ type: "PGC", tournament, tourCard, team }}
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

/**
 * ToggleButton Component
 *
 * Renders a button to toggle between tours.
 *
 * Props:
 * - tour: The tour data.
 * - activeTour: The currently active tour ID.
 * - setActiveTour: Function to set the active tour.
 */
function ToggleButton({
  tour,
  activeTour,
  setActiveTour,
}: {
  tour: TourData;
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
      onAnimationEnd={() => setEffect(false)}
    >
      {tour?.shortForm}
    </button>
  );
}

/**
 * sortTeamsForSpecialPositions Function
 *
 * Sorts teams based on special positions (e.g., DQ, WD, CUT) and their scores.
 *
 * @param teams - The list of teams to sort.
 * @returns The sorted list of teams.
 */
function sortTeamsForSpecialPositions(teams: TeamData[]) {
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

/**
 * sortGolfersForSpecialPositions Function
 *
 * Sorts golfers based on special positions (e.g., DQ, WD, CUT) and their scores.
 *
 * @param golfers - The list of golfers to sort.
 * @returns The sorted list of golfers.
 */
function sortGolfersForSpecialPositions(golfers: Golfer[]) {
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

/**
 * LeaderboardHeaderRow Component
 *
 * Renders the header row for the leaderboard table.
 */
function LeaderboardHeaderRow({
  tournamentOver,
  activeTour,
}: {
  tournamentOver: boolean;
  activeTour: string;
}) {
  return (
    <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center sm:grid-cols-16">
      <div className="col-span-2 place-self-center font-varela text-sm font-bold sm:col-span-3">
        Rank
      </div>
      <div className="col-span-4 place-self-center font-varela text-base font-bold">
        Name
      </div>
      <div className="col-span-2 place-self-center font-varela text-sm font-bold">
        Score
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        {tournamentOver ? (activeTour === "PGA" ? "Group" : "Points") : "Today"}
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs sm:col-span-2">
        {tournamentOver
          ? activeTour === "PGA"
            ? "Rating"
            : "Earnings"
          : "Thru"}
      </div>
      <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
        R1
      </div>
      <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
        R2
      </div>
      <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
        R3
      </div>
      <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
        R4
      </div>
    </div>
  );
}
