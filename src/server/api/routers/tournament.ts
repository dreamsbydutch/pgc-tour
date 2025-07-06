import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tournament.findMany({
      orderBy: { startDate: "asc" },
      include: {
        course: true,
        tier: true,
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
        },
        orderBy: { startDate: "asc" },
      });
    }),
  getById: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: { course: true },
      });
    }),
  getInfo: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return {
      current: await ctx.db.tournament.findFirst({
        where: { startDate: { lte: today }, endDate: { gte: today } },
        orderBy: { startDate: "desc" },
        include: { course: true },
      }),
      past: await ctx.db.tournament.findFirst({
        where: { endDate: { lte: today } },
        orderBy: { startDate: "desc" },
        include: { course: true },
      }),
      next: await ctx.db.tournament.findFirst({
        where: { startDate: { gte: today } },
        orderBy: { startDate: "asc" },
        include: { course: true },
      }),
    };
  }),

  /**
   * Get tournaments by status (current, upcoming, completed)
   * Optimized for tournament navigation hooks
   */
  getByStatus: publicProcedure
    .input(
      z.object({
        status: z.enum(["current", "upcoming", "completed"]),
        seasonId: z.string().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const today = new Date();

      let dateFilter = {};
      switch (input.status) {
        case "current":
          dateFilter = {
            startDate: { lte: today },
            endDate: { gte: today },
          };
          break;
        case "upcoming":
          dateFilter = {
            startDate: { gt: today },
          };
          break;
        case "completed":
          dateFilter = {
            endDate: { lt: today },
          };
          break;
      }

      return ctx.db.tournament.findMany({
        where: {
          ...dateFilter,
          ...(input.seasonId && { seasonId: input.seasonId }),
        },
        include: {
          course: true,
          tier: true,
        },
        orderBy:
          input.status === "upcoming"
            ? { startDate: "asc" }
            : { startDate: "desc" },
        ...(input.limit && { take: input.limit }),
      });
    }),

  /**
   * Get recent completed tournaments for champions display
   * With timing validation
   */
  getRecentCompleted: publicProcedure
    .input(
      z.object({
        daysBack: z.number().optional().default(7),
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.daysBack);

      return ctx.db.tournament.findMany({
        where: {
          endDate: {
            gte: cutoffDate,
            lt: new Date(),
          },
          ...(input.seasonId && { seasonId: input.seasonId }),
        },
        include: {
          course: true,
          tier: true,
        },
        orderBy: { endDate: "desc" },
        take: 5,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        livePlay: z.boolean().optional(),
        currentRound: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.update({ where: { id: input.id }, data: input });
    }),
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        logoUrl: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        courseId: z.string(),
        tierId: z.string(),
        seasonId: z.string(),
        tourIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.create({
        data: {
          name: input.name,
          logoUrl: input.logoUrl,
          startDate: input.startDate,
          endDate: input.endDate,
          courseId: input.courseId,
          tierId: input.tierId,
          seasonId: input.seasonId,
          tours: {
            connect: input.tourIds
              .map((id) => (id ? { id } : undefined))
              .filter((tour): tour is { id: string } => tour !== undefined),
          },
        },
      });
    }),
  delete: adminProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.delete({ where: { id: input.tournamentId } });
    }),
});
