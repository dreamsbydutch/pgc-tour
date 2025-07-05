import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";
import {
  sortGolfers,
  isEmpty,
  isDefined,
  getDaysBetween,
  getTournamentStatus,
} from "@/lib/utils";

/**
 * Smart hook that returns tournament leaderboard data.
 * Automatically chooses the best data source:
 * - Current season tournaments: Uses seasonal store (fast, no API calls)
 * - Historical tournaments: Uses API calls (as needed)
 *
 * @param tournamentId - The ID of the tournament
 * @param options - Configuration options
 * @returns Tournament leaderboard with teams grouped by tour
 */
export function useTournamentLeaderboard(
  tournamentId: string | undefined,
  options?: {
    forceAPI?: boolean; // Force API call even for current season
    refreshInterval?: number; // Refresh interval for current tournament (default: 2 min)
  },
) {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const currentSeason = useSeasonalStore((state) => state.currentSeason);

  // Early validation
  if (!tournamentId) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No tournament ID provided",
      isLoading: false,
      status: "error" as const,
      dataSource: "none" as const,
    };
  }

  // Check if tournament exists in current season (unless forced to use API)
  const isCurrentSeason =
    !options?.forceAPI && tournaments?.some((t) => t.id === tournamentId);

  // Use seasonal store for current season tournaments
  if (isCurrentSeason && tournaments && tours && tourCards) {
    const tournament = tournaments.find((t) => t.id === tournamentId)!;
    const tournamentStatus = getTournamentStatus(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    );

    // For current/active tournaments, optionally use API with refresh
    const shouldUseRefreshAPI =
      tournamentStatus === "current" && options?.refreshInterval;

    if (shouldUseRefreshAPI) {
      return useCurrentTournamentWithRefresh(
        tournamentId,
        options.refreshInterval,
      );
    }

    // Use store data for completed/upcoming tournaments
    return buildLeaderboardFromStore(tournament, tours, tourCards, "store");
  }

  // Use API for historical tournaments or when forced
  return useHistoricalTournamentAPI(tournamentId);
}

/**
 * Smart hook for member history across seasons.
 * Automatically chooses data source:
 * - Current season only: Uses seasonal store
 * - All seasons or specific historical season: Uses API
 *
 * @param memberId - The member ID
 * @param options - Configuration options
 */
export function useMemberHistory(
  memberId: string | undefined,
  options?: {
    seasonId?: string; // Specific season, or undefined for current season
    allSeasons?: boolean; // Get all seasons (forces API)
    includeMissed?: boolean; // Include missed tournaments (current season only)
  },
) {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const tiers = useSeasonalStore((state) => state.tiers);
  const currentSeason = useSeasonalStore((state) => state.currentSeason);

  // Early validation
  if (!memberId) {
    return {
      teams: [],
      error: "No member ID provided",
      isLoading: false,
      status: "error" as const,
      dataSource: "none" as const,
    };
  }

  // Use API for all seasons or specific historical season
  if (
    options?.allSeasons ||
    (options?.seasonId && options.seasonId !== currentSeason?.id)
  ) {
    return useMemberHistoryAPI(memberId, options);
  }

  // Use store for current season
  if (tournaments && tours && tourCards && tiers) {
    return buildMemberHistoryFromStore(
      memberId,
      { tournaments, tours, tourCards, tiers },
      options,
    );
  }

  // Loading state
  return {
    teams: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading" as const,
    dataSource: "store" as const,
  };
}

/**
 * Smart hook for tour card teams.
 * Automatically chooses data source based on what's needed.
 *
 * @param tourCardId - The tour card ID
 * @param options - Configuration options
 */
export function useTourCardHistory(
  tourCardId: string | undefined,
  options?: {
    seasonId?: string; // Specific season, undefined for current
    allSeasons?: boolean; // Get all seasons
    currentSeasonOnly?: boolean; // Force current season only
  },
) {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const tiers = useSeasonalStore((state) => state.tiers);
  const currentSeason = useSeasonalStore((state) => state.currentSeason);

  // Early validation
  if (!tourCardId) {
    return {
      teams: [],
      error: "No tour card ID provided",
      isLoading: false,
      status: "error" as const,
      dataSource: "none" as const,
    };
  }

  // Use API for historical seasons or all seasons
  if (
    options?.allSeasons ||
    (options?.seasonId && options.seasonId !== currentSeason?.id)
  ) {
    return useTourCardHistoryAPI(tourCardId, options);
  }

  // Use store for current season
  if (tournaments && tours && tourCards && tiers) {
    return buildTourCardHistoryFromStore(tourCardId, {
      tournaments,
      tours,
      tourCards,
      tiers,
    });
  }

  // Loading state
  return {
    teams: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading" as const,
    dataSource: "store" as const,
  };
}

