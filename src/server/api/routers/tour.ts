import { z } from "zod";

import { publicProcedure, createTRPCRouter } from "@pgc-server";

export const tourRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tour.findMany({
      include: { season: true, tiers: true },
      orderBy: { name: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ tourID: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tour.findUnique({
        where: { id: input.tourID },
        include: {
          season: true,
          tournaments: true,
          tourCards: true,
          tiers: true,
        },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tour.findMany({
        where: { seasonId: input.seasonId },
        include: { season: true, tiers: true },
        orderBy: { name: "asc" },
      });
    }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const currentSeason = await ctx.db.season.findUnique({
      where: { year: currentYear },
    });

    if (!currentSeason) return [];

    return ctx.db.tour.findMany({
      where: { seasonId: currentSeason.id },
      include: { season: true, tiers: true },
      orderBy: { name: "asc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logoUrl: z.string(),
        seasonId: z.string(),
        shortForm: z.string(),
        buyIn: z.number(),
        playoffSpots: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tour.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        logoUrl: z.string().optional(),
        shortForm: z.string().optional(),
        buyIn: z.number().optional(),
        playoffSpots: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tour.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tour.delete({ where: { id: input.id } });
    }),
});
