import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { teamDataInclude } from "@/src/types/prisma_include";

export const teamRouter = createTRPCRouter({
  getByTourCard: publicProcedure
    .input(z.object({ tourCardId: z.string().optional() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db.team.findMany({
          where: {
            tourCardId: input.tourCardId,
          },
          include: teamDataInclude,
          orderBy: { score: "asc" },
        }),
    ),
  getBySeasonId: publicProcedure
    .input(z.object({ seasonId: z.string().optional() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db.team.findMany({
          where: {
            tournament: {
              seasonId: input.seasonId,
            },
          },
          include: teamDataInclude,
          orderBy: { score: "asc" },
        }),
    ),
  getByTournament: publicProcedure
    .input(z.object({ tournamentId: z.string().optional() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db.team.findMany({
          where: {
            tournamentId: input.tournamentId,
          },
          include: teamDataInclude,
          orderBy: { score: "asc" },
        }),
    ),
  getByUserTournament: publicProcedure
    .input(z.object({ tourCardId: z.string(), tournamentId: z.string() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db.team.findFirst({
          where: {
            tourCardId: input.tourCardId,
            tournamentId: input.tournamentId,
          },
          include: teamDataInclude,
          orderBy: { score: "asc" },
        }),
    ),
  create: publicProcedure
    .input(
      z.object({
        golferIds: z.array(z.number()),
        tourCardId: z.string(),
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTeam = await ctx.db.team.findFirst({
        where: {
          tourCardId: input.tourCardId,
          tournamentId: input.tournamentId,
        },
        include: teamDataInclude,
        orderBy: { score: "asc" },
      });
      if (existingTeam) {
        await ctx.db.team.update({
          where: { id: existingTeam.id },
          data: { golferIds: input.golferIds },
        });
      } else {
        await ctx.db.team.create({
          data: {
            golferIds: input.golferIds,
            tourCardId: input.tourCardId,
            tournamentId: input.tournamentId,
          },
        });
      }
      return true;
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        score: z.number().optional().nullable(),
        position: z.string().optional().nullable(),
        pastPosition: z.string().optional().nullable(),
        earnings: z.number().optional().nullable(),
        points: z.number().optional().nullable(),
        round: z.number().optional().nullable(),
        thru: z.number().optional().nullable(),
        today: z.number().optional().nullable(),
        roundOne: z.number().optional().nullable(),
        roundOneTeeTime: z.string().optional().nullable(),
        roundTwo: z.number().optional().nullable(),
        roundTwoTeeTime: z.string().optional().nullable(),
        roundThree: z.number().optional().nullable(),
        roundThreeTeeTime: z.string().optional().nullable(),
        roundFour: z.number().optional().nullable(),
        roundFourTeeTime: z.string().optional().nullable(),
        makeCut: z.number().optional().nullable(),
        topTen: z.number().optional().nullable(),
        topFive: z.number().optional().nullable(),
        topThree: z.number().optional().nullable(),
        win: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.team.update({
        where: { id: input.id },
        data: {
          score: input.score,
          position: input.position,
          pastPosition: input.pastPosition,
          earnings: input.earnings,
          points: input.points,
          round: input.round,
          thru: input.thru,
          today: input.today,
          roundOne: input.roundOne,
          roundOneTeeTime: input.roundOneTeeTime,
          roundTwo: input.roundTwo,
          roundTwoTeeTime: input.roundTwoTeeTime,
          roundThree: input.roundThree,
          roundThreeTeeTime: input.roundThreeTeeTime,
          roundFour: input.roundFour,
          roundFourTeeTime: input.roundFourTeeTime,
          makeCut: input.makeCut,
          topTen: input.topTen,
          topFive: input.topFive,
          topThree: input.topThree,
          win: input.win,
        },
      });
      return true;
    }),
});
