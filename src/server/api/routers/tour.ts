import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tourDataIncludeTourCard } from "@/src/types/prisma_include";

export const tourRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tour.findMany({});
  }),

  getById: publicProcedure
    .input(z.object({ tourID: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tour.findUnique({
        where: { id: input.tourID },
        include: tourDataIncludeTourCard,
      });
    }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    const activeSeason = await ctx.db.season.findUnique({
      where: { year: 2025 },
    });
    return await ctx.db.tour.findMany({
      where: { seasonId: activeSeason?.id },
      include: tourDataIncludeTourCard,
    });
  }),
  getBySeason: publicProcedure
    .input(z.object({ seasonID: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tour.findMany({
        where: { seasonId: input.seasonID },
        include: tourDataIncludeTourCard,
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        logoUrl: z.string(),
        seasonYear: z.number(),
        shortForm: z.string(),
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
        },
      });
    }),

  update: publicProcedure
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

  delete: publicProcedure
    .input(z.object({ tourID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tour.delete({ where: { id: input.tourID } });
    }),
});