/**
 * Smart hook for playoff teams.
 * Automatically chooses data source based on season.
 *
 * @param seasonId - Season ID, undefined for current season
 */
export function useSeasonPlayoffs(seasonId?: string) {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const currentSeason = useSeasonalStore((state) => state.currentSeason);

  // Use API for historical seasons
  if (seasonId && seasonId !== currentSeason?.id) {
    return useHistoricalPlayoffsAPI(seasonId);
  }

  // Use store for current season
  if (tournaments && tours && tourCards) {
    return buildPlayoffsFromStore({ tournaments, tours, tourCards });
  }

  // Loading state
  return {
    playoffsByTour: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading" as const,
    dataSource: "store" as const,
  };
}

/**
 * Specialized hook for current tournament leaderboard with real-time updates.
 * Only works for active tournaments.
 */
export function useCurrentTournamentLeaderboard(
  refreshInterval: number = 120000,
) {
  const currentTournament = useCurrentTournament();

  if (!currentTournament) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No active tournament",
      isLoading: false,
      dataSource: "none" as const,
    };
  }

  return useTournamentLeaderboard(currentTournament.id, { refreshInterval });
}

/**
 * Specialized hook for latest champions (last 3 days).
 */
export function useLatestChampions() {
  const lastTournament = useLastTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Early validation - check if we have required data
  if (!isDefined(lastTournament) || isEmpty(tours) || isEmpty(tourCards)) {
    return {
      tournament: undefined,
      champs: [],
      error: "Missing required data",
      dataSource: "store" as const,
    };
  }

  // Check if tournament is completed and within the 3-day window
  const now = new Date();
  const tournamentEndDate = new Date(lastTournament.endDate);
  const daysSinceEnd = getDaysBetween(tournamentEndDate, now);

  // Only show champions for 3 days after tournament ends
  if (daysSinceEnd < 0) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Tournament not yet completed",
      dataSource: "store" as const,
    };
  }

  if (daysSinceEnd > 3) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Champion display window expired (3 days after tournament)",
      dataSource: "store" as const,
    };
  }

  // Get winning teams (position 1 or T1)
  const winningTeams = lastTournament.teams.filter(
    (team) => team.position === "1" || team.position === "T1",
  );

  if (isEmpty(winningTeams)) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "No champions found",
      dataSource: "store" as const,
    };
  }

  // Enrich winning teams with tour and tourCard data
  const champs = winningTeams
    .map((team) => {
      const tourCard = tourCards?.find((card) => card.id === team.tourCardId);
      const tour = tours?.find((t) => t.id === tourCard?.tourId);

      // Skip teams with incomplete data
      if (!isDefined(tour) || !isDefined(tourCard)) {
        return null;
      }

      // Get and sort team golfers
      const teamGolfers = lastTournament.golfers.filter((golfer) =>
        team.golferIds.includes(golfer.apiId),
      );

      return {
        ...team,
        tour,
        tourCard,
        golfers: sortGolfers(teamGolfers),
      };
    })
    .filter(isDefined); // Remove null entries

  return {
    tournament: lastTournament,
    champs,
    error: null,
    daysRemaining: 3 - daysSinceEnd,
    dataSource: "store" as const,
  };
}

// ============= HELPER FUNCTIONS =============

function useCurrentTournamentWithRefresh(
  tournamentId: string,
  refreshInterval: number,
) {
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  const {
    data: teams,
    isLoading,
    error: queryError,
  } = api.team.getByTournament.useQuery(
    { tournamentId },
    {
      staleTime: refreshInterval / 2,
      gcTime: refreshInterval * 2,
      refetchInterval: refreshInterval,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      retry: 3,
    },
  );

  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tournament = tournaments?.find((t) => t.id === tournamentId);

  if (queryError) {
    return {
      tournament,
      teamsByTour: [],
      error: `Failed to fetch teams: ${queryError.message}`,
      isLoading,
      dataSource: "api" as const,
    };
  }

  if (isLoading || !teams || !tournament) {
    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: true,
      dataSource: "api" as const,
    };
  }

  // Group teams by tour with enriched data
  const teamsByTour = buildTeamsByTour(teams, tours, tourCards, tournament);

  return {
    tournament,
    teamsByTour,
    error: null,
    isLoading: false,
    status: "success" as const,
    dataSource: "api" as const,
    totalTeams: teams.length,
    lastUpdated: new Date(),
  };
}

