"use server";

import { db } from "../db";

// Explicit type definitions matching LeaderboardView requirements
interface LeaderboardData {
  variant: "regular" | "historical" | "playoff";
  tournament: {
    id: string;
    name: string;
    currentRound: number|null;
    course: {
      id: string;
      name: string;
    } | null;
  };
  tours: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    shortForm: string;
  }>;
  actualTours: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    shortForm: string;
  }>;
  tourCard: {
    id: string;
    displayName: string;
    memberId: string;
    tourId: string;
    playoff: number;
  } | null;
  member: {
    id: string;
    role?: string | null;
    friends?: string[] | null;
  } | null;
  golfers: Array<{
    id: string;
    apiId: number;
    playerName: string;
    country: string | null;
    position: string | null;
    score: number | null;
    today: number | null;
    thru: number | null;
    roundOne: number | null;
    roundTwo: number | null;
    roundThree: number | null;
    roundFour: number | null;
    round: number | null;
    posChange: number | null;
    group: number | null;
    worldRank: number | null;
    rating: number | null;
    makeCut: number | null;
    topTen: number | null;
    win: number | null;
    usage: number | null;
    endHole: number | null;
  }>;
  teams: Array<{
    id: string;
    golferIds: number[];
    position: string | null;
    pastPosition: string | null;
    score: number | null;
    today: number | null; // Added missing today field
    thru: number | null;
    round: number | null;
    points: number | null;
    earnings: string | null;
    tourCard: {
      id: string;
      displayName: string;
      memberId: string;
      tourId: string;
      playoff: number;
    } | null;
  }>;
  tourCards: Array<{
    id: string;
    displayName: string;
    memberId: string;
    tourId: string;
    playoff: number;
  }>;
  inputTour?: string;
}

interface GetLeaderboardDataParams {
  tournamentId: string;
  userId?: string;
  variant?: "playoff" | "historical" | "regular";
  inputTour?: string;
}

export async function getCompleteLeaderboardData({
  tournamentId,
  userId,
  variant = "regular",
  inputTour,
}: GetLeaderboardDataParams): Promise<LeaderboardData> {
  try {
    // Fetch tournament with course information
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        currentRound: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }

    // Fetch all golfers for this tournament
    const golfers = await db.golfer.findMany({
      where: { tournamentId },
      select: {
        id: true,
        apiId: true,
        playerName: true,
        country: true,
        position: true,
        score: true,
        today: true,
        thru: true,
        roundOne: true,
        roundTwo: true,
        roundThree: true,
        roundFour: true,
        round: true,
        posChange: true,
        group: true,
        worldRank: true,
        rating: true,
        makeCut: true,
        topTen: true,
        win: true,
        usage: true,
        endHole: true,
      },
    });

    // Fetch current season to get tours
    const currentSeason = await db.season.findFirst({
      orderBy: { year: "desc" },
      select: {
        id: true,
        tours: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            shortForm: true,
          },
        },
      },
    });

    const tours = currentSeason?.tours ?? [];
    const actualTours = tours; // Same as tours for regular leaderboard

    // Fetch teams with their tour cards for this tournament
    const teamsRaw = await db.team.findMany({
      where: { tournamentId },
      select: {
        id: true,
        golferIds: true,
        position: true,
        pastPosition: true,
        score: true,
        today: true, // Added missing today field
        thru: true,
        round: true,
        points: true,
        earnings: true,
        tourCard: {
          select: {
            id: true,
            displayName: true,
            memberId: true,
            tourId: true,
            playoff: true,
          },
        },
      },
    });

    // Transform teams to match expected types
    const teams = teamsRaw.map((team) => ({
      id: team.id.toString(),
      golferIds: team.golferIds,
      position: team.position,
      pastPosition: team.pastPosition,
      score: team.score,
      today: team.today, // Added missing today field
      thru: team.thru,
      round: team.round,
      points: team.points,
      earnings: team.earnings?.toString() ?? null,
      tourCard: team.tourCard,
    }));

    // Transform golfers to match expected types
    const golfersTransformed = golfers.map((golfer) => ({
      id: golfer.id.toString(),
      apiId: golfer.apiId,
      playerName: golfer.playerName,
      country: golfer.country,
      position: golfer.position,
      score: golfer.score,
      today: golfer.today,
      thru: golfer.thru,
      roundOne: golfer.roundOne,
      roundTwo: golfer.roundTwo,
      roundThree: golfer.roundThree,
      roundFour: golfer.roundFour,
      round: golfer.round,
      posChange: golfer.posChange,
      group: golfer.group,
      worldRank: golfer.worldRank,
      rating: golfer.rating,
      makeCut: golfer.makeCut,
      topTen: golfer.topTen,
      win: golfer.win,
      usage: golfer.usage,
      endHole: golfer.endHole,
    }));

    // Fetch all tour cards for filtering/display purposes
    const tourCards = await db.tourCard.findMany({
      where: {
        tourId: { in: tours.map((tour) => tour.id) },
      },
      select: {
        id: true,
        displayName: true,
        memberId: true,
        tourId: true,
        playoff: true,
      },
    });

    // Fetch user's tour card and member info if userId provided
    let tourCard: LeaderboardData["tourCard"] = null;
    let member: LeaderboardData["member"] = null;

    if (userId) {
      // Get member info
      member = await db.member.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          friends: true,
        },
      });

      // Get user's tour card for the current season
      if (member) {
        const userTourCard = await db.tourCard.findFirst({
          where: {
            memberId: member.id,
            seasonId: currentSeason?.id,
          },
          select: {
            id: true,
            displayName: true,
            memberId: true,
            tourId: true,
            playoff: true,
          },
        });

        tourCard = userTourCard;
      }
    }

    // Transform tournament to handle currentRound nullability
    const tournamentTransformed = {
      id: tournament.id,
      name: tournament.name,
      currentRound: tournament.currentRound ?? 1, // Default to round 1 if null
      course: tournament.course,
    };

    return {
      variant,
      tournament: tournamentTransformed,
      tours,
      actualTours,
      tourCard,
      member,
      golfers: golfersTransformed,
      teams,
      tourCards,
      inputTour,
    };
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw new Error("Failed to fetch leaderboard data");
  }
}

