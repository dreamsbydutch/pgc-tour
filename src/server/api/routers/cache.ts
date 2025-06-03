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
        type: z.string().default("global"),
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
});
