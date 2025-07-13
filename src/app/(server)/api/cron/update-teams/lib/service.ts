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

import { db } from "@/server/db";
import { batchProcess } from "@/lib/utils/main";
import type {
  TournamentWithRelations,
  TeamCalculation,
  TeamUpdateData,
  UpdateResult,
} from "./types";
import type { Team, Golfer, TourCard, Member, Tour } from "@prisma/client";

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

  // Calculate team scores
  const calculatedTeams = tournament.teams.map((team) =>
    calculateTeamScore(team, tournament.golfers, tournament),
  );

  // Calculate positions
  const teamsWithPositions = calculateTeamPositions(calculatedTeams, tourCards);

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
    roundOneTeeTime: team.roundOneTeeTime,
    roundTwoTeeTime: team.roundTwoTeeTime,
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
): Team & TeamCalculation {
  const teamGolfers = allGolfers.filter((g) =>
    team.golferIds.includes(g.apiId),
  );

  const result = { ...team } as Team & TeamCalculation;

  // Round 1 logic
  if (tournament.currentRound === 1) {
    result.round = 1;

    if (!tournament.livePlay) {
      // Pre-tournament: Calculate tee times
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
      result.score = null;
    } else {
      // Live round 1
      result.today =
        teamGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 10;
      result.thru = teamGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) / 10;
      result.score =
        teamGolfers.reduce((sum, g) => sum + (g.score ?? 0), 0) / 10;
      result.roundOne = null;
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 2 logic
  else if (tournament.currentRound === 2) {
    result.round = 2;
    result.roundOne =
      teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10;

    if (!tournament.livePlay) {
      // Post round 1
      result.today =
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
          0,
        ) / 10;
      result.thru = 18;
      result.score =
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
          0,
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
        teamGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 10;
      result.thru = teamGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) / 10;
      result.score =
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
          0,
        ) /
          10 +
        teamGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 10;
      result.roundTwo = null;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 3 logic
  else if (tournament.currentRound === 3) {
    result.round = 3;
    result.roundOne =
      teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10;
    result.roundTwo =
      teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10;

    // Check if team has at least 5 active golfers after round 2
    const activeGolfers = teamGolfers.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfers.length < 5) {
      // Team is cut - null out scores and set position to CUT
      console.log(
        `⚠️ Team ${team.id} cut in round 3 - only ${activeGolfers.length} active golfers remaining`,
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
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
          0,
        ) / 10;
      result.thru = 18;
      result.score =
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
          0,
        ) /
          10 +
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
          0,
        ) /
          10;
      result.roundThree = null;
      result.roundFour = null;
    } else {
      // Live round 3 - use top 5 golfers
      const topActiveGolfers = activeGolfers
        .sort((a, b) => (a.today ?? 999) - (b.today ?? 999))
        .slice(0, 5);

      result.today =
        topActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 5;
      result.thru =
        topActiveGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) / 5;
      result.score =
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundOne ?? 0) - tournament.course.par),
          0,
        ) /
          10 +
        teamGolfers.reduce(
          (sum, g) => sum + ((g.roundTwo ?? 0) - tournament.course.par),
          0,
        ) /
          10 +
        topActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 5;
      result.roundThree = null;
      result.roundFour = null;
    }
  }
  // Round 4 logic
  else if (tournament.currentRound === 4) {
    result.round = 4;
    result.roundOne =
      teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10;
    result.roundTwo =
      teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10;

    const activeGolfers = teamGolfers.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfers.length < 5) {
      // Team is cut - null out scores and set position to CUT
      console.log(
        `⚠️ Team ${team.id} cut in round 4 - only ${activeGolfers.length} active golfers remaining`,
      );
      result.position = "CUT";
      result.roundThree = null;
      result.roundFour = null;
      result.today = null;
      result.thru = null;
      result.score = null;
      return result;
    }

    const topActiveGolfers = activeGolfers
      .sort((a, b) => (a.roundThree ?? 999) - (b.roundThree ?? 999))
      .slice(0, 5);

    result.roundThree =
      topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) / 5;

    if (!tournament.livePlay) {
      // Post round 3
      result.today =
        topActiveGolfers.reduce(
          (sum, g) => sum + ((g.roundThree ?? 0) - tournament.course.par),
          0,
        ) / 5;
      result.thru = 18;
      result.score =
        teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10 +
        teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10 +
        topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) / 5 -
        tournament.course.par * 3;
      result.roundFour = null;
    } else {
      // Live round 4
      const liveActiveGolfers = activeGolfers
        .sort((a, b) => (a.today ?? 999) - (b.today ?? 999))
        .slice(0, 5);

      result.today =
        liveActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 5;
      result.thru =
        liveActiveGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0) / 5;
      result.score =
        teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10 +
        teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10 +
        topActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) / 5 +
        liveActiveGolfers.reduce((sum, g) => sum + (g.today ?? 0), 0) / 5 -
        tournament.course.par * 3;
      result.roundFour = null;
    }
  }
  // Round 5 logic (rare but possible)
  else if (tournament.currentRound === 5) {
    result.round = 5;
    result.roundOne =
      teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10;
    result.roundTwo =
      teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10;

    const activeGolfers = teamGolfers.filter(
      (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
    );

    if (activeGolfers.length < 5) {
      // Team is cut - null out scores and set position to CUT
      console.log(
        `⚠️ Team ${team.id} cut in round 5 - only ${activeGolfers.length} active golfers remaining`,
      );
      result.position = "CUT";
      result.today = null;
      result.thru = null;
      result.score = null;
      result.roundThree = null;
      result.roundFour = null;
      return result;
    }

    const round3ActiveGolfers = activeGolfers
      .sort((a, b) => (a.roundThree ?? 999) - (b.roundThree ?? 999))
      .slice(0, 5);

    const round4ActiveGolfers = activeGolfers
      .sort((a, b) => (a.roundFour ?? 999) - (b.roundFour ?? 999))
      .slice(0, 5);

    result.roundThree =
      round3ActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) / 5;
    result.roundFour =
      round4ActiveGolfers.reduce((sum, g) => sum + (g.roundFour ?? 0), 0) / 5;
    result.today =
      round4ActiveGolfers.reduce(
        (sum, g) => sum + ((g.roundFour ?? 0) - tournament.course.par),
        0,
      ) / 5;
    result.thru = 18;
    result.score =
      teamGolfers.reduce((sum, g) => sum + (g.roundOne ?? 0), 0) / 10 +
      teamGolfers.reduce((sum, g) => sum + (g.roundTwo ?? 0), 0) / 10 +
      round3ActiveGolfers.reduce((sum, g) => sum + (g.roundThree ?? 0), 0) / 5 +
      round4ActiveGolfers.reduce((sum, g) => sum + (g.roundFour ?? 0), 0) / 5 -
      tournament.course.par * 4;
  }

  return result;
}

