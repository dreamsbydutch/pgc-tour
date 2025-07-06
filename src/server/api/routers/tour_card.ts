import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tourCard.findMany({
      include: { member: true },
    });
  }),

  getByDisplayName: publicProcedure
    .input(z.object({ name: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findFirst({
        where: { displayName: input.name, seasonId: input.seasonId },
        include: { member: true },
      });
    }),

  getById: publicProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({
        where: { id: input.tourCardId },
        include: { member: true },
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
        include: { member: true },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        include: { member: true, teams: true, tour: true },
      });
    }),

  getByTourId: publicProcedure
    .input(z.object({ tourId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { tourId: input.tourId },
        include: { member: true },
      });
    }),

  /**
   * Get tour cards by multiple filters
   * Supports the consolidated tourCard hooks
   */
  getFiltered: publicProcedure
    .input(
      z.object({
        seasonId: z.string().optional(),
        tourId: z.string().optional(),
        memberId: z.string().optional(),
        hasEarnings: z.boolean().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.seasonId) where.seasonId = input.seasonId;
      if (input.tourId) where.tourId = input.tourId;
      if (input.memberId) where.memberId = input.memberId;
      if (input.hasEarnings) where.earnings = { gt: 0 };

      return ctx.db.tourCard.findMany({
        where,
        include: {
          tour: true,
          member: true,
          season: true,
        },
        orderBy: [{ earnings: "desc" }, { points: "desc" }],
        ...(input.limit && { take: input.limit }),
      });
    }),

  /**
   * Get historical tour cards across seasons
   * For member history and cross-season analysis
   */
  getHistoricalByMember: publicProcedure
    .input(
      z.object({
        memberId: z.string(),
        includeSeasons: z.string().array().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: {
          memberId: input.memberId,
          ...(input.includeSeasons && {
            seasonId: { in: input.includeSeasons },
          }),
        },
        include: {
          tour: true,
          season: true,
        },
        orderBy: [{ season: { year: "desc" } }, { tour: { name: "asc" } }],
      });
    }),

  getSelfBySeason: publicProcedure
    .input(
      z.object({
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.season.findUnique({
        where: { year: new Date().getFullYear() },
      });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: ctx.user?.id,
        },
        include: { member: true },
      });
    }),
  getAllCurrent: publicProcedure.query(async ({ ctx }) => {
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
      },
      include: { member: true },
    });
  }),

  getSelfCurrent: publicProcedure.query(async ({ ctx }) => {
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
        memberId: ctx.user?.id,
      },
      include: { member: true },
    });
  }),

  getByUserSeason: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: input.userId,
        },
        include: { member: true },
      });
    }),

  create: protectedProcedure
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        position: z.string().optional().nullable(),
        appearances: z.number().optional(),
        topTen: z.number().optional(),
        win: z.number().optional(),
        madeCut: z.number().optional(),
        playoff: z.number().optional(),
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
          appearances: input.appearances,
          topTen: input.topTen,
          win: input.win,
          madeCut: input.madeCut,
          playoff: input.playoff,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ tourCardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.delete({
        where: { id: input.tourCardId },
      });
    }),
});
