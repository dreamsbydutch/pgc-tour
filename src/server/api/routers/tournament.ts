import { z } from "zod";

import { publicProcedure, createTRPCRouter } from "../trpc";

// Helper function to transform tournament data with proper date types
const transformTournamentDates = <T extends { startDate: Date; endDate: Date }>(
  tournament: T,
): T => ({
  ...tournament,
  startDate: new Date(tournament.startDate),
  endDate: new Date(tournament.endDate),
});

const transformTournamentArrayDates = <
  T extends { startDate: Date; endDate: Date },
>(
  tournaments: T[],
): T[] => tournaments.map(transformTournamentDates);

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const tournaments = await ctx.db.tournament.findMany({
      include: {
        course: true,
        season: true,
        tier: true,
        tours: true,
      },
      orderBy: { startDate: "desc" },
    });

    return transformTournamentArrayDates(tournaments);
  }),
  getById: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          course: true,
        },
      });

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      return transformTournamentDates(tournament);
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tournaments = await ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: {
          course: true,
          tier: true,
          tours: true,
        },
        orderBy: { startDate: "desc" },
      });

      return transformTournamentArrayDates(tournaments);
    }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const tournament = await ctx.db.tournament.findFirst({
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

    return tournament ? transformTournamentDates(tournament) : null;
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

    return {
      current: current ? transformTournamentDates(current) : null,
      next: next ? transformTournamentDates(next) : null,
    };
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
      const tournament = await ctx.db.tournament.update({
        where: { id },
        data,
        include: {
          course: true,
          season: true,
          tier: true,
          tours: true,
        },
      });

      return transformTournamentDates(tournament);
    }),
});
