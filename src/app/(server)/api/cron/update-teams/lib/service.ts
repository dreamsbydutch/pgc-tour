/**
 * TEAM UPDATE SERVICE
 * ===================
 *
 * Streamlined service that:
 * 1. Fetches tournament data with teams and golfers
 * 2. Calculates team scores based on current round and live play status
 * 3. Updates team positions based on scores
 * 4. Batch updates all teams in the database
 */

import { db } from "@pgc-server";
import { batchProcess } from "@pgc-utils";
import type {
  TournamentWithRelations,
  TeamCalculation,
  TeamUpdateData,
  UpdateResult,
} from "./types";
import type { Team, Golfer, TourCard, Member, Tour } from "@prisma/client";

/**
 * Extended team type that includes cumulative playoff scores
 */
type TeamWithCumulativeScore = Team &
  TeamCalculation & {
    cumulativeScore?: number | null;
    cumulativePlayoffPosition?: number;
  };

/**
 * Calculate cumulative playoff scores for teams across all playoff tournaments
 */
async function calculateCumulativePlayoffScores(
  currentTournament: TournamentWithRelations,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
): Promise<Map<string, { cumulativeScore: number; position: number }>> {
  const cumulativeScores = new Map<
    string,
    { cumulativeScore: number; position: number }
  >();

  if (!isPlayoffTournament(currentTournament)) {
    return cumulativeScores;
  }

  // Get all playoff tournaments in the same season, ordered by start date
  const playoffTournaments = await db.tournament.findMany({
    where: {
      seasonId: currentTournament.seasonId,
      tier: {
        name: {
          contains: "Playoff",
          mode: "insensitive",
        },
      },
      startDate: {
        lte: currentTournament.startDate, // Only tournaments that have started or are current
      },
    },
    include: {
      teams: true,
    },
    orderBy: { startDate: "asc" },
  });

  console.log(
    `📊 Found ${playoffTournaments.length} playoff tournaments for cumulative scoring`,
  );

  // Calculate cumulative scores for each tour card
  for (const tourCard of tourCards.filter((tc) => tc.playoff > 0)) {
    let cumulativeScore = 0;
    let tournamentsWithScores = 0;
    const currentTournamentNumber =
      getPlayoffTournamentNumber(currentTournament);

    for (const tournament of playoffTournaments) {
      // Determine tournament number from name since we don't have full relations
      const tournamentName = tournament.name.toLowerCase();
      let tournamentNumber = 1;
      if (tournamentName.includes("bmw") || tournamentName.includes("2")) {
        tournamentNumber = 2;
      } else if (
        tournamentName.includes("tour championship") ||
        tournamentName.includes("3")
      ) {
        tournamentNumber = 3;
      }

      const team = tournament.teams.find((t) => t.tourCardId === tourCard.id);

      if (team && team.score !== null && team.score !== undefined) {
        // For tournament 3, we only want the cumulative score from tournament 2
        // (which already includes tournament 1). We don't want to double count tournament 1.
        if (currentTournamentNumber === 3 && tournamentNumber === 3) {
          // For tournament 3, we'll use the cumulative score from tournament 2 as the starting point
          // This tournament's current score will be added during live scoring
          break;
        }

        cumulativeScore += team.score;
        tournamentsWithScores++;
        console.log(
          `🎯 ${tourCard.displayName} - Tournament ${tournament.name} (${tournamentNumber}): ${team.score}, Cumulative: ${cumulativeScore}`,
        );
      }
    }

    if (tournamentsWithScores > 0) {
      cumulativeScores.set(tourCard.id, {
        cumulativeScore: Math.round(cumulativeScore * 10) / 10,
        position: 0, // Will be calculated after all scores are collected
      });
    }
  }

  // Calculate positions based on cumulative scores within each playoff division
  const goldPlayers = Array.from(cumulativeScores.entries())
    .filter(([tourCardId]) => {
      const tourCard = tourCards.find((tc) => tc.id === tourCardId);
      return tourCard?.playoff === 1;
    })
    .sort(([, a], [, b]) => a.cumulativeScore - b.cumulativeScore);

  const silverPlayers = Array.from(cumulativeScores.entries())
    .filter(([tourCardId]) => {
      const tourCard = tourCards.find((tc) => tc.id === tourCardId);
      return tourCard?.playoff === 2;
    })
    .sort(([, a], [, b]) => a.cumulativeScore - b.cumulativeScore);

  // Assign positions within each division, handling ties properly
  let currentPosition = 1;
  for (let i = 0; i < goldPlayers.length; i++) {
    const entry = goldPlayers[i];
    if (!entry) continue;
    const [tourCardId, data] = entry;

    // Check if this player is tied with the previous player
    if (i > 0) {
      const prevEntry = goldPlayers[i - 1];
      if (prevEntry && data.cumulativeScore !== prevEntry[1].cumulativeScore) {
        // Different score, move to next position accounting for ties
        currentPosition = i + 1;
      }
      // Same score = same position (currentPosition stays the same)
    }

    cumulativeScores.set(tourCardId, { ...data, position: currentPosition });
  }

  currentPosition = 1;
  for (let i = 0; i < silverPlayers.length; i++) {
    const entry = silverPlayers[i];
    if (!entry) continue;
    const [tourCardId, data] = entry;

    // Check if this player is tied with the previous player
    if (i > 0) {
      const prevEntry = silverPlayers[i - 1];
      if (prevEntry && data.cumulativeScore !== prevEntry[1].cumulativeScore) {
        // Different score, move to next position accounting for ties
        currentPosition = i + 1;
      }
      // Same score = same position (currentPosition stays the same)
    }

    cumulativeScores.set(tourCardId, { ...data, position: currentPosition });
  }

  console.log(
    `✅ Calculated cumulative scores for ${cumulativeScores.size} playoff players`,
  );
  return cumulativeScores;
}

