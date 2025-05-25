"use client";

import type {
  Course,
  Golfer,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { useState } from "react";
import Link from "next/link";
import { LeaderboardListing } from "../_components/LeaderboardListing";
import { useLeaderboardStore, useMainStore } from "@/src/lib/store/store";
import { ToursToggleButton } from "../../standings/_components/StandingsPage";
import { api } from "@/src/trpc/react";

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
  inputTour,
}: {
  tournament: Tournament & { course: Course | null };
  inputTour: string;
}) {
  let tours = useMainStore((state) => state.tours);
  const pastTournament = useMainStore((state) => state.pastTournaments)?.find(
    (t) => t.id === tournament.id,
  );
  const tourCard = useMainStore((state) => state.currentTourCard);
  const member = useMainStore((state) => state.currentMember);
  const storedGolfers = useLeaderboardStore((state) => state.golfers);
  const storedTeams = useLeaderboardStore((state) => state.teams);
  const golfers = pastTournament ? pastTournament.golfers : storedGolfers;
  const teamsData = pastTournament ? pastTournament.teams : storedTeams;

  const [activeTour, setActiveTour] = useState<string>(
    inputTour && inputTour !== "" ? inputTour : (tourCard?.tourId ?? ""),
  );
  tours = [
    ...(tours ?? []),
    {
      id: "pga",
      shortForm: "PGA",
      name: "PGA Tour",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
      seasonId: tournament?.seasonId ?? "",
      buyIn: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      playoffSpots: [],
    },
  ];

  return (
    <div className="mt-2">
      {/* Admin-only link to tournament stats */}
      {member?.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}

      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-full max-w-xl items-center justify-center gap-4">
        {tours.map((tour) => (
          <ToursToggleButton
            key={tour.id}
            tour={tour}
            tourToggle={activeTour}
            setTourToggle={setActiveTour}
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
          sortGolfersForSpecialPositions(golfers ?? []).map((golfer) => (
            <LeaderboardListing
              key={golfer.id}
              {...{
                type: "PGA",
                tournament,
                tourCard,
                golfer,
              }}
            />
          ))
        ) : tours.find((tour) => tour.id === activeTour) ? (
          sortTeamsForSpecialPositions(teamsData ?? [])
            .filter((team) => team.tourCard?.tourId === activeTour)
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
export function HistoricalLeaderboardPage({
  tournament,
}: {
  tournament: Tournament & { course: Course | null };
}) {
  let tours = api.tour.getBySeason.useQuery({
    seasonID: tournament?.seasonId ?? "",
  }).data;
  const tourCard = useMainStore((state) => state.currentTourCard);
  const member = useMainStore((state) => state.currentMember);
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament?.id ?? "",
  }).data;
  const teamsData = api.team.getByTournament.useQuery({
    tournamentId: tournament?.id ?? "",
  }).data;
  const inputTour = tours?.[0]?.id ?? "";

  const [activeTour, setActiveTour] = useState<string>(
    inputTour && inputTour !== "" ? inputTour : (tours?.[0]?.id ?? ""),
  );
  tours = [
    ...(tours ?? []),
    {
      id: "pga",
      shortForm: "PGA",
      name: "PGA Tour",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
      seasonId: tournament?.seasonId ?? "",
      buyIn: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      playoffSpots: [],
    },
  ];

  return (
    <div className="mt-2">
      {/* Admin-only link to tournament stats */}
      {member?.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}

      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-full max-w-xl items-center justify-center gap-4">
        {tours.map((tour) => (
          <ToursToggleButton
            key={tour.id}
            tour={tour}
            tourToggle={activeTour}
            setTourToggle={setActiveTour}
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
          sortGolfersForSpecialPositions(golfers ?? []).map((golfer) => (
            <LeaderboardListing
              key={golfer.id}
              {...{
                type: "PGA",
                tournament,
                tourCard,
                golfer,
              }}
            />
          ))
        ) : tours.find((tour) => tour.id === activeTour) ? (
          sortTeamsForSpecialPositions(teamsData ?? [])
            .filter((team) => team.tourCard?.tourId === activeTour)
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
export function PlayoffLeaderboardPage({
  tournament,
}: {
  tournament: Tournament & { course: Course | null };
}) {
  const actualTours = api.tour.getBySeason.useQuery({
    seasonID: tournament?.seasonId ?? "",
  }).data;
  const tourCard = useMainStore((state) => state.currentTourCard);
  const member = useMainStore((state) => state.currentMember);
  const tourCards = api.tourCard.getBySeason.useQuery({
    seasonId: tournament?.seasonId ?? "",
  }).data;
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament?.id ?? "",
  }).data;
  const teamsData = api.team.getByTournament.useQuery({
    tournamentId: tournament?.id ?? "",
  }).data;

  const [activeTour, setActiveTour] = useState<string>("gold");
  const goldPlayoff = {
    name: "Gold Playoffs",
    shortForm: "Gold",
    seasonId: tourCard?.seasonId ?? "",
    id: "gold",
    buyIn: 0,
    playoffSpots: [
      actualTours?.reduce((p, c) => (p += +(c.playoffSpots[0] ?? 0)), 0) ?? 0,
    ],
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    updatedAt: new Date(),
    createdAt: new Date(),
  };
  const silverPlayoff = {
    name: "Silver Playoffs",
    shortForm: "Silver",
    seasonId: tourCard?.seasonId ?? "",
    id: "silver",
    buyIn: 0,
    playoffSpots: [
      actualTours?.reduce((p, c) => (p += +(c.playoffSpots[1] ?? 0)), 0) ?? 0,
    ],
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNDs7T9FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    updatedAt: new Date(),
    createdAt: new Date(),
  };
  const soloPlayoff = {
    name: "PGC Playoffs",
    shortForm: "Playoffs",
    seasonId: tourCard?.seasonId ?? "",
    id: "playoffs",
    buyIn: 0,
    playoffSpots: [
      actualTours?.reduce((p, c) => (p += +(c.playoffSpots[0] ?? 0)), 0) ?? 0,
    ],
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    updatedAt: new Date(),
    createdAt: new Date(),
  };
  const pgaPlayoff = {
    id: "pga",
    shortForm: "PGA",
    name: "PGA Tour",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
    seasonId: tournament?.seasonId ?? "",
    buyIn: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    playoffSpots: [],
  };

  const maxPlayoff = Math.max(...(tourCards?.map((a) => a.playoff) ?? []));
  const tours =
    maxPlayoff > 1
      ? [goldPlayoff, silverPlayoff, pgaPlayoff]
      : [soloPlayoff, pgaPlayoff];

  return (
    <div className="mt-2">
      {/* Admin-only link to tournament stats */}
      {member?.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}

      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-full max-w-xl items-center justify-center gap-4">
        {tours.map((tour) => (
          <ToursToggleButton
            key={tour.id}
            tour={tour}
            tourToggle={activeTour}
            setTourToggle={setActiveTour}
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
          sortGolfersForSpecialPositions(golfers ?? []).map((golfer) => (
            <LeaderboardListing
              key={golfer.id}
              {...{
                type: "PGA",
                tournament,
                tourCard,
                golfer,
              }}
            />
          ))
        ) : tours.find((tour) => tour.id === activeTour) ? (
          sortTeamsForSpecialPositions(teamsData ?? [])
            .filter(
              (t) =>
                t.tourCard?.playoff ===
                (activeTour === "gold" ? 1 : activeTour === "silver" ? 2 : 1),
            )
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

function sortTeamsForSpecialPositions(
  teams: (Team & { tourCard: TourCard | null })[],
) {
  return teams
    ?.sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
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
