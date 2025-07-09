import { api } from "@/trpc/server";

/**
 * Returns all teams for a single user at a given tournamentId.
 * @param tournamentId - The ID of the tournament
 * @param tourCardId - The ID of the user's tour card
 */
export async function getTeamByTournamentAndUser(
  tournamentId: string,
  tourCardId: string,
) {
  if (!tournamentId || !tourCardId)
    throw new Error("tournamentId and tourCardId are required");
  return api.team.getByUserTournament({ tournamentId, tourCardId });
}

/**
 * Returns all teams for a given tournamentId.
 * @param tournamentId - The ID of the tournament
 */
export async function getTeamsByTournament(tournamentId: string) {
  if (!tournamentId) throw new Error("tournamentId is required");
  return api.team.getByTournament({ tournamentId });
}

export async function getUserChampions(memberId: string) {
  if (!memberId) throw new Error("memberId is required");
  return api.team.getChampionsByUser({ memberId });
}