/**
 * Calculate team positions based on scores
 */
function calculateTeamPositions(
  teams: (Team & TeamCalculation)[],
  tourCards: (TourCard & { member: Member; tour: Tour })[],
): (Team & TeamCalculation)[] {
  return teams.map((team) => {
    // If team is already marked as CUT, keep that position
    if (team.position === "CUT") {
      return team;
    }
    const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);

    // Only calculate positions for teams that aren't cut
    const activeTeams = teams.filter(
      (t) =>
        t.position !== "CUT" &&
        tourCard?.tourId ===
          tourCards.find((tc) => tc.id === t.tourCardId)?.tourId,
    );
    const tiedTeams = activeTeams.filter(
      (t) =>
        t.score === team.score &&
        tourCard?.tourId ===
          tourCards.find((tc) => tc.id === t.tourCardId)?.tourId,
    ).length;
    const betterTeams = activeTeams.filter(
      (t) => (t.score ?? 999) < (team.score ?? 999),
    ).length;
    team.position =
      tiedTeams > 1 ? "T" + (betterTeams + 1) : (betterTeams + 1).toString();
    return team;
  });
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
          roundOneTeeTime: teamData.roundOneTeeTime,
          roundTwoTeeTime: teamData.roundTwoTeeTime,
        },
      });
      updated++;
    },
  );

  console.log(`✅ Successfully updated ${updated} teams`);
  return updated;
}
