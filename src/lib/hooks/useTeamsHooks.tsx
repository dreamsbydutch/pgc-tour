import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";
import {
  sortGolfers,
  sortTeams,
  sortByPosition,
  sortTeamsByLeaderboard,
  enhanceTourCard,
  enhanceTournament,
  isEmpty,
  isDefined,
  getDaysBetween,
  getTournamentStatus,
} from "@/lib/utils";
import type {
  Tournament,
  Tour,
  TourCard,
  Member,
  Team,
  Golfer,
  Tier,
  Course,
} from "@prisma/client";
import type {
  TournamentLeaderboardResult,
  MemberHistoryResult,
  TourCardHistoryResult,
  SeasonPlayoffsResult,
  LatestChampionsResult,
  CurrentTournamentLeaderboardResult,
  EnhancedTeam,
  TeamsByTour,
  DataSource,
  HookStatus,
  StoreData,
  APITournamentData,
  APIMemberData,
  APITourCardData,
  MemberHistoryOptions,
  TourCardHistoryOptions,
  TournamentLeaderboardOptions,
  EnhancedTournament,
  TourCardTeamHistory,
  MemberTeamHistory,
  MissedTournament,
  PlayoffTeam,
  PlayoffsByTour,
  TournamentStatus,
} from "@/lib/types/hooks";

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
  options?: TournamentLeaderboardOptions,
): TournamentLeaderboardResult {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  if (!tournamentId) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No tournament ID provided",
      isLoading: false,
      status: "error",
      dataSource: "none",
    };
  }

  // Check if tournament exists in current season (unless forced to use API)
  const isCurrentSeason =
    !options?.forceAPI && tournaments?.some((t) => t.id === tournamentId);

  if (isCurrentSeason && tournaments && tours && tourCards) {
    const tournament = tournaments.find((t) => t.id === tournamentId)!;
    const tournamentStatus = getTournamentStatus(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    );

    // For current/active tournaments with refresh, use API
    if (tournamentStatus === "current" && options?.refreshInterval) {
      return useCurrentTournamentWithRefresh(
        tournamentId,
        options.refreshInterval,
      );
    }

    // Use store data for completed/upcoming tournaments
    return buildLeaderboardFromStore(tournament, tours, tourCards, "store");
  }

  // Use API for historical tournaments
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
  options?: MemberHistoryOptions,
): MemberHistoryResult {
  const {
    tournaments,
    tours,
    allTourCards: tourCards,
    tiers,
    season,
  } = useSeasonalStore();

  if (!memberId) {
    return {
      teams: [],
      error: "No member ID provided",
      isLoading: false,
      status: "error",
      dataSource: "none",
    };
  }

  // Use API for all seasons or historical seasons
  if (
    options?.allSeasons ||
    (options?.seasonId && options.seasonId !== season?.id)
  ) {
    return useMemberHistoryAPI(memberId, options);
  }

  // Use store for current season
  if (tournaments && tours && tourCards && tiers) {
    return buildMemberHistoryFromStore(
      memberId,
      { tournaments, tours, tourCards, tiers },
      options || {},
    );
  }

  return {
    teams: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading",
    dataSource: "store",
  };
}

export function useTourCardHistory(
  tourCardId: string | undefined,
  options?: TourCardHistoryOptions,
): TourCardHistoryResult {
  const {
    tournaments,
    tours,
    allTourCards: tourCards,
    tiers,
    season,
  } = useSeasonalStore();

  if (!tourCardId) {
    return {
      teams: [],
      error: "No tour card ID provided",
      isLoading: false,
      status: "error",
      dataSource: "none",
    };
  }

  // Use API for historical seasons
  if (
    options?.allSeasons ||
    (options?.seasonId && options.seasonId !== season?.id)
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

  return {
    teams: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading",
    dataSource: "store",
  };
}

export function useSeasonPlayoffs(seasonId?: string): SeasonPlayoffsResult {
  const {
    tournaments,
    tours,
    allTourCards: tourCards,
    season,
  } = useSeasonalStore();

  // Use API for historical seasons
  if (seasonId && seasonId !== season?.id) {
    return useHistoricalPlayoffsAPI(seasonId);
  }

  // Use store for current season
  if (tournaments && tours && tourCards) {
    return buildPlayoffsFromStore({ tournaments, tours, tourCards });
  }

  return {
    playoffsByTour: [],
    error: "Seasonal data not loaded yet",
    isLoading: true,
    status: "loading",
    dataSource: "store",
  };
}

export function useCurrentTournamentLeaderboard(
  refreshInterval: number = 120000,
): CurrentTournamentLeaderboardResult {
  const currentTournament = useCurrentTournament();

  if (!currentTournament) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No active tournament",
      isLoading: false,
      status: "error",
      dataSource: "none",
    };
  }

  return useTournamentLeaderboard(currentTournament.id, { refreshInterval });
}