/**
 * Main function to update all teams for a tournament
 */
export async function updateAllTeamsOptimized(
  tournament: TournamentWithRelations,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
): Promise<UpdateResult> {
  console.log(`🚀 Starting team update for tournament: ${tournament.name}`);
  console.log(
    `📊 Tournament info: Round ${tournament.currentRound}, Live: ${tournament.livePlay}`,
  );

  if (!tournament.teams.length) {
    console.log("⚠️ No teams found for tournament");
    return {
      teamsUpdated: 0,
      tournamentProcessed: true,
      totalTeams: 0,
    };
  }

  // For playoff tournaments, calculate cumulative scores first
  let cumulativeScores = new Map<
    string,
    { cumulativeScore: number; position: number }
  >();
  if (isPlayoffTournament(tournament)) {
    cumulativeScores = await calculateCumulativePlayoffScores(
      tournament,
      tourCards,
    );
  }

  // Calculate team scores
  const calculatedTeams = tournament.teams.map((team) =>
    calculateTeamScore(
      team,
      tournament.golfers,
      tournament,
      tourCards,
      cumulativeScores,
    ),
  );

  // Calculate positions
  const teamsWithPositions = calculateTeamPositions(
    calculatedTeams,
    tourCards,
    tournament,
    cumulativeScores,
  );

  // Prepare update data
  const updateData: TeamUpdateData[] = teamsWithPositions.map((team) => ({
    id: team.id,
    round: team.round,
    roundOne:
      team.roundOne === null
        ? null
        : team.roundOne !== undefined
          ? Math.round(team.roundOne * 10) / 10
          : team.roundOne,
    roundTwo:
      team.roundTwo === null
        ? null
        : team.roundTwo !== undefined
          ? Math.round(team.roundTwo * 10) / 10
          : team.roundTwo,
    roundThree:
      team.roundThree === null
        ? null
        : team.roundThree !== undefined
          ? Math.round(team.roundThree * 10) / 10
          : team.roundThree,
    roundFour:
      team.roundFour === null
        ? null
        : team.roundFour !== undefined
          ? Math.round(team.roundFour * 10) / 10
          : team.roundFour,
    today:
      team.today === null
        ? null
        : team.today !== undefined
          ? Math.round(team.today * 10) / 10
          : team.today,
    thru:
      team.thru === null
        ? null
        : team.thru !== undefined
          ? Math.round(team.thru * 10) / 10
          : team.thru,
    score:
      team.score === null
        ? null
        : team.score !== undefined
          ? Math.round(team.score * 10) / 10
          : team.score,
    position: team.position,
    pastPosition: team.pastPosition,
    roundOneTeeTime: team.roundOneTeeTime,
    roundTwoTeeTime: team.roundTwoTeeTime,
    roundThreeTeeTime: team.roundThreeTeeTime,
    roundFourTeeTime: team.roundFourTeeTime,
    points: team.points,
    earnings: team.earnings,
  }));

  // Batch update teams
  const teamsUpdated = await batchUpdateTeams(updateData);

  console.log(`✅ Team update completed: ${teamsUpdated} teams updated`);

  return {
    teamsUpdated,
    tournamentProcessed: true,
    totalTeams: tournament.teams.length,
  };
}

/**
 * Calculate team score based on tournament round and live play status
 */
