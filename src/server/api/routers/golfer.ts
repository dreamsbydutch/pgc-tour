import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const golferRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.golfer.findMany();
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
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findMany({
        where: {
          tournament: {
            seasonId: input.seasonId,
          },
        },
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        country: z.string().nullable().optional(),
        earnings: z.number().nullable().optional(),
        makeCut: z.number().nullable().optional(),
        position: z.string().nullable().optional(),
        posChange: z.number().nullable().optional(),
        win: z.number().nullable().optional(),
        usage: z.number().nullable().optional(),
        round: z.number().nullable().optional(),
        score: z.number().nullable().optional(),
        topTen: z.number().nullable().optional(),
        today: z.number().nullable().optional(),
        thru: z.number().nullable().optional(),
        roundOneTeeTime: z.string().nullable().optional(),
        roundOne: z.number().nullable().optional(),
        roundTwoTeeTime: z.string().nullable().optional(),
        roundTwo: z.number().nullable().optional(),
        roundThreeTeeTime: z.string().nullable().optional(),
        roundThree: z.number().nullable().optional(),
        roundFourTeeTime: z.string().nullable().optional(),
        roundFour: z.number().nullable().optional(),
        endHole: z.number().nullable().optional(),
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
          posChange: input.posChange,
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
  create: adminProcedure
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
  delete: adminProcedure
    .input(z.object({ golferId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.golfer.delete({ where: { id: input.golferId } });
    }),
});
