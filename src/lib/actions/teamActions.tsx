import { api } from "@/src/trpc/server";
import { getLatestTournament, getCurrentSeasonData } from "./tournamentActions";
import { cache } from "react";
import {
  sortGolfers,
  sortTeams,
  sortByPosition,
  isEmpty,
  isDefined,
  getDaysBetween,
  getTournamentStatus,
} from "@/lib/utils";

// ============= AGGRESSIVE CACHING STRATEGY =============
// Current season data: 5 minutes (fairly static)
// Historical data: 30 minutes (completely static)
// Active tournament data: 1 minute (live updates needed)

/**
 * Smart server action for tournament leaderboard data.
 * Automatically chooses the best data source and caching strategy:
 * - Current season tournaments: Cached current season data (5 min cache)
 * - Historical tournaments: Single optimized API call (30 min cache)
 * - Active tournaments: Fresh API call with minimal cache (1 min cache)
 *
 * @param tournamentId - The ID of the tournament
 * @param options - Configuration options
 */
export const getTournamentLeaderboard = cache(
  async (
    tournamentId: string,
    options?: {
      forceAPI?: boolean;
      skipCache?: boolean; // For active tournaments
    },
  ) => {
    try {
      if (!tournamentId) {
        return {
          tournament: null,
          teamsByTour: [],
          error: "No tournament ID provided",
          dataSource: "none" as const,
        };
      }

      // Get current season data first (cached for 5 minutes)
      const currentSeasonData = await getCurrentSeasonData();
      const isCurrentSeason =
        !options?.forceAPI &&
        currentSeasonData.tournaments.some((t: any) => t.id === tournamentId);

      if (isCurrentSeason) {
        // Use current season data for efficiency
        const tournament = currentSeasonData.tournaments.find(
          (t: any) => t.id === tournamentId,
        )!;
        const tournamentStatus = getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        );

        // For active tournaments, get fresh data if requested
        if (tournamentStatus === "current" && options?.skipCache) {
          return await getActiveTournamentLeaderboard(tournamentId);
        }

        // Use cached season data for completed/upcoming tournaments
        return buildLeaderboardFromSeasonData(tournament, currentSeasonData);
      }

      // Use optimized API for historical tournaments (heavily cached)
      return await getHistoricalTournamentLeaderboard(tournamentId);
    } catch (error) {
      return {
        tournament: null,
        teamsByTour: [],
        error: `Failed to fetch tournament: ${error instanceof Error ? error.message : "Unknown error"}`,
        dataSource: "error" as const,
      };
    }
  },
);

/**
 * Smart server action for member history across seasons.
 * Automatically chooses data source and caching:
 * - Current season only: Uses cached current season data
 * - All seasons or historical: Uses API with aggressive caching
 *
 * @param memberId - The member ID
 * @param options - Configuration options
 */
export const getMemberHistory = cache(
  async (
    memberId: string,
    options?: {
      seasonId?: string;
      allSeasons?: boolean;
      includeMissed?: boolean;
    },
  ) => {
    try {
      if (!memberId) {
        return {
          teams: [],
          error: "No member ID provided",
          dataSource: "none" as const,
        };
      }

      // Use API for all seasons or specific historical season
      if (options?.allSeasons || options?.seasonId) {
        return await getMemberHistoryFromAPI(memberId, options);
      }

      // Use current season data for current season queries
      const currentSeasonData = await getCurrentSeasonData();
      return buildMemberHistoryFromSeasonData(
        memberId,
        currentSeasonData,
        options,
      );
    } catch (error) {
      return {
        teams: [],
        error: `Failed to fetch member history: ${error instanceof Error ? error.message : "Unknown error"}`,
        dataSource: "error" as const,
      };
    }
  },
);

/**
 * Smart server action for tour card history.
 * Automatically chooses data source based on requirements.
 *
 * @param tourCardId - The tour card ID
 * @param options - Configuration options
 */
export const getTourCardHistory = cache(
  async (
    tourCardId: string,
    options?: {
      seasonId?: string;
      allSeasons?: boolean;
      currentSeasonOnly?: boolean;
    },
  ) => {
    try {
      if (!tourCardId) {
        return {
          teams: [],
          error: "No tour card ID provided",
          dataSource: "none" as const,
        };
      }

      // Use API for historical or all seasons
      if (options?.allSeasons || options?.seasonId) {
        return await getTourCardHistoryFromAPI(tourCardId, options);
      }

      // Use current season data for current season
      const currentSeasonData = await getCurrentSeasonData();
      return buildTourCardHistoryFromSeasonData(tourCardId, currentSeasonData);
    } catch (error) {
      return {
        teams: [],
        error: `Failed to fetch tour card history: ${error instanceof Error ? error.message : "Unknown error"}`,
        dataSource: "error" as const,
      };
    }
  },
);