function calculateTeamScore(
  team: Team,
  allGolfers: Golfer[],
  tournament: TournamentWithRelations,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
  cumulativeScores: Map<string, { cumulativeScore: number; position: number }>,
): Team & TeamCalculation {
  const teamGolfers = allGolfers.filter((g) =>
    team.golferIds.includes(g.apiId),
  );

  const result = { ...team } as Team & TeamCalculation;

  // Get playoff tournament order if this is a playoff tournament
  const playoffTournamentNumber = getPlayoffTournamentNumber(tournament);

  // Get starting score for playoff tournaments
  let carryOverScore = 0;
  if (isPlayoffTournament(tournament)) {
    if (playoffTournamentNumber === 1) {
      // Tournament 1: Apply starting strokes only
      carryOverScore = calculatePlayoffStartingStrokes(
        team,
        tourCards,
        tournament,
      );
    } else if (playoffTournamentNumber === 2) {
      // Tournament 2: Start with final score from tournament 1
      const cumulativeData = cumulativeScores.get(team.tourCardId);
      carryOverScore = cumulativeData?.cumulativeScore ?? 0;
    } else if (playoffTournamentNumber === 3) {
      // Tournament 3: Start with final score from tournament 2 only (which already includes tournament 1)
      const cumulativeData = cumulativeScores.get(team.tourCardId);
      carryOverScore = cumulativeData?.cumulativeScore ?? 0;
    }
  }

  // Determine golfer selection based on playoff tournament and round
  let golfersToUse = teamGolfers;
  let golferCount = 10; // Default for regular tournaments and early rounds

  if (isPlayoffTournament(tournament)) {
    if (playoffTournamentNumber === 1) {
      // Tournament 1: All golfers for rounds 1-2, top 5 for rounds 3-4
      if ((tournament.currentRound ?? 1) >= 3) {
        golferCount = 5;
      } else {
        golferCount = 10;
      }
      golfersToUse = teamGolfers; // Always use all 10 golfers as the pool
    } else if (playoffTournamentNumber === 2) {
      // Tournament 2: Top 5 golfers from all 10 for all rounds
      golferCount = 5;
      golfersToUse = teamGolfers; // Use all 10 golfers as the pool
    } else if (playoffTournamentNumber === 3) {
      // Tournament 3: Top 3 golfers from all 10 for all rounds
      golferCount = 3;
      golfersToUse = teamGolfers; // Use all 10 golfers as the pool
    }
  } else {
    // Regular tournament: All golfers for rounds 1-2, top 5 for rounds 3-4
    if ((tournament.currentRound ?? 1) >= 3) {
      golferCount = 5;
    } else {
      golferCount = 10;
    }
    golfersToUse = teamGolfers;
  }

  // Special handling for playoff teams with no golfers - they get par scores + starting strokes
  if (isPlayoffTournament(tournament) && teamGolfers.length === 0) {
    result.round = tournament.currentRound ?? 1;

    // Calculate par-based scores for each completed round
    const courseParPerRound = tournament.course.par;

    if (!tournament.livePlay) {
      // Post-round: Set completed rounds to par (0 relative to par)
      if (result.round >= 2) result.roundOne = courseParPerRound; // Par score
      if (result.round >= 3) result.roundTwo = courseParPerRound; // Par score
      if (result.round >= 4) result.roundThree = courseParPerRound; // Par score
      if (result.round >= 5) result.roundFour = courseParPerRound; // Par score

      // Calculate total score: completed rounds at par + carry over score
      let totalParScore = 0;
      if (result.round >= 2) totalParScore += 0; // Round 1 at par (0 relative to par)
      if (result.round >= 3) totalParScore += 0; // Round 2 at par (0 relative to par)
      if (result.round >= 4) totalParScore += 0; // Round 3 at par (0 relative to par)
      if (result.round >= 5) totalParScore += 0; // Round 4 at par (0 relative to par)

      result.today = 0; // Par for the completed round
      result.thru = 18;
      result.score = totalParScore + carryOverScore;
    } else {
      // Live play: Set today to par, thru to 18
      result.today = 0; // Playing at par
      result.thru = 18;

      // Calculate score including completed rounds
      let totalParScore = 0;
      if (result.round >= 2) totalParScore += 0; // Round 1 at par
      if (result.round >= 3) totalParScore += 0; // Round 2 at par
      if (result.round >= 4) totalParScore += 0; // Round 3 at par

      result.score = totalParScore + carryOverScore;
    }

    // Set other fields
    result.position = "1"; // Will be calculated later
    result.pastPosition = "1"; // Will be calculated later
    result.points = 0;
    result.earnings = 0;

    console.log(
      `🏌️ Team ${team.id} has no golfers - assigned par scores + starting strokes: ${carryOverScore}`,
    );
    return result;
  }

  // Round 1 logic
  if (tournament.currentRound === 1) {
    result.round = 1;

    if (!tournament.livePlay) {
      // Pre-tournament: Calculate tee times (always use all golfers for tee times)
      result.roundOneTeeTime = getEarliestTeeTime(
        teamGolfers,
        "roundOneTeeTime",
      );
      result.roundTwoTeeTime = getEarliestTeeTime(
        teamGolfers,
        "roundTwoTeeTime",
      );
      result.roundOne = null;
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
      result.today = null;
      result.thru = null;
      result.score = carryOverScore || null;
    } else {
      // Live round 1 - select top golfers dynamically based on golferCount
      const selectedGolfers =
        golferCount === 10
          ? golfersToUse
          : getTopGolfers(golfersToUse, golferCount);
      result.today =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.thru =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.score =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.score ?? 0), 0) /
            selectedGolfers.length +
            carryOverScore) *
            10,
        ) / 10;
      result.roundOne = null;
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 2 logic
  else if (tournament.currentRound === 2) {
    result.round = 2;
    const selectedGolfers =
      golferCount === 10
        ? golfersToUse
        : getTopGolfers(golfersToUse, golferCount);
    result.roundOne =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;

    if (!tournament.livePlay) {
      // Post round 1
      result.today =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.thru = 18;
      result.score =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length +
            carryOverScore) *
            10,
        ) / 10;
      result.roundTwoTeeTime = getEarliestTeeTime(
        teamGolfers,
        "roundTwoTeeTime",
      );
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
    } else {
      // Live round 2
      result.today =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.thru =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.score =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length +
            selectedGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
              selectedGolfers.length +
            carryOverScore) *
            10,
        ) / 10;
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 3 logic
  else if (tournament.currentRound === 3) {
    result.round = 3;
    const selectedGolfers =
      golferCount === 10
        ? golfersToUse
        : getTopGolfers(golfersToUse, golferCount);
    result.roundOne =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;
    result.roundTwo =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;

    // Check if team has enough active golfers from the golfer pool
    const activeGolfersFromPool = golfersToUse.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfersFromPool.length < golferCount) {
      // Team is cut - not enough active golfers to meet requirement
      console.log(
        `⚠️ Team ${team.id} cut in round 3 - only ${activeGolfersFromPool.length} active golfers remaining, need ${golferCount}`,
      );
      result.position = "CUT";
      result.roundThree = null;
      result.roundFour = null;
      result.today = null;
      result.thru = null;
      result.score = null;
      return result;
    }

    if (!tournament.livePlay) {
      // Post round 2
      result.today =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length) *
            10,
        ) / 10;
      result.thru = 18;
      result.score =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length +
            selectedGolfers.reduce(
              (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
              0,
            ) /
              selectedGolfers.length +
            carryOverScore) *
            10,
        ) / 10;
      result.roundThree = null;
      result.roundFour = null;
    } else {
      // Live round 3 - select the best performers for this round
      const topActiveGolfers = getTopGolfers(
        activeGolfersFromPool,
        golferCount,
      );

      result.today =
        Math.round(
          (topActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
            topActiveGolfers.length) *
            10,
        ) / 10;
      result.thru =
        Math.round(
          (topActiveGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) /
            topActiveGolfers.length) *
            10,
        ) / 10;
      result.score =
        Math.round(
          (selectedGolfers.reduce(
            (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
            0,
          ) /
            selectedGolfers.length +
            selectedGolfers.reduce(
              (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
              0,
            ) /
              selectedGolfers.length +
            topActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
              topActiveGolfers.length +
            carryOverScore) *
            10,
        ) / 10;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 4 logic
  else if (tournament.currentRound === 4) {
    result.round = 4;
    const selectedGolfers =
      golferCount === 10
        ? golfersToUse
        : getTopGolfers(golfersToUse, golferCount);
    result.roundOne =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;
    result.roundTwo =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;

    const activeGolfersFromPool = golfersToUse.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfersFromPool.length < golferCount) {
      // Team is cut - not enough active golfers to meet requirement
      console.log(
        `⚠️ Team ${team.id} cut in round 4 - only ${activeGolfersFromPool.length} active golfers remaining, need ${golferCount}`,
      );
      result.position = "CUT";
      result.roundThree = null;
      result.roundFour = null;
      result.today = null;
      result.thru = null;
      result.score = null;
      return result;
    }

    const topActiveGolfers = getTopGolfers(activeGolfersFromPool, golferCount);

    result.roundThree =
      Math.round(
        (topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) /
          topActiveGolfers.length) *
          10,
      ) / 10;

    if (!tournament.livePlay) {
      // Post round 3
      result.today =
        Math.round(
          (topActiveGolfers.reduce(
            (sum, g) => sum + ((g.roundThree ?? 0) - tournament.course.par),
            0,
          ) /
            topActiveGolfers.length) *
            10,
        ) / 10;
      result.thru = 18;
      result.score =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
            selectedGolfers.length +
            selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
              selectedGolfers.length +
            topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) /
              topActiveGolfers.length -
            tournament.course.par * 3 +
            carryOverScore) *
            10,
        ) / 10;
      result.roundFour = null;
    } else {
      // Live round 4
      const liveActiveGolfers = getTopGolfers(
        activeGolfersFromPool,
        golferCount,
      );

      result.today =
        Math.round(
          (liveActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
            liveActiveGolfers.length) *
            10,
        ) / 10;
      result.thru =
        Math.round(
          (liveActiveGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) /
            liveActiveGolfers.length) *
            10,
        ) / 10;
      result.score =
        Math.round(
          (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
            selectedGolfers.length +
            selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
              selectedGolfers.length +
            topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) /
              topActiveGolfers.length +
            liveActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) /
              liveActiveGolfers.length -
            tournament.course.par * 3 +
            carryOverScore) *
            10,
        ) / 10;
      result.roundFour = null;
    }
  }
  // Round 5 logic (rare but possible)
  else if (tournament.currentRound === 5) {
    result.round = 5;
    const selectedGolfers =
      golferCount === 10
        ? golfersToUse
        : getTopGolfers(golfersToUse, golferCount);
    result.roundOne =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;
    result.roundTwo =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
          selectedGolfers.length) *
          10,
      ) / 10;

    const activeGolfersFromPool = golfersToUse.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfersFromPool.length < golferCount) {
      // Team is cut - not enough active golfers to meet requirement
      console.log(
        `⚠️ Team ${team.id} cut in round 5 - only ${activeGolfersFromPool.length} active golfers remaining, need ${golferCount}`,
      );
      result.position = "CUT";
      result.today = null;
      result.thru = null;
      result.score = null;
      result.roundThree = null;
      result.roundFour = null;
      return result;
    }

    const round3ActiveGolfers = getTopGolfers(
      activeGolfersFromPool,
      golferCount,
    );
    const round4ActiveGolfers = getTopGolfers(
      activeGolfersFromPool,
      golferCount,
    );

    result.roundThree =
      Math.round(
        (round3ActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) /
          round3ActiveGolfers.length) *
          10,
      ) / 10;
    result.roundFour =
      Math.round(
        (round4ActiveGolfers.reduce((sum, g) => sum + (g.roundFour ?? 0), 0) /
          round4ActiveGolfers.length) *
          10,
      ) / 10;
    result.today =
      Math.round(
        (round4ActiveGolfers.reduce(
          (sum, g) => sum + ((g.roundFour ?? 0) - tournament.course.par),
          0,
        ) /
          round4ActiveGolfers.length) *
          10,
      ) / 10;
    result.thru = 18;
    result.score =
      Math.round(
        (selectedGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) /
          selectedGolfers.length +
          selectedGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) /
            selectedGolfers.length +
          round3ActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) /
            round3ActiveGolfers.length +
          round4ActiveGolfers.reduce((sum, g) => sum + (g.roundFour ?? 0), 0) /
            round4ActiveGolfers.length -
          tournament.course.par * 4 +
          carryOverScore) *
          10,
      ) / 10;
  }

  // Starting strokes are already applied via carryOverScore for tournament 1
  // No need to apply them again here

  return result;
}