function useHistoricalTournamentAPI(tournamentId: string) {
  const {
    data: tournamentData,
    isLoading,
    error,
  } = api.tournament.getByIdWithLeaderboard.useQuery(
    { tournamentId },
    {
      staleTime: 1000 * 60 * 30, // Cache for 30 minutes
      gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    },
  );

  if (isLoading) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      dataSource: "api" as const,
    };
  }

  if (error) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: `Failed to fetch tournament data: ${error.message}`,
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  if (!tournamentData) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "Tournament not found",
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  const { tournament, teams, golfers, tours } = tournamentData;
  const tournamentStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );

  // Handle case where no teams exist
  if (!teams || isEmpty(teams)) {
    const noTeamsMessage =
      tournamentStatus === "upcoming"
        ? "No teams registered yet (tournament hasn't started)"
        : tournamentStatus === "completed"
          ? "No teams found for this tournament"
          : "No teams found for current tournament";

    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: false,
      status: "empty" as const,
      tournamentStatus,
      message: noTeamsMessage,
      totalTeams: 0,
      dataSource: "api" as const,
    };
  }

  // Group teams by tour
  const teamsByTour = tours
    .map((tour) => {
      const tourTeams = teams
        .filter((team) => team.tourCard.tourId === tour.id)
        .map((team) => {
          const teamGolfers = (golfers ?? []).filter((golfer) =>
            team.golferIds.includes(golfer.apiId),
          );

          return {
            ...team,
            tour,
            tourCard: team.tourCard,
            golfers: sortGolfers(teamGolfers),
          };
        });

      return {
        tour,
        teams: tourTeams,
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0);

  return {
    tournament,
    teamsByTour,
    error: null,
    isLoading: false,
    status: "success" as const,
    tournamentStatus,
    totalTeams: teams.length,
    lastUpdated: new Date(),
    dataSource: "api" as const,
  };
}

function buildLeaderboardFromStore(
  tournament: any,
  tours: any[],
  tourCards: any[],
  dataSource: string,
) {
  const tournamentStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );

  const teams = tournament.teams;
  if (!teams || isEmpty(teams)) {
    const noTeamsMessage =
      tournamentStatus === "upcoming"
        ? "No teams registered yet (tournament hasn't started)"
        : tournamentStatus === "completed"
          ? "No teams found for this tournament"
          : "No teams found for current tournament";

    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: false,
      status: "empty" as const,
      tournamentStatus,
      message: noTeamsMessage,
      totalTeams: 0,
      dataSource,
    };
  }

  const teamsByTour = buildTeamsByTour(teams, tours, tourCards, tournament);

  return {
    tournament,
    teamsByTour,
    error: null,
    isLoading: false,
    status: "success" as const,
    tournamentStatus,
    totalTeams: teams.length,
    lastUpdated: new Date(),
    dataSource,
  };
}

function buildTeamsByTour(
  teams: any[],
  tours: any[],
  tourCards: any[],
  tournament: any,
) {
  return tours
    .map((tour) => {
      const tourTeams = teams
        .filter((team) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          return tourCard?.tourId === tour.id;
        })
        .map((team) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          if (!isDefined(tourCard)) return null;

          const teamGolfers = tournament.golfers.filter((golfer: any) =>
            team.golferIds.includes(golfer.apiId),
          );

          return {
            ...team,
            tour,
            tourCard,
            golfers: sortGolfers(teamGolfers),
          };
        })
        .filter(isDefined);

      return {
        tour,
        teams: tourTeams,
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0);
}