/**
 * Smart server action for playoff teams.
 * Automatically chooses data source based on season.
 *
 * @param seasonId - Season ID, undefined for current season
 */
export const getSeasonPlayoffs = cache(async (seasonId?: string) => {
  try {
    // Use API for historical seasons (heavily cached)
    if (seasonId) {
      return await getHistoricalPlayoffsFromAPI(seasonId);
    }

    // Use current season data for current season
    const currentSeasonData = await getCurrentSeasonData();
    return buildPlayoffsFromSeasonData(currentSeasonData);
  } catch (error) {
    return {
      playoffsByTour: [],
      error: `Failed to fetch playoffs: ${error instanceof Error ? error.message : "Unknown error"}`,
      dataSource: "error" as const,
    };
  }
});

/**
 * Server action for current tournament leaderboard (live updates).
 * Minimal caching for real-time data.
 */
export const getCurrentTournamentLeaderboard = cache(async () => {
  try {
    const currentSeasonData = await getCurrentSeasonData();
    const now = new Date();

    const currentTournament = currentSeasonData.tournaments.find(
      (tournament: any) => {
        const startDate = new Date(tournament.startDate);
        const endDate = new Date(tournament.endDate);
        return startDate <= now && endDate >= now;
      },
    );

    if (!currentTournament) {
      return {
        tournament: null,
        teamsByTour: [],
        error: "No active tournament",
        dataSource: "season" as const,
      };
    }

    return await getTournamentLeaderboard(currentTournament.id, {
      skipCache: true,
    });
  } catch (error) {
    return {
      tournament: null,
      teamsByTour: [],
      error: `Failed to fetch current tournament: ${error instanceof Error ? error.message : "Unknown error"}`,
      dataSource: "error" as const,
    };
  }
});

/**
 * Server action for latest champions (last 3 days).
 * Uses cached data for efficiency.
 */
export const getLatestChampions = cache(async () => {
  try {
    const lastTournament = await getLatestTournament();
    if (!lastTournament) {
      return {
        tournament: null,
        champs: [],
        error: "No recent tournament found",
        dataSource: "none" as const,
      };
    }

    // Check 3-day window
    const now = new Date();
    const tournamentEndDate = new Date(lastTournament.endDate);
    const daysSinceEnd = getDaysBetween(tournamentEndDate, now);

    if (daysSinceEnd < 0) {
      return {
        tournament: lastTournament,
        champs: [],
        error: "Tournament not yet completed",
        dataSource: "season" as const,
      };
    }

    if (daysSinceEnd > 3) {
      return {
        tournament: lastTournament,
        champs: [],
        error: "Champion display window expired (3 days after tournament)",
        dataSource: "season" as const,
      };
    }

    // Get tournament details with champions
    const leaderboard = await getTournamentLeaderboard(lastTournament.id);
    if (leaderboard.error || !leaderboard.teamsByTour) {
      return {
        tournament: lastTournament,
        champs: [],
        error: leaderboard.error || "Failed to get champions",
        dataSource: leaderboard.dataSource,
      };
    }

    // Extract champions from leaderboard
    const champs = leaderboard.teamsByTour
      .flatMap((tourGroup) =>
        tourGroup.teams.filter(
          (team) => team.position === "1" || team.position === "T1",
        ),
      )
      .sort((a, b) => {
        // Sort champions by score (lower is better)
        const aScore = a.score ?? 999;
        const bScore = b.score ?? 999;
        return aScore - bScore;
      });

    return {
      tournament: lastTournament,
      champs,
      error: null,
      daysRemaining: 3 - daysSinceEnd,
      dataSource: leaderboard.dataSource,
    };
  } catch (error) {
    return {
      tournament: null,
      champs: [],
      error: `Failed to fetch champions: ${error instanceof Error ? error.message : "Unknown error"}`,
      dataSource: "error" as const,
    };
  }
});

// ============= HELPER FUNCTIONS =============

/**
 * Get active tournament data with minimal caching (1 minute)
 */