/**
 * Calculate team positions based on scores
 */
function calculateTeamPositions(
  teams: (Team & TeamCalculation)[],
  tourCards: (TourCard & { member: Member; tour: Tour })[],
  tournament: TournamentWithRelations,
  cumulativeScores?: Map<string, { cumulativeScore: number; position: number }>,
): (Team & TeamCalculation)[] {
  return teams.map((team) => {
    // If team is already marked as CUT, keep that position
    if (team.position === "CUT") {
      return team;
    }

    const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);

    // Calculate all position-related data in one comprehensive function
    const positionData = calculateTeamPositionData(
      team,
      teams,
      tourCard,
      tourCards,
      tournament,
      cumulativeScores,
    );

    // Apply all calculated values
    team.position = positionData.position;
    team.pastPosition = positionData.pastPosition;
    team.points = positionData.points;
    team.earnings = positionData.earnings;

    return team;
  });
}

/**
 * Calculate comprehensive position data for a team including position, pastPosition, points, and earnings
 */
function calculateTeamPositionData(
  team: Team & TeamCalculation,
  allTeams: (Team & TeamCalculation)[],
  tourCard: (TourCard & { member: Member; tour: Tour }) | undefined,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
  tournament: TournamentWithRelations,
  cumulativeScores?: Map<string, { cumulativeScore: number; position: number }>,
): {
  position: string;
  pastPosition: string;
  points: number;
  earnings: number;
} {
  // Get teams for comparison - use playoff division for playoff tournaments, tour for regular tournaments
  const activeTeams = getActiveTeams(allTeams);
  const teamsForComparison = isPlayoffTournament(tournament)
    ? getTeamsInSamePlayoffDivision(activeTeams, tourCard, tourCards)
    : getTeamsInSameTour(activeTeams, tourCard, tourCards);

  // For playoff tournaments, use cumulative scores for positioning if available
  let currentTiedTeams: (Team & TeamCalculation)[];
  let currentBetterTeams: (Team & TeamCalculation)[];

  if (
    isPlayoffTournament(tournament) &&
    cumulativeScores &&
    cumulativeScores.size > 0
  ) {
    // Use cumulative playoff standings for position calculation
    const teamCumulativeData = cumulativeScores.get(team.tourCardId);
    if (teamCumulativeData) {
      // Find teams with same cumulative position (tied)
      currentTiedTeams = teamsForComparison.filter((t) => {
        const tCumulativeData = cumulativeScores.get(t.tourCardId);
        return tCumulativeData?.position === teamCumulativeData.position;
      });

      // Find teams with better cumulative position (lower position number = better)
      currentBetterTeams = teamsForComparison.filter((t) => {
        const tCumulativeData = cumulativeScores.get(t.tourCardId);
        return (tCumulativeData?.position ?? 999) < teamCumulativeData.position;
      });

      console.log(
        `🏆 ${tourCard?.displayName} - Cumulative Position: ${teamCumulativeData.position}, Tied: ${currentTiedTeams.length}, Better: ${currentBetterTeams.length}`,
      );
    } else {
      // Fallback to current tournament score if no cumulative data
      currentTiedTeams = teamsForComparison.filter(
        (t) => t.score === team.score,
      );
      currentBetterTeams = teamsForComparison.filter(
        (t) => (t.score ?? 999) < (team.score ?? 999),
      );
    }
  } else {
    // Regular tournament position calculation based on current tournament score
    currentTiedTeams = teamsForComparison.filter(
      (t: Team & TeamCalculation) => t.score === team.score,
    );
    currentBetterTeams = teamsForComparison.filter(
      (t: Team & TeamCalculation) => (t.score ?? 999) < (team.score ?? 999),
    );
  }

  const position = formatPosition(
    currentBetterTeams.length + 1,
    currentTiedTeams.length > 1,
  );

  // Calculate past position
  const pastScore = calculatePastScore(team, tournament, tourCard, tourCards);
  const teamsForPastCalculation =
    team.round > 3 ? getActiveTeams(allTeams) : allTeams;
  const pastTeamsForComparison = isPlayoffTournament(tournament)
    ? getTeamsInSamePlayoffDivision(
        teamsForPastCalculation,
        tourCard,
        tourCards,
      )
    : getTeamsInSameTour(teamsForPastCalculation, tourCard, tourCards);

  const tiedPastTeams = pastTeamsForComparison.filter(
    (t: Team & TeamCalculation) => {
      const tTourCard = tourCards.find((tc) => tc.id === t.tourCardId);
      const tPastScore = calculatePastScore(
        t,
        tournament,
        tTourCard,
        tourCards,
      );
      return tPastScore === pastScore;
    },
  );

  const betterPastTeams = pastTeamsForComparison.filter(
    (t: Team & TeamCalculation) => {
      const tTourCard = tourCards.find((tc) => tc.id === t.tourCardId);
      const tPastScore = calculatePastScore(
        t,
        tournament,
        tTourCard,
        tourCards,
      );
      return (tPastScore ?? 999) < (pastScore ?? 999);
    },
  );

  const pastPosition = formatPosition(
    betterPastTeams.length + 1,
    tiedPastTeams.length > 1,
  );

  // Calculate points and earnings using playoff-specific logic
  const tiedTeams = currentTiedTeams.length;
  const betterTeams = currentBetterTeams.length;
  const tierPayouts = tournament.tier.payouts;
  const tierPoints = tournament.tier.points;

  let points = 0;
  let earnings = 0;

  if (isPlayoffTournament(tournament)) {
    const playoffTournamentNumber = getPlayoffTournamentNumber(tournament);

    if (playoffTournamentNumber === 1 || playoffTournamentNumber === 2) {
      // Tournaments 1 and 2: No points or earnings awarded
      points = 0;
      earnings = 0;
    } else if (playoffTournamentNumber === 3) {
      // Tournament 3: No points, but earnings based on playoff division
      points = 0;

      if (tourCard?.playoff === 1) {
        // Gold playoff: Use payouts 1-75 (top 75 payouts)
        earnings = Math.round(
          tierPayouts
            .slice(betterTeams, Math.min(betterTeams + tiedTeams, 75))
            .reduce((sum, payout) => sum + payout, 0) / tiedTeams,
        );
      } else if (tourCard?.playoff === 2) {
        // Silver playoff: Use payouts 76-150 (positions 76-150)
        const silverStartIndex = 75; // 0-based index for position 76
        const silverBetterTeams = Math.max(0, betterTeams);
        const silverEndIndex = Math.min(
          silverStartIndex + silverBetterTeams + tiedTeams,
          150,
        );

        earnings = Math.round(
          tierPayouts
            .slice(silverStartIndex + silverBetterTeams, silverEndIndex)
            .reduce((sum, payout) => sum + payout, 0) / tiedTeams,
        );
      }
    }
  } else {
    // Regular tournaments: Use standard points and earnings calculation
    points = Math.round(
      tierPoints
        .slice(betterTeams, betterTeams + tiedTeams)
        .reduce((sum, point) => sum + point, 0) / tiedTeams,
    );

    earnings = Math.round(
      tierPayouts
        .slice(betterTeams, betterTeams + tiedTeams)
        .reduce((sum, payout) => sum + payout, 0) / tiedTeams,
    );
  }

  return {
    position,
    pastPosition,
    points,
    earnings,
  };
}

