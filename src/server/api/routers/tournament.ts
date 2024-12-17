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
});
