import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { teamDataInclude } from "@/src/types/prisma_include";

export const teamRouter = createTRPCRouter({
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
        score: z.number().optional(),
        position: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        round: z.number().optional(),
        thru: z.number().optional(),
        today: z.number().optional(),
        roundOne: z.number().optional(),
        roundOneTeeTime: z.string().optional(),
        roundTwo: z.number().optional(),
        roundTwoTeeTime: z.string().optional(),
        roundThree: z.number().optional(),
        roundThreeTeeTime: z.string().optional(),
        roundFour: z.number().optional(),
        roundFourTeeTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.team.update({
        where: { id: input.id },
        data: {
          score: input.score,
          position: input.position,
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
        },
      });
      return true;
    }),
});
