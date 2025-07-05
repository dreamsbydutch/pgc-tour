import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/**
 * Optimized router for seasonal store data
 * Returns minimal data structures to prevent localStorage quota issues
 */
export const storeRouter = createTRPCRouter({
  /**
   * Get all essential seasonal data in one optimized query
   * Only includes minimal necessary data for the store
   */
  getSeasonalData: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get minimal tournaments data (no teams/golfers)
      const tournaments = await ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          startDate: true,
          endDate: true,
          livePlay: true,
          currentRound: true,
          seasonId: true,
          courseId: true,
          tierId: true,
          course: {
            select: {
              id: true,
              name: true,
              location: true,
              par: true,
              apiId: true,
            },
          },
          tier: {
            select: {
              id: true,
              name: true,
              seasonId: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
      });

      // Get minimal tour cards (no heavy includes)
      const allTourCards = await ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          memberId: true,
          tourId: true,
          seasonId: true,
          displayName: true,
          earnings: true,
          points: true,
          position: true,
        },
      });

      // Get tours
      const tours = await ctx.db.tour.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          buyIn: true,
          shortForm: true,
        },
      });

      // Get tiers
      const tiers = await ctx.db.tier.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          name: true,
          seasonId: true,
        },
      });

      return {
        tournaments,
        allTourCards,
        tours,
        tiers,
      };
    }),

  /**
   * Get minimal tournament data for store (no teams/golfers)
   */
  getMinimalTournaments: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          startDate: true,
          endDate: true,
          livePlay: true,
          currentRound: true,
          course: {
            select: {
              id: true,
              name: true,
              location: true,
              par: true,
            },
          },
          tier: {
            select: {
              id: true,
              name: true,
              seasonId: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
      });
    }),

  /**
   * Get minimal tour cards for store
   */
  getMinimalTourCards: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        select: {
          id: true,
          memberId: true,
          tourId: true,
          seasonId: true,
          displayName: true,
          earnings: true,
          points: true,
          position: true,
        },
      });
    }),
});
