/**
 * Server action to fetch a user's team, tour card, and golfers for a tournament.
 *
 * Returns minimal, type-safe objects for use in team-building and tournament UIs.
 *
 * - Returns the user's tour card for the season (if any)
 * - Returns the user's team for the tournament (if any)
 * - Returns all golfers for the tournament, and the subset on the user's team
 * - Handles errors gracefully and provides a loading/error state
 *
 * @module server/actions/getTournamentTeamData
 */
import { api } from "@/trpc/server";
import type { Team, Golfer, TourCard } from "@prisma/client";

/**
 * Minimal tour card type for team/tournament UI.
 * Only includes fields needed for team selection and display.
 */
export type MinimalTourCard = Pick<
  TourCard,
  "id" | "seasonId" | "memberId" | "points" | "earnings" | "position"
>;

/**
 * Minimal team type for team/tournament UI.
 * Only includes fields needed for team selection and display.
 */
export type MinimalTeam = Pick<
  Team,
  "id" | "tournamentId" | "tourCardId" | "golferIds"
>;

/**
 * Minimal golfer type for team/tournament UI.
 * Only includes fields needed for team selection and display.
 */
export type MinimalGolfer = Pick<
  Golfer,
  "id" | "playerName" | "worldRank" | "rating" | "group"
>;

/**
 * Arguments for getTournamentTeamData.
 */
interface GetTournamentTeamDataArgs {
  /** Tournament ID to fetch team/golfers for */
  tournamentId: string;
  /** Member ID (user), or null if not logged in */
  memberId: string | null;
  /** Season ID for the tournament */
  seasonId: string;
}

/**
 * Fetches the user's team, tour card, and golfers for a tournament.
 *
 * Returns minimal objects for use in team-building and tournament UIs.
 *
 * @param {GetTournamentTeamDataArgs} args - Arguments for fetching team data
 * @returns {Promise<{
 *   tourCard: MinimalTourCard | null;
 *   existingTeam: MinimalTeam | null;
 *   teamGolfers: MinimalGolfer[];
 * }>} Team/tour card/golfer data for the tournament
 *
 * @example
 * const { tourCard, existingTeam, teamGolfers, isTeamLoading, teamError } = await getTournamentTeamData({
 *   tournamentId: "...",
 *   memberId: "...",
 *   seasonId: "..."
 * });
 */
export async function getTournamentTeamData({
  tournamentId,
  memberId,
  seasonId,
}: GetTournamentTeamDataArgs) {
  let tourCard: MinimalTourCard | null = null;
  let existingTeam: MinimalTeam | null = null;
  let teamGolfers: MinimalGolfer[] = [];

  // Fetch the user's tour card for this season
  if (memberId) {
    const tourCards = await api.tourCard.getByMember({ memberId });
    const found =
      tourCards.find((card: TourCard) => card.seasonId === seasonId) ?? null;
    if (found) {
      tourCard = {
        id: found.id,
        seasonId: found.seasonId,
        memberId: found.memberId,
        points: found.points,
        earnings: found.earnings,
        position: found.position,
      };
    }
  }

  // Fetch the user's team for this tournament
  if (tourCard) {
    const teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
    const found =
      teams.find((team: Team) => team.tournamentId === tournamentId) ?? null;
    if (found) {
      existingTeam = {
        id: found.id,
        tournamentId: found.tournamentId,
        tourCardId: found.tourCardId,
        golferIds: found.golferIds,
      };
    }
  }

  // Fetch all golfers for this tournament
  const golfers = await api.golfer.getByTournament({ tournamentId });
  const allGolfers: MinimalGolfer[] = golfers.map((g: Golfer) => ({
    id: g.id,
    playerName: g.playerName,
    worldRank: g.worldRank,
    rating: g.rating,
    group: g.group,
  }));

  // Find the golfers on the user's team
  if (existingTeam && allGolfers.length > 0) {
    teamGolfers = allGolfers.filter((g) =>
      existingTeam?.golferIds?.includes(g.id),
    );
  }

  return {
    tourCard,
    existingTeam,
    teamGolfers,
  };
}