function useMemberHistoryAPI(memberId: string, options: any) {
  const {
    data: memberData,
    isLoading,
    error,
  } = api.member.getAllTimeTeams.useQuery(
    { memberId },
    {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
    },
  );

  if (isLoading) {
    return {
      teams: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      dataSource: "api" as const,
    };
  }

  if (error) {
    return {
      teams: [],
      error: `Failed to fetch member history: ${error.message}`,
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  if (!memberData) {
    return {
      teams: [],
      error: "Member not found",
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  return {
    teamsBySeason: memberData.teamsBySeason,
    allTimeStatistics: memberData.statistics,
    member: memberData.member,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "api" as const,
  };
}

function buildMemberHistoryFromStore(
  memberId: string,
  storeData: {
    tournaments: any[];
    tours: any[];
    tourCards: any[];
    tiers: any[];
  },
  options: any,
) {
  const { tournaments, tours, tourCards, tiers } = storeData;

  // Find the member's tour cards
  const memberTourCards = tourCards.filter(
    (card) => card.memberId === memberId,
  );

  if (isEmpty(memberTourCards)) {
    return {
      teams: [],
      error: "Member has no tour cards for this season",
      isLoading: false,
      status: "error" as const,
      dataSource: "store" as const,
    };
  }

  // Process tournaments to build history
  const teams: any[] = [];
  const missedTournaments: any[] = [];

  tournaments
    .map((tournament) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .forEach((tournament) => {
      const tournamentStatus = getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );

      const memberTeams = tournament.teams.filter((team: any) =>
        memberTourCards.some((card) => card.id === team.tourCardId),
      );

      if (memberTeams.length > 0) {
        memberTeams.forEach((team: any) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          const tour = tours.find((t) => t.id === tourCard?.tourId);
          const tier = tiers.find((t) => t.id === tournament.tierId);

          if (tourCard && tour) {
            const teamGolfers = tournament.golfers.filter((golfer: any) =>
              team.golferIds.includes(golfer.apiId),
            );

            teams.push({
              team,
              tournament,
              tour,
              tourCard,
              tier,
              golfers: sortGolfers(teamGolfers),
              tournamentStatus,
            });
          }
        });
      } else if (options?.includeMissed) {
        // Add missed tournament logic here if needed
        const eligibleTours = tours.filter((tour) =>
          memberTourCards.some((card) => card.tourId === tour.id),
        );

        if (eligibleTours.length > 0) {
          const tier = tiers.find((t) => t.id === tournament.tierId);
          missedTournaments.push({
            tournament,
            tier,
            eligibleTours,
            reason:
              tournamentStatus === "upcoming"
                ? "Not yet registered"
                : "Did not participate",
            tournamentStatus,
          });
        }
      }
    });

  const statistics = {
    totalTournaments: tournaments.length,
    participated: teams.length,
    missed: missedTournaments.length,
    participationRate:
      tournaments.length > 0 ? (teams.length / tournaments.length) * 100 : 0,
  };

  return {
    teams: options?.includeMissed
      ? { participatedTeams: teams, missedTournaments }
      : teams,
    statistics,
    memberTourCards,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "store" as const,
  };
}

function useTourCardHistoryAPI(tourCardId: string, options: any) {
  const {
    data: tourCardData,
    isLoading,
    error,
  } = api.tourCard.getHistoricalTeams.useQuery(
    { tourCardId },
    {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
    },
  );

  if (isLoading) {
    return {
      teams: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      dataSource: "api" as const,
    };
  }

  if (error || !tourCardData) {
    return {
      teams: [],
      error: error?.message || "Tour card not found",
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  return {
    teams: tourCardData.teams,
    statistics: tourCardData.statistics,
    tourCard: tourCardData.tourCard,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "api" as const,
  };
}

function buildTourCardHistoryFromStore(
  tourCardId: string,
  storeData: {
    tournaments: any[];
    tours: any[];
    tourCards: any[];
    tiers: any[];
  },
) {
  const { tournaments, tours, tourCards, tiers } = storeData;

  const tourCard = tourCards.find((card) => card.id === tourCardId);
  const tour = tours.find((t) => t.id === tourCard?.tourId);

  if (!tourCard) {
    return {
      teams: [],
      error: "Tour card not found in current season",
      isLoading: false,
      status: "error" as const,
      dataSource: "store" as const,
    };
  }

  const teams: any[] = [];

  tournaments
    .map((tournament) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .forEach((tournament) => {
      const tournamentStatus = getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );

      const tourCardTeams = tournament.teams.filter(
        (team: any) => team.tourCardId === tourCardId,
      );

      tourCardTeams.forEach((team: any) => {
        const teamGolfers = tournament.golfers.filter((golfer: any) =>
          team.golferIds.includes(golfer.apiId),
        );
        const tier = tiers.find((t) => t.id === tournament.tierId);

        teams.push({
          team,
          tournament,
          tour: tour!,
          tourCard,
          tier,
          golfers: sortGolfers(teamGolfers),
          tournamentStatus,
        });
      });
    });

  // Calculate statistics
  const statistics = {
    totalTeams: teams.length,
    wins: teams.filter(
      (t) => t.team.position === "1" || t.team.position === "T1",
    ).length,
    topTens: teams.filter((t) => {
      const pos = parseInt(t.team.position?.replace(/[^0-9]/g, "") || "999");
      return pos <= 10;
    }).length,
    cuts: teams.filter((t) => t.team.makeCut === 1).length,
    averageScore:
      teams.length > 0
        ? Math.round(
            (teams.reduce((sum, t) => sum + (t.team.score || 0), 0) /
              teams.length) *
              100,
          ) / 100
        : 0,
    bestFinish: teams.reduce(
      (best, t) => {
        const pos = parseInt(t.team.position?.replace(/[^0-9]/g, "") || "999");
        return best === null || pos < best ? pos : best;
      },
      null as number | null,
    ),
  };

  return {
    teams,
    statistics,
    tourCard,
    tour,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "store" as const,
  };
}

function useHistoricalPlayoffsAPI(seasonId: string) {
  const {
    data: playoffData,
    isLoading,
    error,
  } = api.season.getPlayoffTeams.useQuery(
    { seasonId },
    {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
    },
  );

  if (isLoading) {
    return {
      playoffsByTour: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      dataSource: "api" as const,
    };
  }

  if (error || !playoffData) {
    return {
      playoffsByTour: [],
      error: error?.message || "Season not found",
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  const totalGoldTeams = playoffData.playoffsByTour.reduce(
    (sum: number, tour: any) => sum + tour.goldTeams.length,
    0,
  );
  const totalSilverTeams = playoffData.playoffsByTour.reduce(
    (sum: number, tour: any) => sum + tour.silverTeams.length,
    0,
  );

  return {
    playoffsByTour: playoffData.playoffsByTour,
    totalGoldTeams,
    totalSilverTeams,
    season: playoffData.season,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "api" as const,
  };
}

function buildPlayoffsFromStore(storeData: {
  tournaments: any[];
  tours: any[];
  tourCards: any[];
}) {
  const { tournaments, tours, tourCards } = storeData;

  const playoffsByTour = tours.map((tour) => {
    // Get all teams for this tour across all tournaments
    const tourTeams = tournaments.flatMap((tournament) =>
      tournament.teams
        .filter((team: any) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          return tourCard?.tourId === tour.id;
        })
        .map((team: any) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          return { ...team, tournament, tourCard };
        }),
    );

    // Group teams by tour card and calculate season totals
    const teamsByTourCard = new Map();

    tourTeams.forEach((team) => {
      const tourCardId = team.tourCardId;
      if (!teamsByTourCard.has(tourCardId)) {
        teamsByTourCard.set(tourCardId, {
          tourCard: team.tourCard,
          teams: [],
          totalPoints: 0,
          totalEarnings: 0,
          wins: 0,
          topTens: 0,
          cuts: 0,
          appearances: 0,
        });
      }

      const seasonData = teamsByTourCard.get(tourCardId);
      seasonData.teams.push(team);
      seasonData.totalPoints += team.points || 0;
      seasonData.totalEarnings += team.earnings || 0;
      seasonData.wins +=
        team.position === "1" || team.position === "T1" ? 1 : 0;

      const pos = parseInt(team.position?.replace(/[^0-9]/g, "") || "999");
      if (pos <= 10) seasonData.topTens += 1;
      if (team.makeCut === 1) seasonData.cuts += 1;
      seasonData.appearances += 1;
    });

    // Sort teams by points then earnings
    const sortedTeams = Array.from(teamsByTourCard.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.totalEarnings - a.totalEarnings;
    });

    // Determine playoff spots
    const playoffSpots = tour.playoffSpots || [];
    const goldSpots = playoffSpots[0] || 0;
    const silverSpots = playoffSpots[1] || 0;

    let goldTeams: any[] = [];
    let silverTeams: any[] = [];

    if (playoffSpots.length === 1) {
      goldTeams = sortedTeams.slice(0, goldSpots);
    } else if (playoffSpots.length === 2) {
      goldTeams = sortedTeams.slice(0, goldSpots);
      silverTeams = sortedTeams.slice(goldSpots, goldSpots + silverSpots);
    }

    return {
      tour,
      goldTeams: goldTeams.map((team, index) => ({
        ...team,
        playoffPosition: index + 1,
        playoffType: "gold" as const,
      })),
      silverTeams: silverTeams.map((team, index) => ({
        ...team,
        playoffPosition: index + 1,
        playoffType: "silver" as const,
      })),
      totalTeams: sortedTeams.length,
      playoffSpots,
    };
  });

  const totalGoldTeams = playoffsByTour.reduce(
    (sum, tour) => sum + tour.goldTeams.length,
    0,
  );
  const totalSilverTeams = playoffsByTour.reduce(
    (sum, tour) => sum + tour.silverTeams.length,
    0,
  );

  return {
    playoffsByTour,
    totalGoldTeams,
    totalSilverTeams,
    error: null,
    isLoading: false,
    status: "success" as const,
    lastUpdated: new Date(),
    dataSource: "store" as const,
  };
}