export function useLatestChampions(): LatestChampionsResult {
  const lastTournament = useLastTournament();
  const { tours, allTourCards: tourCards } = useSeasonalStore();

  if (!lastTournament || !tours || !tourCards) {
    return {
      tournament: undefined,
      champs: [],
      error: "Missing required data",
      dataSource: "store",
    };
  }

  const now = new Date();
  const tournamentEndDate = new Date(lastTournament.endDate);
  const daysSinceEnd = getDaysBetween(tournamentEndDate, now);

  // Only show champions for 3 days after tournament ends
  if (daysSinceEnd < 0) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Tournament not yet completed",
      dataSource: "store",
    };
  }
  if (daysSinceEnd > 3) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Champion display window expired (3 days after tournament)",
      dataSource: "store",
    };
  }

  // Get winning teams and enrich with data
  const champs = lastTournament.teams
    .filter((team) => team.position === "1" || team.position === "T1")
    .map((team) => {
      const tourCard = tourCards.find((card) => card.id === team.tourCardId);
      const tour = tours.find((t) => t.id === tourCard?.tourId);

      if (!tour || !tourCard) return null;

      return {
        ...team,
        tour,
        tourCard: enhanceTourCard(tourCard),
        golfers: sortGolfers(
          lastTournament.golfers.filter((golfer) =>
            team.golferIds.includes(golfer.apiId),
          ),
        ),
      };
    })
    .filter(isDefined);

  if (!champs.length) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "No champions found",
      dataSource: "store",
    };
  }

  return {
    tournament: lastTournament,
    champs: sortTeamsByLeaderboard(champs),
    error: null,
    daysRemaining: 3 - daysSinceEnd,
    dataSource: "store",
  };
}

// ============= HELPER FUNCTIONS =============

function useCurrentTournamentWithRefresh(
  tournamentId: string,
  refreshInterval: number,
): TournamentLeaderboardResult {
  const { tours, allTourCards: tourCards, tournaments } = useSeasonalStore();

  const {
    data: teams,
    isLoading,
    error,
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

  const tournament = tournaments?.find((t) => t.id === tournamentId);

  if (error) {
    return {
      tournament,
      teamsByTour: [],
      error: `Failed to fetch teams: ${error.message}`,
      isLoading,
      status: "error",
      dataSource: "api",
    };
  }

  if (isLoading || !teams || !tournament) {
    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading",
      dataSource: "api",
    };
  }

  return {
    tournament,
    teamsByTour: buildTeamsByTour(
      teams,
      tours ?? [],
      tourCards ?? [],
      tournament,
    ),
    error: null,
    isLoading: false,
    status: "success",
    dataSource: "api",
    totalTeams: teams.length,
    lastUpdated: new Date(),
  };
}

