import { z } from "zod";

import {
  publicProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@pgc-server";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.team.findMany({
      include: {
        tournament: true,
        tourCard: true,
      },
      orderBy: { score: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findUnique({
        where: { id: input.id },
        include: {
          tournament: true,
          tourCard: {
            include: { member: true },
          },
        },
      });
    }),

  getByTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          tourCard: {
            include: { member: true },
          },
        },
        orderBy: { score: "asc" },
      });
    }),

  getByTourCard: protectedProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: { tourCardId: input.tourCardId },
        include: {
          tournament: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getByUserTournament: protectedProcedure
    .input(
      z.object({
        tourCardId: z.string(),
        tournamentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findFirst({
        where: {
          tourCardId: input.tourCardId,
          tournamentId: input.tournamentId,
        },
        include: {
          tournament: true,
          tourCard: {
            include: { member: true },
          },
        },
      });
    }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: {
          tourCard: {
            memberId: input.memberId,
          },
        },
        include: {
          tournament: true,
          tourCard: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getChampionsByUser: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: {
          tourCard: { memberId: input.memberId },
          OR: [{ position: "1" }, { position: "T1" }],
        },
        include: {
          tournament: {
            select: { name: true, logoUrl: true, startDate: true },
          },
        },
        orderBy: { tournament: { tier: { payouts: "asc" } } },
      });
    }),
  getChampionsByTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findMany({
        where: {
          tournamentId: input.tournamentId,
          position: "1",
        },
        include: {
          tournament: true,
          tourCard: {
            include: { member: true },
          },
        },
        orderBy: { score: "asc" },
      });
    }),
  createOrUpdate: publicProcedure
    .input(
      z.object({
        golferIds: z.array(z.number()),
        tournamentId: z.string(),
        tourCardId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(input);
      // Try to find an existing team for this tourCard and tournament
      const existing = await ctx.db.team.findFirst({
        where: {
          tourCardId: input.tourCardId,
          tournamentId: input.tournamentId,
        },
      });
      console.log("Existing team:", existing);
      if (existing) {
        // Update the existing team
        return ctx.db.team.update({
          where: { id: existing.id },
          data: {
            golferIds: input.golferIds,
          },
        });
      }
      // Otherwise, create a new team
      return ctx.db.team.create({
        data: input,
      });
    }),
  create: publicProcedure
    .input(
      z.object({
        golferIds: z.array(z.number()),
        tournamentId: z.string(),
        tourCardId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.team.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        golferIds: z.array(z.number()).optional(),
        earnings: z.number().optional(),
        makeCut: z.number().optional(),
        points: z.number().optional(),
        today: z.number().optional(),
        thru: z.number().optional(),
        round: z.number().optional(),
        position: z.string().optional(),
        score: z.number().optional(),
        topTen: z.number().optional(),
        topFive: z.number().optional(),
        topThree: z.number().optional(),
        win: z.number().optional(),
        roundOne: z.number().optional(),
        roundTwo: z.number().optional(),
        roundThree: z.number().optional(),
        roundFour: z.number().optional(),
        roundOneTeeTime: z.string().optional(),
        roundTwoTeeTime: z.string().optional(),
        roundThreeTeeTime: z.string().optional(),
        roundFourTeeTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.team.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.team.delete({ where: { id: input.id } });
    }),
});
