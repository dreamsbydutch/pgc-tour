import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/src/server/api/trpc";

export const cacheRouter = createTRPCRouter({
  /**
   * Get the latest cache invalidation timestamp
   */
  getLatestInvalidation: publicProcedure.query(async ({ ctx }) => {
    const latestInvalidation = await ctx.db.cacheInvalidation.findFirst({
      orderBy: { timestamp: "desc" },
      select: {
        timestamp: true,
        source: true,
        type: true,
      },
    });

    return {
      timestamp: latestInvalidation?.timestamp?.getTime() ?? 0,
      source: latestInvalidation?.source ?? null,
      type: latestInvalidation?.type ?? "global",
    };
  }),

  /**
   * Create a cache invalidation entry (manual refresh trigger)
   */
  invalidateCache: publicProcedure
    .input(
      z.object({
        source: z.string().default("manual"),
        type: z.enum(["global", "tourCards", "tournaments"]).default("global"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invalidation = await ctx.db.cacheInvalidation.create({
        data: {
          source: input.source,
          type: input.type,
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        timestamp: invalidation.timestamp.getTime(),
        source: invalidation.source,
        type: invalidation.type,
      };
    }),

  /**
   * Check if cache needs refresh based on store timestamp
   */
  checkNeedsRefresh: publicProcedure
    .input(
      z.object({
        storeTimestamp: z.number(), // Store's last updated timestamp
      }),
    )
    .query(async ({ ctx, input }) => {
      const latestInvalidation = await ctx.db.cacheInvalidation.findFirst({
        orderBy: { timestamp: "desc" },
      });

      if (!latestInvalidation) {
        return { needsRefresh: false, reason: "No invalidation records" };
      }

      const invalidationTime = latestInvalidation.timestamp.getTime();
      const needsRefresh = invalidationTime > input.storeTimestamp;

      return {
        needsRefresh,
        invalidationTimestamp: invalidationTime,
        storeTimestamp: input.storeTimestamp,
        reason: needsRefresh
          ? `Cache invalidated at ${new Date(invalidationTime).toISOString()}`
          : "Store is up to date",
        source: latestInvalidation.source,
      };
    }),

  /**
   * Get latest cache invalidations by type
   */
  getLatestByType: publicProcedure
    .input(
      z.object({
        type: z.enum(["global", "tourCards", "tournaments"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.type) {
        // Get latest for specific type
        const invalidation = await ctx.db.cacheInvalidation.findFirst({
          where: { type: input.type },
          orderBy: { timestamp: "desc" },
        });

        return {
          [input.type]: invalidation ? {
            timestamp: invalidation.timestamp.getTime(),
            source: invalidation.source,
            type: invalidation.type,
          } : null,
        };
      }

      // Get latest for all types
      const [global, tourCards, tournaments] = await Promise.all([
        ctx.db.cacheInvalidation.findFirst({
          where: { type: "global" },
          orderBy: { timestamp: "desc" },
        }),
        ctx.db.cacheInvalidation.findFirst({
          where: { type: "tourCards" },
          orderBy: { timestamp: "desc" },
        }),
        ctx.db.cacheInvalidation.findFirst({
          where: { type: "tournaments" },
          orderBy: { timestamp: "desc" },
        }),
      ]);

      return {
        global: global ? {
          timestamp: global.timestamp.getTime(),
          source: global.source,
          type: global.type,
        } : null,
        tourCards: tourCards ? {
          timestamp: tourCards.timestamp.getTime(),
          source: tourCards.source,
          type: tourCards.type,
        } : null,
        tournaments: tournaments ? {
          timestamp: tournaments.timestamp.getTime(),
          source: tournaments.source,
          type: tournaments.type,
        } : null,
      };
    }),

  /**
   * Get cache invalidation history
   */
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        type: z.enum(["global", "tourCards", "tournaments"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.type ? { type: input.type } : {};
      
      const invalidations = await ctx.db.cacheInvalidation.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: input.limit,
      });

      return invalidations.map((inv) => ({
        id: inv.id,
        timestamp: inv.timestamp.getTime(),
        source: inv.source,
        type: inv.type,
      }));
    }),

  /**
   * Get cache status overview
   */
  getStatus: publicProcedure.query(async ({ ctx }) => {
    const [latestOverall, latestTourCards, latestTournaments, totalCount] = await Promise.all([
      ctx.db.cacheInvalidation.findFirst({
        orderBy: { timestamp: "desc" },
      }),
      ctx.db.cacheInvalidation.findFirst({
        where: { type: "tourCards" },
        orderBy: { timestamp: "desc" },
      }),
      ctx.db.cacheInvalidation.findFirst({
        where: { type: "tournaments" },
        orderBy: { timestamp: "desc" },
      }),
      ctx.db.cacheInvalidation.count(),
    ]);

    return {
      status: "active",
      totalInvalidations: totalCount,
      latestInvalidation: latestOverall ? {
        timestamp: latestOverall.timestamp.getTime(),
        source: latestOverall.source,
        type: latestOverall.type,
      } : null,
      latestTourCardInvalidation: latestTourCards ? {
        timestamp: latestTourCards.timestamp.getTime(),
        source: latestTourCards.source,
        type: latestTourCards.type,
      } : null,
      latestTournamentInvalidation: latestTournaments ? {
        timestamp: latestTournaments.timestamp.getTime(),
        source: latestTournaments.source,
        type: latestTournaments.type,
      } : null,
    };
  }),
});