/**
 * Calculate a team's score at the end of the previous round
 */
function calculatePastScore(
  team: Team & TeamCalculation,
  tournament: TournamentWithRelations,
  tourCard?: TourCard & { member: Member; tour: Tour },
  tourCards?: (TourCard & { member: Member; tour: Tour })[],
): number | null {
  // Round 1 or Round 2 not live: no past score
  if (team.round === 1 || (team.round === 2 && !tournament.livePlay)) {
    let pastScore = 0;

    // Apply playoff starting strokes if this is a playoff tournament
    if (isPlayoffTournament(tournament) && tourCard && tourCards) {
      const startingStrokes = calculatePlayoffStartingStrokes(
        { ...team, tourCardId: tourCard.id } as Team,
        tourCards,
        tournament,
      );
      pastScore += startingStrokes;
    }

    return pastScore;
  }

  // Round 2 live or Round 3 not live: past score is after round 1
  if (
    (team.round === 2 && tournament.livePlay) ||
    (team.round === 3 && !tournament.livePlay)
  ) {
    let pastScore = Math.round((team.roundOne ?? 0) * 10) / 10;

    // Apply playoff starting strokes if this is a playoff tournament
    if (isPlayoffTournament(tournament) && tourCard && tourCards) {
      const startingStrokes = calculatePlayoffStartingStrokes(
        { ...team, tourCardId: tourCard.id } as Team,
        tourCards,
        tournament,
      );
      pastScore = Math.round((pastScore + startingStrokes) * 10) / 10;
    }

    return pastScore;
  }

  // Round 3 live or Round 4 not live: past score is after round 2
  if (
    (team.round === 3 && tournament.livePlay) ||
    (team.round === 4 && !tournament.livePlay)
  ) {
    let pastScore =
      Math.round(((team.roundOne ?? 0) + (team.roundTwo ?? 0)) * 10) / 10;

    // Apply playoff starting strokes if this is a playoff tournament
    if (isPlayoffTournament(tournament) && tourCard && tourCards) {
      const startingStrokes = calculatePlayoffStartingStrokes(
        { ...team, tourCardId: tourCard.id } as Team,
        tourCards,
        tournament,
      );
      pastScore = Math.round((pastScore + startingStrokes) * 10) / 10;
    }

    return pastScore;
  }

  // Round 4 live or Round 5+: past score is after round 3
  if ((team.round === 4 && tournament.livePlay) || team.round > 4) {
    let pastScore =
      Math.round(
        ((team.roundOne ?? 0) + (team.roundTwo ?? 0) + (team.roundThree ?? 0)) *
          10,
      ) / 10;

    // Apply playoff starting strokes if this is a playoff tournament
    if (isPlayoffTournament(tournament) && tourCard && tourCards) {
      const startingStrokes = calculatePlayoffStartingStrokes(
        { ...team, tourCardId: tourCard.id } as Team,
        tourCards,
        tournament,
      );
      pastScore = Math.round((pastScore + startingStrokes) * 10) / 10;
    }

    return pastScore;
  }

  // Default to current score
  let defaultScore = Math.round((team.score ?? 0) * 10) / 10;

  // Apply playoff starting strokes if this is a playoff tournament
  if (isPlayoffTournament(tournament) && tourCard && tourCards) {
    const startingStrokes = calculatePlayoffStartingStrokes(
      { ...team, tourCardId: tourCard.id } as Team,
      tourCards,
      tournament,
    );
    defaultScore = Math.round((defaultScore + startingStrokes) * 10) / 10;
  }

  return defaultScore;
}

