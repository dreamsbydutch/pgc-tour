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
      // Use Promise.all for parallel queries
      const [tournaments, allTourCards, tours, tiers] = await Promise.all([
        // Get minimal tournaments data (no teams/golfers)
        ctx.db.tournament.findMany({
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
        }),

        // Get minimal tour cards (no heavy includes)
        ctx.db.tourCard.findMany({
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
          orderBy: [{ points: "desc" }, { earnings: "desc" }],
        }),

        // Get tours
        ctx.db.tour.findMany({
          where: { seasonId: input.seasonId },
          select: {
            id: true,
            name: true,
            logoUrl: true,
            buyIn: true,
            shortForm: true,
            seasonId: true,
          },
          orderBy: { name: "asc" },
        }),

        // Get tiers
        ctx.db.tier.findMany({
          where: { seasonId: input.seasonId },
          select: {
            id: true,
            name: true,
            seasonId: true,
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        tournaments,
        allTourCards,
        tours,
        tiers,
      };
    }),

  /**
   * Batch update tour cards
   */
  batchUpdateTourCards: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            earnings: z.number().optional(),
            points: z.number().optional(),
            position: z.string().optional(),
            displayName: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Use Promise.all for parallel updates
      const updatePromises = input.updates.map((update) =>
        ctx.db.tourCard.update({
          where: { id: update.id },
          data: {
            ...(update.earnings !== undefined && { earnings: update.earnings }),
            ...(update.points !== undefined && { points: update.points }),
            ...(update.position !== undefined && { position: update.position }),
            ...(update.displayName !== undefined && {
              displayName: update.displayName,
            }),
          },
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
        }),
      );

      return Promise.all(updatePromises);
    }),

  /**
   * Batch update tournaments
   */
  batchUpdateTournaments: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            livePlay: z.boolean().optional(),
            currentRound: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatePromises = input.updates.map((update) =>
        ctx.db.tournament.update({
          where: { id: update.id },
          data: {
            ...(update.name !== undefined && { name: update.name }),
            ...(update.livePlay !== undefined && { livePlay: update.livePlay }),
            ...(update.currentRound !== undefined && {
              currentRound: update.currentRound,
            }),
          },
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
        }),
      );

      return Promise.all(updatePromises);
    }),

  /**
   * Get tournaments with filters (server-side filtering for better performance)
   */
  getFilteredTournaments: publicProcedure
    .input(
      z.object({
        seasonId: z.string(),
        tierIds: z.array(z.string()).optional(),
        courseIds: z.array(z.string()).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = { seasonId: input.seasonId };

      if (input.tierIds?.length) {
        where.tierId = { in: input.tierIds };
      }

      if (input.courseIds?.length) {
        where.courseId = { in: input.courseIds };
      }

      if (input.startDate || input.endDate) {
        where.startDate = {};
        if (input.startDate) where.startDate.gte = input.startDate;
        if (input.endDate) where.startDate.lte = input.endDate;
      }

      return ctx.db.tournament.findMany({
        where,
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
    }),

  /**
   * Get tour cards with filters (server-side filtering)
   */
  getFilteredTourCards: publicProcedure
    .input(
      z.object({
        seasonId: z.string(),
        tourIds: z.array(z.string()).optional(),
        minEarnings: z.number().optional(),
        maxEarnings: z.number().optional(),
        minPoints: z.number().optional(),
        maxPoints: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = { seasonId: input.seasonId };

      if (input.tourIds?.length) {
        where.tourId = { in: input.tourIds };
      }

      if (input.minEarnings !== undefined || input.maxEarnings !== undefined) {
        where.earnings = {};
        if (input.minEarnings !== undefined)
          where.earnings.gte = input.minEarnings;
        if (input.maxEarnings !== undefined)
          where.earnings.lte = input.maxEarnings;
      }

      if (input.minPoints !== undefined || input.maxPoints !== undefined) {
        where.points = {};
        if (input.minPoints !== undefined) where.points.gte = input.minPoints;
        if (input.maxPoints !== undefined) where.points.lte = input.maxPoints;
      }

      return ctx.db.tourCard.findMany({
        where,
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
        orderBy: [{ points: "desc" }, { earnings: "desc" }],
      });
    }),
});
