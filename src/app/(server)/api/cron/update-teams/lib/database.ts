/**
 * Database operations for team updates
 */

import { api } from "@trpcLocal/server";
import type { Team } from "@prisma/client";

/**
 * Updates a team in the database
 */
export async function updateTeamInDatabase(team: Team): Promise<void> {
  await api.team.update({
    id: team.id,
    position: team.position ?? undefined,
    score: team.score ?? undefined,
    today: team.today ?? undefined,
    thru: team.thru ?? undefined,
    points: team.points ?? undefined,
    earnings: team.earnings ?? undefined,
    round: team.round ?? undefined,
    roundOne: team.roundOne ?? undefined,
    roundTwo: team.roundTwo ?? undefined,
    roundThree: team.roundThree ?? undefined,
    roundFour: team.roundFour ?? undefined,
    roundOneTeeTime: team.roundOneTeeTime ?? undefined,
    roundTwoTeeTime: team.roundTwoTeeTime ?? undefined,
    roundThreeTeeTime: team.roundThreeTeeTime ?? undefined,
    roundFourTeeTime: team.roundFourTeeTime ?? undefined,
  });
}