/**
 * Get teams that are not cut, withdrawn, or disqualified
 */
function getActiveTeams(
  teams: (Team & TeamCalculation)[],
): (Team & TeamCalculation)[] {
  return teams.filter((t) => !["CUT", "WD", "DQ"].includes(t.position));
}

/**
 * Get teams that are in the same tour as the given team
 */
function getTeamsInSameTour(
  teams: (Team & TeamCalculation)[],
  tourCard: (TourCard & { member: Member; tour: Tour }) | undefined,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
): (Team & TeamCalculation)[] {
  return teams.filter((t) => {
    const tTourCard = tourCards.find((tc) => tc.id === t.tourCardId);
    return tourCard?.tourId === tTourCard?.tourId;
  });
}

/**
 * Get teams that are in the same playoff division as the given team
 */
function getTeamsInSamePlayoffDivision(
  teams: (Team & TeamCalculation)[],
  tourCard: (TourCard & { member: Member; tour: Tour }) | undefined,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
): (Team & TeamCalculation)[] {
  return teams.filter((t) => {
    const tTourCard = tourCards.find((tc) => tc.id === t.tourCardId);
    return tourCard?.playoff === tTourCard?.playoff;
  });
}

/**
 * Format position string with tie indicator
 */
function formatPosition(position: number, isTied: boolean): string {
  return isTied ? `T${position}` : position.toString();
}

