import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

/**
 * Optimized router for seasonal store data
 * Returns full Prisma types for all store data (except member/tourCard, which are fetched separately)
 */
export const storeRouter = createTRPCRouter({
  /**
   * Get all essential seasonal data in one optimized query
   * Returns full objects for tournaments (with course), tours, tiers, and all tour cards
   */
  getSeasonalData: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Use Promise.all for parallel queries
      const [tournaments, allTourCards, tours, tiers] = await Promise.all([
        // Get tournaments with full fields and included course
        ctx.db.tournament.findMany({
          where: { seasonId: input.seasonId },
          include: {
            course: true,
            tier: true,
          },
          orderBy: { startDate: "asc" },
        }),

        // Get all tour cards for the season (full fields)
        ctx.db.tourCard.findMany({
          where: { seasonId: input.seasonId },
          orderBy: [{ points: "desc" }, { earnings: "desc" }],
        }),

        // Get all tours for the season (full fields)
        ctx.db.tour.findMany({
          where: { seasonId: input.seasonId },
          orderBy: { name: "asc" },
        }),

        // Get all tiers for the season (full fields)
        ctx.db.tier.findMany({
          where: { seasonId: input.seasonId },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        tournaments, // TournamentWithCourse[]
        allTourCards, // TourCard[]
        tours, // Tour[]
        tiers, // Tier[]
      };
    }),

  /**
   * Get optimized standings data with pre-computed position changes
   * This reduces client-side computation and improves performance
   */
  getStandingsData: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all base data in parallel
      const [tournaments, allTourCards, tours, tiers, teams] =
        await Promise.all([
          ctx.db.tournament.findMany({
            where: { seasonId: input.seasonId },
            include: { course: true, tier: true },
            orderBy: { startDate: "asc" },
          }),
          ctx.db.tourCard.findMany({
            where: { seasonId: input.seasonId },
            orderBy: [{ points: "desc" }, { earnings: "desc" }],
          }),
          ctx.db.tour.findMany({
            where: { seasonId: input.seasonId },
            orderBy: { name: "asc" },
          }),
          ctx.db.tier.findMany({
            where: { seasonId: input.seasonId },
            orderBy: { name: "asc" },
          }),
          ctx.db.team.findMany({
            where: { tournament: { seasonId: input.seasonId } },
            select: {
              id: true,
              tourCardId: true,
              tournamentId: true,
              points: true,
            },
          }),
        ]);

      // Pre-compute position changes on the server
      const now = new Date();
      const pastTournament = tournaments
        .filter((t) => new Date(t.endDate) < now)
        .sort(
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        )[0];

      let extendedTourCards = allTourCards;

      if (pastTournament) {
        // Create lookup map for past tournament teams
        const pastTeamsMap = new Map<string, number>();
        teams
          .filter((team) => team.tournamentId === pastTournament.id)
          .forEach((team) => {
            if (team.tourCardId) {
              pastTeamsMap.set(team.tourCardId, team.points ?? 0);
            }
          });

        // Calculate position changes on server
        const tourCardsWithPastPoints = allTourCards.map((tc) => {
          const pastTournamentPoints = pastTeamsMap.get(tc.id) ?? 0;
          return {
            ...tc,
            pastPoints: tc.points - pastTournamentPoints,
          };
        });

        // Pre-sort for position calculations
        const sortedByPastPoints = [...tourCardsWithPastPoints].sort(
          (a, b) => (b.pastPoints ?? 0) - (a.pastPoints ?? 0),
        );
        const sortedByCurrentPoints = [...tourCardsWithPastPoints].sort(
          (a, b) => b.points - a.points,
        );

        // Create position maps
        const pastPositionMap = new Map<string, number>();
        const currentPositionMap = new Map<string, number>();

        sortedByPastPoints.forEach((tc, index) => {
          pastPositionMap.set(tc.id, index + 1);
        });

        sortedByCurrentPoints.forEach((tc, index) => {
          currentPositionMap.set(tc.id, index + 1);
        });

        // Calculate final extended tour cards with position changes
        extendedTourCards = tourCardsWithPastPoints.map((tc) => {
          const pastPositionPO = pastPositionMap.get(tc.id) ?? 999;
          const currentPositionPO = currentPositionMap.get(tc.id) ?? 999;

          // Calculate position within tour
          const tourCards = tourCardsWithPastPoints.filter(
            (card) => card.tourId === tc.tourId,
          );
          const sortedTourCards = [...tourCards].sort(
            (a, b) => (b.pastPoints ?? 0) - (a.pastPoints ?? 0),
          );
          const pastPositionInTour =
            sortedTourCards.findIndex((card) => card.id === tc.id) + 1;

          const currentPositionInTour = parseInt(
            tc.position?.replace("T", "") ?? "999",
            10,
          );
          const posChange = pastPositionInTour - currentPositionInTour;
          const posChangePO = pastPositionPO - currentPositionPO;

          return {
            ...tc,
            pastPoints: tc.pastPoints,
            posChange: isNaN(posChange) ? 0 : posChange,
            posChangePO: isNaN(posChangePO) ? 0 : posChangePO,
          };
        });
      } else {
        // No past tournament, add default values
        extendedTourCards = allTourCards.map((tc) => ({
          ...tc,
          pastPoints: tc.points,
          posChange: 0,
          posChangePO: 0,
        }));
      }

      return {
        tournaments,
        allTourCards: extendedTourCards,
        tours,
        tiers,
        teams: teams.map((team) => ({
          id: team.id,
          tourCardId: team.tourCardId,
          tournamentId: team.tournamentId,
          points: team.points,
        })),
      };
    }),
  getLastTourCardsUpdate: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the most recent updatedAt from all tour cards for this season
      const mostRecentTourCard = await ctx.db.tourCard.findFirst({
        where: { seasonId: input.seasonId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });

      return {
        lastUpdated: mostRecentTourCard?.updatedAt ?? null,
      };
    }),
});
