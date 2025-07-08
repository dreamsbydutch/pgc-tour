import { api } from "@/trpc/server";

/**
 * Returns all teams for a given tournamentId.
 * @param tournamentId - The ID of the tournament
 */
export async function getTeamByTournamentAndUser(
  tournamentId: string,
  tourCardId: string,
) {
  if (!tournamentId || !tourCardId)
    throw new Error("tournamentId and tourCardId are required");
  return api.team.getByUserTournament({ tournamentId, tourCardId });
}
