import { api } from "@/trpc/server";
import type { Team, Golfer, TourCard } from "@prisma/client";

// Minimal types for return values
export type MinimalTourCard = Pick<
  TourCard,
  "id" | "seasonId" | "memberId" | "points" | "earnings" | "position"
>;
export type MinimalTeam = Pick<
  Team,
  "id" | "tournamentId" | "tourCardId" | "golferIds"
>;
export type MinimalGolfer = Pick<
  Golfer,
  "id" | "playerName" | "worldRank" | "rating" | "group"
>;

interface GetTournamentTeamDataArgs {
  tournamentId: string;
  memberId: string | null;
  seasonId: string;
}

export async function getTournamentTeamData({
  tournamentId,
  memberId,
  seasonId,
}: GetTournamentTeamDataArgs) {
  let tourCard: MinimalTourCard | null = null;
  let existingTeam: MinimalTeam | null = null;
  let teamGolfers: MinimalGolfer[] = [];
  let isTeamLoading = false;
  let teamError: string | null = null;

  try {
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
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      teamError = (err as { message: string }).message;
    } else {
      teamError = "Unknown error";
    }
  }

  return {
    tourCard,
    existingTeam,
    teamGolfers,
    isTeamLoading,
    teamError,
  };
}