const getActiveTournamentLeaderboard = cache(async (tournamentId: string) => {
  // This cache will be shorter-lived for active tournaments
  const teams = await api.team.getByTournament({ tournamentId });
  const tournament = await api.tournament.getById({ tournamentId });
  const currentSeasonData = await getCurrentSeasonData();

  if (!tournament || !teams) {
    return {
      tournament: null,
      teamsByTour: [],
      error: "Tournament or teams not found",
      dataSource: "api" as const,
    };
  }

  const teamsByTour = buildTeamsByTour(
    teams,
    currentSeasonData.tours,
    currentSeasonData.tourCards,
    tournament,
  );

  return {
    tournament,
    teamsByTour,
    error: null,
    dataSource: "api" as const,
    totalTeams: teams.length,
    lastUpdated: new Date(),
  };
});

/**
 * Get historical tournament data with aggressive caching (30 minutes)
 */
const getHistoricalTournamentLeaderboard = cache(
  async (tournamentId: string) => {
    // This uses the optimized single-call API that fetches everything
    const tournamentData = await api.tournament.getByIdWithLeaderboard({
      tournamentId,
    });

    if (!tournamentData) {
      return {
        tournament: null,
        teamsByTour: [],
        error: "Tournament not found",
        dataSource: "api" as const,
      };
    }

    const { tournament, teams, golfers, tours, tourCards } = tournamentData;
    const tournamentStatus = getTournamentStatus(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    );

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
        message: noTeamsMessage,
        dataSource: "api" as const,
        totalTeams: 0,
      };
    }

    // Build teams by tour
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
          })
          .sort((a, b) => {
            // Primary sort: by position (if available)
            if (a.position && b.position) {
              const posSort = sortByPosition(a.position, b.position);
              if (posSort !== 0) return posSort;
            }

            // Secondary sort: by score (lower is better)
            const aScore = a.score ?? 999;
            const bScore = b.score ?? 999;
            return aScore - bScore;
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
      tournamentStatus,
      totalTeams: teams.length,
      lastUpdated: new Date(),
      dataSource: "api" as const,
    };
  },
);

/**
 * Build leaderboard from cached current season data
 */
function buildLeaderboardFromSeasonData(tournament: any, seasonData: any) {
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
      message: noTeamsMessage,
      dataSource: "season" as const,
      totalTeams: 0,
    };
  }

  const teamsByTour = buildTeamsByTour(
    teams,
    seasonData.tours,
    seasonData.tourCards,
    tournament,
  );

  return {
    tournament,
    teamsByTour,
    error: null,
    tournamentStatus,
    totalTeams: teams.length,
    lastUpdated: new Date(),
    dataSource: "season" as const,
  };
}

/**
 * Build teams by tour helper
 */
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

          const teamGolfers =
            tournament.golfers?.filter((golfer: any) =>
              team.golferIds.includes(golfer.apiId),
            ) ?? [];

          return {
            ...team,
            tour,
            tourCard,
            golfers: sortGolfers(teamGolfers),
          };
        })
        .filter(isDefined)
        .sort((a, b) => {
          // Primary sort: by position (if available)
          if (a.position && b.position) {
            const posSort = sortByPosition(a.position, b.position);
            if (posSort !== 0) return posSort;
          }

          // Secondary sort: by score (lower is better)
          const aScore = a.score ?? 999;
          const bScore = b.score ?? 999;
          return aScore - bScore;
        });

      return {
        tour,
        teams: tourTeams,
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0);
}

/**
 * Get member history from API with aggressive caching
 */
const getMemberHistoryFromAPI = cache(
  async (memberId: string, options: any) => {
    const memberData = await api.member.getAllTimeTeams({ memberId });

    if (!memberData) {
      return {
        teams: [],
        error: "Member not found",
        dataSource: "api" as const,
      };
    }

    return {
      teamsBySeason: memberData.teamsBySeason,
      allTimeStatistics: memberData.statistics,
      member: memberData.member,
      error: null,
      lastUpdated: new Date(),
      dataSource: "api" as const,
    };
  },
);

/**
 * Build member history from current season data
 */
