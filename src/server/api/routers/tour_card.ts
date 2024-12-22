import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ tournamentID: z.string() }))
    .query(() => {
      return {};
    }),

  getById: publicProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({ where: { id: input.tourCardId } });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.userId) return;
      return await ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
      });
    }),

  getBySeasonId: publicProcedure
    .input(z.object({ seasonId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.seasonId) return;
      return await ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
      });
    }),

  getByTourId: publicProcedure
    .input(z.object({ tourId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.tourId) return;
      return await ctx.db.tourCard.findMany({
        where: { tourId: input.tourId },
      });
    }),

  getByUserSeason: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.userId || !input.seasonId) return;
      return await ctx.db.tourCard.findFirst({
        where: { seasonId: input.seasonId, memberId: input.userId },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        seasonId: z.string().min(1),
        email: z.string().min(1),
        displayName: z.string().min(1),
        fullName: z.string().min(1),
        buyin: z.number().min(1),
        tourId: z.string().min(1),
        memberId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.create({
        data: {
          seasonId: input.seasonId,
          displayName: input.displayName,
          tourId: input.tourId,
          memberId: input.memberId,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        position: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.update({
        where: { id: input.id },
        data: {
          earnings: input.earnings,
          points: input.points,
          position: input.position,
          displayName: input.displayName,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ tourCardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.delete({ where: { id: input.tourCardId } });
    }),
});