function useHistoricalTournamentAPI(
  tournamentId: string,
): TournamentLeaderboardResult {
  const {
    data: tournamentData,
    isLoading,
    error,
  } = api.tournament.getByIdWithLeaderboard.useQuery(
    { tournamentId },
    { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 60 },
  );

  if (isLoading) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading",
      dataSource: "api",
    };
  }

  if (error) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: `Failed to fetch tournament data: ${error.message}`,
      isLoading: false,
      status: "error",
      dataSource: "api",
    };
  }

  if (!tournamentData) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "Tournament not found",
      isLoading: false,
      status: "error",
      dataSource: "api",
    };
  }

  const { tournament, teams, golfers, tours } = tournamentData;
  const tournamentStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );
  const enhancedTournament = {
    ...tournament,
    course: tournament.course,
    teams: teams || [],
    golfers: golfers || [],
  };

  if (!teams?.length) {
    const message =
      tournamentStatus === "upcoming"
        ? "No teams registered yet (tournament hasn't started)"
        : "No teams found for this tournament";

    return {
      tournament: enhancedTournament,
      teamsByTour: [],
      error: null,
      isLoading: false,
      status: "empty",
      tournamentStatus,
      message,
      totalTeams: 0,
      dataSource: "api",
    };
  }

  // Group teams by tour with proper sorting
  const teamsByTour = tours
    .map((tour) => {
      const tourTeams = teams
        .filter((team) => team.tourCard.tourId === tour.id)
        .map((team) => ({
          ...team,
          tour,
          tourCard: team.tourCard,
          golfers: sortGolfers(
            (golfers ?? []).filter((golfer) =>
              team.golferIds.includes(golfer.apiId),
            ),
          ),
        }));

      return {
        tour,
        teams: sortTeamsByLeaderboard(tourTeams),
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0);

  return {
    tournament: enhancedTournament,
    teamsByTour,
    error: null,
    isLoading: false,
    status: "success",
    tournamentStatus,
    totalTeams: teams.length,
    lastUpdated: new Date(),
    dataSource: "api",
  };
}

function buildLeaderboardFromStore(
  tournament: Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course?: Course;
  },
  tours: Tour[],
  tourCards: TourCard[],
  dataSource: DataSource,
): TournamentLeaderboardResult {
  const tournamentStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );
  const enhancedTournament = enhanceTournament(tournament);

  if (!tournament.teams?.length) {
    const message =
      tournamentStatus === "upcoming"
        ? "No teams registered yet (tournament hasn't started)"
        : "No teams found for this tournament";

    return {
      tournament: enhancedTournament,
      teamsByTour: [],
      error: null,
      isLoading: false,
      status: "empty",
      tournamentStatus,
      message,
      totalTeams: 0,
      dataSource,
    };
  }

  return {
    tournament: enhancedTournament,
    teamsByTour: buildTeamsByTour(
      tournament.teams,
      tours,
      tourCards,
      tournament,
    ),
    error: null,
    isLoading: false,
    status: "success",
    tournamentStatus,
    totalTeams: tournament.teams.length,
    lastUpdated: new Date(),
    dataSource,
  };
}

function buildTeamsByTour(
  teams: Team[],
  tours: Tour[],
  tourCards: (TourCard & { member?: Member })[],
  tournament: Tournament & { golfers: Golfer[] },
): TeamsByTour[] {
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
          if (!tourCard) return null;

          const teamGolfers =
            tournament.golfers?.filter((golfer) =>
              team.golferIds.includes(golfer.apiId),
            ) ?? [];

          return {
            ...team,
            tour,
            tourCard: enhanceTourCard(tourCard, tourCard.member),
            golfers: sortGolfers(teamGolfers),
          } as EnhancedTeam;
        })
        .filter(isDefined);

      return {
        tour,
        teams: sortTeamsByLeaderboard(tourTeams),
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0);
}

