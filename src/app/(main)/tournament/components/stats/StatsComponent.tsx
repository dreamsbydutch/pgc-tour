"use client";

import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { cn, formatScore } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useLeaderboardData } from "@/src/lib/store/hooks/useLeaderboardData";
import { useTournamentData } from "@/src/lib/store/hooks/useTournamentData";
import type { Team, Tour, TourCard, Tournament } from "@prisma/client";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";

export default function StatsComponent({
  tournament,
  tours,
  tourCard,
  _onClose,
}: {
  tournament: Tournament;
  tours: Tour[];
  tourCard?: TourCard;
  _onClose: () => void;
}) {
  const [activeTour, setActiveTour] = useState<string>(tourCard?.tourId ?? "");

  // Use new hooks for data
  const { pastTournaments } = useTournamentData();
  const { teams: leaderboardTeams, lastUpdated: mainStoreLastUpdated } =
    useLeaderboardData(tournament.id);

  // First check if we already have the data in the store
  const pastTournament = pastTournaments.find((t) => t.id === tournament.id);
  // Check if stored data is stale (older than 5 minutes)
  const isDataStale = () => {
    if (!mainStoreLastUpdated) return true;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return mainStoreLastUpdated.getTime() < fiveMinutesAgo;
  };
  // Add a state to track when the user manually triggers a refresh
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Fetch teams data if:
  // 1. No data in store, or
  // 2. Data is stale, or
  // 3. User manually refreshes
  const {
    data: fetchedTeams,
    isLoading: isFetchingTeams,
    refetch: _refetch,
  } = api.team.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      enabled: !leaderboardTeams || isDataStale() || refreshTrigger > 0,
    },
  );

  // Use data from store if available and not stale, otherwise use fetched data
  const teams = (() => {
    if (!isDataStale() && leaderboardTeams) {
      return leaderboardTeams;
    }
    return fetchedTeams;
  })();

  const isLoading = isFetchingTeams && !teams;
  // Get the currently active teams for the selected tour
  const tourTeams =
    teams?.filter(
      (team: Team & { tourCard?: TourCard | null }) =>
        team.tourCard?.tourId === activeTour,
    ) ?? []; // Helper function to get sorted teams based on tour type
  const getSortedTeams = () => {
    if (!teams) return [];

    const filteredTeams = teams.filter(
      (team: Team & { tourCard?: TourCard | null }) =>
        team.tourCard?.tourId === activeTour,
    );
    return sortTeamsForSpecialPostions(filteredTeams);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading tournament statistics...</p>
      </div>
    );
  }

  return (
    <div className="mt-2 px-2">
      {/* Refresh button with last update time */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {mainStoreLastUpdated && (
            <span>
              Last updated:
              {new Date(mainStoreLastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={isFetchingTeams}
          className="flex items-center justify-center rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
        >
          {isFetchingTeams ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              {isDataStale() ? "Update Stale Data" : "Refresh Data"}
            </>
          )}
        </button>
      </div>

      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {tours.map((tour) => (
          <ToggleButton
            tour={tour}
            activeTour={activeTour}
            setActiveTour={setActiveTour}
            key={tour.id}
          />
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-800 text-center font-bold text-gray-50">
            <TableCell>Rank</TableCell>
            <TableCell colSpan={4}>Name</TableCell>
            <TableCell>Score</TableCell>
            {[1, 2, 3, 4].map((round) => (
              <TableCell key={`round-${round}`} colSpan={4}>
                Round {round}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>

        {activeTour ? (
          getSortedTeams().length > 0 ? (
            getSortedTeams().map((team) => (
              <StatsListing
                key={team.id}
                team={team}
                teams={teams ?? []}
                tourTeams={tourTeams}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={22} className="py-4 text-center text-lg">
                No data available for this tour
              </TableCell>
            </TableRow>
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={22}
              className="py-4 text-center text-lg font-bold"
            >
              Choose a tour using the toggle buttons
            </TableCell>
          </TableRow>
        )}
      </Table>
    </div>
  );
}

function ToggleButton({
  tour,
  activeTour,
  setActiveTour,
}: {
  tour: Tour;
  activeTour: string;
  setActiveTour: Dispatch<SetStateAction<string>>;
}) {
  const [effect, setEffect] = useState(false);

  return (
    <button
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

function sortTeamsForSpecialPostions(
  teams: (Team & { tourCard?: TourCard | null })[],
) {
  return teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort((a, b) => {
      const getAdjustedScore = (
        team: Team & { tourCard?: TourCard | null },
      ) => {
        const score = team.score ?? 999;
        if (team.position === "DQ") return 999 + score;
        if (team.position === "WD") return 888 + score;
        if (team.position === "CUT") return 444 + score;
        return score;
      };

      return getAdjustedScore(a) - getAdjustedScore(b);
    });
}

function StatsListing({
  team,
  teams,
  tourTeams,
}: {
  team: Team & { tourCard?: TourCard | null };
  teams: (Team & { tourCard?: TourCard | null })[];
  tourTeams: (Team & { tourCard?: TourCard | null })[];
}) {
  // Get current season for tour cards data
  const { data: currentSeason } = api.season.getCurrent.useQuery();
  const { data: tourCards } = api.tourCard.getBySeason.useQuery(
    {
      seasonId: currentSeason?.id ?? "",
    },
    {
      enabled: !!currentSeason?.id,
    },
  );

  // First try to use the already joined tourCard, fallback to finding it in tourCards
  const tourCard =
    team.tourCard ?? tourCards?.find((card) => card.id === team.tourCardId);

  return (
    <TableRow className="border-slate-900 text-center">
      <TableCell className="border-l border-slate-900 text-sm">
        {team.position}
      </TableCell>
      <TableCell colSpan={4} className="whitespace-nowrap text-sm">
        {tourCard?.displayName ?? "Unknown Team"}
      </TableCell>
      <TableCell className="border-r border-slate-900 text-xs">
        {team.score}
      </TableCell>
      <RoundCell
        roundNum={1}
        roundScore={team.roundOne}
        team={team}
        teams={teams}
        tourTeams={tourTeams}
      />
      <RoundCell
        roundNum={2}
        roundScore={team.roundTwo}
        team={team}
        teams={teams}
        tourTeams={tourTeams}
      />
      <RoundCell
        roundNum={3}
        roundScore={team.roundThree}
        team={team}
        teams={teams}
        tourTeams={tourTeams}
      />
      <RoundCell
        roundNum={4}
        roundScore={team.roundFour}
        team={team}
        teams={teams}
        tourTeams={tourTeams}
      />
    </TableRow>
  );
}

function RoundCell({
  roundNum,
  roundScore,
  team,
  teams,
  tourTeams,
}: {
  roundNum: 1 | 2 | 3 | 4;
  roundScore: number | null;
  team: Team & { tourCard?: TourCard | null };
  teams: (Team & { tourCard?: TourCard | null })[];
  tourTeams: (Team & { tourCard?: TourCard | null })[];
}) {
  // Helper functions
  const getRoundProperty = (team: Team, round: 1 | 2 | 3 | 4) => {
    switch (round) {
      case 1:
        return team.roundOne;
      case 2:
        return team.roundTwo;
      case 3:
        return team.roundThree;
      case 4:
        return team.roundFour;
    }
  };

  const getCumulativeScoreUpToRound = (team: Team, round: 1 | 2 | 3 | 4) => {
    let score = 0;
    for (let i = 1; i <= round; i++) {
      score += getRoundProperty(team, i as 1 | 2 | 3 | 4) ?? 999;
    }
    return score;
  };

  // Calculate values for this round
  const roundAvg =
    teams.reduce((p, c) => p + (getRoundProperty(c, roundNum) ?? 999), 0) /
    teams.length;
  const roundDiff = (roundScore ?? 999) - roundAvg;
  const formattedDiff = formatScore(Math.round(roundDiff * 10) / 10);

  // Calculate rankings
  const sameRoundScoreCount = tourTeams.filter(
    (a) => (getRoundProperty(a, roundNum) ?? 999) === (roundScore ?? 999),
  ).length;

  const betterRoundScoreCount = tourTeams.filter(
    (a) => (getRoundProperty(a, roundNum) ?? 999) < (roundScore ?? 999),
  ).length;

  const roundRankPrefix = sameRoundScoreCount > 1 ? "T" : "";
  const roundRank = `${roundRankPrefix}${betterRoundScoreCount + 1}`;

  // Calculate cumulative ranking
  const currentTeamCumulativeScore = getCumulativeScoreUpToRound(
    team,
    roundNum,
  );

  const sameCumulativeScoreCount = tourTeams.filter(
    (a) =>
      getCumulativeScoreUpToRound(a, roundNum) === currentTeamCumulativeScore,
  ).length;

  const betterCumulativeScoreCount = tourTeams.filter(
    (a) =>
      getCumulativeScoreUpToRound(a, roundNum) < currentTeamCumulativeScore,
  ).length;

  const cumulativeRankPrefix = sameCumulativeScoreCount > 1 ? "T" : "";
  const cumulativeRank = `${cumulativeRankPrefix}${betterCumulativeScoreCount + 1}`;

  return (
    <>
      <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
        {roundScore}
      </TableCell>
      <TableCell className="text-2xs font-semibold">{roundRank}</TableCell>
      <TableCell className="whitespace-nowrap text-2xs font-semibold">
        {cumulativeRank}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
          Math.round(roundDiff * 10) / 10 < 0
            ? "bg-green-50 text-green-900"
            : "bg-red-50 text-red-900",
        )}
      >
        {formattedDiff}
      </TableCell>
    </>
  );
}
