/**
 * Main orchestration service for team updates
 */

import { api } from "@pgc-trpcServer";
import type { Team, Golfer } from "@prisma/client";
import type { TeamWithGolfers, TournamentWithCourse } from "./types";
import { calculateTeamScoring } from "./team-scoring";
import {
  groupTeamsByTour,
  calculatePositions,
  calculatePointsAndEarnings,
} from "./positions";
import { updateTeamInDatabase } from "./database";

/**
 * Updates all teams for the current tournament
 */
export async function updateAllTeams(
  teams: Team[],
  tournament: TournamentWithCourse,
  golfers: Golfer[],
): Promise<void> {
  // Create teams with their golfers
  const teamsWithGolfers = teams.map(
    (team): TeamWithGolfers => ({
      ...team,
      golfers: golfers.filter((golfer) =>
        team.golferIds.includes(golfer.apiId),
      ),
    }),
  );

  // Calculate scoring for all teams
  const updatedTeams = teamsWithGolfers.map((team) =>
    calculateTeamScoring(team, tournament),
  );

  // Update positions and prizes
  await updateTeamPositionsAndPrizes(updatedTeams, tournament);
}

/**
 * Updates team positions and calculates points/earnings
 */
async function updateTeamPositionsAndPrizes(
  teams: Team[],
  tournament: TournamentWithCourse,
): Promise<void> {
  const [tier, tourCards] = await Promise.all([
    api.tier.getById({ id: tournament.tierId }),
    api.tourCard.getBySeason({ seasonId: tournament.seasonId }),
  ]);

  const teamsByTour = groupTeamsByTour(teams, tourCards);

  for (const [, tourTeams] of teamsByTour) {
    const updatedTeams = calculatePositions(tourTeams);

    // Calculate points and earnings if tournament is complete
    const isComplete = !tournament.livePlay && tournament.currentRound === 5;
    if (isComplete && tier) {
      calculatePointsAndEarnings(updatedTeams, tier);
    }

    // Update teams in database
    await Promise.all(updatedTeams.map(updateTeamInDatabase));
  }
}
