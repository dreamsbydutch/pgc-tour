import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const golferRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.golfer.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ golferID: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findUnique({ where: { id: input.golferID } });
    }),
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findMany({ where: { playerName: input.name } });
    }),
  getByTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findMany({
        where: { tournamentId: input.tournamentId },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        country: z.string().optional(),
        earnings: z.number().optional(),
        makeCut: z.number().optional(),
        position: z.string().optional(),
        win: z.number().optional(),
        usage: z.number().optional(),
        round: z.number().optional(),
        score: z.number().optional(),
        topTen: z.number().optional(),
        today: z.number().optional(),
        thru: z.number().optional(),
        roundOneTeeTime: z.string().optional(),
        roundOne: z.number().optional(),
        roundTwoTeeTime: z.string().optional(),
        roundTwo: z.number().optional(),
        roundThreeTeeTime: z.string().optional(),
        roundThree: z.number().optional(),
        roundFourTeeTime: z.string().optional(),
        roundFour: z.number().optional(),
        endHole: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.golfer.update({
        where: { id: input.id },
        data: {
          country: input.country,
          earnings: input.earnings,
          makeCut: input.makeCut,
          position: input.position,
          win: input.win,
          usage: input.usage,
          round: input.round,
          score: input.score,
          topTen: input.topTen,
          today: input.today,
          thru: input.thru,
          roundOneTeeTime: input.roundOneTeeTime,
          roundOne: input.roundOne,
          roundTwoTeeTime: input.roundTwoTeeTime,
          roundTwo: input.roundTwo,
          roundThreeTeeTime: input.roundThreeTeeTime,
          roundThree: input.roundThree,
          roundFourTeeTime: input.roundFourTeeTime,
          roundFour: input.roundFour,
          endHole: input.endHole,
        },
      });
    }),
  create: publicProcedure
    .input(
      z.object({
        apiId: z.number(),
        playerName: z.string().min(1),
        tournamentId: z.string().min(1),
        group: z.number(),
        worldRank: z.number().optional(),
        rating: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.golfer.create({
        data: {
          apiId: input.apiId,
          playerName: input.playerName,
          tournamentId: input.tournamentId,
          group: input.group,
          worldRank: input.worldRank,
          rating: input.rating,
        },
      });
    }),
});
