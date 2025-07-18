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
   * Get the most recent tourCard update timestamp
   * This tells clients when tourCard data was last modified server-side
   */
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