function useMemberHistoryAPI(
  memberId: string,
  options: MemberHistoryOptions,
): MemberHistoryResult {
  const {
    data: memberData,
    isLoading,
    error,
  } = api.member.getAllTimeTeams.useQuery(
    { memberId },
    { staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30 },
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

  if (error || !memberData) {
    return {
      teams: [],
      error: error?.message || "Member not found",
      isLoading: false,
      status: "error" as const,
      dataSource: "api" as const,
    };
  }

  return {
    teams: [], // API uses different structure (teamsBySeason)
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
  storeData: StoreData,
  options: MemberHistoryOptions,
): MemberHistoryResult {
  const { tournaments, tours, tourCards, tiers } = storeData;

  // Find and enhance member's tour cards
  const memberTourCards = tourCards
    .filter((card) => card.memberId === memberId)
    .map((card) => enhanceTourCard(card));

  if (!memberTourCards.length) {
    return {
      teams: [],
      error: "Member has no tour cards for this season",
      isLoading: false,
      status: "error",
      dataSource: "store",
    };
  }

  const teams: MemberTeamHistory[] = [];
  const missedTournaments: MissedTournament[] = [];

  // Process tournaments chronologically
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
      const memberTeams = tournament.teams.filter((team: Team) =>
        memberTourCards.some((card) => card.id === team.tourCardId),
      );

      if (memberTeams.length > 0) {
        memberTeams.forEach((team: Team) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          const tour = tours.find((t) => t.id === tourCard?.tourId);
          const tier = tiers.find((t) => t.id === tournament.tierId);

          if (tourCard && tour && tier) {
            teams.push({
              team,
              tournament: enhanceTournament(tournament),
              tour,
              tourCard: enhanceTourCard(tourCard),
              tier,
              golfers: sortGolfers(
                tournament.golfers.filter((golfer: Golfer) =>
                  team.golferIds.includes(golfer.apiId),
                ),
              ),
              tournamentStatus,
            });
          }
        });
      } else if (options?.includeMissed) {
        const eligibleTours = tours.filter((tour) =>
          memberTourCards.some((card) => card.tourId === tour.id),
        );
        if (eligibleTours.length > 0) {
          const tier = tiers.find((t) => t.id === tournament.tierId);
          if (tier) {
            missedTournaments.push({
              tournament: enhanceTournament(tournament),
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
    status: "success",
    lastUpdated: new Date(),
    dataSource: "store",
  };
}

function useTourCardHistoryAPI(
  tourCardId: string,
  options: TourCardHistoryOptions,
): TourCardHistoryResult {
  const {
    data: tourCardData,
    isLoading,
    error,
  } = api.tourCard.getHistoricalTeams.useQuery(
    { tourCardId },
    { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 60 },
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
    teams: tourCardData.teams as unknown as TourCardTeamHistory[], // API structure differs from store structure
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
    tournaments: EnhancedTournament[];
    tours: Tour[];
    tourCards: TourCard[];
    tiers: Tier[];
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

  // Process tournaments chronologically and build teams
  const teams: TourCardTeamHistory[] = tournaments
    .map((tournament) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .flatMap((tournament) => {
      const tournamentStatus = getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );
      return tournament.teams
        .filter((team: Team) => team.tourCardId === tourCardId)
        .map((team: Team) => {
          const tier = tiers.find((t) => t.id === tournament.tierId);
          return {
            team,
            tournament,
            tour: tour!,
            tourCard,
            tier: tier!,
            golfers: sortGolfers(
              tournament.golfers.filter((golfer: Golfer) =>
                team.golferIds.includes(golfer.apiId),
              ),
            ),
            tournamentStatus,
          };
        });
    });

  // Calculate statistics efficiently
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
    { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 60 },
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
    (sum: number, tour: PlayoffsByTour) => sum + tour.goldTeams.length,
    0,
  );
  const totalSilverTeams = playoffData.playoffsByTour.reduce(
    (sum: number, tour: PlayoffsByTour) => sum + tour.silverTeams.length,
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
  tournaments: EnhancedTournament[];
  tours: Tour[];
  tourCards: TourCard[];
}) {
  const { tournaments, tours, tourCards } = storeData;

  const playoffsByTour = tours.map((tour) => {
    // Get all teams for this tour across all tournaments
    const tourTeams = tournaments.flatMap((tournament) =>
      tournament.teams
        .filter((team: Team) => {
          const tourCard = tourCards.find(
            (card) => card.id === team.tourCardId,
          );
          return tourCard?.tourId === tour.id;
        })
        .map((team: Team) => ({
          ...team,
          tournament,
          tourCard: tourCards.find((card) => card.id === team.tourCardId),
        })),
    );

    // Group teams by tour card and calculate season totals efficiently
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
      return b.totalPoints !== a.totalPoints
        ? b.totalPoints - a.totalPoints
        : b.totalEarnings - a.totalEarnings;
    });

    // Determine playoff spots
    const playoffSpots = tour.playoffSpots || [];
    const goldSpots = playoffSpots[0] || 0;
    const silverSpots = playoffSpots[1] || 0;

    const goldTeams: PlayoffTeam[] = sortedTeams
      .slice(0, goldSpots)
      .map((team, index) => ({
        ...team,
        playoffPosition: index + 1,
        playoffType: "gold" as const,
      }));

    const silverTeams: PlayoffTeam[] =
      playoffSpots.length === 2
        ? sortedTeams
            .slice(goldSpots, goldSpots + silverSpots)
            .map((team, index) => ({
              ...team,
              playoffPosition: index + 1,
              playoffType: "silver" as const,
            }))
        : [];

    return {
      tour,
      goldTeams,
      silverTeams,
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
