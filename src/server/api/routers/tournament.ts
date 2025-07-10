import { z } from "zod";

import { publicProcedure, createTRPCRouter } from "@server/api/trpc";

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tournament.findMany({
      include: {
        course: true,
        season: true,
        tier: true,
        tours: true,
      },
      orderBy: { startDate: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          course: true,
          season: true,
          tier: true,
          tours: true,
          golfers: {
            orderBy: { score: "asc" },
          },
          teams: {
            include: { tourCard: true },
            orderBy: { score: "asc" },
          },
        },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: {
          course: true,
          tier: true,
          tours: true,
        },
        orderBy: { startDate: "desc" },
      });
    }),

  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.db.tournament.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        course: true,
        season: true,
        tier: true,
        tours: true,
        golfers: {
          orderBy: { score: "asc" },
        },
      },
    });
  }),

  getInfo: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const [current, next] = await Promise.all([
      ctx.db.tournament.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          course: true,
          season: true,
          tier: true,
          tours: true,
        },
      }),
      ctx.db.tournament.findFirst({
        where: {
          startDate: { gt: now },
        },
        include: {
          course: true,
          season: true,
          tier: true,
          tours: true,
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    return { current, next };
  }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.db.tournament.findFirst({
      where: {
        OR: [
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          {
            startDate: { gt: now },
          },
        ],
      },
      include: {
        course: true,
        season: true,
        tier: true,
        tours: true,
      },
      orderBy: { startDate: "asc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
        tierId: z.string(),
        courseId: z.string(),
        seasonId: z.string(),
        logoUrl: z.string().optional(),
        apiId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        logoUrl: z.string().optional(),
        currentRound: z.number().optional(),
        livePlay: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tournament.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.delete({ where: { id: input.id } });
    }),
});
