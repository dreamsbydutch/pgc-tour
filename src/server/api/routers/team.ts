import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const teamRouter = createTRPCRouter({
  getByUserTournament: publicProcedure
    .input(z.object({ tourCardId: z.string(), tournamentId: z.string() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db.team.findFirst({
          where: {
            tourCardId: input.tourCardId,
            tournamentId: input.tournamentId,
          },
        }),
    ),
  create: publicProcedure
    .input(
      z.object({
        golferIds: z.array(z.string()),
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
});