function buildMemberHistoryFromSeasonData(
  memberId: string,
  seasonData: any,
  options: any,
) {
  const { tournaments, tours, tourCards, tiers } = seasonData;

  const memberTourCards = tourCards.filter(
    (card: any) => card.memberId === memberId,
  );
  if (isEmpty(memberTourCards)) {
    return {
      teams: [],
      error: "Member has no tour cards for this season",
      dataSource: "season" as const,
    };
  }

  const teams: any[] = [];
  const missedTournaments: any[] = [];

  tournaments
    .map((tournament: any) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    }))
    .sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime())
    .forEach((tournament: any) => {
      const tournamentStatus = getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );

      const memberTeams = tournament.teams.filter((team: any) =>
        memberTourCards.some((card: any) => card.id === team.tourCardId),
      );

      if (memberTeams.length > 0) {
        memberTeams.forEach((team: any) => {
          const tourCard = tourCards.find(
            (card: any) => card.id === team.tourCardId,
          );
          const tour = tours.find((t: any) => t.id === tourCard?.tourId);
          const tier = tiers.find((t: any) => t.id === tournament.tierId);

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
        const eligibleTours = tours.filter((tour: any) =>
          memberTourCards.some((card: any) => card.tourId === tour.id),
        );

        if (eligibleTours.length > 0) {
          const tier = tiers.find((t: any) => t.id === tournament.tierId);
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
    lastUpdated: new Date(),
    dataSource: "season" as const,
  };
}

/**
 * Get tour card history from API with aggressive caching
 */
const getTourCardHistoryFromAPI = cache(
  async (tourCardId: string, options: any) => {
    const tourCardData = await api.tourCard.getHistoricalTeams({ tourCardId });

    if (!tourCardData) {
      return {
        teams: [],
        error: "Tour card not found",
        dataSource: "api" as const,
      };
    }

    return {
      teams: tourCardData.teams,
      statistics: tourCardData.statistics,
      tourCard: tourCardData.tourCard,
      error: null,
      lastUpdated: new Date(),
      dataSource: "api" as const,
    };
  },
);

/**
 * Build tour card history from current season data
 */
function buildTourCardHistoryFromSeasonData(
  tourCardId: string,
  seasonData: any,
) {
  const { tournaments, tours, tourCards, tiers } = seasonData;

  const tourCard = tourCards.find((card: any) => card.id === tourCardId);
  const tour = tours.find((t: any) => t.id === tourCard?.tourId);

  if (!tourCard) {
    return {
      teams: [],
      error: "Tour card not found in current season",
      dataSource: "season" as const,
    };
  }

  const teams: any[] = [];

  tournaments
    .map((tournament: any) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    }))
    .sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime())
    .forEach((tournament: any) => {
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
        const tier = tiers.find((t: any) => t.id === tournament.tierId);

        teams.push({
          team,
          tournament,
          tour,
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
    lastUpdated: new Date(),
    dataSource: "season" as const,
  };
}

/**
 * Get historical playoffs from API with aggressive caching
 */
const getHistoricalPlayoffsFromAPI = cache(async (seasonId: string) => {
  const playoffData = await api.season.getPlayoffTeams({ seasonId });

  if (!playoffData) {
    return {
      playoffsByTour: [],
      error: "Season not found",
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
    lastUpdated: new Date(),
    dataSource: "api" as const,
  };
});

/**
 * Build playoffs from current season data
 */
function buildPlayoffsFromSeasonData(seasonData: any) {
  const { tournaments, tours, tourCards } = seasonData;

  const playoffsByTour = tours.map((tour: any) => {
    // Get all teams for this tour across all tournaments
    const tourTeams = tournaments.flatMap((tournament: any) =>
      tournament.teams
        .filter((team: any) => {
          const tourCard = tourCards.find(
            (card: any) => card.id === team.tourCardId,
          );
          return tourCard?.tourId === tour.id;
        })
        .map((team: any) => {
          const tourCard = tourCards.find(
            (card: any) => card.id === team.tourCardId,
          );
          return { ...team, tournament, tourCard };
        }),
    );

    // Group teams by tour card and calculate season totals
    const teamsByTourCard = new Map();

    tourTeams.forEach((team: any) => {
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
    (sum: number, tour: any) => sum + tour.goldTeams.length,
    0,
  );
  const totalSilverTeams = playoffsByTour.reduce(
    (sum: number, tour: any) => sum + tour.silverTeams.length,
    0,
  );

  return {
    playoffsByTour,
    totalGoldTeams,
    totalSilverTeams,
    error: null,
    lastUpdated: new Date(),
    dataSource: "season" as const,
  };
}