// Additional helper function for playoff-specific data
export async function getPlayoffLeaderboardData({
  tournamentId,
  userId,
  inputTour,
}: Omit<GetLeaderboardDataParams, "variant">): Promise<LeaderboardData> {
  const baseData = await getCompleteLeaderboardData({
    tournamentId,
    userId,
    variant: "playoff",
    inputTour,
  });

  // Filter teams to only include playoff teams
  const playoffTeams = baseData.teams.filter(
    (team) => team.tourCard && team.tourCard.playoff > 0,
  );

  // Filter tour cards to only include playoff cards
  const playoffTourCards = baseData.tourCards.filter(
    (card) => card.playoff > 0,
  );

  return {
    ...baseData,
    teams: playoffTeams,
    tourCards: playoffTourCards,
  };
}

// Helper function for historical leaderboard data
export async function getHistoricalLeaderboardData({
  tournamentId,
  userId,
  inputTour,
}: Omit<GetLeaderboardDataParams, "variant">): Promise<LeaderboardData> {
  return getCompleteLeaderboardData({
    tournamentId,
    userId,
    variant: "historical",
    inputTour,
  });
}

// Simplified function that matches your current usage pattern
export async function getLeaderboardDataForTournament(
  tournamentId: string,
  userId?: string,
): Promise<LeaderboardData> {
  return getCompleteLeaderboardData({
    tournamentId,
    userId,
    variant: "regular",
  });
}

// Version with auth integration
export async function getAuthenticatedLeaderboardData(
  tournamentId: string,
): Promise<LeaderboardData> {
  // This would need to be integrated with your auth system
  try {
    const { createServerSupabaseClient } = await import("@pgc-authServer");
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return getCompleteLeaderboardData({
      tournamentId,
      userId: user?.id,
      variant: "regular",
    });
  } catch (_error) {
    // If auth fails, return data without user context
    return getCompleteLeaderboardData({
      tournamentId,
      variant: "regular",
    });
  }
}
