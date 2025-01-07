import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const golferRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.golfer.findMany({});
  }),
  // getById: publicProcedure
  //   .input(z.object({ golferID: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     return ctx.db.golfer.findUnique({where: {apiId:input.golferID}});
  //   }),
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
