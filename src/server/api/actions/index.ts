/**
 * Server Actions Index
 * Consolidated exports for all server-side data fetching actions
 *
 * This is the server-side equivalent of the hooks folder, providing
 * the same data outputs but designed for server-side execution.
 */

// Tournament Navigation Actions
export {
  getTournamentData,
  getTournamentHistory,
  getCurrentTournament,
  getNextTournament,
} from "./tournaments";

// Leaderboard Data Actions
export {
  getLeaderboardData,
  getCurrentLeaderboard,
  getHistoricalLeaderboard,
} from "./leaderboards";

// Champions Data Actions
export { getRecentChampions, getChampionsByTournament } from "./champions";

// Golfer Actions
export {
  updateUsageForTournament,
  getGolfersWithUsage,
  getTopGolfers,
} from "./golfer";

// Member Actions
export {
  updateMemberTiers,
  getMemberWithTourCards,
  getMembersByTier,
  getMemberStats,
} from "./member";

// Team Actions
export {
  teamCreateOnFormSubmit,
  updateTeamGolfers,
  deleteTeam,
  getTeamsForTournament,
  getTeamStats,
} from "./team";

// Transaction Actions
export {
  processPayment,
  addFunds,
  getTransactionHistory,
  getAccountBalance,
} from "./transaction";

// Tour Card Actions
export {
  createTourCard,
  deleteTourCard,
  updateTourCardNames,
} from "./tour_card";

// Tour Card Data Actions (simplified version)
export async function getTourCardsSimple(memberIds?: string[]) {
  const { db } = await import("../../db");

  const whereClause = memberIds?.length ? { memberId: { in: memberIds } } : {};

  const tourCards = await db.tourCard.findMany({
    where: whereClause,
    include: {
      tour: true,
      member: true,
    },
    orderBy: { earnings: "desc" },
  });

  return tourCards.map((tc) => ({
    id: tc.id,
    memberId: tc.memberId,
    tourId: tc.tourId,
    earnings: tc.earnings,
    points: tc.points,
    member: {
      id: tc.member.id,
      email: tc.member.email,
      firstname: tc.member.firstname,
      lastname: tc.member.lastname,
    },
    tour: {
      id: tc.tour.id,
      name: tc.tour.name,
      seasonId: tc.tour.seasonId,
    },
  }));
}

/**
 * Get tour cards for a specific member
 */
export async function getMemberCardsSimple(memberId: string) {
  return getTourCardsSimple([memberId]);
}
