import { z } from "zod";

import {
  publicProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@pgc-server";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tourCard.findMany({
      include: {
        member: true,
        season: true,
        tour: true,
      },
      orderBy: { points: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({
        where: { id: input.id },
        include: {
          member: true,
          season: true,
          tour: true,
          teams: {
            include: { tournament: true },
          },
        },
      });
    }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { memberId: input.memberId },
        include: {
          season: true,
          tour: true,
          teams: {
            include: { tournament: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        include: {
          member: true,
          tour: true,
        },
        orderBy: { points: "desc" },
      });
    }),

  getByTourId: publicProcedure
    .input(z.object({ tourId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { tourId: input.tourId },
        include: {
          member: true,
          season: true,
          tour: true,
        },
        orderBy: { points: "desc" },
      });
    }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
        include: {
          season: true,
          tour: true,
          teams: {
            include: { tournament: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getSelfCurrent: protectedProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    const currentSeason = await ctx.db.season.findUnique({
      where: { year: currentYear },
    });

    if (!currentSeason) return null;

    return ctx.db.tourCard.findFirst({
      where: {
        memberId: ctx.user.id,
        seasonId: currentSeason.id,
      },
      include: {
        season: true,
        tour: true,
        teams: {
          include: { tournament: true },
        },
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        displayName: z.string().min(1),
        memberId: z.string(),
        tourId: z.string(),
        seasonId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tourCard.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        win: z.number().optional(),
        topTen: z.number().optional(),
        madeCut: z.number().optional(),
        appearances: z.number().optional(),
        playoff: z.number().optional(),
        position: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tourCard.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tourCard.delete({ where: { id: input.id } });
    }),
});
