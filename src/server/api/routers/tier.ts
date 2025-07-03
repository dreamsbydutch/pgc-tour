import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const tierRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tier.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tier.findUnique({
        where: { id: input.id },
      });
    }),
  getCurrent: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tier.findMany({
      where: { season: { year: new Date().getFullYear() } },
    });
  }),
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tier.findMany({
        where: { seasonId: input.seasonId },
      });
    }),
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        seasonId: z.string(),
        points: z.array(z.number()),
        payouts: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tier.create({
        data: {
          name: input.name,
          seasonId: input.seasonId,
          points: input.points,
          payouts: input.payouts,
        },
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        tierID: z.string(),
        name: z.string().optional(),
        points: z.array(z.number()).optional(),
        payouts: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tier.update({
        where: { id: input.tierID },
        data: {
          name: input.name ?? undefined,
          points: input.points ?? undefined,
          payouts: input.payouts ?? undefined,
        },
      });
    }),
  delete: adminProcedure
    .input(z.object({ tierID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tier.delete({
        where: { id: input.tierID },
      });
    }),
});