/**
 * Get earliest tee time from team golfers
 */
function getEarliestTeeTime(
  teamGolfers: Golfer[],
  teeTimeField: "roundOneTeeTime" | "roundTwoTeeTime",
): string {
  return (
    teamGolfers
      .reduce((earliest: Date | null, g) => {
        if (!g[teeTimeField]) return earliest;
        const teeTime = new Date(g[teeTimeField]);
        return !earliest || teeTime < earliest ? teeTime : earliest;
      }, null)
      ?.toTimeString() ?? ""
  );
}

/**
 * Batch update teams in the database
 */
async function batchUpdateTeams(updateData: TeamUpdateData[]): Promise<number> {
  if (!updateData.length) return 0;

  console.log(`🔄 Batch updating ${updateData.length} teams`);

  let updated = 0;
  await batchProcess(
    updateData,
    10, // Process 10 teams at a time
    async (teamData) => {
      await db.team.update({
        where: { id: teamData.id },
        data: {
          round: teamData.round,
          roundOne: teamData.roundOne,
          roundTwo: teamData.roundTwo,
          roundThree: teamData.roundThree,
          roundFour: teamData.roundFour,
          today: teamData.today,
          thru: teamData.thru,
          score: teamData.score,
          position: teamData.position,
          pastPosition: teamData.pastPosition,
          roundOneTeeTime: teamData.roundOneTeeTime,
          roundTwoTeeTime: teamData.roundTwoTeeTime,
          roundThreeTeeTime: teamData.roundThreeTeeTime,
          roundFourTeeTime: teamData.roundFourTeeTime,
          points: teamData.points,
          earnings: teamData.earnings,
        },
      });
      updated++;
    },
  );

  console.log(`✅ Successfully updated ${updated} teams`);
  return updated;
}

