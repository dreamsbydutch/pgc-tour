import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tournamentDataInclude } from "@/src/types/prisma_include";

export const tournamentRouter = createTRPCRouter({
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: tournamentDataInclude,
        orderBy: { startDate: "asc" },
      });
    }),
  getById: publicProcedure
    .input(z.object({ tournamentId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: tournamentDataInclude,
      });
    }),
  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const tournaments = await ctx.db.tournament.findMany({
      include: tournamentDataInclude,
    });

    return tournaments
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      .find((obj) => obj.endDate > today);
  }),
  update: publicProcedure
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
});
