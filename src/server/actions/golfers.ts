import { api } from "@trpcLocal/server";

/**
 * Returns all golfers for a given tournamentId.
 * @param tournamentId - The ID of the tournament
 */
export async function getGolfersByTournament(tournamentId: string) {
  if (!tournamentId) throw new Error("tournamentId is required");
  return api.golfer.getByTournament({ tournamentId });
}