/**
 * Check if a tournament is a playoff tournament
 */
function isPlayoffTournament(tournament: TournamentWithRelations): boolean {
  return tournament.tier.name.toLowerCase().includes("playoff");
}

/**
 * Get which playoff tournament this is (1, 2, or 3) based on the tournament name or date
 */
function getPlayoffTournamentNumber(
  tournament: TournamentWithRelations,
): number {
  const name = tournament.name.toLowerCase();

  // Common playoff tournament naming patterns
  if (
    name.includes("fedex") ||
    name.includes("st. jude") ||
    name.includes("1")
  ) {
    return 1;
  } else if (name.includes("bmw") || name.includes("2")) {
    return 2;
  } else if (name.includes("tour championship") || name.includes("3")) {
    return 3;
  }

  // Fallback: assume it's the first tournament
  return 1;
}

/**
 * Get top N golfers based on their current performance
 */
function getTopGolfers(golfers: Golfer[], count: number): Golfer[] {
  if (golfers.length <= count) return golfers;

  // Sort by score (lowest first), with fallbacks for missing data
  return golfers
    .sort((a, b) => {
      const aScore = a.score ?? a.today ?? 999;
      const bScore = b.score ?? b.today ?? 999;
      return aScore - bScore;
    })
    .slice(0, count);
}

/**
 * Calculate starting strokes for a team in playoff tournaments
 * based on their cumulative playoff standings position, properly handling ties
 */
function calculatePlayoffStartingStrokes(
  team: Team,
  tourCards: (TourCard & { member: Member; tour: Tour })[],
  tournament: TournamentWithRelations,
  cumulativeScores?: Map<string, { cumulativeScore: number; position: number }>,
): number {
  const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
  if (!tourCard || !tourCard.playoff) {
    return 0; // No starting strokes if not in playoffs
  }

  // Get the playoff tier points array (contains starting strokes from -10 to 0)
  const playoffStrokes = tournament.tier.points;

  // For playoff tournaments after the first one, use cumulative standings
  if (cumulativeScores && cumulativeScores.size > 0) {
    const teamCumulativeData = cumulativeScores.get(team.tourCardId);
    if (teamCumulativeData) {
      // Get all teams in the same playoff division with cumulative data
      const samePlayoffDivision = Array.from(cumulativeScores.entries())
        .filter(([tcId]) => {
          const tc = tourCards.find((t) => t.id === tcId);
          return tc?.playoff === tourCard.playoff;
        })
        .map(([tcId, data]) => ({ tourCardId: tcId, ...data }))
        .sort((a, b) => a.position - b.position);

      // Find teams with the same cumulative position (tied teams)
      const tiedTeams = samePlayoffDivision.filter(
        (data) => data.position === teamCumulativeData.position,
      );

      // Find teams with better cumulative position
      const betterTeams = samePlayoffDivision.filter(
        (data) => data.position < teamCumulativeData.position,
      );

      // Calculate the range of positions occupied by tied teams
      const startPosition = betterTeams.length + 1;
      const endPosition = betterTeams.length + tiedTeams.length;

      // Calculate average strokes for tied positions
      const strokesSum = playoffStrokes
        .slice(startPosition - 1, endPosition)
        .reduce((sum, strokes) => sum + strokes, 0);

      const startingStrokes =
        Math.round((strokesSum / tiedTeams.length) * 10) / 10;

      console.log(
        `🎯 Team ${team.id} (${tourCard.displayName}) - Cumulative Playoff Position: ${teamCumulativeData.position}, Tied Teams: ${tiedTeams.length}, Positions: ${startPosition}-${endPosition}, Starting Strokes: ${startingStrokes}`,
      );

      return startingStrokes;
    }
  }

  // Fallback to original season points-based calculation for first playoff tournament
  // Get all teams in the same playoff division
  const samePlayoffDivision = tourCards.filter(
    (tc) => tc.playoff === tourCard.playoff,
  );

  // Sort by points (highest first) to determine playoff standings position
  const sortedByPoints = samePlayoffDivision.sort(
    (a, b) => b.points - a.points,
  );

  // Find teams with the same points as this team (tied teams)
  const tiedTeams = samePlayoffDivision.filter(
    (tc) => tc.points === tourCard.points,
  );

  // Find teams with better points (higher position teams)
  const betterTeams = samePlayoffDivision.filter(
    (tc) => tc.points > tourCard.points,
  );

  // Calculate the range of positions occupied by tied teams
  const startPosition = betterTeams.length + 1;
  const endPosition = betterTeams.length + tiedTeams.length;

  // Calculate average strokes for tied positions
  const strokesSum = playoffStrokes
    .slice(startPosition - 1, endPosition)
    .reduce((sum, strokes) => sum + strokes, 0);

  const startingStrokes = Math.round((strokesSum / tiedTeams.length) * 10) / 10;

  console.log(
    `🎯 Team ${team.id} (${tourCard.displayName}) - Playoff Division: ${tourCard.playoff}, Points: ${tourCard.points}, Tied Teams: ${tiedTeams.length}, Positions: ${startPosition}-${endPosition}, Starting Strokes: ${startingStrokes}`,
  );

  return startingStrokes;
}
