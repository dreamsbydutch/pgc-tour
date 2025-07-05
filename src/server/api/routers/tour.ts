import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const tourRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tour.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ tourID: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tour.findUnique({
        where: { id: input.tourID },
      });
    }),
  getActive: publicProcedure.query(async ({ ctx }) => {
    const activeSeason = await ctx.db.season.findUnique({
      where: { year: new Date().getFullYear() },
    });
    return await ctx.db.tour.findMany({
      where: { seasonId: activeSeason?.id },
    });
  }),
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tour.findMany({
        where: { seasonId: input.seasonId },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        logoUrl: z.string(),
        seasonYear: z.number(),
        shortForm: z.string(),
        buyIn: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tourSeason = await ctx.db.season.findUnique({
        where: { year: input.seasonYear },
      });
      if (!tourSeason) return null;
      return await ctx.db.tour.create({
        data: {
          name: input.name,
          logoUrl: input.logoUrl,
          seasonId: tourSeason.id,
          shortForm: input.shortForm,
          buyIn: input.buyIn,
        },
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        data: z.object({
          name: z.string().optional(),
          logoUrl: z.string().optional(),
          seasonYear: z.number().optional(),
          shortForm: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tour.update({
        where: { id: input.id },
        data: input.data,
      });
    }),
  delete: adminProcedure
    .input(z.object({ tourID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tour.delete({ where: { id: input.tourID } });
    }),
});
