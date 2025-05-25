import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const tierRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tier.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ tierID: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tier.findUnique({
        where: { id: input.tierID },
      });
    }),
  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const currentSeason = await ctx.db.season.findUnique({
      where: { year: 2025 },
    });
    return await ctx.db.tier.findMany({
      where: { seasonId: currentSeason?.id },
    });
  }),
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tier.findMany({
        where: { seasonId: input.seasonId },
      });
    }),
});
