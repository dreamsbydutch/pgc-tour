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
      const tournaments = await ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: {
          course: true,
          tier: true,
        },
        orderBy: { startDate: "asc" },
      });

      // Get teams and golfers for each tournament
      const tournamentsWithTeamsAndGolfers = await Promise.all(
        tournaments.map(async (tournament) => {
          const [teams, golfers] = await Promise.all([
            ctx.db.team.findMany({
              where: { tournamentId: tournament.id },
              include: {
                tourCard: {
                  include: {
                    tour: true,
                    member: true,
                  },
                },
              },
              orderBy: [{ position: "asc" }, { score: "asc" }],
            }),
            ctx.db.golfer.findMany({
              where: { tournamentId: tournament.id },
              orderBy: { position: "asc" },
            }),
          ]);

          return {
            ...tournament,
            teams,
            golfers,
          };
        }),
      );

      return tournamentsWithTeamsAndGolfers;
    }),
  getById: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: { course: true },
      });
    }),
  getByIdWithGolfers: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          course: true,
          golfers: true,
        },
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
  getActive: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db.tournament.findFirst({
      where: { startDate: { lte: today }, endDate: { gte: today } },
      include: {
        course: true,
      },
    });
  }),
  getCurrentSchedule: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db.tournament.findMany({
      where: { season: { year: today.getFullYear() } },
      include: {
        course: true,
        tier: true,
      },
      orderBy: { startDate: "asc" },
    });
  }),
  getSeasonSchedule: publicProcedure
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
  getByIdWithLeaderboard: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get tournament with all related data
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          course: true,
          tier: true,
          tours: true,
          season: true,
        },
      });

      if (!tournament) {
        return null;
      }

      // Get teams for this tournament with tour card details
      const teams = await ctx.db.team.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          tourCard: {
            include: {
              tour: true,
              member: true,
            },
          },
        },
        orderBy: [{ position: "asc" }, { score: "asc" }],
      });

      // Get golfers for this tournament
      const golfers = await ctx.db.golfer.findMany({
        where: { tournamentId: input.tournamentId },
        orderBy: { position: "asc" },
      });

      // Get tour cards for this tournament's season
      const tourCards = await ctx.db.tourCard.findMany({
        where: { seasonId: tournament.seasonId },
        include: {
          tour: true,
          member: true,
        },
      });

      return {
        tournament,
        teams,
        golfers,
        tourCards,
        tours: tournament.tours,
      };
    }),
});
